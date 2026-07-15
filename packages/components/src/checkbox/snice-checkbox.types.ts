export type CheckboxSize = 'small' | 'medium' | 'large';

export interface SniceCheckboxElement extends HTMLElement {
  checked: boolean;
  defaultChecked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  size: CheckboxSize;
  name: string;
  value: string;
  label: string;
  readonly type: 'checkbox';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;
  focus(): void;
  blur(): void;
  click(): void;
  toggle(): void;
  setIndeterminate(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface CheckboxChangeDetail {
  checked: boolean;
  indeterminate: boolean;
  checkbox: SniceCheckboxElement;
}
