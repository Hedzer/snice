<!-- AI: For a low-token version of this doc, use docs/ai/components/sparkline.md instead -->

# Sparkline
`<snice-sparkline>`

A lightweight inline chart for visualizing trends in compact spaces.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/sparkline/snice-sparkline';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-sparkline.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `number[]` | `[]` | Array of numeric values to visualize |
| `type` | `'line' \| 'bar' \| 'area'` | `'line'` | Chart type |
| `color` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'muted'` | `'primary'` | Color variant |
| `customColor` (attr: `custom-color`) | `string` | `undefined` | Custom CSS color (overrides `color`) |
| `width` | `number` | `100` | Chart width in pixels |
| `height` | `number` | `30` | Chart height in pixels |
| `strokeWidth` (attr: `stroke-width`) | `number` | `2` | Line stroke width |
| `showDots` (attr: `show-dots`) | `boolean` | `false` | Show dots on data points |
| `showArea` (attr: `show-area`) | `boolean` | `false` | Show area fill below line |
| `smooth` | `boolean` | `false` | Use smooth bezier curves |
| `min` | `number` | `undefined` | Minimum scale value (auto if unset) |
| `max` | `number` | `undefined` | Maximum scale value (auto if unset) |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Outer container |
| `svg` | SVG element |
| `line` | Line path |
| `area` | Area fill path |
| `dot` | Data point dot |
| `bar` | Bar rectangle |

## Basic Usage

```typescript
import 'snice/components/sparkline/snice-sparkline';
```

```html
<snice-sparkline id="chart"></snice-sparkline>

<script>
  document.getElementById('chart').data = [10, 20, 15, 25, 30];
</script>
```

## Examples

### Chart Types

Use the `type` attribute to switch between chart styles.

```html
<snice-sparkline type="line"></snice-sparkline>
<snice-sparkline type="bar"></snice-sparkline>
<snice-sparkline type="area"></snice-sparkline>
```

### Colors

Use the `color` attribute for semantic color variants.

```html
<snice-sparkline color="primary"></snice-sparkline>
<snice-sparkline color="success"></snice-sparkline>
<snice-sparkline color="warning"></snice-sparkline>
<snice-sparkline color="danger"></snice-sparkline>
<snice-sparkline color="muted"></snice-sparkline>
```

### Custom Color

Use the `custom-color` attribute to apply any CSS color.

```html
<snice-sparkline custom-color="#9333ea"></snice-sparkline>
<snice-sparkline custom-color="hsl(270, 80%, 60%)"></snice-sparkline>
```

### With Dots

Set the `show-dots` attribute to display data point markers on line charts.

```html
<snice-sparkline show-dots></snice-sparkline>
```

### With Area Fill

Set the `show-area` attribute to fill the area below the line.

```html
<snice-sparkline show-area></snice-sparkline>
```

### Smooth Curves

Set the `smooth` attribute for bezier curve interpolation.

```html
<snice-sparkline smooth></snice-sparkline>
```

### Custom Size

Use the `width` and `height` attributes to set pixel dimensions.

```html
<snice-sparkline width="200" height="50"></snice-sparkline>
```

### Custom Scale

Use `min` and `max` to set fixed data bounds for consistent comparison.

```html
<snice-sparkline min="0" max="100"></snice-sparkline>
```

### Dashboard Trend

```html
<div>
  <label>Daily Visitors</label>
  <snice-sparkline id="traffic" color="primary" width="150" height="40" show-area></snice-sparkline>
</div>

<script>
  document.getElementById('traffic').data = [1200, 1350, 1100, 1450, 1600, 1550, 1700];
</script>
```
