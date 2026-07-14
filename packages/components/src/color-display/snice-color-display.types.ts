export type ColorSwatchSize = 'small' | 'medium' | 'large';
export type ColorFormat = 'hex' | 'rgb' | 'hsl';

export interface SniceColorDisplayElement extends HTMLElement {
  value: string;
  format: ColorFormat;
  showSwatch: boolean;
  showLabel: boolean;
  swatchSize: ColorSwatchSize;
  label: string;
}
