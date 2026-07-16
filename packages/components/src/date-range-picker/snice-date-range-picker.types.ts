export type DateRangePickerSize = 'small' | 'medium' | 'large';
export type DateRangePickerVariant = 'outlined' | 'filled' | 'underlined';
export type DateRangeFormat = 'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy';

export interface DateRangePreset {
  label: string;
  start: Date | string;
  end: Date | string;
}

export interface SniceDateRangePickerElement extends HTMLElement {
  /** Live start value; accepts canonical or configured display-format strings. */
  start: string;
  /** Live end value; accepts canonical or configured display-format strings. */
  end: string;
  /** Authored `start` attribute used as the form-reset default. */
  defaultStart: string;
  /** Authored `end` attribute used as the form-reset default. */
  defaultEnd: string;
  size: DateRangePickerSize;
  variant: DateRangePickerVariant;
  format: DateRangeFormat;
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
  columns: number;
  firstDayOfWeek: number;
  presets: DateRangePreset[];
  showCalendar: boolean;
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  readonly labels: NodeList | null;

  focus(): void;
  blur(): void;
  clear(): void;
  open(): void;
  close(): void;
  selectRange(start: Date, end: Date): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface DateRangeChangeDetail {
  start: string;
  end: string;
  startDate: Date | null;
  endDate: Date | null;
  startIso: string;
  endIso: string;
  dateRangePicker: SniceDateRangePickerElement;
}

export interface DateRangeInputDetail {
  value: string;
  field: 'start' | 'end';
  dateRangePicker: SniceDateRangePickerElement;
}

export interface DateRangePresetDetail {
  label: string;
  start: string;
  end: string;
  dateRangePicker: SniceDateRangePickerElement;
}

export interface DateRangePickerEventDetail {
  dateRangePicker: SniceDateRangePickerElement;
}
