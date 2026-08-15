# Theme System

## Color Format

All colors use HSL format (space-separated): `hue saturation% lightness%`

Modern syntax with alpha: `hsl(0 0% 0% / 0.15)` (not `hsla(0, 0%, 0%, 0.15)`)

## Color Primitives

**Gray Scale** (0 0% L%):
- 50: 98%, 100: 95%, 200: 89%, 300: 82%, 400: 64%
- 500: 45%, 600: 32%, 700: 25%, 800: 15%, 900: 9%, 950: 4%

**Blue** (217 83% L% base), **Green** (142 71% L% base), **Red** (0 72% L% base), **Yellow** (41 96% L% base) — full 50-950 ranges.

## Semantic Colors

```css
--snice-color-primary: hsl(var(--snice-color-blue-600));
--snice-color-success: hsl(var(--snice-color-green-600));
--snice-color-warning: hsl(var(--snice-color-yellow-600));
--snice-color-danger: hsl(var(--snice-color-red-600));

--snice-color-text: hsl(var(--snice-color-gray-900));
--snice-color-text-secondary: hsl(var(--snice-color-gray-600));
--snice-color-text-tertiary: hsl(var(--snice-color-gray-500));
```

## Surfaces

```css
--snice-color-surface:                   hsl(0 0% 100%);           /* page/body */
--snice-color-surface-container-lowest:  hsl(0 0% 100%);           /* inputs, recessed fields */
--snice-color-surface-container-low:     hsl(var(--snice-color-gray-50));
--snice-color-surface-container:         hsl(var(--snice-color-gray-100));
--snice-color-surface-container-high:    hsl(40 9% 97%);           /* cards, panels */
--snice-color-surface-container-highest: hsl(0 0% 100%);           /* modals, popovers */
```

## Borders

```css
--snice-color-border: hsl(var(--snice-color-gray-300));
--snice-color-border-hover: hsl(var(--snice-color-gray-400));
--snice-color-border-focus: hsl(var(--snice-color-blue-500));
--snice-color-border-subtle: hsl(0 0% 0% / 0.12);
```

## Interactive States

```css
--snice-color-surface-hover: hsl(var(--snice-color-gray-100));
--snice-color-surface-active: hsl(var(--snice-color-gray-200));
--snice-color-surface-disabled: hsl(var(--snice-color-gray-100));
--snice-color-text-disabled: hsl(var(--snice-color-gray-400));

--snice-color-overlay-hover: hsl(0 0% 0% / 0.04);
--snice-color-overlay-selected: hsl(var(--snice-color-blue-500) / 0.08);
--snice-color-overlay-selected-hover: hsl(var(--snice-color-blue-500) / 0.12);
--snice-color-overlay-stripe: hsl(0 0% 0% / 0.02);   /* dark: hsl(0 0% 100% / 0.11) */
```

## Layers (z-index)

```css
--snice-z-base:         0;
--snice-z-raised:       1;
--snice-z-sticky:       10;
--snice-z-fixed:        30;
--snice-z-floating:     100;
--snice-z-scrim:        1000;
--snice-z-overlay:      1100;
--snice-z-popover-over: 1200;
--snice-z-notification: 1300;
```

## Shadows

```css
--snice-shadow-xs: 0 1px 3px 0 hsl(0 0% 0% / 0.04), 0 1px 2px 0 hsl(0 0% 0% / 0.06);
--snice-shadow-sm/md/lg/xl/2xl: progressively stronger
```

## Focus

```css
--snice-focus-ring-width: 2px;
--snice-focus-ring-color: hsl(var(--snice-color-blue-500) / 0.5);
--snice-focus-ring-offset: 2px;
```

## Dark Theme

Set `data-theme="dark"` on `<html>`. All semantic tokens (not primitives) switch to dark values automatically.

## Native Controls

```css
--snice-color-scheme-filter: none;                         /* light */
--snice-color-scheme-filter: invert(1) hue-rotate(180deg); /* dark */
```

Applied to `::-webkit-calendar-picker-indicator` with 0.7 opacity, 1.0 on hover.

## Complete token list

Exhaustive table (colors, surfaces, borders, overlays, motion, shadow glows, focus rings, density, texture, print, spacing, typography, radius, layers): components/theme.md
