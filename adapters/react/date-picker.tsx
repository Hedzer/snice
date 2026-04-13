import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the DatePicker component
 */
export interface DatePickerProps extends SniceBaseProps {
  size?: any;
  variant?: any;
  value?: any;
  format?: any;
  placeholder?: any;
  label?: any;
  helperText?: any;
  errorText?: any;
  disabled?: any;
  readonly?: any;
  loading?: any;
  required?: any;
  invalid?: any;
  clearable?: any;
  min?: any;
  max?: any;
  name?: any;
  showCalendar?: any;
  firstDayOfWeek?: any;
  onDatepickerInput?: (event: any) => void;
  onDatepickerChange?: (event: any) => void;
  onDatepickerFocus?: (event: any) => void;
  onDatepickerBlur?: (event: any) => void;
  onDatepickerOpen?: (event: any) => void;
  onDatepickerClose?: (event: any) => void;
  onDatepickerClear?: (event: any) => void;
  onDatepickerSelect?: (event: any) => void;
}

/**
 * DatePicker - React adapter for snice-date-picker
 *
 * This is an auto-generated React wrapper for the Snice date-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/date-picker';
 * import { DatePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DatePicker />;
 * }
 * ```
 */
export const DatePicker = createReactAdapter<DatePickerProps>({
  tagName: 'snice-date-picker',
  properties: ["size","variant","value","format","placeholder","label","helperText","errorText","disabled","readonly","loading","required","invalid","clearable","min","max","name","showCalendar","firstDayOfWeek"],
  events: {"datepicker-input":"onDatepickerInput","datepicker-change":"onDatepickerChange","datepicker-focus":"onDatepickerFocus","datepicker-blur":"onDatepickerBlur","datepicker-open":"onDatepickerOpen","datepicker-close":"onDatepickerClose","datepicker-clear":"onDatepickerClear","datepicker-select":"onDatepickerSelect"},
  formAssociated: false
});
