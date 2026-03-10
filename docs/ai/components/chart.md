# snice-chart

General-purpose chart component with 10 chart types and animations.

## Properties

```typescript
type: 'line'|'bar'|'horizontal-bar'|'area'|'pie'|'donut'|'scatter'|'bubble'|'radar'|'mixed' = 'line';
datasets: ChartDataset[] = [];    // property only
labels: string[] = [];            // property only
options: ChartOptions = {};       // property only
width: number = 0;                // 0 = auto
height: number = 0;               // 0 = auto
```

## Methods

- `refresh()` - Re-render chart
- `update(datasets: ChartDataset[])` - Replace all datasets
- `addDataset(dataset: ChartDataset)` - Append dataset
- `removeDataset(index: number)` - Remove by index
- `toggleDataset(index: number)` - Toggle visibility
- `exportImage(format?: 'png'|'svg'): string` - Export as data URL (default: `'svg'`)
- `getData(): { datasets, labels }` - Get current data

## CSS Parts

- `base` - Outer chart container
- `canvas` - Chart canvas rendering area
- `legend` - Legend container

## Basic Usage

```html
<snice-chart type="line" height="400"></snice-chart>
```

```typescript
import 'snice/components/chart/snice-chart';

chart.type = 'line';
chart.datasets = [{ label: 'Sales', data: [12, 19, 15, 25], borderColor: '#2196f3' }];
chart.labels = ['Jan', 'Feb', 'Mar', 'Apr'];
chart.options = {
  legend: { position: 'bottom', clickable: true },
  animation: { enabled: true, duration: 1000 },
  yAxis: { min: 0, max: 100, grid: true }
};
```

## Accessibility

- Legend items clickable to toggle datasets
- Hover tooltips for data values
