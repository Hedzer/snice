export type RadioSize = 'small' | 'medium' | 'large';
export type RadioVariant = 'default' | 'block';

export interface SniceRadioElement extends HTMLElement {
  checked: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  variant: RadioVariant;
  size: RadioSize;
  name: string;
  value: string;
  label: string;
  description: string;
  focus(): void;
  blur(): void;
  click(): void;
}

export interface RadioChangeDetail {
  checked: boolean;
  value: string;
  radio: SniceRadioElement;
}