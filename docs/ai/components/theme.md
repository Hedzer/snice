# theme.css

CSS-only design token system. No component — just import the stylesheet.

## Usage

```html
<link rel="stylesheet" href="snice/components/theme/theme.css">
```

## Themes

- Default: light theme on `:root`
- `data-theme="dark"`: dark theme
- `data-theme="light"`: force light
- No attribute: follows `prefers-color-scheme`

```html
<html data-theme="dark">...</html>
```

## Tokens

### Colors

```css
--snice-color-primary
--snice-color-success
--snice-color-warning
--snice-color-danger
--snice-color-neutral
--snice-color-text
--snice-color-text-secondary
--snice-color-text-tertiary
--snice-color-text-inverse
--snice-color-background
--snice-color-background-secondary
--snice-color-background-tertiary
--snice-color-background-element
--snice-color-background-input
--snice-color-border
--snice-color-border-hover
--snice-color-border-focus
```

### Spacing

```css
--snice-spacing-3xs: 0.125rem;  /* 2px */
--snice-spacing-2xs: 0.25rem;   /* 4px */
--snice-spacing-xs: 0.5rem;     /* 8px */
--snice-spacing-sm: 0.75rem;    /* 12px */
--snice-spacing-md: 1rem;       /* 16px */
--snice-spacing-lg: 1.5rem;     /* 24px */
--snice-spacing-xl: 2rem;       /* 32px */
--snice-spacing-2xl: 3rem;      /* 48px */
--snice-spacing-3xl: 4rem;      /* 64px */
```

### Typography

```css
--snice-font-family: system font stack
--snice-font-family-mono: monospace stack
--snice-font-size-2xs..4xl: 10px..36px
--snice-font-weight-light..bold: 300..700
--snice-line-height-dense|normal|loose: 1.25|1.5|1.75
```

### Border Radius

```css
--snice-border-radius-sm..xl: 2px..16px
--snice-border-radius-circle: 50%
--snice-border-radius-pill: 9999px
```

### Shadows

```css
--snice-shadow-xs..2xl
--snice-shadow-inset-sm|md
```

### Transitions

```css
--snice-transition-fast: 150ms
--snice-transition-medium: 250ms
--snice-transition-slow: 350ms
```

### Z-Index

```css
--snice-z-index-dropdown: 1000
--snice-z-index-sticky: 1020
--snice-z-index-fixed: 1030
--snice-z-index-modal-backdrop: 1040
--snice-z-index-modal: 1050
--snice-z-index-tooltip: 1070
```

### Focus

```css
--snice-focus-ring-width: 2px
--snice-focus-ring-color: blue-500/0.5
--snice-focus-ring-offset: 2px
```

### Color Primitives (HSL)

Gray, blue, green, red, yellow scales from 50-950:

```css
--snice-color-blue-500: 217 91% 60%;
color: hsl(var(--snice-color-blue-500));
```
