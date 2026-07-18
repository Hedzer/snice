export type TextareaSize = 'small' | 'medium' | 'large';
export type TextareaVariant = 'outlined' | 'filled' | 'underlined';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface SniceTextareaElement extends HTMLElement {
  size: TextareaSize;
  variant: TextareaVariant;
  resize: TextareaResize;
  value: string;
  defaultValue: string;
  placeholder: string;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  rows: number;
  cols: number;
  maxlength: number;
  minlength: number;
  name: string;
  autocomplete: string;
  autoGrow: boolean;
  readonly type: 'textarea';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;

  focus(): void;
  blur(): void;
  select(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}
