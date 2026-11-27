<!-- AI: For the AI-optimized version of this doc, see docs/ai/platform-skins.md -->
# Platform Skins

**One class per component, one superset template. Platform = CSS.**

Snice Platform Skins give every Snice component contemporary native visual and behavioral fidelity across four OS design languages without framework-specific wrappers, duplicate component classes, or runtime theme providers:

| Platform ID | Contemporary Target | Primary Characteristics |
|---|---|---|
| `default` | Snice neutral | Unchanged baseline tokens & styling (0-byte overhead) |
| `ios` | **iOS 26+ Liquid Glass** | Floating regular/clear Liquid Glass chrome, specular rims, 44px touch targets, elongated capsule switch, sliding glass pill tabs, spring sheet detents |
| `material` | **Android Material 3 Expressive** | Deterministic `color-mix()` tonal surface container ladder, dual spatial/effects springs, expressive press/selection shape morphing, pointer-origin ripple, tall M3 slider handle & stop dots |
| `windows` | **Windows 11 Fluent 2 / WinUI 3** | Mica/Mica Alt surface hierarchy, transient Acrylic flyouts/menus, 4px/8px radii, 32px desktop density, 1px top-lit strokes, bottom-accent input focus, keyboard-only dual-stroke focus, first-class `forced-colors` |
| `macos` | **macOS 26+ Liquid Glass / AppKit** | Compact desktop pointer density (13px body, 28px buttons, 38×22px NSSwitch — distinct from iOS), floating Liquid Glass sidebars/menus/Spotlight palette, concentric 6px/12px/16px radii, soft accent focus halo |

Non-native Snice elements (`snice-table`, `snice-kanban`, `snice-gantt`, `snice-chart`, `snice-calendar`, `snice-work-order`, etc.) follow each platform's published surface, density, typography, and motion guidelines so an entire application feels cohesive.

## Two Deployment Modes

### Mode A — Build-Time Single Platform (Zero-Cost Production)

Pass `platform` to `snice/vite` or `snice/rollup`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [snice({ platform: 'ios' })], // 'default' | 'ios' | 'material' | 'windows' | 'macos'
});
```

```typescript
// main.ts
import 'snice/components/theme/core.css';
import 'snice/components/theme/dark.css';
import 'snice/components/button/snice-button';
import 'snice/components/switch/snice-switch';
```

What the bundler plugin compiles automatically:
1. Auto-layers `theme/platforms/<platform>.css` into the cached `snice-theme` chunk before user brand CSS.
2. Wraps each component's base CSS in `@layer snice-base` and folds ONLY that platform's colocated `<comp>/<platform>.css` override above it.
3. Strips unselected `data-platform-only` helper nodes from templates at build time.
4. Folds `__SNICE_PLATFORM__` so Rollup/Vite dead-code-eliminates all unselected `platform-behaviors/*.js` modules to **0 bytes**.

### Mode B — Runtime Multi-Platform (`[data-platform]`)

For theme labs, previews, multi-platform docs, or live switching without rebuilding, load the compiled `*-scoped.css` sheets and set `data-platform` on `<html>` or any subtree:

```html
<link rel="stylesheet" href="theme/core.css">
<link rel="stylesheet" href="theme/dark.css">
<link rel="stylesheet" href="theme/platforms/ios-scoped.css">
<link rel="stylesheet" href="theme/platforms/material-scoped.css">
<link rel="stylesheet" href="theme/platforms/windows-scoped.css">
<link rel="stylesheet" href="theme/platforms/macos-scoped.css">

<section data-platform="ios">
  <snice-button variant="primary">iOS 26+ Liquid Glass</snice-button>
  <snice-switch checked label="Notifications"></snice-switch>
</section>

<section data-platform="windows">
  <snice-button variant="primary">Windows 11 Fluent 2</snice-button>
</section>
```

Scoped platform stylesheets contain zero bare `:root` leaks and zero `:host-context()`, working identically across Chromium, Firefox, and WebKit — including nested `[data-platform]` subtrees.

For optional interactive platform micro-behaviors (pointer ripple, sliding glass pill, sheet detents, keyboard focus tracking) in Mode B:

```typescript
import { enableRuntimePlatformBehaviors } from 'snice/components/platform-behaviors/runtime';

const handle = enableRuntimePlatformBehaviors(document);
// Later, if tearing down:
handle.disconnect();
```

## Brand Overrides (`color-mix()` Cascade)

Platform skins set semantic seeds (`--snice-color-primary`, etc.) inside the theme layer. Override `--snice-color-primary` in your own stylesheet and every derived state (`-hover`, `-subtle`, focus halo, Material tonal containers, iOS tinted glass) updates automatically with zero JavaScript:

```css
:root {
  --snice-color-primary: hsl(265 75% 54%);
}
```

## Cross-Framework Usage (Zero Adapter Rewrites)

Because Platform Skins are pure CSS tokens and standard `::part()` rules, every framework consuming Snice components gets identical styling and behavior automatically:

- **Vanilla HTML / MPA / CDN**: `<html data-platform="ios">` + `ios-scoped.css` (or `snice({ platform: 'ios' })`).
- **React**: `import { Button } from 'snice/react';` — no wrapper changes; place `data-platform` on any ancestor or compile with `snice({ platform })`.
- **Vue / Svelte**: `<div data-platform="material"><snice-button variant="primary">Save</snice-button></div>`.
- **Rust (Yew / Leptos) & C# (Blazor)**: emit standard `data-platform="windows"` on any container element alongside `<snice-button>`.

## Authoring Custom Platform Overrides

Platform overrides use two plain CSS layers:
1. **Layer 1 (`theme/platforms/<platform>.css`)**: semantic tokens, materials, shadows, radii, motion curves, dark mode, and accessibility fallbacks.
2. **Layer 2 (`<component>/<platform>.css`)**: strict Shadow DOM overrides using only `:host`, `:host(...)`, `[part~="<name>"]`, and `:host(...) [part~="<name>"]` — zero `!important`, zero private class selectors, zero `:host-context()`, and zero `backdrop-filter` on scrolling data cells.

## Accessibility, Media Modes & Browser Limits

- **Reduced transparency (`prefers-reduced-transparency: reduce`)** and **`@supports not (backdrop-filter: blur(1px))`**: iOS/macOS Liquid Glass and Windows Acrylic automatically fall back to high-legibility tinted opaque surfaces.
- **High contrast & Forced Colors (`prefers-contrast: more`, `forced-colors: active`)**: translucent chrome collapses to crisp system colors (`Canvas`, `CanvasText`, `Highlight`, `ButtonBorder`) and clear borders.
- **Reduced motion (`prefers-reduced-motion: reduce`)**: springs collapse to instant/linear transitions (`0ms`–`1ms`), ripples collapse to static state layers, and press magnification disables cleanly.
- **RTL (`dir="rtl"`)**: all controls use logical alignment and preserve geometry cleanly.
- **Browser-imposed limits**: OS-private APIs (CoreHaptics / `UIImpactFeedbackGenerator`, Android `WallpaperColors`, behind-window desktop wallpaper Mica/Liquid Glass refraction) are unavailable to web browsers; deterministic CSS `color-mix()`, `backdrop-filter`, specular rim borders, and pointer micro-behaviors provide browser-expressible parity.

## Font & Trademark Provenance

Snice Platform Skins rely exclusively on native OS system font stacks (`-apple-system`, `Roboto`, `Segoe UI Variable`, `system-ui`). Snice does not redistribute Apple, Google, or Microsoft proprietary font files, SF Symbols binaries, or trademarked icon assets, and claims no affiliation with or endorsement by Apple Inc., Google LLC, or Microsoft Corporation.
