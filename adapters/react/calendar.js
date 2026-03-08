import { createReactAdapter } from './wrapper';
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
export const Calendar = createReactAdapter({
    tagName: 'snice-calendar',
    properties: ["value", "view", "events", "minDate", "maxDate", "disabledDates", "highlightToday", "showWeekNumbers", "firstDayOfWeek", "locale"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=calendar.js.map