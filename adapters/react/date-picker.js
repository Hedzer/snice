// GENERATED FILE — DO NOT EDIT.
// Source: components/date-picker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * DatePicker - React adapter for snice-date-picker
 *
 * This is an auto-generated React wrapper for the Snice date-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/date-picker/snice-date-picker';
 * import { DatePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DatePicker />;
 * }
 * ```
 */
export const DatePicker = createReactAdapter({
    tagName: 'snice-date-picker',
    properties: ["size", "variant", "defaultValue", "format", "placeholder", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "clearable", "min", "max", "name", "open", "firstDayOfWeek", "value"],
    events: { "datepicker-input": "onDatepickerInput", "datepicker-change": "onDatepickerChange", "datepicker-focus": "onDatepickerFocus", "datepicker-blur": "onDatepickerBlur", "datepicker-open": "onDatepickerOpen", "datepicker-close": "onDatepickerClose", "datepicker-clear": "onDatepickerClear", "datepicker-select": "onDatepickerSelect" },
    formAssociated: true
});
//# sourceMappingURL=date-picker.js.map