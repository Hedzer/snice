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
    events: {},
    formAssociated: false
});
//# sourceMappingURL=time-range-picker.js.map