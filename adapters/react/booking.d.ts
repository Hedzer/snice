import { type SniceReactComponent } from './wrapper';
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
export declare const Booking: SniceReactComponent<BookingProps, SniceComponentRef>;
//# sourceMappingURL=booking.d.ts.map