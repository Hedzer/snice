# Bundler Plugin (`snice/vite`, `snice/rollup`)

Built-in Vite and Rollup plugin for decorator lowering, template/CSS minification, lean pre-compiled templates, partial-theme allowlisted `var()` fallback stripping, theme feature-block/token pruning, dev-only `@element` HMR, dev-diagnostic DCE (`__SNICE_DEV__`), and deterministic volatility-tiered caching (Rollup `manualChunks` + Vite 6+/Rolldown `advancedChunks`/`codeSplitting`).

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
  decorators?: boolean;                    // default: true (lowers Snice decorators; handles satisfies/using/accessor; TC39 fallback)
  minifyTemplates?: boolean;               // default: !dev (minifies html`` / svg``; preserves pre/code/textarea/script/style)
  precompileTemplates?: boolean;           // default: false (emits minimal per-part imports; bypasses runtime HTML/TreeWalker parser)
  minifyCss?: boolean;                     // default: !dev (minifies inline css`` & folds static .css?inline)
  stripCssFallbacks?: 'auto' | boolean;    // default: 'auto' (union allowlist of imported theme slices & custom :root CSS; true = shipped theme.css)
  pruneTheme?: boolean;                    // default: false (alias for theme.prune)
  themeSafelist?: (string | RegExp)[];     // default: [] (alias for theme.safelist)
  theme?: {
    prune?: boolean;                       // cross-block transitive token pruning + re-hashing
    dark?: boolean | 'auto' | 'manual';    // prune Snice dark blocks; NEVER strips custom [data-theme="<name>"]
    density?: boolean;                     // false strips [data-density="compact"|"spacious"]
    motion?: boolean;                      // false strips prefers-reduced-motion & [data-motion=...]
    print?: boolean;                       // false strips @media print
    safelist?: (string | RegExp)[];
  };
  dev?: boolean | 'preserve';              // default: true in Vite serve/Vitest, false in prod; 'preserve' for libs
  caching?: boolean | {                    // default: true (code-splitting builds only)
    isolateHeavy?: boolean;                // default: true (table, pdf-viewer, qr-reader, chart, calendar, code-block, flow, kanban)
    isolateComponents?: string[];
    replaceDefaults?: boolean;
    vendor?: boolean;                      // default: true (isolates third-party node_modules into `vendor`)
    componentGroups?: Record<string, string[]>; // e.g. { forms: ['input', 'select'] } -> snice-forms-[hash].js
  };
  target?: string | false;                 // default: 'es2022' when build.target unset; false disables
  hmr?: boolean;                           // default: true in Vite serve mode only (0 bytes in prod/Rollup)
  report?: boolean | ((r: SniceBuildReport) => void) | {
    print?: boolean;
    compareWith?: string;                  // previous manifest JSON -> STABLE / CHANGED / NEW diff
    writeManifest?: string;                // write manifest JSON
    budgets?: Record<string, { raw?: number; gzip?: number; brotli?: number }>;
    failOnBudget?: boolean;                // default: true
    onReport?: (r: SniceBuildReport) => void;
  };
  table?: false | 'auto' | {
    cells?: string[];                      // undefined = all 21 cells; [] = core 'text' only
    features?: string[];                   // undefined = all 11 features; [] = core only; transitive deps auto-added
  };
}
```

## Cache Tiers

- `snice-runtime-[hash].js` — tree-shaken Snice core (`dist/_core/*`)
- `vendor-react-[hash].js` — `react` / `react-dom` / `scheduler`
- `vendor-[hash].js` — third-party `node_modules` (`caching.vendor`, default `true`)
- `snice-theme-[hash].css` — `snice/components/theme/*.css` (`theme.css` or modular slices)
- `snice-<group>-[hash].js` — user `caching.componentGroups` (shared helpers go to `snice-shared`)
- `snice-components-[hash].js` — standard Snice components
- `snice-<heavy>-[hash].js` — isolated heavy components
- `index-[hash].js` — volatile app code
- Rolldown / Vite 6+: auto-configures `advancedChunks.groups` / `codeSplitting.groups` (also exported as `createSniceAdvancedChunksGroups()`).
- Bypassed automatically for `iife`/`umd`, `build.lib`, `inlineDynamicImports`, or user `manualChunks` function.
- Recommended headers: `Cache-Control: public, max-age=31536000, immutable` on hashed assets, `no-cache` on `index.html`.

## Rules & Migration

- Replaces `unplugin-swc` in `vite.config.ts` and `vitest.config.ts`.
- `stripCssFallbacks: 'auto'` is import-order independent, uses the union of top-level `:root` tokens across imported theme slices and custom theme CSS, and never strips non-theme `--snice-<comp>-*` tokens.
- `theme` pruning preserves custom `[data-theme="<name>"]` blocks, dark-mode transitive primitives, data URIs, and dynamic `--snice-color-accent-*` tokens.
- `table: 'auto'` conservatively falls back to full `snice-table` whenever columns or spreads are dynamic.
- `table.features` valid names: `virtualizer`, `filter`, `editor`, `export`, `masterDetail`, `toolbar`, `treeData`, `grouping`, `columnMenu`, `rowDnD`, `columnDnD`. Unknown names fail fast in `buildStart`. Without the plugin, import `snice/components/table/snice-table-core`.
