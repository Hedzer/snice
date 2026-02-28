import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Booking component
 */
export interface BookingProps extends SniceBaseProps {
  availableDates?: any;
  availableSlots?: any;
  duration?: any;
  minDate?: any;
  maxDate?: any;
  fields?: any;
  variant?: any;

}

/**
 * Booking - React adapter for snice-booking
 *
 * This is an auto-generated React wrapper for the Snice booking component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/booking';
 * import { Booking } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Booking />;
 * }
 * ```
 */
export const Booking = createReactAdapter<BookingProps>({
  tagName: 'snice-booking',
  properties: ["availableDates","availableSlots","duration","minDate","maxDate","fields","variant"],
  events: {},
  formAssociated: false
});
