export type TimePickerFormat = '12h' | '24h';
export type TimePickerStep = 1 | 5 | 10 | 15 | 30;
export type TimePickerVariant = 'dropdown' | 'inline';

export interface SniceTimePickerElement extends HTMLElement {
  value: string;
  format: TimePickerFormat;
  step: TimePickerStep;
  minTime: string;
  maxTime: string;
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
  variant: TimePickerVariant;

  // Methods
  open(): void;
  close(): void;
  focus(): void;
  blur(): void;
}

export interface TimeChangeDetail {
  value: string;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  timePicker: SniceTimePickerElement;
}

export interface TimePickerFocusDetail {
  timePicker: SniceTimePickerElement;
}

export interface TimePickerBlurDetail {
  timePicker: SniceTimePickerElement;
}

export interface TimePickerOpenDetail {
  timePicker: SniceTimePickerElement;
}

export interface TimePickerCloseDetail {
  timePicker: SniceTimePickerElement;
}

export interface SniceTimePickerEventMap {
  'time-change': CustomEvent<TimeChangeDetail>;
  'timepicker-focus': CustomEvent<TimePickerFocusDetail>;
  'timepicker-blur': CustomEvent<TimePickerBlurDetail>;
  'timepicker-open': CustomEvent<TimePickerOpenDetail>;
  'timepicker-close': CustomEvent<TimePickerCloseDetail>;
}
