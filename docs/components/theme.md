<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/theme.md -->

# Theme
`theme.css`

Provides all design tokens for Snice components via CSS custom properties. Includes light and dark themes with automatic system preference detection. This is a CSS-only module with no web component.

## Table of Contents
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## CSS Custom Properties

### Colors

| Property | Description |
|----------|-------------|
| `--snice-color-primary` | Interactive accent (buttons, links, focus, selected state) |
| `--snice-color-brand` | Product identity color. Defaults to `--snice-color-primary`; override when the consumer's brand color should differ from the interactive accent |
| `--snice-color-brand-hover` | Hovered brand |
| `--snice-color-brand-subtle` | Tinted-background brand element |
| `--snice-color-success` | Success state color |
| `--snice-color-warning` | Warning state color |
| `--snice-color-danger` | Danger/error state color |
| `--snice-color-neutral` | Neutral color |
| `--snice-color-accent-1` … `-accent-8` | Data-visualization palette (8 slots, muted/business tones). Charts, treemaps, sankey, funnel, network-graph cycle through these for series coloring when no per-point color is supplied |
| `--snice-color-text` | Primary text color |
| `--snice-color-text-secondary` | Secondary text color |
| `--snice-color-text-tertiary` | Tertiary text color |
| `--snice-color-text-inverse` | Text on dark/colored backgrounds |
| `--snice-color-background` | Page background |
| `--snice-color-background-secondary` | Secondary background |
| `--snice-color-background-tertiary` | Tertiary background |
| `--snice-color-background-element` | Element background |
| `--snice-color-background-input` | Input field background |
| `--snice-color-background-elevated` | Raised surface background (modals, popovers, menus). In light = white; in dark = lighter than base so elevation reads without heavy drop shadows |
| `--snice-color-border` | Default border color |
| `--snice-color-border-hover` | Hovered border color |
| `--snice-color-border-focus` | Focused border color |
| `--snice-color-border-subtle` | Alpha-based border (~12% black in light, ~12% white in dark). Composites correctly over tinted surfaces where a solid gray would fight the palette |

### Interaction overlays

| Property | Description |
|----------|-------------|
| `--snice-color-overlay-hover` | 4% alpha tint layered over a surface on hover. Use instead of swapping `background-color` — composites over striped rows, tinted cells, and any bg without fighting the palette |
| `--snice-color-overlay-selected` | 8% primary-tinted overlay for selected rows/items |
| `--snice-color-overlay-selected-hover` | Selected state when also hovered |

This is the MUI-style pattern. A row hover should *layer* a translucent tint, not swap to another solid color — solid swaps break down when the row is already striped or variant-tinted.

### Motion

| Property | Description |
|----------|-------------|
| `--snice-transition-fast / -medium / -slow` | 150ms / 250ms / 350ms durations |
| `--snice-ease-out` | Expo-out for confident entrances (`cubic-bezier(0.22, 1, 0.36, 1)`) |
| `--snice-ease-in` | Accelerate for exits |
| `--snice-ease-in-out` | Symmetric balanced curve |
| `--snice-ease-spring` | Slight overshoot — hover/press micro-interactions |
| `--snice-ease-bounce` | Pronounced overshoot |

**Motion control — three ways to opt out:**
1. OS preference — `@media (prefers-reduced-motion: reduce)` is honored automatically
2. App-level toggle — set `data-motion="reduce"` on any ancestor (typically `<html>`) to collapse transitions to 0ms and neutralize animations without touching OS settings. Useful for an in-app "reduce motion" setting.
3. Hard off — `data-motion="off"` strips `animation` and `transition` declarations entirely. Useful for static renders and snapshot tests where even 0ms transitions can cause flake.

```html
<!-- user toggled "reduce motion" in app settings -->
<html data-motion="reduce">
```

### Shadow glows

| Property | Description |
|----------|-------------|
| `--snice-shadow-glow-primary` | Colored halo for selected/focused primary CTAs |
| `--snice-shadow-glow-success` | Success-tinted halo |
| `--snice-shadow-glow-warning` | Warning-tinted halo |
| `--snice-shadow-glow-danger` | Danger-tinted halo |

### State-aware focus rings

| Property | Description |
|----------|-------------|
| `--snice-focus-ring-color-primary` | Focus ring on primary variants |
| `--snice-focus-ring-color-success` | Focus ring on success variants |
| `--snice-focus-ring-color-warning` | Focus ring on warning variants |
| `--snice-focus-ring-color-danger` | Focus ring on danger variants |

### Density

Apply `data-density="compact"` or `data-density="spacious"` on an ancestor element to scale every spacing token. No attribute = default comfortable.

```html
<!-- dense table page -->
<html data-density="compact">
```

### Texture overlay

| Property | Description |
|----------|-------------|
| `--snice-texture-noise` | Inline SVG noise URL at 4% alpha. Apply as `background-image` on any surface for paper-like grain. Not applied by default — opt in where you want atmosphere. |

```css
.hero-surface {
  background-image: var(--snice-texture-noise);
  background-blend-mode: overlay;
}
```

### Print

All Snice components inherit a print baseline that collapses shadows and neutralizes animations/transitions. `print-color-adjust: exact` is enabled so data-vis (charts, badges, chips) retain semantic colors on paper.

Document components (receipt, invoice, estimate, work-order) ship additional `@media print` rules that hide interactive chrome (action buttons, toggles) and strip backgrounds/borders for ink saving.

### Spacing

| Property | Value |
|----------|-------|
| `--snice-spacing-3xs` | `0.125rem` (2px) |
| `--snice-spacing-2xs` | `0.25rem` (4px) |
| `--snice-spacing-xs` | `0.5rem` (8px) |
| `--snice-spacing-sm` | `0.75rem` (12px) |
| `--snice-spacing-md` | `1rem` (16px) |
| `--snice-spacing-lg` | `1.5rem` (24px) |
| `--snice-spacing-xl` | `2rem` (32px) |
| `--snice-spacing-2xl` | `3rem` (48px) |
| `--snice-spacing-3xl` | `4rem` (64px) |
| `--snice-spacing-4xl` | `6rem` (96px) — hero / section divider |
| `--snice-spacing-5xl` | `8rem` (128px) — editorial breathing room |

### Typography

| Property | Description |
|----------|-------------|
| `--snice-font-family` | Body font (system stack by default) |
| `--snice-font-family-display` | Font for headings / titles. Defaults to `--snice-font-family`; override for a distinct display face |
| `--snice-font-family-mono` | Monospace font stack |
| `--snice-font-size-2xs` | 10px |
| `--snice-font-size-xs` | 12px |
| `--snice-font-size-sm` | 14px |
| `--snice-font-size-md` | 16px |
| `--snice-font-size-lg` | 18px |
| `--snice-font-size-xl` | 20px |
| `--snice-font-size-2xl` | 24px |
| `--snice-font-size-3xl` | 30px |
| `--snice-font-size-4xl` | 36px |
| `--snice-heading-xs` | 14px — tightest heading (card/chip) |
| `--snice-heading-sm` | 16px |
| `--snice-heading-md` | 18px |
| `--snice-heading-lg` | 20px — common section heading |
| `--snice-heading-xl` | 24px |
| `--snice-heading-2xl` | 36px — largest display heading |
| `--snice-font-weight-light` | 300 |
| `--snice-font-weight-normal` | 400 |
| `--snice-font-weight-medium` | 500 |
| `--snice-font-weight-semibold` | 600 |
| `--snice-font-weight-bold` | 700 |
| `--snice-tracking-tight` | `-0.02em` — for large display headings |
| `--snice-tracking-normal` | `0` |
| `--snice-tracking-wide` | `0.03em` — subtle tracking for uppercase labels |
| `--snice-tracking-widest` | `0.1em` — strong tracking for eyebrows / small caps |

### Border Radius

| Property | Value |
|----------|-------|
| `--snice-border-radius-sm` | `0.125rem` (2px) |
| `--snice-border-radius-md` | `0.25rem` (4px) |
| `--snice-border-radius-lg` | `0.5rem` (8px) |
| `--snice-border-radius-xl` | `1rem` (16px) |
| `--snice-border-radius-circle` | `50%` |
| `--snice-border-radius-pill` | `9999px` |

### Shadows

| Property | Description |
|----------|-------------|
| `--snice-shadow-xs` | Extra small shadow |
| `--snice-shadow-sm` | Small shadow |
| `--snice-shadow-md` | Medium shadow |
| `--snice-shadow-lg` | Large shadow |
| `--snice-shadow-xl` | Extra large shadow |
| `--snice-shadow-2xl` | Double extra large shadow |

### Transitions

| Property | Value |
|----------|-------|
| `--snice-transition-fast` | `150ms` |
| `--snice-transition-medium` | `250ms` |
| `--snice-transition-slow` | `350ms` |

### Z-Index

| Property | Value |
|----------|-------|
| `--snice-z-index-dropdown` | `1000` |
| `--snice-z-index-sticky` | `1020` |
| `--snice-z-index-fixed` | `1030` |
| `--snice-z-index-modal-backdrop` | `1040` |
| `--snice-z-index-modal` | `1050` |
| `--snice-z-index-tooltip` | `1070` |

### Focus

| Property | Description |
|----------|-------------|
| `--snice-focus-ring-width` | Focus ring width (2px) |
| `--snice-focus-ring-color` | Focus ring color |
| `--snice-focus-ring-offset` | Focus ring offset (2px) |

### Color Primitives

The theme defines color scales in HSL format (gray, blue, green, red, yellow) with shades from 50 to 950. These are used internally by the semantic tokens above.

```css
--snice-color-blue-500: 217 91% 60%;
/* Use with hsl(): */
color: hsl(var(--snice-color-blue-500));
```

## Basic Usage

```typescript
import 'snice/components/theme/theme.css';
```

```html
<link rel="stylesheet" href="snice/components/theme/theme.css">
```

## Examples

### Light Theme (Default)

The light theme is applied by default on `:root`.

```html
<html>
  <head>
    <link rel="stylesheet" href="theme.css">
  </head>
  <body>
    <!-- Light theme by default -->
  </body>
</html>
```

### Dark Theme

Set `data-theme="dark"` on any element to apply dark theme tokens.

```html
<html data-theme="dark">
  <!-- Dark theme applied -->
</html>
```

### Automatic Theme (System Preference)

Without a `data-theme` attribute, the theme follows the user's system preference via `prefers-color-scheme`.

```html
<html>
  <!-- Follows OS dark/light setting automatically -->
</html>
```

### Scoped Dark Section

Apply dark theme to a section of the page.

```html
<body>
  <div>Light content here</div>
  <div data-theme="dark" style="padding: 2rem; background: var(--snice-color-background);">
    <p style="color: var(--snice-color-text);">Dark section</p>
  </div>
</body>
```

### Theme Toggle

```html
<button id="toggle">Toggle Theme</button>

<script>
  document.getElementById('toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  });
</script>
```
