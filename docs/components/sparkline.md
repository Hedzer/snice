# Sparkline Component

A lightweight inline chart component for visualizing trends and patterns in compact spaces. Perfect for dashboards, tables, and data-dense interfaces.

## Features

- **Multiple Chart Types**: line, bar, area
- **Semantic Colors**: primary, success, warning, danger, muted
- **Custom Colors**: Use any color with the `custom-color` attribute
- **Smooth Curves**: Optional smooth bezier curve interpolation
- **Customizable Size**: Configurable width and height
- **Optional Enhancements**: Dots, area fill, custom stroke width
- **Flexible Data Range**: Optional min/max values for scaling

## Basic Usage

```html
<snice-sparkline id="chart"></snice-sparkline>

<script>
  document.getElementById('chart').data = [10, 20, 15, 25, 30];
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `number[]` | `[]` | Array of numeric values to visualize |
| `type` | `SparklineType` | `'line'` | Chart type ('line', 'bar', 'area') |
| `color` | `SparklineColor` | `'primary'` | Color variant ('primary', 'success', 'warning', 'danger', 'muted') |
| `custom-color` | `string` | `undefined` | Custom color (overrides `color`) - any valid CSS color |
| `width` | `number` | `100` | Chart width in pixels |
| `height` | `number` | `30` | Chart height in pixels |
| `strokeWidth` | `number` | `2` | Line/dot stroke width |
| `showDots` | `boolean` | `false` | Show dots on data points (line charts) |
| `showArea` | `boolean` | `false` | Show area fill (line charts) |
| `smooth` | `boolean` | `false` | Use smooth bezier curves instead of sharp lines |
| `min` | `number` | `undefined` | Minimum value for scaling (auto if not set) |
| `max` | `number` | `undefined` | Maximum value for scaling (auto if not set) |

## Chart Types

### Line Chart
```html
<snice-sparkline type="line"></snice-sparkline>
```

### Bar Chart
```html
<snice-sparkline type="bar"></snice-sparkline>
```

### Area Chart
```html
<snice-sparkline type="area"></snice-sparkline>
```

## Colors

### Primary
```html
<snice-sparkline color="primary"></snice-sparkline>
```

### Success
```html
<snice-sparkline color="success"></snice-sparkline>
```

### Warning
```html
<snice-sparkline color="warning"></snice-sparkline>
```

### Danger
```html
<snice-sparkline color="danger"></snice-sparkline>
```

### Muted
```html
<snice-sparkline color="muted"></snice-sparkline>
```

## Customization

### With Dots
```html
<snice-sparkline show-dots></snice-sparkline>
```

### With Area Fill
```html
<snice-sparkline show-area></snice-sparkline>
```

### Custom Size
```html
<snice-sparkline width="200" height="50"></snice-sparkline>
```

### Thick Stroke
```html
<snice-sparkline stroke-width="3"></snice-sparkline>
```

### Custom Scale
```html
<snice-sparkline min="0" max="100"></snice-sparkline>
```

### Smooth Curves
```html
<snice-sparkline smooth></snice-sparkline>
```

### Custom Colors
```html
<!-- Hex color -->
<snice-sparkline custom-color="#9333ea"></snice-sparkline>

<!-- RGB color -->
<snice-sparkline custom-color="rgb(147, 51, 234)"></snice-sparkline>

<!-- Any valid CSS color -->
<snice-sparkline custom-color="hsl(270, 80%, 60%)"></snice-sparkline>
```

## CSS Parts

Use `::part()` to style internal elements:

```css
snice-sparkline::part(container) {
  padding: 4px;
}

snice-sparkline::part(svg) {
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

snice-sparkline::part(line) {
  stroke-dasharray: 4;
}

snice-sparkline::part(bar) {
  rx: 2;
}

snice-sparkline::part(area) {
  opacity: 0.3;
}

snice-sparkline::part(dot) {
  fill: white;
}
```

## Theming

The component uses these CSS custom properties:

```css
--snice-color-primary
--snice-color-success
--snice-color-warning
--snice-color-danger
--snice-color-text-secondary
```

## Examples

### Website Traffic Trend
```html
<div>
  <label>Daily Visitors</label>
  <snice-sparkline
    id="traffic"
    color="primary"
    width="150"
    height="40"
    show-area>
  </snice-sparkline>
</div>

<script>
  document.getElementById('traffic').data = [
    1200, 1350, 1100, 1450, 1600, 1550, 1700,
    1800, 1650, 1900, 2100, 2000, 2200, 2400
  ];
</script>
```

### Sales Performance
```html
<div>
  <label>Weekly Sales</label>
  <snice-sparkline
    id="sales"
    type="bar"
    color="success"
    width="150"
    height="40">
  </snice-sparkline>
</div>

<script>
  document.getElementById('sales').data = [45, 52, 48, 61, 55, 70, 68];
</script>
```

### Server Response Time
```html
<div>
  <label>Response Time (ms)</label>
  <snice-sparkline
    id="response"
    color="warning"
    width="150"
    height="40"
    show-dots>
  </snice-sparkline>
</div>

<script>
  document.getElementById('response').data = [
    120, 135, 115, 145, 160, 155, 140, 130, 125, 120
  ];
</script>
```

### Error Rate
```html
<div>
  <label>Error Rate</label>
  <snice-sparkline
    id="errors"
    type="area"
    color="danger"
    width="150"
    height="40"
    min="0">
  </snice-sparkline>
</div>

<script>
  document.getElementById('errors').data = [
    5, 3, 7, 12, 8, 15, 25, 20, 18, 22, 15, 10, 5, 3, 1, 0
  ];
</script>
```

### In Table Cells
```html
<table>
  <tr>
    <td>Product A</td>
    <td><snice-sparkline id="product-a" width="80" height="25"></snice-sparkline></td>
  </tr>
  <tr>
    <td>Product B</td>
    <td><snice-sparkline id="product-b" width="80" height="25"></snice-sparkline></td>
  </tr>
</table>

<script>
  document.getElementById('product-a').data = [10, 12, 15, 14, 18, 22, 25];
  document.getElementById('product-b').data = [30, 28, 25, 27, 24, 22, 20];
</script>
```

## Best Practices

1. **Keep it Simple**: Sparklines are meant to show trends, not detailed analysis
2. **Consistent Sizing**: Use the same dimensions for sparklines in a group
3. **Appropriate Scale**: Set `min`/`max` when comparing multiple charts
4. **Semantic Colors**: Use colors that match the data meaning (success=good, danger=bad)
5. **Add Context**: Always label sparklines so users understand what they represent

## Accessibility

- Sparklines are decorative visualizations
- Always provide text labels or tooltips for the data
- Consider adding `aria-label` to describe the trend
- Ensure sufficient color contrast for visibility

## Performance

- Lightweight SVG rendering
- No external dependencies
- Efficiently handles data updates
- Suitable for rendering many sparklines simultaneously
