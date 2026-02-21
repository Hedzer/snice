# snice-heatmap

GitHub-style calendar heatmap visualization.

## Properties

```typescript
data: HeatmapDataPoint[] = [];           // Array of { date: string, value: number }
colorScheme: 'green'|'blue'|'purple'|'orange'|'red' = 'green';
showLabels: boolean = true;              // Show day/month labels
cellSize: number = 12;                   // Cell size in px
cellGap: number = 3;                     // Gap between cells in px
showTooltip: boolean = true;             // Tooltip on hover
weeks: number = 52;                      // Number of weeks to display
```

## Events

```typescript
'cell-click': CustomEvent<{ date: string; value: number }>
```

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

## Features

- 5 color schemes (green, blue, purple, orange, red)
- 5 intensity levels (empty, low, medium, high, very-high)
- Day labels (Mon, Wed, Fri) on left
- Month labels on top
- Tooltip on hover with date and value
- Cell click events
- Configurable cell size, gap, and week count
- Accessible: aria-labels on all cells
