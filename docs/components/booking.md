[//]: # (AI: For a low-token version of this doc, use docs/ai/components/booking.md instead)

# Booking Component
`<snice-booking>`

A multi-step appointment booking widget with date selection, time slot picking, and confirmation form.

## Basic Usage

```html
<snice-booking></snice-booking>
```

```javascript
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

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/booking/snice-booking';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-booking.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `availableDates` | `available-dates` | `(Date \| string)[]` | `[]` | Dates that can be selected |
| `availableSlots` | `available-slots` | `BookingSlot[]` | `[]` | Available time slots |
| `duration` | `duration` | `number` | `30` | Default duration in minutes |
| `minDate` | `min-date` | `Date \| string` | `''` | Earliest selectable date |
| `maxDate` | `max-date` | `Date \| string` | `''` | Latest selectable date |
| `fields` | — | `BookingField[]` | `[]` | Form fields for step 3 |
| `variant` | `variant` | `'stepper' \| 'inline'` | `'stepper'` | Layout mode |

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

## Methods

### `reset(): void`
Reset the booking widget to step 1 and clear all selections.

```javascript
booking.reset();
```

### `getBooking(): BookingData | null`
Get the current booking data. Returns `null` if date or slot not selected.

```javascript
const data = booking.getBooking();
if (data) {
  console.log('Date:', data.date);
  console.log('Time:', data.slot.time);
  console.log('Name:', data.fields.name);
}
```

## Events

### `date-select`
Dispatched when a date is selected in step 1.

```javascript
booking.addEventListener('date-select', (e) => {
  console.log('Selected date:', e.detail.date);
  // Load available slots for this date from your API
});
```

**Detail:** `{ date: string }`

### `slot-select`
Dispatched when a time slot is selected in step 2.

```javascript
booking.addEventListener('slot-select', (e) => {
  console.log('Selected slot:', e.detail.slot);
});
```

**Detail:** `{ slot: BookingSlot }`

### `booking-confirm`
Dispatched when the booking is confirmed in step 3.

```javascript
booking.addEventListener('booking-confirm', (e) => {
  const { booking } = e.detail;
  submitBooking(booking);
});
```

**Detail:** `{ booking: BookingData }`

### `booking-cancel`
Dispatched when the cancel button is clicked.

```javascript
booking.addEventListener('booking-cancel', () => {
  closeBookingModal();
});
```

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Main booking container |
| `stepper` | `<div>` | Step indicator header |
| `calendar` | `<div>` | Date picker section |
| `slots` | `<div>` | Time slots section |
| `form` | `<div>` | Confirmation form section |
| `confirmation` | `<div>` | Success message |

```css
snice-booking::part(base) {
  max-width: 500px;
  margin: 0 auto;
}
```

## Examples

### Stepper Variant (Default)

The stepper variant guides users through three steps: date selection, time slot, and confirmation.

```html
<snice-booking></snice-booking>
```

### Inline Variant

The inline variant shows all three steps side by side.

```html
<snice-booking variant="inline"></snice-booking>
```

### With Date Restrictions

```html
<snice-booking min-date="2025-06-01" max-date="2025-08-31"></snice-booking>
```

### Dynamic Slot Loading

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

```javascript
const booking = document.querySelector('snice-booking');

// Set up available dates and slots
booking.availableDates = getAvailableDates();
booking.availableSlots = getAvailableSlots();
booking.fields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
];

// Handle confirmation
booking.addEventListener('booking-confirm', async (e) => {
  const result = await createAppointment(e.detail.booking);
  if (result.success) {
    showNotification('Booking confirmed!');
  }
});

// Handle cancellation
booking.addEventListener('booking-cancel', () => {
  booking.reset();
});
```

## Accessibility

- Keyboard navigation for date picker and slots
- ARIA labels for steps and form fields
- Focus management between steps
- Screen reader friendly step indicators

## Browser Support

- Modern browsers with Custom Elements v1 support
- Date formatting via Intl API
