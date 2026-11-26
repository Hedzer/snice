# Bundler Plugin (`snice/vite`, `snice/rollup`)

Built-in Vite and Rollup plugin for decorator lowering, template/CSS minification, allowlisted `var()` fallback stripping, dev-diagnostic DCE (`__SNICE_DEV__`), and deterministic volatility-tiered caching.

## Usage

```typescript
// vite.config.ts (Snice SPA / Vitest)
import { defineConfig } from 'vite';
import snice from 'snice/vite';
export default defineConfig({ plugins: [snice()] });

// vite.config.ts (React + Snice)
import react from '@vitejs/plugin-react';
import snice from 'snice/vite';
export default defineConfig({ plugins: [react(), snice()] });

// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import snice from 'snice/rollup';
export default {
  input: 'src/main.ts',
  output: { dir: 'dist', format: 'es', sourcemap: true },
  plugins: [resolve({ extensions: ['.ts', '.js'] }), snice()],
};
```

## Options

```typescript
interface SnicePluginOptions {
  decorators?: boolean;                    // default: true (lowers Snice decorators; TC39 2022-03 fallback)
  minifyTemplates?: boolean;               // default: !dev (minifies html`` / svg``; preserves pre/code/textarea/script/style)
  precompileTemplates?: boolean;           // default: false (opt-in hoisted template descriptors)
  minifyCss?: boolean;                     // default: !dev (minifies inline css`` & folds static .css?inline)
  stripCssFallbacks?: 'auto' | boolean;    // default: 'auto' (strips allowlisted :root --snice-* fallbacks when theme.css is imported; true uses shipped theme.css)
  pruneTheme?: boolean;                    // default: false (opt-in cross-block transitive theme.css pruning + re-hashing)
  themeSafelist?: (string | RegExp)[];     // default: [] (tokens kept when pruneTheme: true)
  dev?: boolean;                           // default: true in Vite serve/Vitest, false in prod (folds __SNICE_DEV__)
  caching?: boolean | {                    // default: true (code-splitting builds only)
    isolateHeavy?: boolean;                // default: true (table, pdf-viewer, qr-reader, chart, calendar, code-block, flow, kanban)
    isolateComponents?: string[];
    replaceDefaults?: boolean;
  };
  target?: string | false;                 // default: 'es2022' when build.target unset; false disables
  report?: boolean | ((r: SniceBuildReport) => void); // default: false
}
```

## Cache Tiers

- `snice-runtime-[hash].js` — tree-shaken Snice core (`dist/_core/*`)
- `vendor-react-[hash].js` — `react` / `react-dom` / `scheduler`
- `snice-theme-[hash].css` — `snice/components/theme/theme.css`
- `snice-components-[hash].js` — standard Snice components
- `snice-<heavy>-[hash].js` — isolated heavy components
- `index-[hash].js` — volatile app code
- Bypassed automatically for `iife`/`umd`, `build.lib`, `inlineDynamicImports`, or user `manualChunks` function.
- Recommended headers: `Cache-Control: public, max-age=31536000, immutable` on hashed assets, `no-cache` on `index.html`.

## Rules & Migration

- Replaces `unplugin-swc` in both `vite.config.ts` and `vitest.config.ts` (remove `unplugin-swc`, `build.target: 'es2015'`, and naive `manualChunks`).
- `stripCssFallbacks: 'auto'` is import-order independent and never strips non-theme `--snice-<comp>-*` tokens.
- `pruneTheme: true` preserves dark-mode transitive primitives (`[data-theme="dark"]`, `prefers-color-scheme: dark`), data URIs, and dynamic `--snice-color-accent-*` tokens; use `themeSafelist` for custom dynamic lookups.
- Both `'snice/vite'` and `'snice/rollup'` are accepted by `npx snice check` and `npx snice doctor`.
