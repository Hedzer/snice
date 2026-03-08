import { createReactAdapter } from './wrapper';
/**
 * TimePicker - React adapter for snice-time-picker
 *
 * This is an auto-generated React wrapper for the Snice time-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/time-picker';
 * import { TimePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TimePicker />;
 * }
 * ```
 */
export const TimePicker = createReactAdapter({
    tagName: 'snice-time-picker',
    properties: ["value", "format", "step", "minTime", "maxTime", "showSeconds", "disabled", "readonly", "placeholder", "label", "helperText", "errorText", "required", "invalid", "name", "variant", "size", "loading", "clearable", "showDropdown"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=time-picker.js.map