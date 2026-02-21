export type GaugeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type GaugeSize = 'small' | 'medium' | 'large';

export interface SniceGaugeElement extends HTMLElement {
  value: number;
  min: number;
  max: number;
  label: string;
  variant: GaugeVariant;
  size: GaugeSize;
  showValue: boolean;
  thickness: number;
}
