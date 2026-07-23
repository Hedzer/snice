// GENERATED FILE — DO NOT EDIT.
// Source: components/booking/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
  onDateSelect?: (event: any) => void;
  onSlotSelect?: (event: any) => void;
  onBookingConfirm?: (event: any) => void;
  onBookingCancel?: (event: any) => void;
}

/**
 * Booking - React adapter for snice-booking
 *
 * This is an auto-generated React wrapper for the Snice booking component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/booking/snice-booking';
 * import { Booking } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Booking />;
 * }
 * ```
 */
export const Booking: SniceReactComponent<BookingProps, SniceComponentRef> = createReactAdapter<BookingProps, false>({
  tagName: 'snice-booking',
  properties: ["availableDates","availableSlots","duration","minDate","maxDate","fields","variant"],
  events: {"date-select":"onDateSelect","slot-select":"onSlotSelect","booking-confirm":"onBookingConfirm","booking-cancel":"onBookingCancel"},
  formAssociated: false
});
