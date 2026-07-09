# CDN / Standalone Usage

Use any component on a plain HTML page — no bundler. Each component is a standalone `.min.js` sharing one runtime.

## Load order

Runtime first, then one bundle per component (components any order after runtime):
```html
<link rel="stylesheet" href="theme.css">      <!-- optional: tokens + dark mode -->
<script src="snice-runtime.min.js"></script>  <!-- required, first -->
<script src="snice-button.min.js"></script>
<snice-button variant="primary">Click me</snice-button>
```
- `snice-runtime.min.js` shared by all — omit it → elements never register → blank page.

## Bundle families

One bundle registers its whole family:
- `snice-tabs.min.js` → `<snice-tabs>` `<snice-tab>` `<snice-tab-panel>`
- `snice-select.min.js` → `<snice-select>` `<snice-option>`
- `snice-toast.min.js` → `<snice-toast>` `<snice-toast-container>`

## Theme / dark mode

- `theme.css` optional — components have light-mode fallbacks; add it for full tokens + dark mode.
- Dark follows OS by default; force with `<html data-theme="dark">` (or `"light"` to pin).

## Builds

- Use `.min.js` (IIFE) for `<script src>`, not `.esm.min.js` (ESM, for bundlers).
- Build one: `snice build-component <name>`.
