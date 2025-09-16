export type ProgressVariant = 'linear' | 'circular';
export type ProgressSize = 'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl';
export type ProgressColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface SniceProgressElement extends HTMLElement {
  value: number;
  max: number;
  variant: ProgressVariant;
  size: ProgressSize;
  color: ProgressColor;
  indeterminate: boolean;
  showLabel: boolean;
  label: string;
  striped: boolean;
  animated: boolean;
  thickness: number;
  getPercentage(): number;
  setProgress(value: number, max?: number): void;
}