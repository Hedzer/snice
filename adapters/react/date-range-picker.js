import { createReactAdapter } from './wrapper';
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
export const DateRangePicker = createReactAdapter({
    tagName: 'snice-date-range-picker',
    properties: ["start", "end", "size", "variant", "format", "placeholder", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "clearable", "min", "max", "name", "columns", "firstDayOfWeek", "presets", "showCalendar"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=date-range-picker.js.map