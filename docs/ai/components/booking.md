# snice-booking

Multi-step appointment booking widget: date picker, time slots, confirmation form.

## Properties

```typescript
availableDates: (Date | string)[] = [];   // JS property only
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
