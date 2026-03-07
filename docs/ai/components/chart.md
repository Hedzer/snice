# snice-chart

General-purpose chart component with multiple types and animations.

## Properties

```typescript
type: 'line'|'bar'|'horizontal-bar'|'area'|'pie'|'donut'|'scatter'|'bubble'|'radar'|'mixed' = 'line';
datasets: ChartDataset[] = [];
labels: string[] = [];
options: ChartOptions = {};
width: number = 0;
height: number = 0;
```

## ChartDataset

```typescript
interface ChartDataset {
  label: string;
  data: (number | ChartDataPoint)[];
  type?: ChartType; // for mixed charts
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number; // 0-1
  pointRadius?: number;
  pointHoverRadius?: number;
  hidden?: boolean;
}
```

## ChartDataPoint

```typescript
interface ChartDataPoint {
  x?: number | string | Date;
  y?: number;
  r?: number; // bubble radius
  label?: string;
}
```

## ChartOptions

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

- `refresh()` — re-render the chart
- `update(datasets: ChartDataset[])` — replace all datasets
- `addDataset(dataset: ChartDataset)` — append a dataset
- `removeDataset(index: number)` — remove dataset by index
- `toggleDataset(index: number)` — toggle dataset visibility
- `exportImage(format?: 'png'|'svg')` — returns data URL string (default: `'svg'`)
- `getData()` — returns `{ datasets: ChartDataset[]; labels: string[] }`

## Usage

```javascript
// Line chart
chart.type = 'line';
chart.datasets = [{
  label: 'Sales',
  data: [12, 19, 15, 25, 22, 30],
  borderColor: '#2196f3',
  tension: 0.4
}];
chart.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// Bar chart
chart.type = 'bar';
chart.datasets = [{
  label: 'Revenue',
  data: [65, 59, 80, 81, 56],
  backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
}];

// Pie chart
chart.type = 'pie';
chart.datasets = [{
  label: 'Market Share',
  data: [30, 25, 20, 15, 10],
  backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
}];
chart.labels = ['A', 'B', 'C', 'D', 'E'];

// Scatter plot
chart.type = 'scatter';
chart.datasets = [{
  label: 'Dataset 1',
  data: [
    { x: 10, y: 20 },
    { x: 15, y: 25 },
    { x: 20, y: 22 }
  ],
  backgroundColor: '#2196f3'
}];

// Options
chart.options = {
  legend: { position: 'bottom', clickable: true },
  animation: { enabled: true, duration: 1000 },
  yAxis: { min: 0, max: 100, ticks: 5, grid: true }
};
```

```html
<snice-chart type="line" height="400"></snice-chart>
```

**CSS Parts:**
- `base` - Outer chart container div
- `canvas` - Chart canvas rendering area
- `legend` - Legend container

## Features

- 10 chart types (line, bar, area, pie, donut, scatter, bubble, radar, horizontal-bar, mixed)
- Multiple datasets
- Interactive legend
- Hover tooltips
- Animations
- SVG rendering
- Custom colors
- Grid/axes
- Export capability
