# snice-booking

Multi-step appointment booking widget: date picker, time slots, confirmation form.

## Properties

```typescript
availableDates: (Date | string)[] = [];   // JS property only; Date | 'YYYY-MM-DD' | ISO string, matched by calendar day — non-empty list disables all other days
availableSlots: BookingSlot[] = [];       // JS property only
duration: number = 30;                     // default appointment duration (minutes)
minDate: Date | string = '';              // attr: min-date
maxDate: Date | string = '';              // attr: max-date
fields: BookingField[] = [];              // JS property only
variant: 'stepper'|'inline' = 'stepper';
```

## Methods

- `reset()` - Reset to step 1, clear selections
- `getBooking()` - Returns `BookingData | null`

## Events

- `date-select` -> `{ date: string }`
- `slot-select` -> `{ slot: BookingSlot }`
- `booking-confirm` -> `{ booking: BookingData }`
- `booking-cancel` -> `void`

## CSS Parts

- `base` - Main container
- `stepper` - Step indicator header
- `calendar` - Date picker section
- `slots` - Time slots section
- `form` - Confirmation form section
- `confirmation` - Success message
- `content` - Wrapper around the current step body
- `step` - One step in the stepper header
- `step-active` - Added to `step` for the current step
- `step-completed` - Added to `step` for a completed step
- `step-number` - Step number/checkmark badge
- `step-number-active` - Added to `step-number` for the current step
- `step-number-completed` - Added to `step-number` for a completed step
- `month-header` - Month navigation row
- `month-nav` - A month navigation button
- `month-nav-prev` - Added to `month-nav` on the previous-month button
- `month-nav-next` - Added to `month-nav` on the next-month button
- `month-title` - Month and year label
- `weekdays` - Weekday header row
- `weekday` - One weekday header cell
- `days` - Day grid
- `day` - One day cell
- `day-other` - Added to `day` for a day outside the displayed month
- `day-today` - Added to `day` for today
- `day-selected` - Added to `day` for the selected date
- `day-available` - Added to `day` for a selectable available date
- `day-disabled` - Added to `day` for a non-selectable date
- `slots-title` - Heading above the time slots
- `no-slots` - Empty-state message when no slots are available
- `slots-grid` - Grid of time slot buttons
- `slot` - One time slot button
- `slot-selected` - Added to `slot` for the selected slot
- `slot-time` - Time label inside a slot
- `slot-duration` - Duration label inside a slot
- `summary` - Booking summary block in the form step
- `summary-row` - One summary line
- `summary-label` - Summary line label
- `summary-value` - Summary line value
- `field` - One custom form field wrapper
- `label` - Field label
- `input` - Field input control
- `input-textarea` - Added to `input` on a textarea field
- `actions` - Stepper action bar
- `button` - An action-bar or confirmation button
- `back-button` - Added to `button` on the back/cancel button
- `next-button` - Added to `button` on the next/confirm button
- `reset-button` - Added to `button` on the "Book Another" button
- `confirmation-icon` - Success checkmark
- `confirmation-title` - Success heading
- `confirmation-text` - Success detail text

## Interfaces

```typescript
interface BookingSlot {
  date: string;     // "YYYY-MM-DD"
  time: string;     // "HH:MM"
  duration: number;  // minutes
}

interface BookingField {
  name: string;
  label: string;
  type: 'text'|'email'|'tel'|'textarea';
  required?: boolean;
  placeholder?: string;
}

interface BookingData {
  date: string;
  slot: BookingSlot;
  fields: Record<string, string>;
}
```

## Basic Usage

```html
<snice-booking></snice-booking>
```

```typescript
booking.availableDates = ['2025-06-15', '2025-06-16'];
booking.availableSlots = [
  { date: '2025-06-15', time: '09:00', duration: 30 },
  { date: '2025-06-15', time: '10:00', duration: 30 },
];
booking.fields = [
  { name: 'name', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
];

booking.addEventListener('booking-confirm', e => {
  console.log(e.detail.booking);
});

// Inline variant (all steps visible)
// <snice-booking variant="inline"></snice-booking>
```

## Accessibility

- Keyboard navigation for date picker and slots
- ARIA labels for steps and form fields
- Focus management between steps
