export type WaterfallBarType = 'increase' | 'decrease' | 'total';

export interface WaterfallDataPoint {
  label: string;
  value: number;
  type?: WaterfallBarType;
}

export interface SniceWaterfallElement extends HTMLElement {
  data: WaterfallDataPoint[];
  orientation: 'vertical' | 'horizontal';
  showValues: boolean;
  showConnectors: boolean;
  animated: boolean;
}

export interface SniceWaterfallEventMap {
  'bar-click': CustomEvent<{ item: WaterfallDataPoint; index: number }>;
  'bar-hover': CustomEvent<{ item: WaterfallDataPoint; index: number }>;
}
