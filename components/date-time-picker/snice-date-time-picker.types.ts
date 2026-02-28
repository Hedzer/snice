export type DateTimePickerVariant = 'dropdown' | 'inline';
export type DateTimePickerTimeFormat = '12h' | '24h';

export interface SniceDateTimePickerElement extends HTMLElement {
  value: string;
  dateFormat: string;
  timeFormat: DateTimePickerTimeFormat;
  min: string;
  max: string;
  showSeconds: boolean;
  disabled: boolean;
  readonly: boolean;
  placeholder: string;
  label: string;
  helperText: string;
  errorText: string;
  required: boolean;
  invalid: boolean;
  name: string;
  variant: DateTimePickerVariant;

  // Methods
  open(): void;
  close(): void;
  focus(): void;
  blur(): void;
}

export interface DateTimeChangeDetail {
  value: string;
  date: Date | null;
  dateString: string;
  timeString: string;
  iso: string;
  dateTimePicker: SniceDateTimePickerElement;
}

export interface DateTimePickerFocusDetail {
  dateTimePicker: SniceDateTimePickerElement;
}

export interface DateTimePickerBlurDetail {
  dateTimePicker: SniceDateTimePickerElement;
}

export interface DateTimePickerOpenDetail {
  dateTimePicker: SniceDateTimePickerElement;
}

export interface DateTimePickerCloseDetail {
  dateTimePicker: SniceDateTimePickerElement;
}

export interface SniceDateTimePickerEventMap {
  'datetime-change': CustomEvent<DateTimeChangeDetail>;
  'datetimepicker-focus': CustomEvent<DateTimePickerFocusDetail>;
  'datetimepicker-blur': CustomEvent<DateTimePickerBlurDetail>;
  'datetimepicker-open': CustomEvent<DateTimePickerOpenDetail>;
  'datetimepicker-close': CustomEvent<DateTimePickerCloseDetail>;
}
