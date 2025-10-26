export type StatTrend = 'up' | 'down' | 'neutral';
export type StatSize = 'small' | 'medium' | 'large';

export interface SniceStatElement extends HTMLElement {
  label: string;
  value: string | number;
  change: string | number;
  trend: StatTrend;
  size: StatSize;
  icon: string;
  iconImage: string;
  colorValue: boolean;
}
