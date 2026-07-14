export type CheckboxSize = 'small' | 'medium' | 'large';

export interface SniceCheckboxElement extends HTMLElement {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  size: CheckboxSize;
  name: string;
  value: string;
  label: string;
  focus(): void;
  blur(): void;
  click(): void;
}

export interface CheckboxChangeDetail {
  checked: boolean;
  indeterminate: boolean;
  checkbox: SniceCheckboxElement;
}