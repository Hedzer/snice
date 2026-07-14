export type SparklineType = 'line' | 'bar' | 'area';
export type SparklineColor = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

export interface SniceSparklineElement extends HTMLElement {
  data: number[];
  type: SparklineType;
  color: SparklineColor;
  customColor?: string;
  width: number;
  height: number;
  strokeWidth: number;
  showDots: boolean;
  showArea: boolean;
  smooth: boolean;
  min?: number;
  max?: number;
}
