import { createReactAdapter } from './wrapper';
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
export const DateTimePicker = createReactAdapter({
    tagName: 'snice-date-time-picker',
    properties: ["size", "value", "dateFormat", "timeFormat", "min", "max", "showSeconds", "loading", "clearable", "disabled", "readonly", "placeholder", "label", "helperText", "errorText", "required", "invalid", "name", "variant", "showPanel"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=date-time-picker.js.map