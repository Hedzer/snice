<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/spinner.md -->

# Spinner

An animated loading indicator with configurable size, color, and optional label.

## Table of Contents

- [Properties](#properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large' \| 'xl'` | `'medium'` | Spinner size |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'primary'` | Color variant |
| `label` | `string` | `''` | Accessible label text displayed below the spinner |
| `thickness` | `number` | `4` | Stroke thickness in pixels |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer spinner container |
| `circle` | The SVG spinner circle |
| `label` | The label text element |

## Basic Usage

```typescript
import 'snice/components/spinner/snice-spinner';
```

```html
<snice-spinner></snice-spinner>
```

## Examples

### Sizes

Use the `size` attribute to change the spinner's dimensions.

```html
<snice-spinner size="small"></snice-spinner>
<snice-spinner size="medium"></snice-spinner>
<snice-spinner size="large"></snice-spinner>
<snice-spinner size="xl"></snice-spinner>
```

### Colors

Use the `color` attribute to change the spinner's color.

```html
<snice-spinner color="primary"></snice-spinner>
<snice-spinner color="success"></snice-spinner>
<snice-spinner color="warning"></snice-spinner>
<snice-spinner color="error"></snice-spinner>
<snice-spinner color="info"></snice-spinner>
```

### With Label

Set the `label` attribute to display descriptive text below the spinner.

```html
<snice-spinner label="Loading data..."></snice-spinner>
```

### Custom Thickness

Use the `thickness` attribute to adjust the stroke width.

```html
<snice-spinner thickness="2"></snice-spinner>
<snice-spinner thickness="6"></snice-spinner>
```

### Inline

Use a small spinner inline with text for button loading states.

```html
<button disabled>
  <snice-spinner size="small"></snice-spinner>
  Processing...
</button>
```

## Accessibility

- Uses `role="status"` with `aria-label` for screen readers
- The `label` property provides visible and accessible descriptive text
