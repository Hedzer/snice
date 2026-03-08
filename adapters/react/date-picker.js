import { createReactAdapter } from './wrapper';
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
export const DatePicker = createReactAdapter({
    tagName: 'snice-date-picker',
    properties: ["size", "variant", "value", "format", "placeholder", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "clearable", "min", "max", "name", "showCalendar", "firstDayOfWeek"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=date-picker.js.map