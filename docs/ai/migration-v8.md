# Snice v8 Migration

## Breaking Changes

- **`sideEffects` + lazy native controllers**: `import 'snice'` no longer runs `useNativeElementControllers()` at import time. Call `useNativeElementControllers()` explicitly only if binding `controller="name"` on non-Snice native HTML elements.
- **Modular `dist/_core/` + `es2022`**: Use public exports (`snice`, `snice/vite`, `snice/rollup`, `snice/symbols`, `snice/transitions`, `snice/testing/dom`). `create-app` templates & `examples/` now use `snice/vite` + `target: 'es2022'` (no `unplugin-swc`).
- **Theme `color-mix()` + auto-dark scope**: Derived hover/subtle/focus-ring/overlay tokens derive via `color-mix()` from semantic seeds (`--snice-color-primary`, etc.). `@media (prefers-color-scheme: dark)` applies only to `:root:not([data-theme]), :root[data-theme="auto"]` so custom `[data-theme="..."]` blocks are preserved.
- **`__SNICE_DEV__` DCE**: Dev warnings strip in production builds when `__SNICE_DEV__` is folded to `false`.

## Upgrade Checklist

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [snice()],
});
```

- Remove `unplugin-swc` / `@swc/core` and `build.target: 'es2015'` boilerplate.
- Optional slimming: `precompileTemplates: true`, `table: 'auto'`, `theme: { prune: true, dark: 'manual', density: false, print: false }`, or import modular slices (`snice/components/theme/core.css`, `dark.css`, `effects.css`, `accents.css`, `density.css`, `motion.css`, `print.css`).
- Verify with `npx snice check` and `npx snice doctor`.
