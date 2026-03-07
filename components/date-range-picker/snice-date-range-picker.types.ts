export type DateRangePickerSize = 'small' | 'medium' | 'large';
export type DateRangePickerVariant = 'outlined' | 'filled' | 'underlined';
export type DateRangeFormat = 'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy';

export interface DateRangePreset {
  label: string;
  start: Date | string;
  end: Date | string;
}

export interface SniceDateRangePickerElement extends HTMLElement {
  start: string;
  end: string;
  size: DateRangePickerSize;
  variant: DateRangePickerVariant;
  format: DateRangeFormat;
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
  columns: number;
  firstDayOfWeek: number;
  presets: DateRangePreset[];
  showCalendar: boolean;

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
