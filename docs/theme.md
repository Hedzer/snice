<!-- AI: For the AI-optimized version of this doc, see docs/ai/theme.md -->
# Theming

Every Snice component is styled entirely through CSS custom properties. Override a few seed tokens and every component — including hover states, subtle fills, focus rings, selection overlays, alpha tints, and glows — adapts automatically.

Load the full self-contained stylesheet once, or import only the modular slices you need:

```html
<!-- Self-contained full theme (CDN / link tag — zero @import waterfall) -->
<link rel="stylesheet" href="theme/theme.css">
```

```typescript
// Bundled apps — full theme:
import 'snice/components/theme/theme.css';

// Or modular slices (smaller CSS payload):
import 'snice/components/theme/core.css';    // primitives, light semantics, surfaces, spacing, type, radius, focus
import 'snice/components/theme/dark.css';    // [data-theme="dark"] + prefers-color-scheme: dark
import 'snice/components/theme/effects.css'; // shadows, glows, gradients, noise texture
```

Component-level styling — `@styles()`, host styling, and icons — is covered in
[Styling](./styling.md). The full token table lives in the
[theme reference](./components/theme.md).

## Modular Theme Slices

`snice/components/theme/theme.css` remains self-contained and backwards-compatible. When you want a leaner stylesheet, import individual slices from `snice/components/theme/`:

| Slice | Contents |
|-------|----------|
| `core.css` | HSL primitives, light semantic colors, brand, surfaces, borders, interactive states, overlays, spacing, typography, radius, transitions, easing, z-index, focus rings |
| `dark.css` | `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` |
| `accents.css` | Data-visualization accent palette (`--snice-color-accent-1..8`) |
| `effects.css` | Elevation shadows, colored glows, convex gradients, `--snice-texture-noise` |
| `density.css` | `[data-density="compact"]` and `[data-density="spacious"]` |
| `motion.css` | `prefers-reduced-motion: reduce`, `[data-motion="reduce"]`, `[data-motion="off"]` |
| `print.css` | `@media print` shadow/animation reset |

With `snice/vite` or `snice/rollup`, all imported `theme/*.css` slices route into the `snice-theme` cache tier, and `stripCssFallbacks: 'auto'` strips fallbacks ONLY for top-level `:root` tokens defined by the slice(s) you actually imported (so importing `core.css` without `effects.css` keeps component shadow fallbacks intact).

## Color Format

Colors are stored as HSL channels, space separated: `hue saturation% lightness%`. Tokens hold the raw channels so they can be reused with any alpha:

```css
--snice-color-blue-600: 217 83% 45%;

color: hsl(var(--snice-color-blue-600));
background: hsl(var(--snice-color-blue-600) / 0.12);   /* modern alpha syntax */
```

Use `hsl(0 0% 0% / 0.15)`, not the legacy `hsla(0, 0%, 0%, 0.15)`.

## Primitives, Seeds, and Derived Tokens

There are two layers, and you almost always want the second.

**Primitives** are raw scales — gray, blue, green, red, and yellow, each running 50 (lightest) through 950 (darkest). They do not change between light and dark.

**Semantic seeds** describe a role, and derived tokens (`*-hover`, `*-subtle`, `*-subtle-hover`, `--snice-color-border-focus`, `--snice-color-overlay-selected*`, `--snice-focus-ring-color*`, `--snice-color-*-alpha*`, `--snice-shadow-glow-*`) compute automatically via CSS `color-mix()` from their semantic parent:

```css
--snice-color-primary: hsl(var(--snice-color-blue-600));
--snice-color-success: hsl(var(--snice-color-green-600));
--snice-color-warning: hsl(var(--snice-color-yellow-600));
--snice-color-danger:  hsl(var(--snice-color-red-600));
--snice-color-neutral: hsl(var(--snice-color-gray-600));

--snice-color-text:           hsl(var(--snice-color-gray-900));
--snice-color-text-secondary: hsl(var(--snice-color-gray-600));
--snice-color-text-tertiary:  hsl(var(--snice-color-gray-500));
```

Override `--snice-color-primary` once and button hover, subtle backgrounds, focus rings, selection tints, and glow shadows all re-theme together — no JS and no build step required. You can still override any derived token explicitly whenever you want manual control.

## Creating a Custom Theme

### 1. Minimal seed override (5 tokens)

Import `core.css` (or `theme.css`) and override a handful of seed variables in your own stylesheet:

```css
/* src/my-theme.css */
:root {
  --snice-color-primary: hsl(265 75% 54%);
  --snice-color-surface: hsl(40 20% 99%);
  --snice-color-text: hsl(240 15% 12%);
  --snice-font-family: 'Inter', system-ui, sans-serif;
  --snice-border-radius-md: 0.5rem;
}
```

### 2. Named theme (`[data-theme="..."]`)

Create switchable custom themes with `[data-theme="<name>"]`. Snice's automatic `@media (prefers-color-scheme: dark)` rule only activates when no `data-theme` attribute is set (or `data-theme="auto"`), so named custom themes are never clobbered by OS dark mode:

```css
/* src/brand-theme.css */
[data-theme="sunset"] {
  --snice-color-primary: hsl(18 88% 52%);
  --snice-color-surface: hsl(28 30% 98%);
  --snice-color-surface-container-high: hsl(28 25% 94%);
  --snice-color-text: hsl(20 25% 12%);
  color-scheme: light;
}
```

```html
<html data-theme="sunset">
```

When using the bundler plugin (`snice/vite` / `snice/rollup`):
- Custom `[data-theme="<name>"]` blocks are **always preserved** under `theme: { prune: true, dark: false }` (only Snice's built-in dark block is pruned).
- Standalone custom theme CSS files automatically participate in `stripCssFallbacks: 'auto'` — only fallbacks for `:root` tokens your custom theme defines are stripped, leaving all other fallbacks intact.

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

Omit `data-theme` (or set `data-theme="auto"`) to follow the OS `prefers-color-scheme: dark` setting automatically. Set `data-theme="light"` to lock light mode.

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

Every component inside `.checkout` picks up the local value (and its derived hover/subtle/focus tokens), because tokens inherit through the shadow boundary.

## Platform Skins

Snice includes contemporary native OS skins for **iOS 26+ Liquid Glass** (`ios`), **Android Material 3 Expressive** (`material`), **Windows 11 Fluent 2 / WinUI 3** (`windows`), and **macOS 26+ Liquid Glass / AppKit** (`macos`) built strictly on pure CSS tokens and standard `::part()` rules — with zero-cost build-time compilation (`snice({ platform })`) and pure-CSS runtime scoping (`[data-platform]`). See [Platform Skins](./platform-skins.md).
