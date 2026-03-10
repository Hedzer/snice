# snice-heatmap

GitHub-style calendar heatmap visualization.

## Properties

```typescript
data: HeatmapDataPoint[] = [];           // Array of { date: string, value: number } (attribute: false)
colorScheme: 'green'|'blue'|'purple'|'orange'|'red' = 'green'; // attr: color-scheme
showLabels: boolean = true;              // attr: show-labels
cellSize: number = 12;                   // attr: cell-size, px
cellGap: number = 3;                     // attr: cell-gap, px
showTooltip: boolean = true;             // attr: show-tooltip
weeks: number = 52;                      // Number of weeks to display
```

## Events

- `cell-click` → `{ date: string; value: number }` — fired when a cell is clicked

## CSS Parts

- `base` - Outer heatmap container div
- `grid-area` - Grid area with labels and cells
- `grid` - Cell grid container
- `tooltip` - Hover tooltip element

## Basic Usage

```typescript
import 'snice/components/heatmap/snice-heatmap';
```

```html
<snice-heatmap color-scheme="green"></snice-heatmap>
```

```typescript
heatmap.data = [
  { date: '2026-01-15', value: 5 },
  { date: '2026-01-16', value: 3 },
];

heatmap.addEventListener('cell-click', (e) => {
  console.log(e.detail.date, e.detail.value);
});
```

## Accessibility

- aria-labels on all cells with date and value
- Cells are focusable buttons
- Tooltip on hover with date and value
