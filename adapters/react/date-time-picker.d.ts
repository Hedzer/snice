import { type SniceReactComponent } from './wrapper';
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
export declare const DateTimePicker: SniceReactComponent<DateTimePickerProps, SniceFormRef>;
//# sourceMappingURL=date-time-picker.d.ts.map