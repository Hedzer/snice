// GENERATED FILE — DO NOT EDIT.
// Source: components/time-range-picker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const TimeRangePicker = createReactAdapter({
    tagName: 'snice-time-range-picker',
    properties: ["granularity", "startTime", "endTime", "value", "disabledRanges", "format", "multiple", "readonly", "disabled"],
    events: { "time-range-change": "onTimeRangeChange", "time-range-select": "onTimeRangeSelect", "time-range-complete": "onTimeRangeComplete" },
    formAssociated: false
});
//# sourceMappingURL=time-range-picker.js.map