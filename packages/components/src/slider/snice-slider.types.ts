export type SliderSize = 'small' | 'medium' | 'large';
export type SliderVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface SniceSliderElement extends HTMLElement {
  size: SliderSize;
  variant: SliderVariant;
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  name: string;
  showValue: boolean;
  showTicks: boolean;
  vertical: boolean;

  focus(): void;
  blur(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}
