import type { SniceBaseProps } from './types';
/**
 * Props for the DateTimePicker component
 */
export interface DateTimePickerProps extends SniceBaseProps {
    size?: any;
    value?: any;
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
    showPanel?: any;
}
/**
 * DateTimePicker - React adapter for snice-date-time-picker
 *
 * This is an auto-generated React wrapper for the Snice date-time-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/date-time-picker';
 * import { DateTimePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DateTimePicker />;
 * }
 * ```
 */
export declare const DateTimePicker: import("react").ForwardRefExoticComponent<Omit<DateTimePickerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=date-time-picker.d.ts.map