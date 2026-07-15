export type RadioSize = 'small' | 'medium' | 'large';
export type RadioVariant = 'default' | 'block';

export interface SniceRadioElement extends HTMLElement {
  checked: boolean;
  defaultChecked: boolean;
  disabled: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  variant: RadioVariant;
  size: RadioSize;
  name: string;
  value: string;
  label: string;
  description: string;
  readonly type: 'radio';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;
  focus(): void;
  blur(): void;
  click(): void;
  select(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface RadioChangeDetail {
  checked: boolean;
  value: string;
  radio: SniceRadioElement;
}
