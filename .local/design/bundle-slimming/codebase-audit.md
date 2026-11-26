# Verified Codebase Audit (Evidence Ledger)

All facts below were directly verified from source files in `/home/hedzer/Dropbox/Projects/snice` (v7.11.0).

---

## 1. Core Engine (`packages/core/src/`)

- **Inventory**: 71 files (41 runtime/utility + 30 type files), 12,152 lines, 432,022 bytes.
- **Largest runtime files**:
  - `packages/core/src/parts.ts`: 2,798 lines (97,006 B)
  - `packages/core/src/element.ts`: 1,204 lines (51,644 B)
  - `packages/core/src/controller.ts`: 689 lines (27,124 B)
  - `packages/core/src/router.ts`: 666 lines (24,028 B)
  - `packages/core/src/on.ts`: 548 lines (21,540 B)
  - `packages/core/src/render.ts`: 617 lines (21,186 B)
  - `packages/core/src/utils.ts`: 512 lines (17,856 B)
  - `packages/core/src/request-response.ts`: 423 lines (16,177 B)
  - `packages/core/src/observe.ts`: 386 lines (12,094 B)
  - `packages/core/src/method-decorators.ts`: 367 lines (10,100 B)
  - `packages/core/src/reactive.ts`: 210 lines (8,629 B)
  - `packages/core/src/symbols.ts`: 153 lines (8,127 B)
  - `packages/core/src/events.ts`: 211 lines (8,038 B)
  - `packages/core/src/context.ts`: 218 lines (7,310 B)
  - `packages/core/src/transitions.ts`: 263 lines (7,125 B)
  - `packages/core/src/template.ts`: 228 lines (6,191 B)

### 1.1 Top-Level Side Effects Blocking Tree-Shaking
1. **`package.json:1-251`**: No `"sideEffects"` field.
2. **`packages/core/src/index.ts:14-16`**:
   ```ts
   if (typeof document !== 'undefined') {
     useNativeElementControllers();
   }
   ```
   Invokes `controller.ts:550-662`, which mutates `globalThis.sniceNativeControllersInitialized`, allocates a `MutationObserver`, sets `globalThis.sniceNativeControllerObserver`, queries `document.querySelectorAll('[controller]')`, and attaches `observer.observe(document.body, ...)`. Unconditionally retains `controller.ts` (27.1 KB) in every bundle.
3. **`packages/core/src/global.ts:9-21`**: Mutates `globalThis.snice` (`controllerRegistry`, `pendingControllerAttachments`, `controllerIdCounter`) at import time.
4. **`packages/core/src/scroll-lock.ts:21-27`**: Mutates `globalThis[Symbol.for('snice:body-scroll-lock')]` at import time.
5. **`packages/core/src/snice-element.ts:12,42`**: Extends global `HTMLElement` and calls `Object.defineProperty(SniceElement.prototype, SNICE_ELEMENT_BASE, { value: true })` at module top level.
6. **`packages/core/src/template-marker.ts:3-13`**: Calls `Math.random()` and constructs `RegExp` at module top level.
7. **`packages/core/src/symbols.ts:8-153`**: ~75 top-level `getSymbol(...)` calls (`Symbol.for(...)`) without `/*#__PURE__*/` annotations.
8. **`packages/core/src/testing-dom.ts:50`**: Separate entry point (`./testing/dom`) that intentionally patches `HTMLElement.prototype.autofocus` on import — MUST stay listed in `"sideEffects"`!

### 1.2 Static Coupling in Lifecycle Setup (Prevents Dropping Unused Decorators)
- **`packages/core/src/element.ts:1-24`** statically imports and calls inside `applyElementFunctionality` (`88-605`):
  - `./controller`: `attachController`, `deferControllerAttachment`, `detachController`, `restoreDirectControllerAttribute`
  - `./observe`: `setupObservers`, `cleanupObservers`
  - `./request-response`: `setupResponseHandlers`, `cleanupResponseHandlers`
  - `./on`: `setupEventHandlers`, `cleanupEventHandlers`
  - `./context`: `setupContextHandler`, `cleanupContextHandler`
  - `./render`: `requestRender`, `applyStyles`, `clearRenderTimers`, `disconnectRenderTree`, `reconnectRenderTree`
  - `./events`: `clearDispatchTimers`
  - `./method-decorators`: `clearDebounceTimers`, `clearThrottleTimers`
  - `./autofocus`: `resetHostAutofocus`, `scheduleAutofocus`
  - `./render-errors`: `registerRenderHostIdentity`
- **`packages/core/src/controller.ts:1-5`**: Statically imports `observe`, `request-response`, `on`, `events`, `context`.
- **`packages/core/src/daemon.ts:1-3`**: Statically imports `events`, `on`, `request-response`.
- **`packages/core/src/parts.ts:802-867`**: `TemplateInstance.renderFragment()` statically switches across all 14 `Part` subclasses (`NodePart`, `AttributePart`, `PropertyPart`, `BooleanAttributePart`, `EventPart`, `ClassPart`, `StylePart`, `SpreadPart`, `ControllerPart`, `ConditionalIfPart`, `ConditionalElseIfPart`, `ConditionalCasePart`, `ConditionalWhenPart`, `CommentPart`), pulling `ControllerPart` → `controller.ts` and all conditional/spread/comment logic into any template render.

### 1.3 Complete Decorator Metadata Protocol (28 Decorator Usages / 27 Unique Exports)
All decorators target TC39 Stage 3 (`ClassDecoratorContext`, `ClassFieldDecoratorContext`, `ClassMethodDecoratorContext`). None target `accessor` or `getter`.

- **Class decorators (5)**:
  - `@element(tagName, options?)` (`element.ts:703-716`, `defineElement:646-701`): merges ancestor `PROPERTIES` & `formAssociated`, reads `context.metadata[PROPERTIES]` (or `_pendingProperties` stack), sets `constructor[ELEMENT_OPTIONS]`, `applyElementFunctionality`, `customElements.define`, `registerRenderHostIdentity`.
  - `@layout(tagName)` (`element.ts:718-722`): delegates to `defineElement`.
  - `@page(options)` (`router.ts:119-182`): instance method returned by `Router()`; transfers `PROPERTIES`, calls `applyElementFunctionality`, sets `PAGE_TRANSITION`, wraps `connectedCallback`/`disconnectedCallback` for router context, defines custom element, registers route.
  - `@controller(name)` (`controller.ts:61-99`): registers in `globalThis.snice.controllerRegistry`, sets `prototype[IS_CONTROLLER_CLASS] = true`, `constructor[CONTROLLER_REGISTRY_NAME] = name`, flushes pending attachments.
  - `@daemon` (`daemon.ts:14-22`): sets non-enumerable `prototype[IS_DAEMON_CLASS] = true`.
- **Field decorators (4)**:
  - `@property(options?)` (`element.ts:742-896`): records options in `context.metadata[PROPERTIES]` (or `_pendingProperties`); field initializer installs getter/setter on `constructor.prototype` (once per class via `PROPERTY_DEFINERS`), captures `PROPERTY_DEFAULTS`, wraps deep proxies (`PROPERTY_WRAPPERS`), rescues pre-upgrade bindings.
  - `@state(options?)` (`element.ts:899-901`): `property({ ...options, attribute: false, reflect: false })`.
  - `@query(selector, options?)` (`element.ts:909-934`): installs prototype getter querying `getRenderRoot`/`shadowRoot`/light DOM.
  - `@queryAll(selector, options?)` (`element.ts:936-966`): installs prototype getter returning `querySelectorAll` array.
  - `@context` (deprecated field `contextProperty`, `element.ts:1035-1071`): prototype getter returning `this[ROUTER_CONTEXT] ?? getAppContext(this)`.
- **Method decorators registering constructor metadata via `addInitializer` (10)**:
  - `@render(options?)` (`render.ts:474-497`): sets `this[RENDER_METHOD]` + `this[RENDER_OPTIONS]`, wraps method to trigger `performRender` on manual call.
  - `@styles()` (`render.ts:514-528`): chains `this[PARENT_STYLES_METHODS]` and sets `this[STYLES_METHOD]`.
  - `@ready()` / `@dispose()` / `@reconnect()` (`element.ts:1073-1124`): appends `{ methodName, method }` to own `constructor[READY_HANDLERS|DISPOSE_HANDLERS|RECONNECT_HANDLERS]`.
  - `@moved(options?)` / `@adopted(options?)` (`element.ts:1143-1204`): appends to `MOVED_HANDLERS|ADOPTED_HANDLERS` and wraps for debounce/throttle via `MOVED_TIMERS|ADOPTED_TIMERS`.
  - `@watch(...props, options?)` (`element.ts:973-1029`): populates own `constructor[PROPERTY_WATCHERS]` Map.
  - `@on(eventName, selector?, options?)` (`on.ts:63-152`): appends to own `constructor[ON_HANDLERS]`.
  - `@observe(type, selector?, options?)` (`observe.ts:26-76`): appends to own `constructor[OBSERVERS]`.
  - `@respond(channel, options?)` (`request-response.ts:214-241`): appends to own `constructor[CHANNEL_HANDLERS]`.
  - `@context(options?)` (`context.ts:43-71`): appends to own `constructor[CONTEXT_HANDLERS]`.
- **Pure method wrappers (no `addInitializer`, no constructor metadata) (6)**:
  - `@dispatch` (`events.ts:22-189`), `@request` (`request-response.ts:25-205`), `@debounce` / `@throttle` / `@once` / `@memoize` (`method-decorators.ts:35-311`).

### 1.4 `css()` Cache Bypass Bug (`packages/core/src/template.ts:89-127`)
- `cssResultCache = new WeakMap<TemplateStringsArray, CSSResult>()` (`template.ts:15`).
- Line 90: `const cached = values.length === 0 ? cssResultCache.get(strings) : undefined;`
- Line 124: `if (values.length === 0) cssResultCache.set(strings, result);`
- **Impact**: **172** component files + **5** mixed files use `import cssContent from './snice-*.css?inline'` followed by ``css`${cssContent}` `` (`values.length === 1`), bypassing `cssResultCache` completely and running `new CSSStyleSheet(); sheet.replaceSync(cssText)` on **every component instance** instead of once per class!

### 1.5 Dev-Only & Diagnostic Code
- Zero `__DEV__` or `process.env.NODE_ENV` checks exist anywhere in `packages/core/src/`.
- Total unconditional `console.*` calls: **3** `console.debug`, **25** `console.warn` (+2 gated), **48** `console.error`.
- Key diagnostic modules/functions: `render-errors.ts` (4,845 B), `render-debug.ts` (1,168 B), `render-tracker.ts` (1,453 B — unused legacy duplicate of `render-debug.ts`), `validateWatchedProperties` (`utils.ts:482-512`), `warnIfModifierMisuse` (`keyboard-filter.ts:22-34`), `contextualizeTemplatePreparationError` (`parts.ts:154-170`).
- **Contract note**: `tests/cdn-runtime.test.ts` explicitly checks for `'snice: render failed for '` in `snice-runtime.min.js`.

---

## 2. Components, CSS, Templates & Heavy Dependencies (`packages/components/src/`)

- **Counts**: 137 subdirs (135 non-WIP components, 1 WIP `spreadsheet` in `.wip`, 1 `theme/`; 134 CDN entries since `icons/` has `index.ts` only); 496 `.ts` files, 189 `snice-*.ts` files, 221 Rollup entries, 194 `@element` definitions.

### 2.1 `var(--snice-*, fallback)` & `theme.css` Audit
- **`theme.css`**: `packages/components/src/theme/theme.css`, **27,346 B** (544 lines), **214** unique `--snice-*` tokens in `:root` (**52** overridden in `[data-theme="dark"]`). Includes `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)` / `:root:not([data-theme="light"])`, `[data-density="compact"|"spacious"]`, `@media print`, `@media (prefers-reduced-motion: reduce)`, `[data-motion="reduce"|"off"]`.
- **Component CSS (`170 .css` files = 1,041,811 B + inline ``css`...` `` = 48,149 B)**:
  - **7,261** `var(--snice-*, fallback)` calls = **100,313 B** trimmed / **114,835 B** including `, `.
  - **CRITICAL SAFETY FINDINGS**:
    1. **128** nested `var(...)` calls inside `--snice-*` fallbacks (plus 48 in non-`--snice-*` fallbacks).
    2. **497** fallbacks containing commas (294 `font-family`, 66 multi-layer `box-shadow`, 19 `cubic-bezier(...)`, 1 `hsl(var(...))`). **Simple regex WILL corrupt CSS** — a balanced-parenthesis CSS value scanner is mandatory.
    3. **179** `--snice-<comp>-*` component-scoped tokens (e.g. `--snice-terminal-*`, `--snice-receipt-*`, `--snice-table-*`, `--snice-doc-*`) are **NOT in `theme.css`**. Stripping fallbacks MUST ONLY strip tokens present in the imported `theme.css` token set (the 214 `:root` tokens).
    4. **1,852** fallbacks differ slightly from `theme.css` values (e.g. `rgb(226 226 226)` vs `hsl(0 0% 82%)`, hex colors in `pagination`/`menu-divider`). When `theme.css` IS loaded, the fallback is already dead code in CSS evaluation, so allowlisted stripping preserves exact rendered appearance.

### 2.2 HTML Templates Audit
- **428** top-level ``html`...` `` templates (+ **106** nested) across **176** files = **399,765 B** inner content.
- **Verified edge cases**:
  - Whitespace-sensitive tags: `<pre>`/`<code>` (`code-block/snice-code-block.ts:146,160`), `<textarea>` (5 occurrences across `chat`, `comments`, `textarea`).
  - Snice control tags: `<if>` (133), `<case>` (14), `<when>` (14), `<default>` (13), `repeat(...)` (5 JS calls).
  - Multi-line tag attributes: 149 templates across 96 files; `style="..."`: 79; `<svg>`: 89; HTML comments `<!-- -->`: 7; dynamic tag via `unsafeHTML`: 1 (`table/snice-row.ts:258-262`).

### 2.3 Heavy Components & Transitive Bloat
- **`packages/components/src/utils.ts:1-2`**: Unconditionally imports `ICONS` from `./icons/index` (**35,133 B**). **32** component files import `../utils`, including `snice-chart.ts:4` (which only calls `getAccentPalette` and uses zero icons).
- **`packages/components/src/table/snice-table.ts`**: **830,794 B** transitive local graph (74 files, 0 dynamic imports; CDN minified **417.3 KB raw / 77.3 KB gz**). Lines `1-58` unconditionally import 7 sibling components (`input`, `select`, `button`, `checkbox`, `modal`, `empty-state`, `progress`), 22 cell components, 2 structural sub-components (`column`, `row`), and 12 feature modules (13 classes eagerly instantiated at `snice-table.ts:297-309`).
- **`packages/components/src/pdf-viewer/snice-pdf-viewer.ts:6`**: Statically imports vendored `./pdf.min.mjs` (**327,044 B**; CDN **323.7 KB raw / 92.2 KB gz**).
- **`packages/components/src/button/snice-button.ts`**: 6,621 B TS → **20,423 B** JS via `tsc` (`tslib` `__esDecorate`, 3.08×) / **24,210 B** JS via SWC without `externalHelpers` (3.66×, inlining ~12 KB `applyDecs2203RFactory`).

---

## 3. Templates, CLI, Build & Test Contracts

- **`bin/templates/default/vite.config.ts`**:
  - Uses `unplugin-swc` without `externalHelpers: true` (`:7-20`), sets `build.target: 'es2015'` (`:78`), `manualChunks: { vendor: ['snice'] }` (`:83-85`).
- **`bin/templates/react/vite.config.ts`**:
  - Uses `@vitejs/plugin-react` (`:5`), `build.target: 'es2015'` (`:7`), `manualChunks: { vendor: ['react', 'react-dom'], snice: ['snice'] }` (`:11-14`).
- **`bin/snice.js:471-535` (`probeDecoratorTransform`)**:
  - Invoked by `snice doctor` and `snice check` when Vite is present and `src/` uses field decorators.
  - Runs `vite.build({ root: probeDir, configFile, build: { outDir, emptyOutDir: true, minify: false, write: true, rollupOptions: { output: { manualChunks: () => undefined } } } })` on `DECORATOR_PROBE_SOURCE` (`@probeClass`, `@probeField('snice-doctor-probe-installed')`).
  - Checks output JS contains `'snice-doctor-probe-installed'`.
- **`rollup.config.js`**:
  - Core built as monolithic `dist/index.esm.js`, `dist/index.cjs`, `dist/index.iife.js` (`:98-156`) with `failOnCoreCircularDependency` (`:34-40`).
  - Components built via multi-entry Rollup (`preserveModules: false`, `:318`), `external: ['snice', 'snice/symbols', 'snice/transitions', 'tslib']` (`:311`), `CleanCSS({ level: 2 })` for `.css?inline` (`:346-348`), TypeScript `importHelpers: true` (`packages/components/tsconfig.json:12`).
- **`rollup.config.cdn.js`**:
  - Shared runtime (`dist/cdn/runtime/snice-runtime.{js,min.js,esm.js,esm.min.js}`) re-exports `dist/index.esm.js` + imports `symbols` & `transitions`; `name: 'Snice'`.
  - Components bundle from `dist/components/`, externalize `snice`, `snice/symbols`, `snice/transitions` (mapped to global `Snice`), **do not** externalize `tslib` (bundled into every CDN component!).
- **Hard Test Gates**:
  - `vitest.core-coverage.config.ts`: strictly `> 90%` (`90.01%`) statements/branches/functions/lines across `element.ts`, `parts.ts`, `reactive.ts`, `render-root.ts`, `render.ts`, `repeat.ts`, `snice-element.ts`, `template.ts`.
  - `tests/package-contract.test.ts`: `exports` key order, NodeNext types, deep component imports, >180 React adapters, non-null `sourcesContent` in >500 sourcemaps.
  - `tests/cli-create-app.test.ts`: scaffolds both `default` and `react`, runs `type-check`, `snice check . --json`, `npm run build`.
  - `tests/cdn-builds.test.ts` & `tests/cdn-runtime.test.ts`: CDN runtime + component artifact/runtime smoke tests.
  - `tooling/testing/run-full-tests.js` (`npm test`): full gate (distribution, testing, CDN, React, website, deploy, core coverage, matrix, distribution tests, CDN tests, React tests, Playwright framework & website in Chromium/Firefox/WebKit).
