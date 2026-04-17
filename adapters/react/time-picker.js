// GENERATED FILE — DO NOT EDIT.
// Source: components/time-picker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    events: { "time-change": "onTimeChange", "timepicker-focus": "onTimepickerFocus", "timepicker-blur": "onTimepickerBlur", "timepicker-open": "onTimepickerOpen", "timepicker-close": "onTimepickerClose", "timepicker-clear": "onTimepickerClear" },
    formAssociated: false
});
//# sourceMappingURL=time-picker.js.map