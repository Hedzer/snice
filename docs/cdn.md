<!-- AI: For the AI-optimized version of this doc, see docs/ai/cdn.md -->

# CDN / Standalone Usage

Use any Snice component on a plain HTML page — no bundler, no build step. Each component is a standalone `.min.js` bundle that shares one small runtime.

## Load Order

Load the runtime **once, first**, then one bundle per component. Components load in any order *after* the runtime:

```html
<link rel="stylesheet" href="theme.css">      <!-- optional: design tokens + dark mode -->
<script src="snice-runtime.min.js"></script>  <!-- required, load first -->
<script src="snice-button.min.js"></script>   <!-- one bundle per component -->
<script src="snice-card.min.js"></script>

<snice-button variant="primary">Click me</snice-button>
```

`snice-runtime.min.js` is shared by every component. Load it before any `snice-<name>.min.js` — without it the custom elements never register and the page renders blank.

## Bundle Families

One bundle registers its whole element family — you don't load sub-elements separately:

| Bundle | Registers |
|--------|-----------|
| `snice-tabs.min.js` | `<snice-tabs>`, `<snice-tab>`, `<snice-tab-panel>` |
| `snice-select.min.js` | `<snice-select>`, `<snice-option>` |
| `snice-toast.min.js` | `<snice-toast>`, `<snice-toast-container>` |

## Theme and Dark Mode

Components ship with built-in light-mode token fallbacks, so they render correctly with no stylesheet. Add `theme.css` for the full design-token set and dark mode:

```html
<link rel="stylesheet" href="theme.css">
```

Dark mode follows the OS setting automatically. To force it, set `data-theme` on the root element:

```html
<html data-theme="dark">   <!-- or data-theme="light" to pin light -->
```

## Use the `.min.js` Builds

Load the `.min.js` (IIFE) bundles in `<script src>` tags. The `.esm.min.js` builds are ES modules for bundler/`import` use, not `<script src>`.

## Generating Bundles

Bundles are published to the CDN, or build them yourself:

```bash
snice build-component button
```
