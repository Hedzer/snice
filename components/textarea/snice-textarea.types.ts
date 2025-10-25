export type TextareaSize = 'small' | 'medium' | 'large';
export type TextareaVariant = 'outlined' | 'filled' | 'underlined';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface SniceTextareaElement extends HTMLElement {
  size: TextareaSize;
  variant: TextareaVariant;
  resize: TextareaResize;
  value: string;
  placeholder: string;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  rows: number;
  cols: number;
  maxlength: number;
  minlength: number;
  name: string;
  autocomplete: string;
  autoGrow: boolean;

  focus(): void;
  blur(): void;
  select(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}
