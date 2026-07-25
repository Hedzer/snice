<!-- AI: For the AI-optimized version of this doc, see docs/ai/theme.md -->
# Theming

Every Snice component is styled entirely through CSS custom properties. Override a token and every component that uses it follows — no component code changes, no build step.

Load the stylesheet once:

```html
<link rel="stylesheet" href="theme/theme.css">
```

Component-level styling — `@styles()`, host styling, and icons — is covered in [Styling](./styling.md).

## Color Format

Colors are stored as HSL channels, space separated: `hue saturation% lightness%`. Tokens hold the raw channels so they can be reused with any alpha:

```css
--snice-color-blue-600: 217 83% 45%;

color: hsl(var(--snice-color-blue-600));
background: hsl(var(--snice-color-blue-600) / 0.12);   /* modern alpha syntax */
```

Use `hsl(0 0% 0% / 0.15)`, not the legacy `hsla(0, 0%, 0%, 0.15)`.

## Primitives and Semantic Tokens

There are two layers, and you almost always want the second.

**Primitives** are raw scales — gray, blue, green, red, and yellow, each running 50 (lightest) through 950 (darkest). They do not change between light and dark.

**Semantic tokens** describe a role, and they *do* change with the theme:

```css
--snice-color-primary: hsl(var(--snice-color-blue-600));
--snice-color-success: hsl(var(--snice-color-green-600));
--snice-color-warning: hsl(var(--snice-color-yellow-600));
--snice-color-danger:  hsl(var(--snice-color-red-600));

--snice-color-text:           hsl(var(--snice-color-gray-900));
--snice-color-text-secondary: hsl(var(--snice-color-gray-600));
--snice-color-text-tertiary:  hsl(var(--snice-color-gray-500));
```

Override semantic tokens to rebrand; override primitives only to change the underlying palette.

## Surfaces

Surfaces are ordered by elevation rather than by colour, so the same names work in both themes:

```css
--snice-color-surface:                   /* page background */
--snice-color-surface-container-lowest:  /* inputs, recessed fields */
--snice-color-surface-container-low:
--snice-color-surface-container:
--snice-color-surface-container-high:    /* cards, panels */
--snice-color-surface-container-highest: /* modals, popovers */
```

## Borders and Interactive States

```css
--snice-color-border:        /* default */
--snice-color-border-hover:
--snice-color-border-focus:
--snice-color-border-subtle: /* hairlines over arbitrary backgrounds */

--snice-color-surface-hover:
--snice-color-surface-active:
--snice-color-surface-disabled:
--snice-color-text-disabled:

--snice-color-overlay-hover:            /* translucent, composites over any surface */
--snice-color-overlay-selected:
--snice-color-overlay-selected-hover:
```

The `overlay-*` tokens are translucent on purpose: they tint whatever is underneath instead of replacing it, so selection states survive on top of any surface.

## Layers

Stacking is centralised so components never invent a `z-index`:

```css
--snice-z-base: 0;      --snice-z-raised: 1;      --snice-z-sticky: 10;
--snice-z-fixed: 30;    --snice-z-floating: 100;  --snice-z-scrim: 1000;
--snice-z-overlay: 1100; --snice-z-popover-over: 1200; --snice-z-notification: 1300;
```

## Shadows and Focus

```css
--snice-shadow-xs   /* through */   --snice-shadow-2xl

--snice-focus-ring-width: 2px;
--snice-focus-ring-color: hsl(var(--snice-color-blue-500) / 0.5);
--snice-focus-ring-offset: 2px;
```

## Dark Mode

Set `data-theme` on the root element. Semantic tokens switch; primitives do not.

```html
<html data-theme="dark">
```

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

Because components reference semantic tokens only, dark mode requires no component changes. Always check both themes when you override tokens — a colour that passes contrast on a light surface often fails on a dark one.

Native form controls are corrected with a filter token:

```css
--snice-color-scheme-filter: none;                         /* light */
--snice-color-scheme-filter: invert(1) hue-rotate(180deg); /* dark */
```

It is applied to `::-webkit-calendar-picker-indicator` at 0.7 opacity, rising to 1.0 on hover.

## Overriding Tokens

Scope an override wherever you need it — globally, or on a subtree:

```css
:root {
  --snice-color-primary: hsl(280 70% 50%);
}

.checkout {
  --snice-color-primary: hsl(142 71% 40%);
}
```

Every component inside `.checkout` picks up the local value, because tokens inherit through the shadow boundary.
