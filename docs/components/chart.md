<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/chart.md -->

# Chart Component

General-purpose charting component supporting 10 chart types with animations, interactive legends, tooltips, and SVG rendering.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `ChartType` | `'line'` | Chart type: `'line'`, `'bar'`, `'horizontal-bar'`, `'area'`, `'pie'`, `'donut'`, `'scatter'`, `'bubble'`, `'radar'`, `'mixed'` |
| `datasets` | `ChartDataset[]` | `[]` | Chart datasets (property only) |
| `labels` | `string[]` | `[]` | X-axis labels (property only) |
| `options` | `ChartOptions` | `{}` | Chart options (property only) |
| `width` | `number` | `0` | Chart width (0 = auto) |
| `height` | `number` | `0` | Chart height (0 = auto) |

### ChartDataset Interface

```typescript
interface ChartDataset {
  label: string;
  data: (number | ChartDataPoint)[];
  type?: ChartType;                    // for mixed charts
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;                    // 0-1 for line smoothing
  pointRadius?: number;
  pointHoverRadius?: number;
  hidden?: boolean;
}
```

### ChartOptions Interface

```typescript
interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  legend?: { position?: 'top'|'bottom'|'left'|'right'|'none'; clickable?: boolean };
  tooltip?: { trigger?: 'hover'|'click'|'none'; format?: (value, datasetIndex, pointIndex) => string };
  animation?: { enabled?: boolean; duration?: number; easing?: 'linear'|'ease-in'|'ease-out'|'ease-in-out' };
  xAxis?: { title?: string; min?: number; max?: number; ticks?: number; grid?: boolean; labels?: string[] };
  yAxis?: { title?: string; min?: number; max?: number; ticks?: number; grid?: boolean; labels?: string[] };
}
```

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `refresh()` | -- | `void` | Re-render the chart |
| `update()` | `datasets: ChartDataset[]` | `void` | Replace all datasets |
| `addDataset()` | `dataset: ChartDataset` | `void` | Append a dataset |
| `removeDataset()` | `index: number` | `void` | Remove dataset by index |
| `toggleDataset()` | `index: number` | `void` | Toggle dataset visibility |
| `exportImage()` | `format?: 'png' \| 'svg'` | `string` | Export as data URL (default: `'svg'`) |
| `getData()` | -- | `{ datasets: ChartDataset[]; labels: string[] }` | Get current chart data |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer chart container |
| `canvas` | Chart canvas rendering area |
| `legend` | Legend container |

## Basic Usage

```html
<snice-chart id="chart"></snice-chart>
```

```typescript
import 'snice/components/chart/snice-chart';

chart.type = 'line';
chart.datasets = [
  { label: 'Sales', data: [12, 19, 15, 25, 22, 30], borderColor: '#2196f3' }
];
chart.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
```

## Examples

### Line Chart

Use `type="line"` with `tension` for smooth curves.

```javascript
chart.type = 'line';
chart.datasets = [
  { label: 'Temperature', data: [20, 22, 19, 25, 27, 24, 23], borderColor: '#2196f3', tension: 0.4 }
];
chart.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
```

### Bar Chart

Use `type="bar"` with `backgroundColor` for colored bars.

```javascript
chart.type = 'bar';
chart.datasets = [
  { label: 'Revenue', data: [65, 59, 80, 81, 56, 55, 40], backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#ffcd56'] }
];
chart.labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'];
```

### Pie Chart

Use `type="pie"` for proportional data.

```javascript
chart.type = 'pie';
chart.datasets = [
  { label: 'Market Share', data: [30, 25, 20, 15, 10], backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'] }
];
chart.labels = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
```

### Scatter Plot

Use `type="scatter"` with `{ x, y }` data points.

```javascript
chart.type = 'scatter';
chart.datasets = [
  { label: 'Dataset 1', data: [{ x: 10, y: 20 }, { x: 15, y: 25 }, { x: 20, y: 22 }], backgroundColor: '#2196f3', pointRadius: 5 }
];
```

### Radar Chart

Use `type="radar"` for multi-dimensional comparison.

```javascript
chart.type = 'radar';
chart.datasets = [
  { label: 'Team A', data: [80, 90, 70, 85, 75], borderColor: '#2196f3', backgroundColor: '#2196f3' },
  { label: 'Team B', data: [70, 85, 80, 75, 85], borderColor: '#4caf50', backgroundColor: '#4caf50' }
];
chart.labels = ['Speed', 'Strength', 'Agility', 'Defense', 'Skill'];
```

### Mixed Chart

Use `type="mixed"` and set `type` on each dataset.

```javascript
chart.type = 'mixed';
chart.datasets = [
  { label: 'Bar Data', type: 'bar', data: [10, 20, 30, 40, 50], backgroundColor: '#2196f3' },
  { label: 'Line Data', type: 'line', data: [15, 25, 20, 35, 30], borderColor: '#4caf50' }
];
chart.labels = ['A', 'B', 'C', 'D', 'E'];
```

### Custom Options

Configure legend, tooltip, animation, and axes.

```javascript
chart.options = {
  legend: { position: 'bottom', clickable: true },
  tooltip: { trigger: 'hover', format: (value) => `Value: ${value}` },
  animation: { enabled: true, duration: 1000, easing: 'ease-in-out' },
  yAxis: { title: 'Values', min: 0, max: 100, ticks: 5, grid: true }
};
```

### Export Chart

Use `exportImage()` to save the chart as SVG or PNG.

```javascript
const svg = chart.exportImage('svg');
const blob = new Blob([svg], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'chart.svg';
a.click();
```

## Accessibility

- Legend items are clickable to toggle dataset visibility
- Tooltip shows data values on hover
