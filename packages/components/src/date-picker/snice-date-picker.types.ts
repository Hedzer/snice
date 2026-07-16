export type DatePickerSize = 'small' | 'medium' | 'large';
export type DatePickerVariant = 'outlined' | 'filled' | 'underlined';
export type DateFormat = 'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy';

export interface DatePickerValue {
  date: Date | null;
  formatted: string;
  iso: string;
}

export interface SniceDatePickerElement extends HTMLElement {
  size: DatePickerSize;
  variant: DatePickerVariant;
  /** Live canonical date (`YYYY-MM-DD`), or empty when no valid date exists. */
  value: string;
  /** Authored `value` attribute used as the form-reset default. */
  defaultValue: string;
  format: DateFormat;
  placeholder: string;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  clearable: boolean;
  min: string;
  max: string;
  name: string;
  open: boolean;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  readonly type: 'date';
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;
  
  // Methods
  focus(): void;
  blur(): void;
  clear(): void;
  show(): void;
  hide(): void;
  selectDate(date: Date): void;
  goToMonth(year: number, month: number): void;
  goToToday(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface DatePickerChangeDetail {
  value: string;
  date: Date | null;
  formatted: string;
  iso: string;
  datePicker: SniceDatePickerElement;
}

export interface DatePickerInputDetail {
  value: string;
  datePicker: SniceDatePickerElement;
}

export interface DatePickerFocusDetail {
  datePicker: SniceDatePickerElement;
}

export interface DatePickerBlurDetail {
  datePicker: SniceDatePickerElement;
}

export interface DatePickerOpenDetail {
  datePicker: SniceDatePickerElement;
}

export interface DatePickerCloseDetail {
  datePicker: SniceDatePickerElement;
}

export interface DatePickerClearDetail {
  datePicker: SniceDatePickerElement;
}

export interface DatePickerSelectDetail {
  date: Date;
  formatted: string;
  iso: string;
  datePicker: SniceDatePickerElement;
}
