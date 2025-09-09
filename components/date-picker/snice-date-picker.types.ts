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
  value: string;
  format: DateFormat;
  placeholder: string;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  clearable: boolean;
  min: string;
  max: string;
  name: string;
  showCalendar: boolean;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  
  // Methods
  focus(): void;
  blur(): void;
  clear(): void;
  open(): void;
  close(): void;
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