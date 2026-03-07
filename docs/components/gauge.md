<!-- AI: For a low-token version of this doc, use docs/ai/components/gauge.md instead -->

# Gauge Component

The gauge component renders an SVG-based semicircle gauge/meter chart, ideal for dashboards and data visualization. It displays a value within a range using an animated arc fill with optional label text.

## Table of Contents
- [Properties](#properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)
- [Variant Colors](#variant-colors)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current value to display |
| `min` | `number` | `0` | Minimum value of the range |
| `max` | `number` | `100` | Maximum value of the range |
| `label` | `string` | `''` | Label text displayed below the gauge |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Color variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Gauge size |
| `showValue` | `boolean` | `true` | Whether to display the numeric value |
| `thickness` | `number` | `8` | Stroke thickness of the gauge arc |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer gauge container with `role="meter"` |
| `value` | `<span>` | Numeric value text displayed inside the gauge |
| `label` | `<span>` | Label text displayed below the gauge |

```css
snice-gauge::part(value) {
  font-size: 2rem;
  font-weight: 800;
}

snice-gauge::part(label) {
  color: #64748b;
  font-size: 0.875rem;
}
```

## Basic Usage

```html
<!-- Simple gauge -->
<snice-gauge value="75"></snice-gauge>

<!-- With label -->
<snice-gauge value="42" label="CPU Usage"></snice-gauge>
```

```typescript
import 'snice/components/gauge/snice-gauge';
```

## Examples

### Basic Gauge

```html
<snice-gauge value="75"></snice-gauge>
<snice-gauge value="42" label="Score"></snice-gauge>
<snice-gauge value="100" label="Complete"></snice-gauge>
```

### Color Variants

```html
<snice-gauge value="30" variant="default" label="Default"></snice-gauge>
<snice-gauge value="45" variant="primary" label="Primary"></snice-gauge>
<snice-gauge value="80" variant="success" label="Good"></snice-gauge>
<snice-gauge value="60" variant="warning" label="Warning"></snice-gauge>
<snice-gauge value="90" variant="error" label="Critical"></snice-gauge>
<snice-gauge value="55" variant="info" label="Info"></snice-gauge>
```

### Different Sizes

```html
<!-- Small (80px wide) -->
<snice-gauge value="60" size="small" label="Small"></snice-gauge>

<!-- Medium (120px wide, default) -->
<snice-gauge value="60" size="medium" label="Medium"></snice-gauge>

<!-- Large (160px wide) -->
<snice-gauge value="60" size="large" label="Large"></snice-gauge>
```

### Custom Range

```html
<!-- Temperature gauge (0-300) -->
<snice-gauge value="180" min="0" max="300" label="Temperature" variant="warning"></snice-gauge>

<!-- Percentage (0-100, default) -->
<snice-gauge value="75" label="Battery"></snice-gauge>

<!-- Custom scale -->
<snice-gauge value="7" min="0" max="10" label="Rating" variant="primary"></snice-gauge>
```

### Custom Thickness

```html
<!-- Thin -->
<snice-gauge value="65" thickness="4" label="Thin"></snice-gauge>

<!-- Default -->
<snice-gauge value="65" thickness="8" label="Default"></snice-gauge>

<!-- Thick -->
<snice-gauge value="65" thickness="14" label="Thick"></snice-gauge>
```

### Without Value Display

```html
<snice-gauge value="50" showValue="false" label="Progress"></snice-gauge>
```

### Dashboard Layout

```html
<style>
  .dashboard {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }
</style>

<div class="dashboard">
  <snice-gauge value="72" variant="primary" label="CPU" size="large"></snice-gauge>
  <snice-gauge value="45" variant="success" label="Memory" size="large"></snice-gauge>
  <snice-gauge value="88" variant="warning" label="Disk" size="large"></snice-gauge>
  <snice-gauge value="15" variant="error" label="Network" size="large"></snice-gauge>
</div>
```

### Dynamic Updates

```html
<snice-gauge id="live-gauge" value="0" variant="primary" label="Progress" size="large"></snice-gauge>

<button onclick="updateGauge()">Update</button>

<script type="module">
  import type { SniceGaugeElement } from 'snice/components/gauge/snice-gauge.types';

  const gauge = document.getElementById('live-gauge') as SniceGaugeElement;

  window.updateGauge = () => {
    gauge.value = Math.round(Math.random() * 100);
  };
</script>
```

## Accessibility

- **ARIA role**: The gauge has `role="meter"` for screen reader support
- **ARIA values**: `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` are set automatically
- **ARIA label**: Uses the `label` property for `aria-label`, falls back to "Gauge: {value}"
- **Color contrast**: All variant colors meet WCAG AA standards against their backgrounds
- **No motion sensitivity**: Arc animation uses CSS transitions which respect `prefers-reduced-motion`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Variant Colors

| Variant | Color Scheme | Use Case |
|---------|-------------|----------|
| `default` | Gray | Neutral metrics |
| `primary` | Blue | Primary metrics, general data |
| `success` | Green | Positive values, health checks |
| `warning` | Orange | Attention needed, thresholds |
| `error` | Red | Critical values, alerts |
| `info` | Light blue | Informational data |
