<!-- AI: For the AI-optimized version of this doc, see docs/ai/bundler-plugin.md -->

# Bundler Plugin

The official Snice bundler plugin (`snice/vite` and `snice/rollup`) compiles TC39 decorators directly to compact registration calls, minifies `html\`...\``, `svg\`...\``, and `css\`...\`` templates, strips redundant CSS token fallbacks when `theme.css` is imported, removes dev-only diagnostics in production, and splits output into deterministic volatility-tiered chunks for long-lived HTTP caching.

## Table of Contents
- [Quick Start](#quick-start)
- [Options Reference](#options-reference)
- [Caching and HTTP Headers](#caching-and-http-headers)
- [CSS Pipeline and Theme Pruning](#css-pipeline-and-theme-pruning)
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
  /** Opt-in pre-compiled template descriptors that skip runtime quasi scanning (default: false). */
  precompileTemplates?: boolean;
  /** Minify inline css`` templates and fold static .css?inline imports (default: !dev). */
  minifyCss?: boolean;
  /** Strip allowlisted var(--snice-*, fallback) values ('auto' | boolean, default: 'auto'). */
  stripCssFallbacks?: 'auto' | boolean;
  /** Opt-in transitive pruning of unused --snice-* tokens in theme.css (default: false). */
  pruneTheme?: boolean;
  /** Token names or RegExp patterns always kept when pruneTheme is true (default: []). */
  themeSafelist?: (string | RegExp)[];
  /** Fold __SNICE_DEV__ diagnostics (default: true in Vite serve/Vitest, false in production). */
  dev?: boolean;
  /** Volatility-tiered deterministic chunk splitting (default: true for code-splitting builds). */
  caching?: boolean | {
    isolateHeavy?: boolean;
    isolateComponents?: string[];
    replaceDefaults?: boolean;
  };
  /** Default Vite build.target when unset by user (default: 'es2022'; false disables). */
  target?: string | false;
  /** Print or receive per-tier raw and gzip bundle size report (default: false). */
  report?: boolean | ((report: SniceBuildReport) => void);
  /** Optional snice-table cell and feature allowlist stripping. */
  table?: {
    cells?: string[];
    features?: string[];
  };
}
```

### Decorator Lowering (`decorators`)

Snice decorators (`@element`, `@page`, `@layout`, `@controller`, `@daemon`, `@property`, `@state`, `@query`, `@queryAll`, `@render`, `@styles`, `@ready`, `@dispose`, `@reconnect`, `@moved`, `@adopted`, `@watch`, `@on`, `@observe`, `@respond`, `@context`, `@dispatch`, `@request`, `@debounce`, `@throttle`, `@once`, `@memoize`) lower directly to compact registration calls without `tslib` `__esDecorate` boilerplate. Any non-Snice TC39 2022-03 decorators in the same project fall back seamlessly to a tiny deduplicated virtual runtime.

### Template Minification and Pre-compilation (`minifyTemplates`, `precompileTemplates`)

In production, `minifyTemplates` collapses redundant whitespace and strips static HTML comments inside Snice `html\`...\`` and `svg\`...\`` literals while preserving `<pre>`, `<code>`, `<textarea>`, `<script>`, `<style>`, quoted attributes, inline element spacing, and dynamic comments. Enabling `precompileTemplates: true` hoists static part descriptors at build time so runtime rendering skips the quasi scanner completely.

### Modular Table Stripping (`table`)

When your app imports `snice/components/table/snice-table`, pass `table: { cells, features }` to strip unused cell types and optional features at build time without changing application imports:

```typescript
snice({
  table: {
    cells: ['text', 'number', 'date', 'status', 'actions'],
    features: ['filter', 'export'],
  },
});
```

- Omitting `cells` keeps all 21 cell types; passing `cells: []` keeps only core `text`. Documented aliases (`percent`, `url`, `money`, `tags`, etc.) normalize automatically.
- Omitting `features` keeps all 11 optional features; passing `features: []` keeps only core sorting/selection/pagination/column-manager/keyboard. Transitive dependencies (such as `'toolbar'` requiring `'filter'`) are included automatically.
- Unrecognized cell or feature names fail fast at build start. Apps without the plugin can also import `snice/components/table/snice-table-core` directly.

## Caching and HTTP Headers

When `caching` is enabled (the default for code-splitting builds), `snice()` partitions modules by change volatility so routine app deploys keep framework, component, and theme hashes byte-identical:

- `snice-runtime-[hash].js` — tree-shaken Snice core engine
- `vendor-react-[hash].js` — React and ReactDOM (when present)
- `snice-theme-[hash].css` — Snice theme tokens (`snice/components/theme/theme.css`)
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

Single-file (`iife`/`umd`), library (`build.lib`), and custom `manualChunks` function builds bypass automatic chunking without error.

## CSS Pipeline and Theme Pruning

- **Inline `css\`...\`` and `.css?inline`**: Minifies static CSS while preserving `calc(...)` spacing, custom properties, `:host(...)`, `::part(...)`, `@container`, and `url("data:...")`. Static `import styles from './x.css?inline'` + ``css`${styles}` `` folds into a zero-interpolation `css` call.
- **Automatic fallback stripping (`stripCssFallbacks: 'auto'`)**: When `snice/components/theme/theme.css` is imported in the module graph, allowlisted top-level `:root` `--snice-*` fallbacks are stripped in production (saving up to ~115 KB across component CSS) while preserving component-scoped `--snice-<comp>-*` tokens. Apps without `theme.css` retain all fallbacks untouched. If you load `theme.css` externally via `<link rel="stylesheet">`, opt in with `stripCssFallbacks: true`.
- **Opt-in theme pruning (`pruneTheme: true`)**: Computes cross-block transitive token closure across `:root`, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)`, density, print, and motion blocks, removes unreferenced `--snice-*` declarations and empty blocks, and updates the emitted `snice-theme-[hash].css` filename hash. Use `themeSafelist` to retain dynamically queried tokens.

## Migrating from unplugin-swc

1. Remove `unplugin-swc` from `package.json` `devDependencies`.
2. Replace `swc.vite(...)` with `snice()` from `'snice/vite'` in both `vite.config.ts` and `vitest.config.ts`.
3. Remove legacy `build.target: 'es2015'` and manual `manualChunks: { vendor: ['snice'] }` entries so `snice()` manages `es2022` output and cache-tier chunking automatically.
4. Run `npx snice check` and `npm run build` to verify.

## Troubleshooting

- **Missing decorator transforms in `snice doctor`**: Ensure `snice()` is registered in `vite.config.ts` `plugins`.
- **Dynamic CSS tokens stripped under `pruneTheme: true`**: Add exact token names or `RegExp` patterns to `themeSafelist: ['--snice-color-danger', /^--snice-z-/]`.
- **Custom Rollup `manualChunks`**: Passing a `manualChunks` object merges with Snice's tiers; passing a `manualChunks` function takes full precedence over Snice's built-in chunking.
- **Inspecting chunk sizes**: Pass `report: true` (prints a table) or `report: (r) => { ... }` to inspect per-tier raw and gzip bytes.
