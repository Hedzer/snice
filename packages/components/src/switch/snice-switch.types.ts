export type SwitchSize = 'small' | 'medium' | 'large';

export interface SniceSwitchElement extends HTMLElement {
  checked: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  size: SwitchSize;
  name: string;
  value: string;
  label: string;
  labelOn: string;
  labelOff: string;
  focus(): void;
  blur(): void;
  click(): void;
  toggle(): void;
}

export interface SwitchChangeDetail {
  checked: boolean;
  switch: SniceSwitchElement;
}