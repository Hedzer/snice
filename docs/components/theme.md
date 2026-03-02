[//]: # (AI: For a low-token version of this doc, use docs/ai/components/theme.md instead)

# Theme
`theme.css`

Provides all design tokens for Snice components via CSS custom properties. Includes light and dark themes with automatic system preference detection.

## Basic Usage

```html
<link rel="stylesheet" href="snice/components/theme/theme.css">
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/theme/theme.css';
```

**CDN**
```html
<link rel="stylesheet" href="theme.min.css">
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

### Force Light Theme

Set `data-theme="light"` to override system preference and force light theme.

```html
<html data-theme="light">
  <!-- Always light, regardless of system preference -->
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

## CSS Custom Properties

### Colors

| Property | Description |
|----------|-------------|
| `--snice-color-primary` | Primary brand color |
| `--snice-color-success` | Success state color |
| `--snice-color-warning` | Warning state color |
| `--snice-color-danger` | Danger/error state color |
| `--snice-color-neutral` | Neutral color |
| `--snice-color-text` | Primary text color |
| `--snice-color-text-secondary` | Secondary text color |
| `--snice-color-text-tertiary` | Tertiary text color |
| `--snice-color-text-inverse` | Text on dark/colored backgrounds |
| `--snice-color-background` | Page background |
| `--snice-color-background-secondary` | Secondary background |
| `--snice-color-background-tertiary` | Tertiary background |
| `--snice-color-background-element` | Element background |
| `--snice-color-background-input` | Input field background |
| `--snice-color-border` | Default border color |
| `--snice-color-border-hover` | Hovered border color |
| `--snice-color-border-focus` | Focused border color |

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

### Typography

| Property | Description |
|----------|-------------|
| `--snice-font-family` | System font stack |
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
| `--snice-font-weight-light` | 300 |
| `--snice-font-weight-normal` | 400 |
| `--snice-font-weight-medium` | 500 |
| `--snice-font-weight-semibold` | 600 |
| `--snice-font-weight-bold` | 700 |

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
