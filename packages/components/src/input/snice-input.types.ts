export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
export type InputSize = 'small' | 'medium' | 'large';
export type InputVariant = 'outlined' | 'filled' | 'underlined';

export interface SniceInputElement extends HTMLElement {
  type: InputType;
  size: InputSize;
  variant: InputVariant;
  value: string;
  placeholder: string;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  clearable: boolean;
  password: boolean;
  min: string;
  max: string;
  step: string;
  pattern: string;
  maxlength: number;
  minlength: number;
  autocomplete: string;
  name: string;
  align: 'top' | 'center' | 'bottom' | '';
  labelAlign: 'left' | 'center' | 'right';
  stretch: boolean;
  prefixIcon: string;
  suffixIcon: string;
  focus(): void;
  blur(): void;
  select(): void;
  clear(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface InputChangeDetail {
  value: string;
  input: SniceInputElement;
}

export interface InputInputDetail {
  value: string;
  input: SniceInputElement;
}

export interface InputFocusDetail {
  input: SniceInputElement;
}

export interface InputBlurDetail {
  input: SniceInputElement;
}

export interface InputClearDetail {
  input: SniceInputElement;
}