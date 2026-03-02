# Theme System

## Color Format

All colors use HSL format (space-separated): `hue saturation% lightness%`

Modern syntax with alpha: `hsl(0 0% 0% / 0.15)` (not `hsla(0, 0%, 0%, 0.15)`)

## Color Primitives

**Gray Scale** (0 0% L%):
- 50: 98%, 100: 95%, 200: 89%, 300: 82%, 400: 64%
- 500: 45%, 600: 32%, 700: 25%, 800: 15%, 900: 9%, 950: 4%

**Blue** (217 83% L% base):
- 50-500: High saturation (91-100%)
- 600-950: Medium-low saturation (56-83%)

**Green** (142 71% L% base):
- Full range 50-950

**Red** (0 72% L% base):
- Full range 50-950

**Yellow** (41 96% L% base):
- Full range 50-950

## Semantic Colors

### Light Theme
```css
--snice-color-primary: hsl(var(--snice-color-blue-600));
--snice-color-success: hsl(var(--snice-color-green-600));
--snice-color-warning: hsl(var(--snice-color-yellow-600));
--snice-color-danger: hsl(var(--snice-color-red-600));

--snice-color-text: hsl(var(--snice-color-gray-900));
--snice-color-text-secondary: hsl(var(--snice-color-gray-600));
--snice-color-text-tertiary: hsl(var(--snice-color-gray-500));

--snice-color-background: hsl(0 0% 100%);
--snice-color-background-input: hsl(0 0% 100%);
--snice-color-background-element: hsl(40 9% 97%);

--snice-color-border: hsl(var(--snice-color-gray-300)); /* 82% */
--snice-color-border-hover: hsl(var(--snice-color-gray-400));
```

### Dark Theme
```css
--snice-color-primary: hsl(var(--snice-color-blue-500));

--snice-color-text: hsl(var(--snice-color-gray-50));
--snice-color-text-secondary: hsl(var(--snice-color-gray-300));

--snice-color-background: hsl(var(--snice-color-gray-900));
--snice-color-background-input: hsl(0 0% 15%);
--snice-color-background-element: hsl(30 5% 18%);

--snice-color-border: hsl(0 0% 35%);
```

## Interactive States

```css
--snice-color-background-hover: hsl(var(--snice-color-gray-100));
--snice-color-background-active: hsl(var(--snice-color-gray-200));
--snice-color-background-disabled: hsl(var(--snice-color-gray-100));
--snice-color-text-disabled: hsl(var(--snice-color-gray-400));
```

Dark theme uses gray-700/600/800/600 respectively.

## Key Design Decisions

1. **Input backgrounds**: Pure white (light) / 15% gray (dark) for maximum contrast
2. **Border contrast**: Gray-300 (82%) meets WCAG 3:1 ratio
3. **Disabled states**: Explicit colors instead of opacity
4. **Element backgrounds**: Warm tones for cards/containers
5. **Dropdown menus**: Use `background-element` for elevation in dark mode

## Usage Patterns

### Form Inputs
All form inputs use `--snice-color-background-input`:
- input, textarea, select trigger, date-picker, color-picker

### Elevated Elements
Use `--snice-color-background-element`:
- Cards, modals, select dropdowns, tooltips

### Borders
- Default: `--snice-color-border`
- Hover: `--snice-color-border-hover`
- Focus: `--snice-color-border-focus`

## Shadows

HSL format with alpha: `hsl(0 0% 0% / alpha)`

```css
--snice-shadow-xs: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
--snice-shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.1), ...;
--snice-shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.1), ...;
```

Dark theme increases alpha: 0.1 → 0.15, 0.25 → 0.35

## Focus States

```css
--snice-focus-ring-width: 2px;
--snice-focus-ring-color: hsl(var(--snice-color-blue-500) / 0.5);
--snice-focus-ring-offset: 2px;
```

## Native Controls

Date/time picker icons styled via webkit pseudo-elements:

```css
--snice-color-scheme-filter: none; /* light mode */
--snice-color-scheme-filter: invert(1) hue-rotate(180deg); /* dark mode */
color-scheme: light | dark;
```

Applied to `::-webkit-calendar-picker-indicator` with 0.7 opacity, 1.0 on hover.

## Accessibility

- Text contrast: 4.5:1 minimum (primary/secondary text)
- Border contrast: 3:1 minimum (meets WCAG)
- Disabled state: Explicit colors maintain legibility
- Focus indicators: Visible at 2px width with 50% alpha
- Native controls: Proper color-scheme for OS-level dark mode support
