export type SwitchSize = 'small' | 'medium' | 'large';

export interface SniceSwitchElement extends HTMLElement {
  checked: boolean;
  defaultChecked: boolean;
  disabled: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  size: SwitchSize;
  name: string;
  value: string;
  label: string;
  labelOn: string;
  labelOff: string;
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
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface SwitchChangeDetail {
  checked: boolean;
  switch: SniceSwitchElement;
}
