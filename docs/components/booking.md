<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/booking.md -->

# Booking Component
`<snice-booking>`

A multi-step appointment booking widget with date selection, time slot picking, and confirmation form.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Interfaces](#interfaces)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `availableDates` | -- | `(Date \| string)[]` | `[]` | Dates that can be selected (JS property only) |

> `availableDates` accepts `Date` objects, `YYYY-MM-DD` strings, or full ISO timestamps — all match by calendar day. When the list is non-empty, days outside it are disabled.
| `availableSlots` | -- | `BookingSlot[]` | `[]` | Available time slots (JS property only) |
| `duration` | `duration` | `number` | `30` | Default duration in minutes |
| `minDate` | `min-date` | `Date \| string` | `''` | Earliest selectable date |
| `maxDate` | `max-date` | `Date \| string` | `''` | Latest selectable date |
| `fields` | -- | `BookingField[]` | `[]` | Form fields for step 3 (JS property only) |
| `variant` | `variant` | `'stepper' \| 'inline'` | `'stepper'` | Layout mode |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `reset()` | -- | `void` | Reset to step 1 and clear all selections |
| `getBooking()` | -- | `BookingData \| null` | Get current booking data, or `null` if incomplete |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `date-select` | `{ date: string }` | Fired when a date is selected |
| `slot-select` | `{ slot: BookingSlot }` | Fired when a time slot is selected |
| `booking-confirm` | `{ booking: BookingData }` | Fired when the booking is confirmed |
| `booking-cancel` | `void` | Fired when the cancel button is clicked |

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Main booking container |
| `stepper` | `<div>` | Step indicator header |
| `calendar` | `<div>` | Date picker section |
| `slots` | `<div>` | Time slots section |
| `form` | `<div>` | Confirmation form section |
| `confirmation` | `<div>` | Success message |
| `content` | `<div>` | Wrapper around the current step body |
| `step` | `<div>` | One step in the stepper header |
| `step-active` | `<div>` | Added to `step` for the current step |
| `step-completed` | `<div>` | Added to `step` for a completed step |
| `step-number` | `<span>` | Step number/checkmark badge |
| `month-header` | `<div>` | Month navigation row |
| `month-nav` | `<button>` | A month navigation button |
| `month-nav-prev` | `<button>` | Added to `month-nav` on the previous-month button |
| `month-nav-next` | `<button>` | Added to `month-nav` on the next-month button |
| `month-title` | `<span>` | Month and year label |
| `weekdays` | `<div>` | Weekday header row |
| `weekday` | `<div>` | One weekday header cell |
| `days` | `<div>` | Day grid |
| `day` | `<button>` | One day cell |
| `day-other` | `<button>` | Added to `day` for a day outside the displayed month |
| `day-today` | `<button>` | Added to `day` for today |
| `day-selected` | `<button>` | Added to `day` for the selected date |
| `day-available` | `<button>` | Added to `day` for a selectable available date |
| `day-disabled` | `<button>` | Added to `day` for a non-selectable date |
| `slots-title` | `<div>` | Heading above the time slots |
| `no-slots` | `<div>` | Empty-state message when no slots are available |
| `slots-grid` | `<div>` | Grid of time slot buttons |
| `slot` | `<button>` | One time slot button |
| `slot-selected` | `<button>` | Added to `slot` for the selected slot |
| `slot-time` | `<div>` | Time label inside a slot |
| `slot-duration` | `<div>` | Duration label inside a slot |
| `summary` | `<div>` | Booking summary block in the form step |
| `summary-row` | `<div>` | One summary line |
| `summary-label` | `<div>` | Summary line label |
| `summary-value` | `<div>` | Summary line value |
| `field` | `<div>` | One custom form field wrapper |
| `label` | `<label>` | Field label |
| `input` | `<input>` | Field input control |
| `input-textarea` | `<textarea>` | Added to `input` on a textarea field |
| `actions` | `<div>` | Stepper action bar |
| `button` | `<button>` | An action-bar or confirmation button |
| `back-button` | `<button>` | Added to `button` on the back/cancel button |
| `next-button` | `<button>` | Added to `button` on the next/confirm button |
| `reset-button` | `<button>` | Added to `button` on the "Book Another" button |
| `confirmation-icon` | `<div>` | Success checkmark |
| `confirmation-title` | `<div>` | Success heading |
| `confirmation-text` | `<div>` | Success detail text |

```css
snice-booking::part(base) {
  max-width: 500px;
  margin: 0 auto;
}
```

## Basic Usage

```typescript
import 'snice/components/booking/snice-booking';
```

```html
<snice-booking></snice-booking>
```

```typescript
const booking = document.querySelector('snice-booking');

booking.availableDates = ['2025-06-15', '2025-06-16', '2025-06-17'];
booking.availableSlots = [
  { date: '2025-06-15', time: '09:00', duration: 30 },
  { date: '2025-06-15', time: '10:00', duration: 30 },
  { date: '2025-06-16', time: '14:00', duration: 60 },
];
booking.fields = [
  { name: 'name', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
];

booking.addEventListener('booking-confirm', (e) => {
  console.log('Booking:', e.detail.booking);
});
```

## Examples

### Stepper Variant (Default)

The stepper variant guides users through three steps: date selection, time slot, and confirmation.

```html
<snice-booking></snice-booking>
```

### Inline Variant

The inline variant shows all three sections side by side.

```html
<snice-booking variant="inline"></snice-booking>
```

### With Date Restrictions

Use `min-date` and `max-date` to constrain selectable dates.

```html
<snice-booking min-date="2025-06-01" max-date="2025-08-31"></snice-booking>
```

### Dynamic Slot Loading

Load time slots from an API when a date is selected.

```javascript
booking.addEventListener('date-select', async (e) => {
  const slots = await fetchAvailableSlots(e.detail.date);
  booking.availableSlots = slots;
});
```

### Custom Form Fields

```javascript
booking.fields = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
  { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com' },
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
  { name: 'notes', label: 'Special Requests', type: 'textarea', placeholder: 'Any preferences...' },
];
```

### Complete Booking Flow

```typescript
booking.availableDates = getAvailableDates();
booking.availableSlots = getAvailableSlots();
booking.fields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
];

booking.addEventListener('booking-confirm', async (e) => {
  const result = await createAppointment(e.detail.booking);
  if (result.success) {
    showNotification('Booking confirmed!');
  }
});

booking.addEventListener('booking-cancel', () => {
  booking.reset();
});
```

## Interfaces

### BookingSlot

```typescript
interface BookingSlot {
  date: string;     // "YYYY-MM-DD"
  time: string;     // "HH:MM" (24h format)
  duration: number;  // Minutes
}
```

### BookingField

```typescript
interface BookingField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  placeholder?: string;
}
```

### BookingData

```typescript
interface BookingData {
  date: string;
  slot: BookingSlot;
  fields: Record<string, string>;
}
```

## Accessibility

- Keyboard navigation for date picker and time slots
- ARIA labels for steps and form fields
- Focus management between steps
- Screen reader friendly step indicators
