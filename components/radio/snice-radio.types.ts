export type RadioSize = 'small' | 'medium' | 'large';

export interface SniceRadioElement extends HTMLElement {
  checked: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  size: RadioSize;
  name: string;
  value: string;
  label: string;
  focus(): void;
  blur(): void;
  click(): void;
}

export interface RadioChangeDetail {
  checked: boolean;
  value: string;
  radio: SniceRadioElement;
}