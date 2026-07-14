export type KpiSentiment = 'up' | 'down' | 'neutral';
export type KpiSize = 'small' | 'medium' | 'large';

export interface SniceKpiElement extends HTMLElement {
  label: string;
  value: string | number;
  trendValue?: string | number;
  trendData?: number[];
  sentiment?: KpiSentiment;
  size: KpiSize;
  showSparkline: boolean;
  colorValue: boolean;
}
