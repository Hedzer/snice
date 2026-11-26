# Technical Architecture: Tiny, Easy-to-Cache Snice Packages

This document defines the architecture across both pillars:
1. **Pillar 1 — Tiny Packages**: Core tree-shaking enablement + Snice-aware compile-time plugin transforms + heavy-component decoupling.
2. **Pillar 2 — Easy-to-Cache Packages**: Volatility-tiered deterministic chunking with content-hash stability across app deployments.

All internal implementation details below are design contracts where required by compatibility or performance; implementers retain freedom over internal helper layout unless marked as a contract.

---

## 1. Pillar 1A — Core & Package Tree-Shaking Enablement (Works With or Without Plugin)

### 1.1 Package `"sideEffects"` & Pure Module Hygiene (`BS-01`)
- Add explicit `"sideEffects"` array to root `package.json`:
  - Include ONLY genuine side-effect modules:
    - `"./dist/testing-dom.esm.js"`, `"./dist/testing-dom.cjs"` (patches `HTMLElement.prototype.autofocus`)
    - `"./dist/components/**/*.js"` (custom element self-registration via `customElements.define`)
    - `"./dist/components/**/*.css"` (CSS stylesheets)
  - All core runtime modules (`dist/index.esm.js` / preserved core ESM chunks, `symbols`, `transitions`, `adapters/react/*`) are side-effect-free when imported for named exports.
- **Remove unconditional top-level side effects in `packages/core/src/`**:
  - `index.ts:14-16`: Remove eager `useNativeElementControllers()` call on import!
    - **Backwards-compatibility contract**: Apps that use `@controller` (decorator registration) or explicit `useNativeElementControllers()` / `attachController()` still trigger native element controller observation automatically inside `controller()` registration (first `@controller` registered in a browser lazily calls `useNativeElementControllers()`) and inside `useNativeElementControllers()` itself. Apps that NEVER import `@controller` or `useNativeElementControllers` pay **0 bytes** and spawn **0 `MutationObserver`s**.
    - Verify no existing test expects `[controller="..."]` on a native element to work without ever registering a `@controller` (a native element controller cannot attach to an unregistered controller name anyway; if `useNativeElementControllers()` is called explicitly in tests, it continues working).
  - `global.ts`: Replace module-top-level `globalThis.snice` mutation with lazy `getSniceGlobal()` helper (annotated `/*#__PURE__*/` where applicable).
  - `scroll-lock.ts`: Register `globalThis[TEST_HOOK]` lazily on first lock/unlock (or keep test helper pure/exported without top-level global write).
  - `symbols.ts`, `template.ts`, `render.ts`, `template-marker.ts`: Annotate pure top-level calls (`Symbol.for`, `new WeakMap()`, `new RenderScheduler()`, `getSymbol()`) with `/*#__PURE__*/` so Rollup/Terser/esbuild drop unreferenced symbols and singletons.
- **Fix `css()` stylesheet caching (`template.ts:89-127`)**:
  - When `values.length === 1` and `strings[0] === '' && strings[1] === ''` and `typeof values[0] === 'string'` (the exact ``css`${importedCssString}` `` pattern used by 172 Snice components), cache by a bounded strategy OR (even cleaner, zero leak risk for dynamic strings):
    - Keep `cssResultCache` (`WeakMap<TemplateStringsArray, CSSResult>`) for static `values.length === 0`, AND for a `css` callsite with static-ish single string (e.g. `WeakMap<TemplateStringsArray, { lastText: string; result: CSSResult }>` — stores only **1** entry per callsite, O(1) memory, zero unbounded growth!). If the same callsite passes the same `cssText` string on instance #2..#1000, it reuses the exact cached `CSSResult` and `CSSStyleSheet`!
    - For dynamically varying callsites, it simply replaces the 1-slot cache (still O(1) bounded memory, preserving the comment's invariant at `template.ts:11-14`).

### 1.2 Acyclic Lifecycle-Hook Inversion & Core ESM Granularity (`BS-02`)
- **Problem**: `element.ts:1-24` statically imports `controller`, `observe`, `request-response`, `on`, `context`, `render`, `events`, `method-decorators`, `autofocus`, and `render-errors`. `rollup.config.js` also emits one flat `dist/index.esm.js` rather than tree-shakable module boundaries.
- **Acyclic Hook Inversion Architecture**:
  - Introduce a tiny zero-dependency leaf module `packages/core/src/lifecycle-hooks.ts` (strictly leaf — imports only `symbols.ts` or defines its own `Symbol.for(...)` keys; **zero circular dependencies**, passing `failOnCoreCircularDependency`).
  - Define typed hook slots on constructors/prototypes (e.g. `CONNECT_HOOKS`, `DISCONNECT_HOOKS`, `ATTRIBUTE_HOOKS`, `RENDER_HOOKS` — or per-feature registration functions attached by each decorator when that decorator is actually used):
    - `@on` registers `setupEventHandlers` / `cleanupEventHandlers` into the class's connect/disconnect hook table.
    - `@observe` registers `setupObservers` / `cleanupObservers`.
    - `@respond` registers `setupResponseHandlers` / `cleanupResponseHandlers`.
    - `@context` registers `setupContextHandler` / `cleanupContextHandler`.
    - `@dispatch` registers `clearDispatchTimers` on disconnect.
    - `@debounce` / `@throttle` register `clearDebounceTimers` / `clearThrottleTimers` on disconnect.
    - `@render` / `@styles` register render/style/disconnect/reconnect/timer hooks (or `SniceElement` registers render hooks).
    - `controller` (`@controller` / `ControllerPart` / `.controller` setter) registers controller attachment/detachment hooks rather than `element.ts` statically importing `controller.ts`!
  - `element.ts` (`applyElementFunctionality`) executes only the hooks registered on the class (in exact documented lifecycle order: styles → render → observers → response handlers → event handlers → context → ready; disconnect in reverse cleanup order).
  - **Preservation of exact ordering**: Each hook carries a fixed numeric phase priority (e.g., `PHASE_STYLES = 10`, `PHASE_CONTROLLER = 20`, `PHASE_RENDER = 30`, `PHASE_OBSERVE = 40`, `PHASE_RESPOND = 50`, `PHASE_ON = 60`, `PHASE_CONTEXT = 70`) so execution order is 100% deterministic regardless of decorator declaration order!
  - Apply the same inversion to `controller.ts:1-5` and `daemon.ts:1-3`.
- **`parts.ts` Modularity**:
  - Split optional heavy parts (e.g., `ControllerPart`, `ConditionalIfPart`/`ConditionalCasePart`, `SpreadPart`, `CommentPart`, keyed `repeat` reconciliation) into clean internal modules / pluggable part factories where practical without regressing `parts.ts` runtime perf or `> 90%` core coverage.
  - At minimum, decouple `ControllerPart` from statically pulling all of `controller.ts` into apps that never use `controller=${...}` bindings, and enable build-time pre-compiled descriptors (Section 2.3) to bypass the runtime parser when used.
- **Core Distribution Layout (`rollup.config.js`)**:
  - Keep `dist/index.esm.js` as the public `"."` ESM entry point (satisfying `tests/package-contract.test.ts` and `package.json:14`), while letting Rollup emit shared internal ESM chunks under `dist/_core/` (or `preserveModules` with `dist/index.esm.js` re-exporting from `dist/_core/*`) so consumer bundlers (Vite, Rollup, esbuild, Webpack) get **file-level tree-shaking** across core modules!
  - `dist/index.cjs`, `dist/index.iife.js`, and `dist/cdn/runtime/snice-runtime*.js` remain single-file bundles as before.

### 1.3 Production `__DEV__` Diagnostic Gating (`BS-03`)
- Introduce a compile-time constant check (e.g., `const IS_DEV = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true;` or `typeof __SNICE_DEV__ !== 'undefined' ? __SNICE_DEV__ : (typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true)` — specifically structured so Vite `define`, Rollup `@rollup/plugin-replace`, esbuild `define`, and the Snice plugin can fold it to literal `false` at build time and Terser/esbuild eliminates the dead branches completely!).
- **What IS gated behind `IS_DEV`**:
  - Developer misuse warnings (`console.warn` in `on.ts`, `observe.ts`, `utils.ts` `validateWatchedProperties`, `keyboard-filter.ts` `warnIfModifierMisuse`, `render.ts` non-template/non-string warnings, `parts.ts` duplicate-key/malformed-syntax warnings, `element-ready.ts` slow-definition warnings, `events.ts` / `request-response.ts` misuse warnings).
  - Template preparation context snippets (`contextualizeTemplatePreparationError` in `parts.ts:154-170`).
  - `console.debug` traces (`element.ts:168,312`, `controller.ts:614`).
- **What is NOT stripped (Preserved in Production)**:
  - Actual runtime error handling / recovery (`try/catch` boundaries, `strictRenderErrors`, `MAX_RENDER_DEPTH` guard).
  - `render-errors.ts` host attribution in default/CDN runtime builds (required by `tests/cdn-runtime.test.ts` checking `'snice: render failed for '`); in production app builds with the Snice plugin, `stripDiagnostics: true` (default or configurable) can optionally replace verbose host-identity tracking with compact `<element>` attribution.
- **Coverage Gate Note**: Guard helper and gated branches in the 8 core coverage files must remain `> 90%` covered under Vitest (where `IS_DEV` is `true`, avoid untestable dead branches inside the 8 files by keeping the constant evaluation in a helper module outside the 8-file list or testing both branches via explicit unit tests).

---

## 2. Pillar 1B — Snice Bundler Plugin (`packages/plugin/`)

### 2.0 Packaging & Export Surface (Settled — Q-1, User-Provided)
- Authored under `packages/plugin/` and built into `dist/plugin/` as part of `build:distribution`.
- Published as built-in subpath exports of `snice` with lockstep versioning and zero extra user install:
  - `'snice/vite'` → `{ "types": "./dist/plugin/vite.d.ts", "import": "./dist/plugin/vite.js" }`
  - `'snice/rollup'` → `{ "types": "./dist/plugin/rollup.d.ts", "import": "./dist/plugin/rollup.js" }`
- `types` MUST remain ordered before `import` in `package.json` `exports` (`tests/package-contract.test.ts`), and generated `.map` files under `dist/plugin/` MUST embed `sourcesContent` via `embed-sourcemap-sources.mjs`.
- Node-only runtime modules (`packages/plugin/`) MUST NOT be imported by browser runtime code (`packages/core/` or `packages/components/`), and `snice`'s browser bundle/install footprint must stay lean (minimal build-time deps; never pull plugin code into browser outputs).
- **Bundler Targets & Single-Plugin Ergonomics (Settled — Q-2, User-Provided)**:
  - Targets **Vite + Rollup** first (`import snice from 'snice/vite'` / `'snice/rollup'`).
  - In Vite (`enforce: 'pre'`), `plugins: [snice()]` handles Snice decorator lowering AND TC39 2022-03 compilation fallback for any non-Snice decorators in `.ts`/`.tsx` files directly, **replacing `unplugin-swc` in `create-app` Vite templates** (no SWC boilerplate needed in user projects).
  - Remains cleanly compatible if a user explicitly keeps `unplugin-swc` alongside `snice()` or uses `snice/rollup` with `@rollup/plugin-typescript`.
  - Crucially satisfies `snice doctor`'s `probeDecoratorTransform` (`bin/snice.js:471-535`), which compiles non-Snice `@probeClass` / `@probeField` decorators via the project's `vite.config.ts`.

### 2.1 Architecture & Transform Pipeline

```text
Source (.ts / .tsx / .js / .css)
  │
  ├─ [1] Resolve & Graph Analysis (buildStart / resolveId / moduleParsed)
  │      • Detects `snice/components/theme/theme.css` in module graph
  │      • Extracts canonical `:root` token allowlist (214 `--snice-*` tokens)
  │      • Tracks Snice component imports & CSS custom property usage (if `pruneTheme`)
  │
  ├─ [2] Per-Module Transform (enforce: 'pre' for TS/decorators, 'post' or unified pass for JS/templates/CSS)
  │      • Pass A: Snice Decorator Lowering (AST-based, magic-string + hires:'boundary' sourcemap)
  │      • Pass B: `html`` ` / `svg`` ` Minification (and optional pre-compiled descriptors)
  │      • Pass C: Inline `css`` ` Minification + static `.css?inline` folding + allowlisted `var()` fallback stripping
  │      • Pass D: `__SNICE_DEV__` folding (`false` in prod, `true` in dev)
  │
  └─ [3] Bundle & Cache-Boundary Optimization (config / outputOptions / generateBundle)
         • Sets modern default `build.target: 'es2022'` (unless user explicitly set target)
         • Applies deterministic volatility-tiered chunking (`manualChunks` / composable)
         • Optionally prunes unreferenced `--snice-*` declarations from `theme.css` (`pruneTheme: true`)
         • Optional build size & cache-boundary report
```

### 2.2 Transform A — Snice Decorator Lowering (`BS-06`)
- **Goal**: Replace TC39 Stage 3 decorator codegen (`__esDecorate`, `__runInitializers`, SWC's ~12 KB `applyDecs2203RFactory`, and 3 arrays per decorated field) with direct, compact Snice registration calls.
- **Exact Scope & Safety Rules**:
  - **Import-binding verified**: The plugin resolves which local identifiers are imported from `'snice'` (including aliased imports `import { element as el } from 'snice'`, and `page` returned by `Router(...)` where statically recognizable). Never blindly rewrite arbitrary `@property` or `@on` decorators from other libraries!
  - **Supported lowered decorators**: All Snice class, field, and method decorators (`@element`, `@layout`, `@property`, `@state`, `@query`, `@queryAll`, `@render`, `@styles`, `@watch`, `@ready`, `@dispose`, `@reconnect`, `@moved`, `@adopted`, `@on`, `@dispatch`, `@observe`, `@context`, `@request`, `@respond`, `@controller`, `@daemon`, `@debounce`, `@throttle`, `@once`, `@memoize`).
  - **Compact Runtime Helper Contract** (exported from `'snice'` internal/public helper surface, e.g. `__sniceDefineElement`, `__sniceProps`, `__sniceQueries`, etc., or calling existing public runtime metadata primitives directly):
    - Class `@element('my-btn', opts)` + 13 `@property()` + 5 `@query()` + `@render()` + `@styles()` compiles from **20–24 KB** of TC39 boilerplate down to **~600–1,000 bytes** of flat declarative registration calls!
    - Example lowered output (illustrative shape — exact helper names at implementer's discretion):
      ```js
      class MyCounter extends HTMLElement {
        count = 0;
        renderContent() { return html`...`; }
      }
      __sniceElement(MyCounter, 'my-counter', {
        props: { count: { type: Number } },
        render: 'renderContent',
      });
      ```
    - **Semantic equivalence invariants (MUST match TC39 runtime behavior 100%)**:
      1. Inheritance (`class Child extends Parent`): ancestor `PROPERTIES`, `formAssociated`, `ELEMENT_OPTIONS`, `PARENT_STYLES_METHODS`, `@watch`, `@on`, `@ready`, `@dispose`, `@observe`, `@respond`, `@context` merge identically to `mergeParentMetadata` + `addInitializer`.
      2. Field initializers & `useDefineForClassFields: false`: pre-upgrade property values (`PRE_UPGRADE_PROPERTY_BINDINGS` / expando rescue), default values (`PROPERTY_DEFAULTS`), deep reactive wrappers (`deep: true`), and `attributeChangedCallback` reflection behave identically.
      3. Stacked decorators on the same method (e.g. `@on('input') @debounce(200) handleInput()`): decorator composition order matches TC39 bottom-to-top application.
      4. Multiple `@on` / `@watch` / `@observe` / `@respond` decorators on one method: all registrations preserved without key collision.
      5. Non-Snice decorators on the same class or file (including `snice doctor`'s `@probeClass` / `@probeField`): MUST fall back gracefully to TC39 2022-03 compilation (e.g. only lower classes/members whose decorators are known Snice decorators; leave unknown decorators for SWC/TC39 fallback).
      6. `SniceElement` subclasses without explicit `@render()` decorator still auto-wire `render()` (`element.ts:682-690`).
- **Performance Bound**: Single AST parse per `.ts`/`.js` file (`O(N)` in file length `N`), skipped in `O(1)` via fast substring pre-filter (`code.includes('@')` and `code.includes('snice')`) for modules without Snice decorators.

### 2.3 Transform B — `html`` ` / `svg`` ` Template Minification & Optional Pre-Compilation (`BS-07`)
- **Pass B1: Build-Time Template Minification (always safe, zero runtime change)**:
  - Identifies `html\`...\`` and `svg\`...\`` tagged templates bound to `'snice'` (including nested templates).
  - Minifies static quasis while preserving:
    - Exact `TemplateStringsArray` structure and interpolation count/order.
    - All whitespace inside `<pre>`, `<code>`, `<textarea>`, `<script>`, `<style>`.
    - Meaningful single spaces between inline elements/text (`<span>A</span> <span>B</span>` → single space preserved, not fused into `AB`!) and between attributes (`<div class="a"\n  ?disabled=${x}>` → `<div class="a" ?disabled=${x}>`).
    - All Snice custom syntax: `<if ${cond}>`, `<else-if ${cond}>`, `<else>`, `<case ${val}>`, `<when ${v}>`, `<default>`, `@event:mod|mod=${fn}`, `@@event=${fn}`, `@keydown.~enter=${fn}`, `.prop=${v}`, `?attr=${v}`, `class:foo=${v}`, `style:bar=${v}`, `...props=${obj}`, `...attrs=${obj}`, `...events=${obj}`, `controller=${C}`, `key=${k}`.
    - Strips HTML comments `<!-- ... -->` except any marker/conditional comment (and preserves dynamic comments containing `${...}`).
  - Complexity: `O(L)` linear state-machine scan over template literal length `L`.
- **Pass B2: Optional Pre-Compiled Template Descriptors (Phase 2 inside `BS-07` or separate opt-in)**:
  - Moves `prepareTemplate`'s char-by-char state machine (`parts.ts:572-680`) to build time: emits a pre-marked HTML string + compact part-descriptor array attached to the template callsite (e.g. `html._compiled(...)` or `TemplateResult` with optional `compiled` descriptor).
  - Runtime checks for `compiled` descriptor first; falls back to existing `prepareTemplate` for uncompiled/dynamic templates (100% backwards compatible!).
  - When all templates in an app are pre-compiled, the runtime parser (`prepareTemplate` state machine) becomes dead code and tree-shakes out!

### 2.4 Transform C — CSS Pipeline (`BS-08`)
1. **Inline `css\`...\`` Minification**:
   - Minifies static ``css`...` `` tagged templates in `.ts`/`.js` files (using `clean-css` or lightweight CSS minifier), preserving CSS custom properties (`--*`), `calc(...)`, `var(...)`, `::part(...)`, `:host(...)`, and `@container` rules.
2. **Static `.css?inline` Folding**:
   - When a module does `import cssContent from './x.css?inline'` and `return css\`${cssContent}\`` (with `cssContent` never mutated), the plugin folds it into a static zero-interpolation `css` call (or cached `CSSResult` factory) so both runtime `CSSStyleSheet` sharing works AND CSS fallback stripping can process it uniformly.
3. **Allowlisted `var(--snice-*, fallback)` Stripping (Settled — Q-4, User-Provided)**:
   - **Activation**: Auto-enabled in production when the plugin detects `snice/components/theme/theme.css` (or a user-configured theme CSS file) is imported in the build graph. Explicitly overridable via `stripCssFallbacks: 'auto' | boolean`.
   - **Strict Allowlist Rule (Verified Safety Requirement)**:
     - Parse `:root { ... }` from the imported `theme.css` to extract the exact set of guaranteed-defined tokens (currently 214 `--snice-*` tokens).
     - Using a **balanced-parenthesis CSS value parser** (NEVER regex!), for every `var(--token, <fallback>)`:
       - If `--token` is in the allowlist → rewrite to `var(--token)`.
       - If `--token` is NOT in the allowlist (e.g. the 179 component-scoped `--snice-terminal-*`, `--snice-table-*`, or user custom tokens) → **leave untouched** (though recursively inspect nested `var(...)` inside its fallback!).
     - Handles arbitrarily nested `var(--a, var(--b, fallback))`, multi-value `font-family` lists, multi-layer `box-shadow`, and `cubic-bezier(...)` cleanly in `O(C)` linear time over CSS length `C`.
4. **Opt-In Unused `theme.css` Token Pruning (`pruneTheme`, Settled — Q-4, User-Provided)**:
   - **Default**: **Off (`false`)** in zero-config builds so dynamic JS (`getComputedStyle`) or unbundled CSS reads of `--snice-*` tokens never break silently; opt-in via `pruneTheme: true` with `themeSafelist: (string | RegExp)[]`.
   - Scans all CSS assets, `.css?inline` imports, inline ``css`...` ``, and `style="..."` templates in the bundle for referenced `--snice-*` custom properties.
   - Computes transitive closure: if a used token in `theme.css` references another token (e.g. `--snice-color-primary: hsl(var(--snice-color-blue-600))`), keep the referenced primitive token too!
   - Drops unreferenced `--snice-*` declarations from `:root`, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)`, density, print, and motion blocks (removing now-empty blocks).
   - Supports `themeSafelist: (string | RegExp)[]` for tokens accessed dynamically in JS.

---

## 3. Pillar 2 — Easy-to-Cache Chunking & Determinism Architecture (`BS-05`)

### 3.1 Volatility-Tiered Chunk Strategy
Instead of bundling Snice components into volatile app chunks (cache bust on every app edit) OR splitting into 50 tiny per-component files (HTTP waterfall + poor gzip dictionary sharing), the plugin groups modules by **change frequency (volatility)** and **size**:

```text
Browser Cache Tiers (Long-Lived Immutable → Volatile)
┌─────────────────────────────────────────────────────────────────────────┐
│ Tier 1: snice-runtime-[hash].js        (Changes only on Snice upgrade)  │
│   packages/core / node_modules/snice/dist/{index,_core,symbols,...}     │
│   + tslib + pica-route                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 2: vendor-[pkg]-[hash].js         (Changes on 3rd-party upgrade)   │
│   e.g. react + react-dom (when present) separated from other vendors    │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 3: snice-theme-[hash].css         (Changes only on theme change)   │
│   snice/components/theme/theme.css                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 4: snice-components-[hash].js     (Changes when UI set changes)    │
│   Eagerly imported Snice UI components (`snice/components/*`),          │
│   EXCLUDING heavy standalone modules (e.g. table, pdf-viewer, chart,    │
│   qr-reader, calendar) which get isolated named chunks (`snice-table`,  │
│   `snice-pdf-viewer`, etc.) so lazy-loaded routes never bloat Tier 4    │
│   and adding/removing one heavy widget doesn't bust common primitives!  │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 5: App Entry & Route Chunks       (Changes on every app deploy)    │
│   src/main.ts, src/pages/*, app business logic — tiny payload!          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Hard Rules for Cache Correctness & Ergonomics
1. **Deterministic, OS-Independent Chunk Names**:
   - Normalize module IDs (`\` → `/`), match package-relative segments (`/snice/dist/...`), never incorporate absolute filesystem paths or timestamps.
   - Standard content-hashed filenames (`assets/[name]-[hash].js`, `assets/[name]-[hash][extname]`) compatible with `Cache-Control: public, max-age=31536000, immutable`.
2. **Never Break Non-Code-Splitting Formats**:
   - Automatically skip `manualChunks` when Rollup output format is `iife`/`umd` or `output.file` is set (library/CDN single-file builds).
3. **Composable With User `manualChunks` & `snice doctor`**:
   - If the user sets `caching: false` (or `chunks: false`) → disable plugin chunking.
   - If Rollup/Vite config already provides `manualChunks` as a function (including `bin/snice.js:518`'s inline `manualChunks: () => undefined` during `snice doctor`):
     - Attach chunking in `outputOptions(opts)` (which Rollup/Vite invokes per output, handling `OutputOptions[]` arrays cleanly and running after Vite merges `inlineConfig` over `vite.config.ts`). Treat an existing `manualChunks` function as authoritative so `bin/snice.js:518`'s `() => undefined` automatically bypasses chunking without hacks; export a composable `createSniceManualChunks()` helper for users who want custom function composition.
   - If user provides `manualChunks` as an object: preserve all user entries and handle remaining IDs via a composed function.
4. **Heavy Component Isolation Threshold**:
   - Components imported via dynamic `import()` naturally stay in async chunks (plugin MUST NOT force dynamically-imported components into the eager `snice-components` chunk — inspect `getModuleInfo(id)` / static vs dynamic importers!).
   - Known heavy standalone families (`table`, `pdf-viewer`, `qr-reader`, `chart`, `calendar`, `code-block`, `flow`, `kanban`) can be isolated into `snice-<name>` chunks so they don't invalidate `snice-components` when added/removed.
5. **Avoid Circular Chunk Warnings**:
   - Verify Tier 1 (`snice-runtime`) NEVER imports Tier 4 (`snice-components`) or Tier 5 (app), and Tier 4 only imports Tier 1. Strictly acyclic chunk dependency DAG!

---

## 4. Component-Level Slimming (`BS-04`, `BS-11`)

### 4.1 Quick-Win Shared Helper Decoupling (`BS-04`)
1. **Split `packages/components/src/utils.ts`**:
   - Move `renderIcon` / `classifyIcon` (which import 35.1 KB `ICONS` from `./icons/index`) into `./icon-utils.ts` (re-exported from `./utils.ts` ONLY if external callers rely on it, while internal components like `snice-chart.ts` import `getAccentPalette` from `./accent-utils.ts` or `./color-utils.ts` and `strictStringAttributeConverter` from `./attr-utils.ts`).
   - Result: `snice-chart` and every other non-icon component importing `../utils` immediately drops **35.1 KB raw**!
2. **Lazy-Load `pdf.min.mjs` in `snice-pdf-viewer.ts`**:
   - Replace top-level static `import * as pdfjsLib from './pdf.min.mjs'` (`snice-pdf-viewer.ts:6`, 327 KB) with dynamic `await import('./pdf.min.mjs')` on first document load (caching the promise).
   - Preserves CDN & ESM asset copy (`rollup.config.js:427-452`) while keeping initial bundle/parse cost near zero until a PDF is actually rendered.

### 4.2 Modular `snice-table` (`BS-11`, Settled — Q-3, User-Provided)
- **Problem**: `snice-table.ts` unconditionally imports 7 sibling components + 22 cell components + 13 feature classes = 417.3 KB raw / 77.3 KB gz.
- **Backwards-Compatible Modularity Design**:
  - Default `import 'snice/components/table/snice-table'` continues registering full table (100% backwards compatible, zero breakage for existing users, CDN builds, React adapters, and matrix tests!).
  - Introduce a modular entry `snice/components/table/snice-table-core` (or feature/cell registration API `registerTableCells(...)`, `registerTableFeatures(...)`) that includes only core table + text cell, letting consumers (or the Snice plugin via `table: { cells: ['text', 'number', 'date'], features: ['sort', 'filter'] }` option) include only the cells and features their app uses!
  - Feature classes (`TableVirtualizer`, `TableExport`, `TableTreeData`, `TableGrouping`, `TableRowDnD`, `TableMasterDetail`, `TableEditor`, `TableToolbar`, `TableColumnMenu`, etc.) become lazily instantiated or injected via a clean feature registry instead of unconditionally constructed at `snice-table.ts:297-309`.

---

## 5. Compatibility Matrix & Verification Strategy

| Gate / Surface | Verification Method | Required Invariant |
|---|---|---|
| Core engine coverage | `npm run test:coverage:core` | Strictly `> 90%` (`90.01%`) statements/branches/functions/lines across all 8 files |
| Core circular deps | `npm run build:distribution` | Zero `CIRCULAR_DEPENDENCY` warnings/errors |
| Package contract | `vitest run tests/package-contract.test.ts` | `exports` key order, NodeNext types, deep component paths, non-null `sourcesContent` in all maps |
| Source & built tests | `npm run test:source` & `npm run test:distribution` | All unit + smoke tests pass against both source and built `dist/` |
| CDN runtime & builds | `npm run test:cdn` | Shared runtime + all 134 CDN components work; `size-report.js` records measurable size drops |
| React adapters | `npm run test:react` | All generated adapters & hooks pass |
| CLI templates & `snice check` | `vitest run tests/cli-create-app.test.ts` + `tests/live/cli-created-app.spec.ts` | Both `default` & `react` templates pass `type-check`, `snice check . --json`, `npm run build`, and Playwright E2E |
| Browser matrix (3 engines) | `npm run test:browser:framework` | Chromium, Firefox, WebKit E2E pass |
| **New: Bundle Size & Cache Stability E2E** | Dedicated Vitest fixture suite running real Vite + Rollup production builds | 1. **Size budgets**: measures raw + gzip bytes for minimal app, multi-component app, and React+Snice app (before vs after / with vs without plugin) proving measurable reductions.<br>2. **Cache-hash stability**: builds fixture v1, mutates an app page file, builds fixture v2 → asserts `snice-runtime`, `snice-components`, and `snice-theme` chunk filenames/hashes are **byte-identical** while app chunk hash updates.<br>3. **Semantic parity**: executes lowered/minified app in happy-dom & Playwright to verify decorators (`@element`, `@property`, `@state`, `@query`, `@watch`, `@on`, `@dispatch`, `@observe`, `@ready`, `@dispose`, `@context`, `@request`/`@respond`, inheritance), templates (`<if>`, `<case>`, `repeat`, `<pre>`/`<textarea>`), and CSS (with & without `theme.css`) behave identically to unlowered source. |
| Full release gate | `npm test` | Must pass cleanly at completion of final integration stories |
