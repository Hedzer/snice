export interface CandleData {
  date: string | number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type TimeFormat = 'auto' | 'date' | 'time' | 'datetime' | 'month' | 'year';
export type YAxisFormat = 'number' | 'currency' | 'percent';

export interface SniceCandlestickElement extends HTMLElement {
  data: CandleData[];
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  bullishColor: string;
  bearishColor: string;
  timeFormat: TimeFormat;
  yAxisFormat: YAxisFormat;
  zoomEnabled: boolean;
  animation: boolean;

  // Methods
  resetZoom(): void;
  zoomTo(startIndex: number, endIndex: number): void;
}

export interface SniceCandlestickEventMap {
  'candle-click': CustomEvent<{ candle: CandleData; index: number }>;
  'candle-hover': CustomEvent<{ candle: CandleData; index: number }>;
  'crosshair-move': CustomEvent<{ price: number; date: string; x: number; y: number }>;
}
