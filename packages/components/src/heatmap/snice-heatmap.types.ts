export type HeatmapColorScheme = 'green' | 'blue' | 'purple' | 'orange' | 'red';

export interface HeatmapDataPoint {
  date: string;
  value: number;
}

export interface SniceHeatmapElement extends HTMLElement {
  data: HeatmapDataPoint[];
  colorScheme: HeatmapColorScheme;
  showLabels: boolean;
  cellSize: number;
  cellGap: number;
  showTooltip: boolean;
  weeks: number;
}

export interface SniceHeatmapEventMap {
  'cell-click': CustomEvent<{ date: string; value: number }>;
}
