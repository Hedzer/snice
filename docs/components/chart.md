[//]: # (AI: For a low-token version of this doc, use docs/ai/components/chart.md instead)

# Chart Component

General-purpose charting component supporting multiple chart types with animations and interactivity.

## Basic Usage

```javascript
const chart = document.querySelector('snice-chart');

chart.type = 'line';
chart.datasets = [
  {
    label: 'Sales',
    data: [12, 19, 15, 25, 22, 30],
    borderColor: '#2196f3'
  }
];
chart.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `ChartType` | `'line'` | Chart type |
| `datasets` | `ChartDataset[]` | `[]` | Chart datasets |
| `labels` | `string[]` | `[]` | X-axis labels |
| `options` | `ChartOptions` | `{}` | Chart options |
| `width` | `number` | `0` | Chart width (0 = auto) |
| `height` | `number` | `0` | Chart height (0 = auto) |

## Chart Types

- `'line'` - Line chart
- `'bar'` - Vertical bar chart
- `'horizontal-bar'` - Horizontal bar chart
- `'area'` - Area chart (filled line)
- `'pie'` - Pie chart
- `'donut'` - Donut chart
- `'scatter'` - Scatter plot
- `'bubble'` - Bubble chart
- `'radar'` - Radar/spider chart
- `'mixed'` - Mixed chart types

## ChartDataset Interface

```typescript
interface ChartDataset {
  label: string;
  data: (number | ChartDataPoint)[];
  type?: ChartType; // for mixed charts
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number; // 0-1 for line smoothing
  pointRadius?: number;
  pointHoverRadius?: number;
  hidden?: boolean;
}
```

## ChartOptions Interface

```typescript
interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  legend?: ChartLegend;
  tooltip?: ChartTooltip;
  animation?: ChartAnimation;
  xAxis?: ChartAxis;
  yAxis?: ChartAxis;
}
```

## Methods

### `refresh(): void`
Refresh the chart display.

```javascript
chart.refresh();
```

### `update(datasets: ChartDataset[]): void`
Update all datasets.

```javascript
chart.update([
  { label: 'New Data', data: [10, 20, 30] }
]);
```

### `addDataset(dataset: ChartDataset): void`
Add a new dataset.

```javascript
chart.addDataset({
  label: 'Series 3',
  data: [15, 25, 35]
});
```

### `removeDataset(index: number): void`
Remove dataset by index.

```javascript
chart.removeDataset(0);
```

### `toggleDataset(index: number): void`
Toggle dataset visibility.

```javascript
chart.toggleDataset(0);
```

### `exportImage(format?: 'svg'): string`
Export chart as SVG string.

```javascript
const svg = chart.exportImage('svg');
```

### `getData(): { datasets, labels }`
Get current chart data.

```javascript
const data = chart.getData();
console.log(data.datasets, data.labels);
```

## Examples

### Line Chart

```javascript
chart.type = 'line';
chart.datasets = [
  {
    label: 'Temperature',
    data: [20, 22, 19, 25, 27, 24, 23],
    borderColor: '#2196f3',
    tension: 0.4 // Smooth line
  }
];
chart.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
```

### Bar Chart

```javascript
chart.type = 'bar';
chart.datasets = [
  {
    label: 'Revenue',
    data: [65, 59, 80, 81, 56, 55, 40],
    backgroundColor: [
      '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0',
      '#9966ff', '#ff9f40', '#ffcd56'
    ]
  }
];
chart.labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'];
```

### Area Chart

```javascript
chart.type = 'area';
chart.datasets = [
  {
    label: 'Users',
    data: [30, 40, 35, 50, 49, 60, 70],
    borderColor: '#4caf50',
    backgroundColor: '#4caf50',
    fill: true
  }
];
chart.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];
```

### Pie Chart

```javascript
chart.type = 'pie';
chart.datasets = [
  {
    label: 'Market Share',
    data: [30, 25, 20, 15, 10],
    backgroundColor: [
      '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'
    ]
  }
];
chart.labels = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
```

### Donut Chart

```javascript
chart.type = 'donut';
chart.datasets = [
  {
    label: 'Sales',
    data: [300, 250, 200, 150],
    backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336']
  }
];
chart.labels = ['North', 'South', 'East', 'West'];
```

### Scatter Plot

```javascript
chart.type = 'scatter';
chart.datasets = [
  {
    label: 'Dataset 1',
    data: [
      { x: 10, y: 20 },
      { x: 15, y: 25 },
      { x: 20, y: 22 },
      { x: 25, y: 30 }
    ],
    backgroundColor: '#2196f3',
    pointRadius: 5
  }
];
```

### Bubble Chart

```javascript
chart.type = 'bubble';
chart.datasets = [
  {
    label: 'Bubble Data',
    data: [
      { x: 10, y: 20, r: 15 },
      { x: 15, y: 25, r: 25 },
      { x: 20, y: 22, r: 10 }
    ],
    backgroundColor: '#ff9800'
  }
];
```

### Radar Chart

```javascript
chart.type = 'radar';
chart.datasets = [
  {
    label: 'Team A',
    data: [80, 90, 70, 85, 75],
    borderColor: '#2196f3',
    backgroundColor: '#2196f3'
  },
  {
    label: 'Team B',
    data: [70, 85, 80, 75, 85],
    borderColor: '#4caf50',
    backgroundColor: '#4caf50'
  }
];
chart.labels = ['Speed', 'Strength', 'Agility', 'Defense', 'Skill'];
```

### Mixed Chart

```javascript
chart.type = 'mixed';
chart.datasets = [
  {
    label: 'Bar Data',
    type: 'bar',
    data: [10, 20, 30, 40, 50],
    backgroundColor: '#2196f3'
  },
  {
    label: 'Line Data',
    type: 'line',
    data: [15, 25, 20, 35, 30],
    borderColor: '#4caf50'
  }
];
chart.labels = ['A', 'B', 'C', 'D', 'E'];
```

### Multiple Datasets

```javascript
chart.type = 'line';
chart.datasets = [
  {
    label: 'Sales 2023',
    data: [12, 19, 15, 25, 22, 30],
    borderColor: '#2196f3'
  },
  {
    label: 'Sales 2024',
    data: [15, 22, 18, 28, 25, 33],
    borderColor: '#4caf50'
  }
];
chart.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
```

### Custom Options

```javascript
chart.type = 'bar';
chart.datasets = [{ label: 'Data', data: [10, 20, 30] }];
chart.labels = ['A', 'B', 'C'];

chart.options = {
  responsive: true,
  legend: {
    position: 'bottom',
    clickable: true
  },
  tooltip: {
    trigger: 'hover',
    format: (value, datasetIndex, pointIndex) => {
      return `Value: ${value}`;
    }
  },
  animation: {
    enabled: true,
    duration: 1000,
    easing: 'ease-in-out'
  },
  xAxis: {
    title: 'Categories',
    grid: true
  },
  yAxis: {
    title: 'Values',
    min: 0,
    max: 100,
    ticks: 5,
    grid: true
  }
};
```

### Dynamic Updates

```javascript
// Add data point
function addData(label, value) {
  chart.labels = [...chart.labels, label];
  chart.datasets = chart.datasets.map(dataset => ({
    ...dataset,
    data: [...dataset.data, value]
  }));
  chart.refresh();
}

// Remove data point
function removeData() {
  chart.labels = chart.labels.slice(0, -1);
  chart.datasets = chart.datasets.map(dataset => ({
    ...dataset,
    data: dataset.data.slice(0, -1)
  }));
  chart.refresh();
}

// Update data
function updateData(index, newValue) {
  chart.datasets = chart.datasets.map(dataset => {
    const newData = [...dataset.data];
    newData[index] = newValue;
    return { ...dataset, data: newData };
  });
  chart.refresh();
}
```

### Legend Interaction

```javascript
chart.options = {
  legend: {
    position: 'top',
    clickable: true // Allow hiding datasets by clicking legend
  }
};

// Programmatically toggle dataset
chart.toggleDataset(0); // Hide/show first dataset
```

### Tooltips

```javascript
chart.options = {
  tooltip: {
    trigger: 'hover', // or 'click', 'none'
    format: (value, datasetIndex, pointIndex) => {
      const dataset = chart.datasets[datasetIndex];
      const label = chart.labels[pointIndex];
      return `${dataset.label} at ${label}: ${value}`;
    }
  }
};
```

### Export Chart

```javascript
// Export as SVG
const svg = chart.exportImage('svg');
console.log(svg);

// Download as SVG
function downloadChart() {
  const svg = chart.exportImage('svg');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chart.svg';
  a.click();
}
```

### Real-time Data

```javascript
let dataPoints = [10, 20, 30, 40, 50];

setInterval(() => {
  // Add new point
  dataPoints.push(Math.random() * 100);

  // Keep last 20 points
  if (dataPoints.length > 20) {
    dataPoints.shift();
  }

  chart.datasets = [{
    label: 'Live Data',
    data: dataPoints,
    borderColor: '#2196f3'
  }];

  chart.labels = dataPoints.map((_, i) => i);
  chart.refresh();
}, 1000);
```

### Responsive Chart

```html
<snice-chart id="responsive-chart"></snice-chart>

<script>
  const chart = document.getElementById('responsive-chart');

  chart.options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2 // 2:1 ratio
  };
</script>
```

### Financial Chart

```javascript
// Candlestick-style using bar chart with custom colors
chart.type = 'bar';
chart.datasets = [{
  label: 'Stock Price',
  data: [100, 110, 95, 120, 115, 130, 125],
  backgroundColor: [
    '#4caf50', '#4caf50', '#f44336', '#4caf50',
    '#f44336', '#4caf50', '#f44336'
  ]
}];
chart.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
```

### Comparison Chart

```javascript
chart.type = 'bar';
chart.datasets = [
  {
    label: 'Last Year',
    data: [30, 40, 35, 50, 45],
    backgroundColor: '#e0e0e0'
  },
  {
    label: 'This Year',
    data: [35, 45, 40, 55, 50],
    backgroundColor: '#2196f3'
  }
];
chart.labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer chart container |
| `canvas` | `<div>` | Chart canvas rendering area |
| `legend` | `<div>` | Legend container |

```css
snice-chart::part(base) {
  border: 1px solid #e2e2e2;
  border-radius: 8px;
}

snice-chart::part(legend) {
  padding: 0.5rem;
}
```

## Accessibility

- Legend items are clickable to toggle dataset visibility
- Tooltip shows data values on hover

## Browser Support

- Modern browsers with Custom Elements v1 support
- SVG rendering support
- Responsive and touch-friendly

## Performance Tips

- Limit data points for smooth animations (< 100 points recommended)
- Disable animations for large datasets
- Use debouncing for real-time updates
- Consider data aggregation for time-series data
