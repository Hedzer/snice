# snice-heatmap

GitHub-style calendar heatmap visualization.

## Properties

```typescript
data: HeatmapDataPoint[] = [];           // Array of { date: string, value: number }
colorScheme: 'green'|'blue'|'purple'|'orange'|'red' = 'green'; // attribute: color-scheme
showLabels: boolean = true;              // attribute: show-labels
cellSize: number = 12;                   // attribute: cell-size, px
cellGap: number = 3;                     // attribute: cell-gap, px
showTooltip: boolean = true;             // attribute: show-tooltip
weeks: number = 52;                      // Number of weeks to display
```

## Events

- `cell-click` → `{ date: string; value: number }` — fired when a cell is clicked

## Usage

```html
<snice-heatmap id="heatmap" color-scheme="green"></snice-heatmap>

<script>
  const heatmap = document.getElementById('heatmap');
  heatmap.data = [
    { date: '2026-01-15', value: 5 },
    { date: '2026-01-16', value: 3 },
  ];

  heatmap.addEventListener('cell-click', (e) => {
    console.log(e.detail.date, e.detail.value);
  });
</script>
```

**CSS Parts:**
- `base` - Outer heatmap container div
- `grid-area` - Grid area with labels and cells
- `grid` - Cell grid container
- `tooltip` - Hover tooltip element

## Features

- 5 color schemes (green, blue, purple, orange, red)
- 5 intensity levels (empty, low, medium, high, very-high)
- Day labels (Mon, Wed, Fri) on left
- Month labels on top
- Tooltip on hover with date and value
- Cell click events
- Configurable cell size, gap, and week count
- Accessible: aria-labels on all cells
