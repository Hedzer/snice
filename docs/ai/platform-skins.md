# Platform Skins

**Architecture:** One class per component, one superset template. Platform = pure CSS (Layer 1 tokens + Layer 2 `:host` / `[part~="..."]` overrides) + tiny tree-shakeable micro-behaviors. Zero theme provider element, zero recipe DSL.

## Platform IDs & Contemporary Targets

| ID | Target | Key Visual & Behavioral Traits |
|---|---|---|
| `default` | Snice neutral | Unmodified baseline (0 B overhead) |
| `ios` | iOS 26+ Liquid Glass | Floating regular/clear glass, specular rims, 44px touch targets, sliding pill tabs, sheet detents |
| `material` | Material 3 Expressive | `color-mix()` tonal surface ladder, spatial/effects springs, press/selection shape morph, ripple, tall slider handle + stop dot |
| `windows` | Windows 11 Fluent 2 / WinUI 3 | Mica/Mica Alt surfaces, transient Acrylic flyouts, 4px/8px radii, 32px density, 1px top-lit strokes, keyboard-only dual-stroke focus, `forced-colors` |
| `macos` | macOS 26+ Liquid Glass / AppKit | Compact desktop density (13px body, 28px buttons, 38×22px NSSwitch), floating glass sidebars/menus, 6px/12px/16px radii, soft accent focus halo |

## Mode A — Build-Time Single Platform (0 B Unused)

```typescript
// vite.config.ts (or rollup.config.js with 'snice/rollup')
import { defineConfig } from 'vite';
import snice from 'snice/vite';
export default defineConfig({ plugins: [snice({ platform: 'ios' })] });
```

```typescript
// main.ts
import 'snice/components/theme/core.css';
import 'snice/components/theme/dark.css';
import 'snice/components/button/snice-button';
import 'snice/components/switch/snice-switch';
```

- Auto-layers `theme/platforms/<p>.css` into `snice-theme` chunk before user brand CSS.
- Folds `<comp>/<p>.css` above `@layer snice-base`.
- Strips unselected `data-platform-only` helper nodes in templates.
- Folds `__SNICE_PLATFORM__` so unselected `platform-behaviors/*.js` DCE to 0 bytes.
- Options: `'default' | 'ios' | 'material' | 'windows' | 'macos' | 'multi' | 'preserve'`. Unknown values throw `TypeError`.

## Mode B — Runtime Multi-Platform (`[data-platform]`)

```html
<link rel="stylesheet" href="theme/core.css">
<link rel="stylesheet" href="theme/dark.css">
<link rel="stylesheet" href="theme/platforms/ios-scoped.css">
<link rel="stylesheet" href="theme/platforms/material-scoped.css">
<section data-platform="ios"><snice-button variant="primary">iOS</snice-button></section>
<section data-platform="material"><snice-button variant="primary">Material</snice-button></section>
```

```typescript
import { enableRuntimePlatformBehaviors } from 'snice/components/platform-behaviors/runtime';
const handle = enableRuntimePlatformBehaviors(document); // lazy-loads only active platforms
handle.disconnect();
```

- `*-scoped.css` has zero bare `:root` leaks and zero `:host-context()` (full Chromium/Firefox/WebKit parity, nested `[data-platform]` supported).

## Brand Cascade & Cross-Framework

```css
/* Overrides cascade through color-mix() into hover/subtle/tonal/glass tokens */
:root { --snice-color-primary: hsl(265 75% 54%); }
```

- Works identically across Vanilla HTML, React (`adapters/react`), Vue, Svelte, Yew, Leptos, and Blazor with zero adapter rewrites.

## Authoring Rules (`<comp>/<platform>.css`)

- Allowed selectors ONLY: `:host`, `:host(...)` (no nested parens), `[part~="<name>"]`, `:host(...) [part~="<name>"]`.
- Forbidden: `!important`, private `.class` selectors, `:host-context()`, descendants after `[part~="..."]`, `backdrop-filter` on scrolling data cells (`table` cells / `card` base).
- Always provide `@supports not (backdrop-filter)`, `prefers-reduced-transparency`, `prefers-contrast`, `forced-colors`, and `prefers-reduced-motion` fallbacks.
- System font stacks only; zero proprietary font/icon binary redistribution.
