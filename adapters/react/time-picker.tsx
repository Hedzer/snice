import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the TimePicker component
 */
export interface TimePickerProps extends SniceBaseProps {
  value?: any;
  format?: any;
  step?: any;
  minTime?: any;
  maxTime?: any;
  showSeconds?: any;
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
  size?: any;
  loading?: any;
  clearable?: any;
  showDropdown?: any;

}

/**
 * TimePicker - React adapter for snice-time-picker
 *
 * This is an auto-generated React wrapper for the Snice time-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/time-picker';
 * import { TimePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TimePicker />;
 * }
 * ```
 */
export const TimePicker = createReactAdapter<TimePickerProps>({
  tagName: 'snice-time-picker',
  properties: ["value","format","step","minTime","maxTime","showSeconds","disabled","readonly","placeholder","label","helperText","errorText","required","invalid","name","variant","size","loading","clearable","showDropdown"],
  events: {},
  formAssociated: false
});
