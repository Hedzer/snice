export type StatGroupVariant = 'card' | 'minimal' | 'bordered';
export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatItem {
  label: string;
  value: string | number;
  trend?: TrendDirection;
  trendValue?: string;
  icon?: string;
  color?: string;
}

export interface SniceStatGroupElement extends HTMLElement {
  stats: StatItem[];
  columns: number;
  variant: StatGroupVariant;
}

export interface StatClickDetail {
  stat: StatItem;
  index: number;
}

export interface SniceStatGroupEventMap {
  'stat-click': CustomEvent<StatClickDetail>;
}
