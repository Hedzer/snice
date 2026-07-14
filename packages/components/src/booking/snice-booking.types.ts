export type BookingVariant = 'stepper' | 'inline';

export interface BookingSlot {
  date: string;
  time: string;
  duration: number;
}

export interface BookingField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  placeholder?: string;
}

export interface BookingData {
  date: string;
  slot: BookingSlot;
  fields: Record<string, string>;
}

export interface SniceBookingElement extends HTMLElement {
  availableDates: (Date | string)[];
  availableSlots: BookingSlot[];
  duration: number;
  minDate: Date | string;
  maxDate: Date | string;
  fields: BookingField[];
  variant: BookingVariant;

  reset(): void;
  getBooking(): BookingData | null;
}

export interface SniceBookingEventMap {
  'date-select': CustomEvent<{ date: string }>;
  'slot-select': CustomEvent<{ slot: BookingSlot }>;
  'booking-confirm': CustomEvent<{ booking: BookingData }>;
  'booking-cancel': CustomEvent<void>;
}
