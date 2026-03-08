import type { SniceBaseProps } from './types';
/**
 * Props for the TimeRangePicker component
 */
export interface TimeRangePickerProps extends SniceBaseProps {
    granularity?: any;
    startTime?: any;
    endTime?: any;
    value?: any;
    disabledRanges?: any;
    format?: any;
    multiple?: any;
    readonly?: any;
    disabled?: any;
}
/**
 * TimeRangePicker - React adapter for snice-time-range-picker
 *
 * This is an auto-generated React wrapper for the Snice time-range-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/time-range-picker';
 * import { TimeRangePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TimeRangePicker />;
 * }
 * ```
 */
export declare const TimeRangePicker: import("react").ForwardRefExoticComponent<Omit<TimeRangePickerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=time-range-picker.d.ts.map