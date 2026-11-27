# Theme System

## Modular Slices

Import full self-contained `snice/components/theme/theme.css` or individual slices under `snice/components/theme/`:
- `core.css` — HSL primitives, light semantic colors, surfaces, borders, overlays, spacing, typography, radius, transitions, easing, z-index, focus rings
- `dark.css` — `[data-theme="dark"]` + `@media (prefers-color-scheme: dark)` (`:root:not([data-theme]), :root[data-theme="auto"]`)
- `accents.css` — `--snice-color-accent-1..8`
- `effects.css` — shadows, colored glows, convex gradients, `--snice-texture-noise`
- `density.css` — `[data-density="compact"|"spacious"]`
- `motion.css` — `prefers-reduced-motion: reduce`, `[data-motion="reduce"|"off"]`
- `print.css` — `@media print`

## Color Format

HSL space-separated channels: `hue saturation% lightness%`. Alpha syntax: `hsl(0 0% 0% / 0.15)` (not `hsla()`).

## Primitives & CSS-First Seed Derivation

- **Primitives**: `gray`, `blue`, `green`, `red`, `yellow` (`50`–`950`), `purple` (`100`/`300`/`500`/`700`). Static across themes.
- **Semantic seeds**: `--snice-color-primary`, `--snice-color-success`, `--snice-color-warning`, `--snice-color-danger`, `--snice-color-neutral`, `--snice-color-surface`, `--snice-color-text*`.
- **Auto-derived via `color-mix()`**: `*-hover`, `*-subtle`, `*-subtle-hover`, `--snice-color-border-focus`, `--snice-color-overlay-selected*`, `--snice-focus-ring-color*`, `--snice-color-*-alpha*`, `--snice-shadow-glow-*`. Overriding `--snice-color-primary` automatically updates all derived tokens in light and dark modes (zero JS).

## Custom Themes

```css
/* Minimal seed override */
:root {
  --snice-color-primary: hsl(265 75% 54%);
  --snice-color-surface: hsl(40 20% 99%);
  --snice-border-radius-md: 0.5rem;
}

/* Named switchable theme — never clobbered by OS prefers-color-scheme: dark */
[data-theme="brand"] {
  --snice-color-primary: hsl(18 88% 52%);
  --snice-color-surface: hsl(28 30% 98%);
  color-scheme: light;
}
```

- Bundler plugin preserves custom `[data-theme="<name>"]` blocks under `theme: { prune: true, dark: false }`.
- Standalone custom theme CSS only strips component fallbacks for `:root` `--snice-*` tokens it actually defines.

## Dark Mode & Native Controls

- `data-theme="dark"` activates dark mode; `data-theme="light"` locks light; omitted or `data-theme="auto"` follows OS `prefers-color-scheme: dark`.
- Native controls filter: `--snice-color-scheme-filter` (`none` in light, `invert(1) hue-rotate(180deg)` in dark).

## Platform Skins

Contemporary OS skins (`ios`, `material`, `windows`, `macos`) layer on top of `core.css` + `dark.css` via `snice({ platform })` (build-time, 0 B unused) or `theme/platforms/<p>-scoped.css` + `[data-platform="<p>"]` (runtime). Brand overrides on `--snice-color-primary` cascade automatically. See `platform-skins.md`.

## Complete Token List

Exhaustive token table: `components/theme.md`.
