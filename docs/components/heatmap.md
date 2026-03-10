<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/heatmap.md -->

# Heatmap Component

The heatmap component displays a GitHub-style contribution calendar heatmap. It visualizes data as a grid of colored cells organized by week and day, with intensity levels indicating the magnitude of each data point.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `HeatmapDataPoint[]` | `[]` | Array of data points with date and value |
| `colorScheme` (attr: `color-scheme`) | `'green' \| 'blue' \| 'purple' \| 'orange' \| 'red'` | `'green'` | Color scheme for intensity levels |
| `showLabels` (attr: `show-labels`) | `boolean` | `true` | Show day and month labels |
| `cellSize` (attr: `cell-size`) | `number` | `12` | Cell size in pixels |
| `cellGap` (attr: `cell-gap`) | `number` | `3` | Gap between cells in pixels |
| `showTooltip` (attr: `show-tooltip`) | `boolean` | `true` | Show tooltip on cell hover |
| `weeks` | `number` | `52` | Number of weeks to display |

### HeatmapDataPoint

```typescript
interface HeatmapDataPoint {
  date: string;   // ISO date string YYYY-MM-DD
  value: number;  // Numeric value for intensity
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `cell-click` | `{ date: string, value: number }` | Fired when a cell is clicked |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer heatmap container |
| `grid-area` | `<div>` | Grid area containing labels and cells |
| `grid` | `<div>` | Cell grid container |
| `tooltip` | `<div>` | Hover tooltip showing date and value |

```css
snice-heatmap::part(base) {
  padding: 1rem;
}

snice-heatmap::part(tooltip) {
  font-size: 0.75rem;
}
```

## Basic Usage

```typescript
import 'snice/components/heatmap/snice-heatmap';
```

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

## Accessibility

- **ARIA labels**: Each cell has an `aria-label` describing the date and contribution count
- **Keyboard navigation**: Cells are focusable buttons
- **Tooltips**: Visual hover feedback with date and value details
- **Color contrast**: Intensity levels are distinguishable at all levels
