<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/progress.md -->

# Progress
`<snice-progress>`

A progress indicator with linear and circular display variants, indeterminate mode, striped/animated styles, and optional labels.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current progress value |
| `max` | `number` | `100` | Maximum value |
| `variant` | `'linear' \| 'circular'` | `'linear'` | Display variant |
| `size` | `'small' \| 'medium' \| 'large' \| 'xl' \| 'xxl' \| 'xxxl'` | `'medium'` | Size of the indicator |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` or CSS color | `'primary'` | Bar color |
| `indeterminate` | `boolean` | `false` | Unknown progress mode |
| `showLabel` (attr: `show-label`) | `boolean` | `false` | Show percentage label |
| `label` | `string` | `''` | Custom label text (overrides percentage) |
| `striped` | `boolean` | `false` | Striped bar pattern (linear only) |
| `animated` | `boolean` | `false` | Animate striped pattern |
| `thickness` | `number` | `4` | Stroke width for circular variant |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setProgress()` | `value: number, max?: number` | Set progress value and optionally max |
| `getPercentage()` | -- | Returns the calculated percentage (0-100) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `progress-change` | `{ value, max, percentage, indeterminate }` | Fired when value, max, or indeterminate changes |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

### Linear Variant

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer progress container |
| `bar` | `<div>` | The progress bar fill |
| `label` | `<span>` | Percentage or custom label text |

### Circular Variant

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer progress container |
| `circle` | `<svg>` | The SVG element |
| `circle-bg` | `<circle>` | Background circle stroke |
| `circle-bar` | `<circle>` | Foreground progress arc |
| `label` | `<div>` | Percentage or custom label text |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--progress-height` | Bar height (linear) | `0.5rem` |
| `--progress-radius` | Bar border radius | `4px` |
| `--progress-bg` | Background track color | `var(--snice-color-border)` |
| `--progress-color` | Progress fill color | `var(--snice-color-primary)` |
| `--progress-animation-duration` | Animation speed | `1.5s` |

## Basic Usage

```typescript
import 'snice/components/progress/snice-progress';
```

```html
<snice-progress value="50"></snice-progress>
```

## Examples

### Variants

Use the `variant` attribute to switch between linear and circular display.

```html
<snice-progress value="60" variant="linear"></snice-progress>
<snice-progress value="60" variant="circular"></snice-progress>
```

### Sizes

Use the `size` attribute to change the progress indicator size.

```html
<snice-progress value="50" size="small"></snice-progress>
<snice-progress value="50" size="medium"></snice-progress>
<snice-progress value="50" size="large"></snice-progress>
<snice-progress value="50" size="xl" variant="circular"></snice-progress>
```

### Colors

Use the `color` attribute with semantic names or any CSS color value.

```html
<snice-progress value="80" color="primary"></snice-progress>
<snice-progress value="80" color="success"></snice-progress>
<snice-progress value="80" color="warning"></snice-progress>
<snice-progress value="80" color="error"></snice-progress>
<snice-progress value="80" color="#3b82f6"></snice-progress>
```

### Indeterminate

Set the `indeterminate` attribute for unknown progress (loading state).

```html
<snice-progress indeterminate></snice-progress>
<snice-progress variant="circular" indeterminate></snice-progress>
```

### With Label

Use `show-label` to display the percentage, or `label` for custom text.

```html
<snice-progress value="60" show-label></snice-progress>
<snice-progress value="60" label="Uploading..."></snice-progress>
```

### Striped and Animated

Use `striped` for a striped pattern and `animated` for animated stripes.

```html
<snice-progress value="70" striped></snice-progress>
<snice-progress value="70" striped animated></snice-progress>
```

### Circular Thickness

Use the `thickness` attribute to control the circular variant's stroke width.

```html
<snice-progress variant="circular" value="75" thickness="8" size="xl"></snice-progress>
```

### Programmatic Control

```typescript
progress.setProgress(75);
progress.setProgress(3, 10); // value 3, max 10
console.log(progress.getPercentage()); // 30
```

## Accessibility

- Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`
- Label text is used as `aria-label` for screen readers
