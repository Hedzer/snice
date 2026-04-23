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
| `variant` | `'arc' \| 'dots' \| 'pulse' \| 'orbit' \| 'bars'` | `'arc'` | Loader shape |
| `label` | `string` | `''` | Accessible label text displayed below the spinner |
| `thickness` | `number` | `4` | Stroke thickness in pixels (applies to `arc` variant only) |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer spinner container |
| `circle` | SVG spinner circle (arc variant) |
| `dots` | Dot container (dots variant) |
| `pulse` | Pulse element (pulse variant) |
| `orbit` | Orbit container (orbit variant) |
| `bars` | Bar container (bars variant) |
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

### Variants

Five distinct loader shapes — useful for matching different contexts:

```html
<snice-spinner variant="arc"></snice-spinner>     <!-- Default: rotating arc -->
<snice-spinner variant="dots"></snice-spinner>    <!-- Three bouncing dots -->
<snice-spinner variant="pulse"></snice-spinner>   <!-- Expanding ring -->
<snice-spinner variant="bars"></snice-spinner>    <!-- Four pulsing bars -->
<snice-spinner variant="orbit"></snice-spinner>   <!-- Three orbiting dots -->
```

All variants inherit the spinner `color` — combine freely:
```html
<snice-spinner variant="dots" color="success" size="small"></snice-spinner>
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
