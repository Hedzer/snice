import type { SniceBaseProps } from './types';
/**
 * Props for the Calendar component
 */
export interface CalendarProps extends SniceBaseProps {
    value?: any;
    view?: any;
    events?: any;
    minDate?: any;
    maxDate?: any;
    disabledDates?: any;
    highlightToday?: any;
    showWeekNumbers?: any;
    firstDayOfWeek?: any;
    locale?: any;
}
/**
 * Calendar - React adapter for snice-calendar
 *
 * This is an auto-generated React wrapper for the Snice calendar component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/calendar';
 * import { Calendar } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Calendar />;
 * }
 * ```
 */
export declare const Calendar: import("react").ForwardRefExoticComponent<Omit<CalendarProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=calendar.d.ts.map