# snice-sparkline

Compact inline chart for visualizing trends and patterns. For dashboards, tables, data-dense interfaces.

## Properties

```typescript
data: number[] = []                     // Values to visualize
type: SparklineType = 'line'            // 'line' | 'bar' | 'area'
color: SparklineColor = 'primary'       // 'primary' | 'success' | 'warning' | 'danger' | 'muted'
customColor?: string                    // Any CSS color (overrides color)
width: number = 100                     // Chart width in pixels
height: number = 30                     // Chart height in pixels
strokeWidth: number = 2                 // Line/dot stroke width
showDots: boolean = false               // Show dots on data points (line charts)
showArea: boolean = false               // Show area fill (line charts)
smooth: boolean = false                 // Use smooth bezier curves
min?: number                            // Min value for scaling (auto if unset)
max?: number                            // Max value for scaling (auto if unset)
```

## Usage

```html
<!-- Basic -->
<snice-sparkline id="chart"></snice-sparkline>
<script>
  document.getElementById('chart').data = [10, 20, 15, 25, 30];
</script>

<!-- Line chart -->
<snice-sparkline id="line" type="line"></snice-sparkline>

<!-- Bar chart -->
<snice-sparkline id="bar" type="bar"></snice-sparkline>

<!-- Area chart -->
<snice-sparkline id="area" type="area"></snice-sparkline>

<!-- Smooth curves -->
<snice-sparkline id="smooth" smooth></snice-sparkline>

<!-- With dots -->
<snice-sparkline id="dots" show-dots></snice-sparkline>

<!-- With area fill -->
<snice-sparkline id="fill" show-area></snice-sparkline>

<!-- Colors -->
<snice-sparkline color="primary"></snice-sparkline>
<snice-sparkline color="success"></snice-sparkline>
<snice-sparkline color="warning"></snice-sparkline>
<snice-sparkline color="danger"></snice-sparkline>
<snice-sparkline color="muted"></snice-sparkline>

<!-- Custom colors -->
<snice-sparkline custom-color="#9333ea"></snice-sparkline>
<snice-sparkline custom-color="rgb(147, 51, 234)"></snice-sparkline>
<snice-sparkline custom-color="hsl(270, 80%, 60%)"></snice-sparkline>

<!-- Sizing -->
<snice-sparkline width="200" height="50"></snice-sparkline>

<!-- Custom scale -->
<snice-sparkline min="0" max="100"></snice-sparkline>

<!-- Combined features -->
<snice-sparkline
  id="advanced"
  type="line"
  color="primary"
  width="150"
  height="40"
  smooth
  show-area
  min="0">
</snice-sparkline>
```

## CSS Parts

```css
::part(container)  /* Container div */
::part(svg)        /* SVG element */
::part(line)       /* Line/path element */
::part(area)       /* Area polygon/path */
::part(bar)        /* Bar rect */
::part(dot)        /* Dot circle */
```

## Styling

```css
--snice-color-primary
--snice-color-success
--snice-color-warning
--snice-color-danger
--snice-color-text-secondary
```

## In Tables

```html
<snice-table id="table"></snice-table>
<script>
  document.getElementById('table').data = [
    {
      product: 'A',
      trend: [10, 15, 12, 18, 22, 25]
    }
  ];

  document.getElementById('table').columns = [
    { key: 'product', label: 'Product' },
    {
      key: 'trend',
      label: 'Trend',
      render: (value) => {
        const sparkline = document.createElement('snice-sparkline');
        sparkline.data = value;
        sparkline.width = 80;
        sparkline.height = 25;
        sparkline.color = 'primary';
        return sparkline;
      }
    }
  ];
</script>
```

## Common Patterns

```html
<!-- Website traffic -->
<snice-sparkline
  id="traffic"
  color="primary"
  width="150"
  height="40"
  smooth
  show-area>
</snice-sparkline>

<!-- Sales bars -->
<snice-sparkline
  id="sales"
  type="bar"
  color="success"
  width="150"
  height="40">
</snice-sparkline>

<!-- Response time with dots -->
<snice-sparkline
  id="response"
  color="warning"
  smooth
  show-dots>
</snice-sparkline>

<!-- Error rate -->
<snice-sparkline
  id="errors"
  type="area"
  color="danger"
  min="0">
</snice-sparkline>
```
