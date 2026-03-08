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
export declare const DatePicker: import("react").ForwardRefExoticComponent<Omit<DatePickerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=date-picker.d.ts.map