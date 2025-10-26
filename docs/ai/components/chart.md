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

```typescript
refresh(): void
update(datasets: ChartDataset[]): void
addDataset(dataset: ChartDataset): void
removeDataset(index: number): void
toggleDataset(index: number): void
exportImage(format?: 'png'|'svg'): string
getData(): { datasets: ChartDataset[]; labels: string[] }
```

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

// Radar chart
chart.type = 'radar';
chart.datasets = [
  { label: 'Team A', data: [80, 90, 70, 85, 75], borderColor: '#2196f3' },
  { label: 'Team B', data: [70, 85, 80, 75, 85], borderColor: '#4caf50' }
];
chart.labels = ['Speed', 'Strength', 'Agility', 'Defense', 'Skill'];

// Mixed chart
chart.type = 'mixed';
chart.datasets = [
  { label: 'Bar', type: 'bar', data: [10, 20, 30], backgroundColor: '#2196f3' },
  { label: 'Line', type: 'line', data: [15, 25, 20], borderColor: '#4caf50' }
];

// Options
chart.options = {
  legend: { position: 'bottom', clickable: true },
  tooltip: {
    trigger: 'hover',
    format: (value, datasetIndex, pointIndex) => `Value: ${value}`
  },
  animation: { enabled: true, duration: 1000 },
  yAxis: { min: 0, max: 100, ticks: 5, grid: true }
};

// Methods
chart.addDataset({ label: 'New', data: [1, 2, 3] });
chart.toggleDataset(0);
const svg = chart.exportImage('svg');
```

```html
<snice-chart type="line" height="400"></snice-chart>
```

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
