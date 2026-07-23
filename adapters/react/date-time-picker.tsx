// GENERATED FILE — DO NOT EDIT.
// Source: components/date-time-picker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';


/**
 * Props for the DateTimePicker component
 */
export interface DateTimePickerProps extends SniceFormProps {
  size?: any;
  defaultValue?: any;
  dateFormat?: any;
  timeFormat?: any;
  min?: any;
  max?: any;
  showSeconds?: any;
  loading?: any;
  clearable?: any;
  disabled?: any;
  readonly?: any;
  placeholder?: any;
  label?: any;
  helperText?: any;
  errorText?: any;
  required?: any;
  invalid?: any;
  name?: any;
  variant?: any;
  value?: any;
  onDatetimepickerClear?: (event: any) => void;
  onDatetimeChange?: (event: any) => void;
  onDatetimepickerFocus?: (event: any) => void;
  onDatetimepickerBlur?: (event: any) => void;
  onDatetimepickerOpen?: (event: any) => void;
  onDatetimepickerClose?: (event: any) => void;
}

/**
 * DateTimePicker - React adapter for snice-date-time-picker
 *
 * This is an auto-generated React wrapper for the Snice date-time-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/date-time-picker/snice-date-time-picker';
 * import { DateTimePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DateTimePicker />;
 * }
 * ```
 */
export const DateTimePicker: SniceReactComponent<DateTimePickerProps, SniceFormRef> = createReactAdapter<DateTimePickerProps, true>({
  tagName: 'snice-date-time-picker',
  properties: ["size","defaultValue","dateFormat","timeFormat","min","max","showSeconds","loading","clearable","disabled","readonly","placeholder","label","helperText","errorText","required","invalid","name","variant","value"],
  events: {"datetimepicker-clear":"onDatetimepickerClear","datetime-change":"onDatetimeChange","datetimepicker-focus":"onDatetimepickerFocus","datetimepicker-blur":"onDatetimepickerBlur","datetimepicker-open":"onDatetimepickerOpen","datetimepicker-close":"onDatetimepickerClose"},
  formAssociated: true
});
