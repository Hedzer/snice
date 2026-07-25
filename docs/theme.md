<!-- AI: For the AI-optimized version of this doc, see docs/ai/theme.md -->
# Theming

Every Snice component is styled entirely through CSS custom properties. Override a token and every component that uses it follows — no component code changes, no build step.

Load the stylesheet once:

```html
<link rel="stylesheet" href="theme/theme.css">
```

Component-level styling — `@styles()`, host styling, and icons — is covered in
[Styling](./styling.md). The full token table lives in the
[theme reference](./components/theme.md).

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

## The complete token list

Every token — colors, surfaces, borders, interaction overlays, motion, shadow
glows, state-aware focus rings, density, texture, print, spacing, typography,
radius, and layers — is tabulated in the
[theme reference](./components/theme.md). That page is the exhaustive list;
this one explains how the system fits together.

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
