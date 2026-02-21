# Heatmap Component

The heatmap component displays a GitHub-style contribution calendar heatmap. It visualizes data as a grid of colored cells organized by week and day, with intensity levels indicating the magnitude of each data point.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [Examples](#examples)

## Basic Usage

```html
<snice-heatmap id="my-heatmap"></snice-heatmap>

<script>
  const heatmap = document.getElementById('my-heatmap');
  heatmap.data = [
    { date: '2026-01-15', value: 5 },
    { date: '2026-01-16', value: 3 },
    { date: '2026-01-17', value: 8 },
  ];
</script>
```

```typescript
import 'snice/components/heatmap/snice-heatmap';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `HeatmapDataPoint[]` | `[]` | Array of data points with date and value |
| `color-scheme` | `'green' \| 'blue' \| 'purple' \| 'orange' \| 'red'` | `'green'` | Color scheme for intensity levels |
| `show-labels` | `boolean` | `true` | Show day and month labels |
| `cell-size` | `number` | `12` | Cell size in pixels |
| `cell-gap` | `number` | `3` | Gap between cells in pixels |
| `show-tooltip` | `boolean` | `true` | Show tooltip on cell hover |
| `weeks` | `number` | `52` | Number of weeks to display |

### HeatmapDataPoint

```typescript
interface HeatmapDataPoint {
  date: string;   // ISO date string YYYY-MM-DD
  value: number;  // Numeric value for intensity
}
```

## Events

### `cell-click`

Fired when a cell is clicked.

```typescript
heatmap.addEventListener('cell-click', (e: CustomEvent) => {
  console.log(e.detail.date);  // '2026-01-15'
  console.log(e.detail.value); // 5
});
```

| Detail Property | Type | Description |
|-----------------|------|-------------|
| `date` | `string` | ISO date of the clicked cell |
| `value` | `number` | Value of the clicked cell |

## Examples

### Default Green Heatmap

```html
<snice-heatmap id="green-heatmap"></snice-heatmap>

<script>
  const heatmap = document.getElementById('green-heatmap');
  const data = [];
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (Math.random() > 0.3) {
      data.push({
        date: d.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 10)
      });
    }
  }
  heatmap.data = data;
</script>
```

### Color Schemes

```html
<snice-heatmap color-scheme="green" id="hm-green"></snice-heatmap>
<snice-heatmap color-scheme="blue" id="hm-blue"></snice-heatmap>
<snice-heatmap color-scheme="purple" id="hm-purple"></snice-heatmap>
<snice-heatmap color-scheme="orange" id="hm-orange"></snice-heatmap>
<snice-heatmap color-scheme="red" id="hm-red"></snice-heatmap>
```

### Compact View (12 weeks)

```html
<snice-heatmap weeks="12" id="compact-heatmap"></snice-heatmap>
```

### Custom Cell Size

```html
<!-- Larger cells -->
<snice-heatmap cell-size="16" cell-gap="4" id="large-heatmap"></snice-heatmap>

<!-- Smaller cells -->
<snice-heatmap cell-size="8" cell-gap="2" id="small-heatmap"></snice-heatmap>
```

### Without Labels

```html
<snice-heatmap show-labels="false" id="no-labels-heatmap"></snice-heatmap>
```

### Handling Cell Clicks

```html
<snice-heatmap id="clickable-heatmap"></snice-heatmap>
<p id="click-output">Click a cell to see details</p>

<script>
  const heatmap = document.getElementById('clickable-heatmap');
  const output = document.getElementById('click-output');

  heatmap.addEventListener('cell-click', (e) => {
    output.textContent = `Date: ${e.detail.date}, Value: ${e.detail.value}`;
  });
</script>
```

## Intensity Levels

Cell colors are calculated based on quartiles of the maximum value in the dataset:

| Level | Range | Description |
|-------|-------|-------------|
| 0 | No data | Empty (gray) |
| 1 | 1-25% of max | Low activity |
| 2 | 26-50% of max | Medium activity |
| 3 | 51-75% of max | High activity |
| 4 | 76-100% of max | Very high activity |

## Color Schemes

| Scheme | Level 1 | Level 2 | Level 3 | Level 4 |
|--------|---------|---------|---------|---------|
| `green` | #9be9a8 | #40c463 | #30a14e | #216e39 |
| `blue` | #9ecae1 | #4292c6 | #2171b5 | #084594 |
| `purple` | #c9b1e0 | #9b72cf | #7b4fbf | #5a2d91 |
| `orange` | #fdcc8a | #fc8d59 | #e34a33 | #b30000 |
| `red` | #fcae91 | #fb6a4a | #de2d26 | #a50f15 |

## Accessibility

- **ARIA labels**: Each cell has an `aria-label` describing the date and contribution count
- **Keyboard navigation**: Cells are focusable buttons
- **Tooltips**: Visual hover feedback with date and value details
- **Color contrast**: Intensity levels are distinguishable at all levels

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Pass data via property**: Set `heatmap.data = [...]` (not attribute)
2. **Use appropriate time ranges**: 52 weeks for yearly view, 12 for quarterly
3. **Choose meaningful color schemes**: Green for contributions, red for errors, etc.
4. **Keep values positive**: Intensity levels are calculated from 0 to max
5. **Format dates correctly**: Always use `YYYY-MM-DD` format
