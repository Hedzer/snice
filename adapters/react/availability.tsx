// GENERATED FILE — DO NOT EDIT.
// Source: components/availability/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Availability component
 */
export interface AvailabilityProps extends SniceBaseProps {
  value?: any;
  granularity?: any;
  startHour?: any;
  endHour?: any;
  format?: any;
  readonly?: any;
  onAvailabilityChange?: (event: any) => void;
}

/**
 * Availability - React adapter for snice-availability
 *
 * This is an auto-generated React wrapper for the Snice availability component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/availability/snice-availability';
 * import { Availability } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Availability />;
 * }
 * ```
 */
export const Availability: SniceReactComponent<AvailabilityProps, SniceComponentRef> = createReactAdapter<AvailabilityProps, false>({
  tagName: 'snice-availability',
  properties: ["value","granularity","startHour","endHour","format","readonly"],
  events: {"availability-change":"onAvailabilityChange"},
  formAssociated: false
});
