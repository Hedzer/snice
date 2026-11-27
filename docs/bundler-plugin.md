<!-- AI: For the AI-optimized version of this doc, see docs/ai/bundler-plugin.md -->

# Bundler Plugin

The official Snice bundler plugin (`snice/vite` and `snice/rollup`) compiles TC39 decorators directly to compact registration calls, minifies and optionally pre-compiles `html\`...\``, `svg\`...\``, and `css\`...\`` templates, strips redundant CSS token fallbacks when theme CSS is imported, removes dev-only diagnostics in production, provides dev-only `@element` HMR in Vite, and splits output into deterministic volatility-tiered chunks (supporting both Rollup `manualChunks` and Vite 6+ / Rolldown `advancedChunks` / `codeSplitting`).

## Table of Contents
- [Quick Start](#quick-start)
- [Options Reference](#options-reference)
- [Caching and HTTP Headers](#caching-and-http-headers)
- [CSS Pipeline, Modular Theme Slices, and Pruning](#css-pipeline-modular-theme-slices-and-pruning)
- [Build Reporting, Cache-Hash Diffing, and Budgets](#build-reporting-cache-hash-diffing-and-budgets)
- [Dev Server HMR](#dev-server-hmr)
- [Migrating from unplugin-swc](#migrating-from-unplugin-swc)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Vite (Snice SPA / PWA)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [snice()],
});
```

### Vite + React

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [react(), snice()],
});
```

### Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [snice()],
  test: { environment: 'happy-dom' },
});
```

### Rollup

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import snice from 'snice/rollup';

export default {
  input: 'src/main.ts',
  output: { dir: 'dist', format: 'es', sourcemap: true },
  plugins: [resolve({ extensions: ['.ts', '.js'] }), snice()],
};
```

## Options Reference

All options are optional. Passing `snice()` with no arguments enables every safe production optimization automatically.

```typescript
export interface SnicePluginOptions {
  /** Build-time Snice decorator lowering + TC39 2022-03 fallback (default: true). */
  decorators?: boolean;
  /** Minify html`` and svg`` templates in production (default: !dev). */
  minifyTemplates?: boolean;
  /** Opt-in pre-compiled template descriptors importing only used part factories (default: false). */
  precompileTemplates?: boolean;
  /** Minify inline css`` templates and fold static .css?inline imports (default: !dev). */
  minifyCss?: boolean;
  /** Strip allowlisted var(--snice-*, fallback) values ('auto' | boolean, default: 'auto'). */
  stripCssFallbacks?: 'auto' | boolean;
  /** Opt-in transitive pruning of unused --snice-* tokens in theme CSS (default: false; alias for `theme.prune`). */
  pruneTheme?: boolean;
  /** Token names or RegExp patterns always kept during pruning (default: []; alias for `theme.safelist`). */
  themeSafelist?: (string | RegExp)[];
  /** Modular theme feature-block & token pruning (always preserves custom user `[data-theme="..."]` blocks). */
  theme?: {
    prune?: boolean;
    dark?: boolean | 'auto' | 'manual';
    density?: boolean;
    motion?: boolean;
    print?: boolean;
    safelist?: (string | RegExp)[];
  };
  /** Fold __SNICE_DEV__ diagnostics (default: true in Vite serve/Vitest, false in prod; 'preserve' keeps untouched for libs). */
  dev?: boolean | 'preserve';
  /** Volatility-tiered deterministic chunk splitting (default: true for code-splitting builds). */
  caching?: boolean | {
    isolateHeavy?: boolean;
    isolateComponents?: string[];
    replaceDefaults?: boolean;
    vendor?: boolean;
    componentGroups?: Record<string, string[]>;
  };
  /** Default Vite build.target when unset by user (default: 'es2022'; false disables). */
  target?: string | false;
  /** Emit build tier size report (raw/gzip/brotli), cache-hash diff, and optional budgets (default: false). */
  report?: boolean | ((report: SniceBuildReport) => void) | {
    print?: boolean;
    compareWith?: string;
    writeManifest?: string;
    budgets?: Record<string, { raw?: number; gzip?: number; brotli?: number }>;
    failOnBudget?: boolean;
    onReport?: (report: SniceBuildReport) => void;
  };
  /** Dev-server HMR for @element classes in Vite serve mode (default: true; 0 bytes in production). */
  hmr?: boolean;
  /** Optional snice-table cell and feature stripping: explicit allowlist, 'auto' conservative detection, or false. */
  table?: false | 'auto' | {
    cells?: string[];
    features?: string[];
  };
  /** Build-time platform skin compilation (`'default' | 'ios' | 'material' | 'windows' | 'macos' | 'multi' | 'preserve'`). See docs/platform-skins.md. */
  platform?: 'default' | 'ios' | 'material' | 'windows' | 'macos' | 'multi' | 'preserve';
}
```

### Decorator Lowering (`decorators`)

Snice decorators (`@element`, `@page`, `@layout`, `@controller`, `@daemon`, `@property`, `@state`, `@query`, `@queryAll`, `@render`, `@styles`, `@ready`, `@dispose`, `@reconnect`, `@moved`, `@adopted`, `@watch`, `@on`, `@observe`, `@respond`, `@context`, `@dispatch`, `@request`, `@debounce`, `@throttle`, `@once`, `@memoize`) lower directly to compact registration calls without `tslib` `__esDecorate` boilerplate. Modern TypeScript syntax (`satisfies`, `using`, `accessor`, generic decorators) is handled cleanly, and any non-Snice TC39 2022-03 decorators fall back seamlessly to a tiny deduplicated virtual runtime.

### Template Minification and Lean Pre-compilation (`minifyTemplates`, `precompileTemplates`)

In production, `minifyTemplates` collapses redundant whitespace and strips static HTML comments inside Snice `html\`...\`` and `svg\`...\`` literals while preserving `<pre>`, `<code>`, `<textarea>`, `<script>`, `<style>`, quoted attributes, inline element spacing, and dynamic comments.

Enabling `precompileTemplates: true` hoists static template descriptors at build time and imports **only** the modular part factories actually used in each file (`__pNode`, `__pEvent`, `__pAttr`, etc.), bypassing the runtime HTML/TreeWalker parser (`prepareTemplate`) and letting Rollup tree-shake unused part families (keyboard filters, spreads, conditionals, controllers) out of your app bundle (~25% smaller gzip minimal app).

### Modular Table Stripping (`table`)

When your app imports `snice/components/table/snice-table`, strip unused cell types and optional features at build time without changing imports:

```typescript
// Explicit allowlist:
snice({
  table: {
    cells: ['text', 'number', 'date', 'status', 'actions'],
    features: ['filter', 'export'],
  },
});

// Or conservative zero-config static auto-detection:
snice({ table: 'auto' });
```

- **`table: 'auto'`** scans project source files for `<snice-table>`, `<snice-column type="...">`, static column arrays, and feature attributes/properties. Whenever columns or spreads are dynamic/computed, it conservatively bails out and keeps the full `snice-table` so runtime behavior is never broken.
- Omitting `cells` keeps all 21 cell types; passing `cells: []` keeps only core `text`. Documented aliases (`percent`, `url`, `money`, `tags`, etc.) normalize automatically.
- Omitting `features` keeps all 11 optional features; passing `features: []` keeps only core sorting/selection/pagination/column-manager/keyboard. Transitive dependencies (such as `'toolbar'` requiring `'filter'`) are included automatically.
- Unrecognized cell or feature names fail fast at build start. Apps without the plugin can also import `snice/components/table/snice-table-core` directly.

## Caching and HTTP Headers

When `caching` is enabled (the default for code-splitting builds), `snice()` partitions modules by change volatility so routine app deploys keep framework, vendor, component, and theme hashes byte-identical:

- `snice-runtime-[hash].js` — tree-shaken Snice core engine
- `vendor-react-[hash].js` — React and ReactDOM (when present)
- `vendor-[hash].js` — statically reachable third-party `node_modules` packages (`caching.vendor`, default `true`)
- `snice-theme-[hash].css` — Snice theme stylesheet(s) (`theme.css` or modular `theme/*.css` slices)
- `snice-<group>-[hash].js` — optional user-defined component groups via `caching.componentGroups` (e.g. `{ forms: ['input', 'select', 'checkbox'] }`) so adding other components does not invalidate that group's cache hash
- `snice-components-[hash].js` — standard Snice UI components
- `snice-<heavy>-[hash].js` — heavy component families (`table`, `pdf-viewer`, `qr-reader`, `chart`, `calendar`, `code-block`, `flow`, `kanban`) isolated on demand
- `index-[hash].js` / route chunks — volatile application code

Serve hashed assets under `/assets/` with long-lived immutable caching and keep `index.html` revalidated:

```http
# /assets/*
Cache-Control: public, max-age=31536000, immutable

# /index.html
Cache-Control: no-cache
```

**Vite 6+ / Rolldown support**: When running on Rolldown or when `output.advancedChunks` / `output.codeSplitting` is configured, `snice()` automatically emits Rolldown chunk groups (also exported as `createSniceAdvancedChunksGroups()`), merging user groups ahead of Snice defaults. Single-file (`iife`/`umd`), library (`build.lib`), and custom `manualChunks` function builds bypass automatic chunking without error.

## CSS Pipeline, Modular Theme Slices, and Pruning

- **Inline `css\`...\`` and `.css?inline`**: Minifies static CSS while preserving `calc(...)` spacing, custom properties, `:host(...)`, `::part(...)`, `@container`, and `url("data:...")`. Static `import styles from './x.css?inline'` + ``css`${styles}` `` folds into a zero-interpolation `css` call.
- **Modular slices & automatic fallback stripping (`stripCssFallbacks: 'auto'`)**: Recognizes `snice/components/theme/theme.css`, all modular slices (`core.css`, `dark.css`, `accents.css`, `effects.css`, `density.css`, `motion.css`, `print.css`), and custom user CSS files that define `:root` `--snice-*` tokens. The allowlist is the **union** of top-level `:root` tokens across ONLY the theme files actually imported — so importing `core.css` without `effects.css` strips core fallbacks while keeping shadow/gradient fallbacks intact, and a standalone custom theme only strips fallbacks for tokens it actually defines. If you load `theme.css` externally via `<link rel="stylesheet">`, opt in with `stripCssFallbacks: true`.
- **Feature-block & token pruning (`theme`)**: When importing full `theme.css`, strip unused built-in blocks and/or unused tokens:
  ```typescript
  snice({
    theme: {
      prune: true,       // cross-block transitive token pruning
      dark: 'manual',    // true | 'auto' | 'manual' | false
      density: false,    // strip [data-density="compact"|"spacious"]
      motion: true,      // keep prefers-reduced-motion & [data-motion=...]
      print: false,      // strip @media print
      safelist: [/^--snice-z-/],
    },
  });
  ```
  Custom user `[data-theme="<custom>"]` blocks are **always preserved** untouched under both feature-block and token pruning.

## Build Reporting, Cache-Hash Diffing, and Budgets

Pass `report: true` for a per-tier table (raw, gzip, and Brotli sizes), or configure cache-hash diffing (`STABLE` vs `CHANGED` vs `NEW`) and size budgets across builds:

```typescript
snice({
  report: {
    writeManifest: '.snice-build-manifest.json',
    compareWith: '.snice-build-manifest.json',
    budgets: {
      total: { gzip: 120_000, brotli: 100_000 },
      'snice-runtime': { gzip: 20_000 },
    },
    failOnBudget: true,
  },
});
```

## Dev Server HMR

In Vite dev (`serve`) mode, `snice/vite` automatically injects dev-only HMR support (`hmr: true`, **0 bytes** in production builds and Rollup) for `@element` and `@layout` classes. Editing a component hot-patches prototype methods, `@render`, and `@styles` and re-renders live mounted instances (including inside open shadow roots) while preserving instance state — without `NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry'` or a full page reload. Pass `hmr: false` to disable.

## Migrating from unplugin-swc

1. Remove `unplugin-swc` from `package.json` `devDependencies`.
2. Replace `swc.vite(...)` with `snice()` from `'snice/vite'` in both `vite.config.ts` and `vitest.config.ts`.
3. Remove legacy `build.target: 'es2015'` and manual `manualChunks: { vendor: ['snice'] }` entries so `snice()` manages `es2022` output and cache-tier chunking automatically.
4. Run `npx snice check` and `npm run build` to verify.

## Troubleshooting

- **Missing decorator transforms in `snice doctor`**: Ensure `snice()` is registered in `vite.config.ts` `plugins`.
- **Dynamic CSS tokens stripped under `theme: { prune: true }` / `pruneTheme: true`**: Add exact token names or `RegExp` patterns to `theme: { safelist: ['--snice-color-danger', /^--snice-z-/] }` (or `themeSafelist`).
- **Custom Rollup `manualChunks`**: Passing a `manualChunks` object merges with Snice's tiers; passing a `manualChunks` function takes full precedence over Snice's built-in chunking.
- **Inspecting chunk sizes**: Pass `report: true`, `report: (r) => { ... }`, or `report: { compareWith, writeManifest, budgets }`.
