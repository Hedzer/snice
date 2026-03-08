import type { SniceBaseProps } from './types';
/**
 * Props for the DateRangePicker component
 */
export interface DateRangePickerProps extends SniceBaseProps {
    start?: any;
    end?: any;
    size?: any;
    variant?: any;
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
    columns?: any;
    firstDayOfWeek?: any;
    presets?: any;
    showCalendar?: any;
}
/**
 * DateRangePicker - React adapter for snice-date-range-picker
 *
 * This is an auto-generated React wrapper for the Snice date-range-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/date-range-picker';
 * import { DateRangePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DateRangePicker />;
 * }
 * ```
 */
export declare const DateRangePicker: import("react").ForwardRefExoticComponent<Omit<DateRangePickerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=date-range-picker.d.ts.map