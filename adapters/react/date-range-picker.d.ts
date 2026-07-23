import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the DateRangePicker component
 */
export interface DateRangePickerProps extends SniceFormProps {
    defaultStart?: any;
    defaultEnd?: any;
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
    start?: any;
    end?: any;
    onDaterangeChange?: (event: any) => void;
    onDaterangeOpen?: (event: any) => void;
    onDaterangeClose?: (event: any) => void;
    onDaterangeClear?: (event: any) => void;
    onDaterangePreset?: (event: any) => void;
    onDaterangeFocus?: (event: any) => void;
    onDaterangeBlur?: (event: any) => void;
}
/**
 * DateRangePicker - React adapter for snice-date-range-picker
 *
 * This is an auto-generated React wrapper for the Snice date-range-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/date-range-picker/snice-date-range-picker';
 * import { DateRangePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DateRangePicker />;
 * }
 * ```
 */
export declare const DateRangePicker: SniceReactComponent<DateRangePickerProps, SniceFormRef>;
//# sourceMappingURL=date-range-picker.d.ts.map