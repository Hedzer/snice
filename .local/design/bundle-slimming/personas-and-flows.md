# Personas, Workload Baselines, and Flows

## 1. Personas & Workload Model

### Persona A — Snice SPA / PWA App Developer (Primary)
- **Profile**: Builds a web app using `npx snice create-app` (or an existing Vite/Rollup setup), authoring 10–100 custom `@element` / `@page` / `@controller` / `@daemon` classes and importing 5–30 `snice/components/*` UI components plus `snice/components/theme/theme.css`.
- **Workload (estimated)**:
  - Dev loop: dozens of HMR saves/hour; needs sub-50ms per-file transform latency in `vite dev`.
  - Production deploys: 1–10 deploys/week; typical app code changes on every deploy while `snice` core and UI components change only every few weeks/months.
- **Goals**:
  - Cold-load bundle stays competitive with Preact/Solid/lean React apps (no 68 KB monolithic runtime when using 3 decorators; no 3.6× SWC decorator bloat; no 114 KB of dead CSS fallbacks when `theme.css` is loaded).
  - Warm repeat visits hit browser/CDN HTTP cache (`Cache-Control: immutable`) for Snice core, Snice components, and theme CSS when only app pages/business logic change.
  - Zero-config ergonomics: add `snice()` to `vite.config.ts` (or get it out-of-the-box from `create-app`) and `snice check` passes cleanly.

### Persona B — React + Snice App Developer
- **Profile**: Uses `npx snice create-app --template=react` or adds Snice UI components (`snice/react` + `snice/components/*`) into an existing React Vite app. Usually writes zero custom Snice decorators; imports 5–25 Snice components and `theme.css`.
- **Workload (estimated)**: Similar deploy cadence to Persona A, plus React vendor bundle (`react`, `react-dom`).
- **Goals**:
  - Snice components do not drag unused Snice core subsystems (`router`, `daemon`, `observe`, `request-response`, `controller` MutationObserver) or 35 KB of unused icons into the app.
  - Cache boundaries cleanly isolate `vendor-react`, `snice-runtime`, `snice-components`, `snice-theme`, and volatile React app code.

### Persona C — No-Plugin / Pure-ESM / CDN Consumer
- **Profile**: Consumes `snice` via `<script src="snice-runtime.min.js">` CDN bundles, esbuild/Webpack/Rollup without the Snice plugin, or directly in browsers/Storybook/Vitest.
- **Goals**:
  - 100% backwards compatibility: standard TC39 Stage 3 decorators, uncompiled `html\`...\``, `var(--snice-*, fallback)` fallbacks without `theme.css`, and `window.Snice` CDN runtime all work identically.
  - Still gains automatic size reductions from core `"sideEffects"`, pure annotations, hook inversion, `css()` caching fix, and smaller published `dist/` / CDN artifacts.

---

## 2. Verified Current Size Baselines

Source: `.size-baseline.json` (2026-07-09, 135 CDN minified bundles) and direct source audits (`codebase-audit.md`).

| Artifact / Surface | Measured Current Size | Primary Bloat Drivers (Verified) |
|---|---|---|
| `dist/cdn/runtime/snice-runtime.min.js` | **68.5 KB raw / 21.1 KB gz** (70,189 B / 21,556 B) | Monolithic core bundle; unconditional `useNativeElementControllers()`; `element.ts` statically imports all 10+ hook subsystems; `parts.ts` is 97 KB (2,798 lines); 73 unconditional `console.*` + diagnostic helpers |
| `snice-button` source vs compiled | **6.6 KB TS** → **20.4 KB JS** (TS `tslib`, 3.08×) / **24.2 KB JS** (SWC inline helper, 3.66×); CDN bundle **19.5 KB raw / 5.0 KB gz** | 21 `__esDecorate` calls + 57 arrays for 19 fields; SWC inlines ~12 KB `applyDecs2203RFactory` per file in `bin/templates/default/vite.config.ts`; `snice-button.css` (10.6 KB min) includes `var()` fallbacks; imports `../utils` → `ICONS` (35.1 KB) |
| `snice-table` | **830.8 KB** transitive source; CDN bundle **417.3 KB raw / 77.3 KB gz** | Unconditionally imports 7 sibling components + 22 cell components + 2 sub-components + 13 eagerly-instantiated feature classes |
| `snice-pdf-viewer` | **349.6 KB** transitive source; CDN bundle **323.7 KB raw / 92.2 KB gz** | Unconditionally imports vendored 327 KB `pdf.min.mjs` at top level |
| `snice-chart` | **94.7 KB** transitive source | Imports `getAccentPalette` from `../utils`, pulling 35.1 KB `icons/index.ts` despite using zero icons |
| Component `var(--snice-*, fallback)` | **114.8 KB** across 7,261 occurrences (`.css` + inline) | Redundant whenever `theme.css` is imported (for the 214 tokens defined in `theme.css`) |
| Component `html\`...\`` strings | **399.8 KB** across 428 top-level templates | Indentation, newlines, multi-line tag whitespace, 7 HTML comments |
| `theme.css` | **27.3 KB** (544 lines, 214 custom properties) | Loaded whole even when an app uses only a small subset of components |
| `bin/templates/default/vite.config.ts` | `build.target: 'es2015'`, no `externalHelpers`, `manualChunks: { vendor: ['snice'] }` | Inlines SWC decorator factory per file, downlevels ES2022→ES2015, mixes `snice/components/*` into app chunks |

### Target Outcomes (Estimates — Marked as Goals, Not Hard Guarantees Until Benchmarked)
- **Minimal app (`@element` + `@property` + `@render` + `html` + `css`, no router/controllers/observers)**: estimated **~5–8 KB gz** runtime (down from ~21.1 KB gz monolithic runtime).
- **Typical medium app (10 components + router + 15 custom elements + `theme.css`)**: estimated **35–60% raw JS+CSS reduction** (and **25–45% gzip reduction**) vs current `create-app` default build.
- **Repeat-deploy cache hit rate**: editing app code produces **0% hash churn** on `snice-runtime`, `snice-components`, and `snice-theme` chunks (only the touched app chunk + entry manifest change).

---

## 3. End-to-End Flows & Branches

### Flow 1: New App Scaffolding & Production Build (`create-app` → `vite build`)
- **Actor**: Persona A or Persona B.
- **Entry point**: `npx snice create-app my-app` (or `--template=react`), then `npm install && npm run build`.
- **Happy path**:
  1. CLI copies updated template with `snice()` plugin configured in `vite.config.ts` and `build.target: 'es2022'`.
  2. `vite build` runs:
     - Plugin lowers Snice decorators in app source (and any unlowered source modules).
     - Plugin minifies `html\`...\`` / `svg\`...\`` templates and inline `css\`...\`` literals.
     - Plugin detects `snice/components/theme/theme.css` in the module graph → strips allowlisted `var(--snice-*, fallback)` fallbacks from component CSS.
     - Plugin defines `__DEV__ = false` (or `process.env.NODE_ENV === 'production'`) so dev-only warnings/diagnostics dead-code-eliminate.
     - Plugin applies deterministic volatility-tiered chunking (`snice-runtime-[hash].js`, `snice-components-[hash].js`, `snice-theme-[hash].css`, heavy split chunks, app entry/route chunks).
  3. Visible result: `dist/` contains tiny, content-hashed assets with clean cache boundaries and valid sourcemaps (`sourcesContent` preserved).
- **Branches**:
  - **Branch 1a (No `theme.css` imported)**: Plugin does NOT detect `theme.css` in module graph → preserves all `var(--snice-*, fallback)` fallbacks automatically so components render with full fallback styling.
  - **Branch 1b (User defines custom `build.rollupOptions.output.manualChunks`)**: Plugin composes with or defers to user's `manualChunks` (if function: user's non-null return wins, plugin handles fallback; if object: merged cleanly without clobbering user keys) instead of overwriting it.
  - **Branch 1c (User disables chunking or passes `manualChunks: () => undefined`)**: Plugin respects explicit `undefined` / disabled chunking (critical for `snice doctor` probe and library/IIFE single-file builds!).
  - **Branch 1d (Custom non-Snice TC39 decorator in app code)**: Plugin lowers Snice decorators and passes non-Snice decorators through TC39 2022-03 compilation cleanly without error.
  - **Branch 1e (Syntax error or malformed template/CSS in user code)**: Plugin fails fast with file path, line/column, and clear diagnostic (never silently corrupts output).

### Flow 2: Iterative App Development & Repeat-Deploy Caching
- **Actor**: Persona A or Persona B.
- **Starting state**: Production build v1 deployed; browser caches `assets/snice-runtime-<H1>.js`, `assets/snice-components-<H2>.js`, `assets/snice-theme-<H3>.css`, `assets/index-<A1>.js`.
- **Action**: Developer edits `src/pages/home-page.ts` (app business logic / markup), runs `npm run build` (build v2).
- **Expected result**:
  - `assets/snice-runtime-<H1>.js` hash is **identical** (`<H1>`).
  - `assets/snice-components-<H2>.js` hash is **identical** (`<H2>`), assuming the same set of Snice components is imported.
  - `assets/snice-theme-<H3>.css` hash is **identical** (`<H3>`).
  - Only `assets/index-<A2>.js` (or the edited lazy route chunk) and `index.html` change.
- **Branches**:
  - **Branch 2a (Developer adds a new lazy-loaded route importing `snice-table`)**: Core `snice-runtime-<H1>.js` and eager `snice-components-<H2>.js` hashes remain unchanged; `snice-table` lands in its own async chunk loaded only on that route.
  - **Branch 2b (Developer adds a new eager component import to `main.ts`)**: `snice-runtime-<H1>.js` hash remains unchanged; only `snice-components` and entry manifest update.
  - **Branch 2c (CI build on different OS/directory path)**: Absolute file paths never leak into chunk IDs or lowered output; identical source produces identical chunk filenames and hashes across machines.

### Flow 3: Local Development (`vite dev`) & Unit Testing (`vitest`)
- **Actor**: Persona A or Persona B.
- **Entry point**: `npm run dev` / `npm test` (`vitest`).
- **Expected behavior**:
  - Dev mode keeps `__DEV__ = true` (full warnings, render error attribution, `@watch` typo warnings, keyboard modifier warnings).
  - Dev mode preserves accurate high-resolution sourcemaps (`magic-string` `hires: 'boundary'`, `includeContent: true`) for breakpoints and Vitest/V8 coverage.
  - Dev mode skips expensive whole-graph optimizations (CSS theme pruning, production chunking) for instant HMR, while still compiling Snice decorators identically to prod so dev/prod behavior never diverges.
  - HMR reload of a decorated `@element` file does not crash on `customElements.define` duplicate registration (preserves existing `element.ts:692-697` idempotent check).

### Flow 4: Project Diagnostics (`npx snice check` & `npx snice doctor`)
- **Actor**: Persona A or Persona B (or CI).
- **Entry point**: `npx snice check` / `npx snice doctor`.
- **Flow**:
  1. `doctor` inspects `package.json`, `tsconfig.json`, deep component imports, AI skill, and runs `probeDecoratorTransform` (`bin/snice.js:471-535`).
  2. `probeDecoratorTransform` invokes `vite.build({ root: probeDir, configFile, build: { rollupOptions: { output: { manualChunks: () => undefined } } } })` on a temporary `probe.ts` with `@probeClass` and `@probeField('snice-doctor-probe-installed')`.
  3. **Required outcome**: Plugin handles temp `root` outside project CWD, respects `manualChunks: () => undefined`, compiles the non-Snice `@probeField` decorator so `'snice-doctor-probe-installed'` appears in output, and `snice check --json` reports `ok: true`.

### Flow 5: Rollup Library / Standalone Component / CDN Build
- **Actor**: Persona C or Snice's own `rollup.config.js` / `rollup.config.cdn.js`.
- **Entry point**: `rollup -c` or `snice build-component <name>`.
- **Expected behavior**:
  - Rollup plugin entry works without Vite-specific hooks (`config`, `configureServer`).
  - Library/single-file formats (`iife`, `cjs`, or explicit `output.file`) automatically bypass multi-chunk `manualChunks` configuration so Rollup never errors with `UMD and IIFE output formats are not supported for code-splitting builds`.
  - CDN runtime (`snice-runtime.min.js`) retains full public API and `window.Snice` exports.
