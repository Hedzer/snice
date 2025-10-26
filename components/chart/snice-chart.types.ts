export type ChartType = 'line' | 'bar' | 'horizontal-bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'bubble' | 'radar' | 'mixed';

export type ChartLegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export type ChartTooltipTrigger = 'hover' | 'click' | 'none';

export interface ChartDataPoint {
  x?: number | string | Date;
  y?: number;
  r?: number; // for bubble charts
  label?: string;
}

export interface ChartDataset {
  label: string;
  data: (number | ChartDataPoint)[];
  type?: ChartType; // for mixed charts
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number; // for line/area smoothing (0-1)
  pointRadius?: number;
  pointHoverRadius?: number;
  hidden?: boolean;
}

export interface ChartAxis {
  title?: string;
  min?: number;
  max?: number;
  ticks?: number;
  grid?: boolean;
  labels?: string[];
}

export interface ChartLegend {
  position?: ChartLegendPosition;
  clickable?: boolean;
}

export interface ChartTooltip {
  trigger?: ChartTooltipTrigger;
  format?: (value: number | ChartDataPoint, datasetIndex: number, pointIndex: number) => string;
}

export interface ChartAnimation {
  enabled?: boolean;
  duration?: number; // ms
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  legend?: ChartLegend;
  tooltip?: ChartTooltip;
  animation?: ChartAnimation;
  xAxis?: ChartAxis;
  yAxis?: ChartAxis;
}

export interface SniceChartElement extends HTMLElement {
  type: ChartType;
  datasets: ChartDataset[];
  labels: string[];
  options: ChartOptions;
  width: number;
  height: number;

  refresh(): void;
  update(datasets: ChartDataset[]): void;
  addDataset(dataset: ChartDataset): void;
  removeDataset(index: number): void;
  toggleDataset(index: number): void;
  exportImage(format?: 'png' | 'svg'): string;
  getData(): { datasets: ChartDataset[]; labels: string[] };
}
