// GENERATED FILE — DO NOT EDIT.
// Source: components/time-range-picker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the TimeRangePicker component
 */
export interface TimeRangePickerProps extends SniceBaseProps {
  granularity?: any;
  startTime?: any;
  endTime?: any;
  value?: any;
  disabledRanges?: any;
  format?: any;
  multiple?: any;
  readonly?: any;
  disabled?: any;
  onTimeRangeChange?: (event: any) => void;
  onTimeRangeSelect?: (event: any) => void;
  onTimeRangeComplete?: (event: any) => void;
}

/**
 * TimeRangePicker - React adapter for snice-time-range-picker
 *
 * This is an auto-generated React wrapper for the Snice time-range-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/time-range-picker/snice-time-range-picker';
 * import { TimeRangePicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TimeRangePicker />;
 * }
 * ```
 */
export const TimeRangePicker: SniceReactComponent<TimeRangePickerProps, SniceComponentRef> = createReactAdapter<TimeRangePickerProps, false>({
  tagName: 'snice-time-range-picker',
  properties: ["granularity","startTime","endTime","value","disabledRanges","format","multiple","readonly","disabled"],
  events: {"time-range-change":"onTimeRangeChange","time-range-select":"onTimeRangeSelect","time-range-complete":"onTimeRangeComplete"},
  formAssociated: false
});
