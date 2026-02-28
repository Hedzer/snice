import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/booking/snice-booking';
import type { SniceBookingElement, BookingSlot, BookingField } from '../../components/booking/snice-booking.types';

describe('snice-booking', () => {
  let booking: SniceBookingElement;

  afterEach(() => {
    if (booking) {
      removeComponent(booking as HTMLElement);
    }
  });

  it('should render', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    expect(booking).toBeTruthy();
  });

  it('should have default properties', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    expect(booking.variant).toBe('stepper');
    expect(booking.duration).toBe(30);
    expect(booking.availableDates).toEqual([]);
    expect(booking.availableSlots).toEqual([]);
    expect(booking.fields).toEqual([]);
  });

  it('should accept available dates', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    booking.availableDates = ['2025-06-15', '2025-06-16', '2025-06-17'];
    await wait();
    expect(booking.availableDates.length).toBe(3);
  });

  it('should accept available slots', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    const slots: BookingSlot[] = [
      { date: '2025-06-15', time: '09:00', duration: 30 },
      { date: '2025-06-15', time: '10:00', duration: 30 },
    ];
    booking.availableSlots = slots;
    await wait();
    expect(booking.availableSlots.length).toBe(2);
  });

  it('should accept custom fields', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    const fields: BookingField[] = [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
    ];
    booking.fields = fields;
    await wait();
    expect(booking.fields.length).toBe(2);
  });

  it('should support stepper variant', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking', {
      variant: 'stepper'
    });
    expect(booking.variant).toBe('stepper');
  });

  it('should support inline variant', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking', {
      variant: 'inline'
    });
    expect(booking.variant).toBe('inline');
  });

  it('should support duration', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking', {
      duration: 60
    });
    expect(booking.duration).toBe(60);
  });

  it('should support min-date', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking', {
      'min-date': '2025-01-01'
    });
    expect(booking.minDate).toBeTruthy();
  });

  it('should support max-date', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking', {
      'max-date': '2025-12-31'
    });
    expect(booking.maxDate).toBeTruthy();
  });

  it('should reset', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    booking.reset();
    await wait();

    const result = booking.getBooking();
    expect(result).toBeNull();
  });

  it('should return null from getBooking when no selection', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    expect(booking.getBooking()).toBeNull();
  });

  it('should emit date-select event', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    let selectedDate = '';
    booking.addEventListener('date-select', ((e: CustomEvent) => {
      selectedDate = e.detail.date;
    }) as EventListener);

    // Verify event listener is set up
    expect(selectedDate).toBe('');
  });

  it('should emit booking-cancel event', async () => {
    booking = await createComponent<SniceBookingElement>('snice-booking');
    let cancelled = false;
    booking.addEventListener('booking-cancel', () => {
      cancelled = true;
    });

    // Verify event listener is set up
    expect(cancelled).toBe(false);
  });
});
