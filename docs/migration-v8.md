<!-- AI: For the AI-optimized version of this doc, see docs/ai/migration-v8.md -->

# Migrating to Snice v8

Snice v8 introduces the built-in `snice/vite` and `snice/rollup` bundler plugins, modular tree-shakeable core ESM chunks, modular CSS theme slices with `color-mix()` seed derivation, and route-aware autofocus.

## Breaking Changes

### 1. Explicit `"sideEffects"` and lazy native element controllers
- `package.json` now declares `"sideEffects"` for tree-shaking, and importing `snice` no longer eagerly scans the DOM or attaches a document-wide `MutationObserver` via `useNativeElementControllers()` on module evaluation.
- Apps using declarative `controller="..."` attributes on native HTML elements (not Snice `@element` hosts) should call `useNativeElementControllers()` explicitly once at startup (or attach controllers via `@controller` / template `controller=${MyController}`, which continue to work automatically).

### 2. Modular `dist/_core/` ESM chunks and `es2022` build target
- `dist/index.esm.js` now re-exports modular chunks under `dist/_core/` (preserving all public package exports in `package.json`). Deep undocumented internal imports into `dist/` should switch to documented package entrypoints (`snice`, `snice/vite`, `snice/rollup`, `snice/symbols`, `snice/transitions`, `snice/testing/dom`).
- `create-app` templates and `examples/` now default to `snice/vite` with `build.target: 'es2022'` instead of `unplugin-swc` + `es2015`.

### 3. Theme `color-mix()` seed derivation and auto-dark scoping
- Derived semantic tokens (`--snice-color-primary-hover`, `--snice-color-primary-subtle`, `--snice-color-border-focus`, focus rings, and selection overlays) now derive via `color-mix()` from their semantic seed tokens (`--snice-color-primary`, etc.) so overriding a single seed token re-themes all derived states automatically.
- `@media (prefers-color-scheme: dark)` in `theme.css` / `theme/dark.css` is now scoped to `:root:not([data-theme]), :root[data-theme="auto"]` so custom `[data-theme="<custom>"]` themes are never overridden by system dark mode.

### 4. Production `__SNICE_DEV__` diagnostic stripping
- Development warnings and render diagnostics are gated behind `__SNICE_DEV__`. Production builds using `snice/vite` or `snice/rollup` fold `__SNICE_DEV__` to `false` for dead-code elimination.

## Recommended Upgrade Steps

1. Replace `unplugin-swc` in `vite.config.ts` with `snice()` from `'snice/vite'` (see [docs/bundler-plugin.md](bundler-plugin.md)).
2. Remove manual `es2015` targets and custom `snice` `manualChunks` boilerplate — `snice()` configures `es2022` and deterministic cache-tiered chunks (`snice-runtime`, `vendor`, `vendor-react`, `snice-theme`, `snice-components`) automatically.
3. Optionally switch from full `snice/components/theme/theme.css` to modular slices (`snice/components/theme/core.css`, `dark.css`, `effects.css`, etc.) or enable `theme: { prune: true }` / `precompileTemplates: true` / `table: 'auto'` in `snice()`.
4. Run `npx snice check` and `npx snice doctor` to verify your project configuration.
