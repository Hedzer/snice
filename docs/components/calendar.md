<!-- AI: For a low-token version of this doc, use docs/ai/components/calendar.md instead -->

# Calendar Component

Display and select dates with event support.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `Date \| string` | `new Date()` | Selected date |
| `view` | `'month' \| 'week' \| 'day'` | `'month'` | Calendar view |
| `events` | `CalendarEvent[]` | `[]` | Calendar events |
| `minDate` | `Date \| string` | `''` | Minimum selectable date |
| `maxDate` | `Date \| string` | `''` | Maximum selectable date |
| `disabledDates` | `(Date \| string)[]` | `[]` | Disabled dates |
| `highlightToday` | `boolean` | `true` | Highlight today's date |
| `showWeekNumbers` | `boolean` | `false` | Show week numbers |
| `firstDayOfWeek` | `number` | `0` | First day of week (0=Sun, 1=Mon) |
| `locale` | `string` | `'en-US'` | Locale for formatting |

## Methods

### `goToToday(): void`
Navigate to today's date.

```javascript
calendar.goToToday();
```

### `goToDate(date: Date | string): void`
Navigate to specific date.

```javascript
calendar.goToDate(new Date(2024, 5, 15));
```

### `previousMonth(): void`
Navigate to previous month.

```javascript
calendar.previousMonth();
```

### `nextMonth(): void`
Navigate to next month.

```javascript
calendar.nextMonth();
```

### `previousWeek(): void`
Navigate to previous week.

```javascript
calendar.previousWeek();
```

### `nextWeek(): void`
Navigate to next week.

```javascript
calendar.nextWeek();
```

### `previousDay(): void`
Navigate to previous day.

```javascript
calendar.previousDay();
```

### `nextDay(): void`
Navigate to next day.

```javascript
calendar.nextDay();
```

### `getDisplayedMonth(): { month: number; year: number }`
Get currently displayed month.

```javascript
const { month, year } = calendar.getDisplayedMonth();
console.log(`Showing ${month + 1}/${year}`);
```

### `getEventsForDate(date: Date | string): CalendarEvent[]`
Get events for specific date.

```javascript
const events = calendar.getEventsForDate(new Date());
console.log(`Today has ${events.length} events`);
```

## CalendarEvent Interface

```typescript
interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date | string;
  end?: Date | string;
  color?: string;
  data?: any;
}
```

## Events

### `calendar-change`
Dispatched when selected date changes.

```javascript
calendar.addEventListener('calendar-change', (e) => {
  console.log('Selected:', e.detail.value);
});
```

**Detail:** `{ value: Date, calendar: SniceCalendarElement }`

### `calendar-event-click`
Dispatched when event is clicked.

```javascript
calendar.addEventListener('calendar-event-click', (e) => {
  console.log('Event clicked:', e.detail.event);
});
```

**Detail:** `{ event: CalendarEvent, calendar: SniceCalendarElement }`

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The main calendar container |
| `header` | `<div>` | The header with month title and navigation buttons |
| `grid` | `<div>` | The day cells grid |

```css
snice-calendar::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-calendar::part(header) {
  padding: 1rem;
  font-weight: 600;
}

snice-calendar::part(grid) {
  gap: 2px;
}
```

## Basic Usage

```html
<snice-calendar></snice-calendar>
```

```javascript
const calendar = document.querySelector('snice-calendar');

calendar.addEventListener('calendar-change', (e) => {
  console.log('Selected date:', e.detail.value);
});
```

## Examples

### Basic Calendar

```html
<snice-calendar></snice-calendar>
```

### With Events

```javascript
const calendar = document.querySelector('snice-calendar');

calendar.events = [
  {
    id: 1,
    title: 'Team Meeting',
    start: new Date(2024, 5, 15, 10, 0),
    color: '#2196f3'
  },
  {
    id: 2,
    title: 'Project Deadline',
    start: new Date(2024, 5, 20),
    color: '#f44336'
  }
];
```

### With Date Restrictions

```html
<snice-calendar
  min-date="2024-01-01"
  max-date="2024-12-31">
</snice-calendar>
```

### Disabled Dates

```javascript
calendar.disabledDates = [
  new Date(2024, 5, 10),
  new Date(2024, 5, 11),
  new Date(2024, 5, 12)
];
```

### Week Starting Monday

```html
<snice-calendar first-day-of-week="1"></snice-calendar>
```

### French Locale

```html
<snice-calendar locale="fr-FR"></snice-calendar>
```

### With Week Numbers

```html
<snice-calendar show-week-numbers></snice-calendar>
```

### Programmatic Navigation

```javascript
// Go to today
calendar.goToToday();

// Go to specific date
calendar.goToDate(new Date(2024, 11, 25));

// Navigate months
calendar.previousMonth();
calendar.nextMonth();
```

### Event Handling

```javascript
// Date selection
calendar.addEventListener('calendar-change', (e) => {
  console.log('Date selected:', e.detail.value);
  updateBookingForm(e.detail.value);
});

// Event clicks
calendar.addEventListener('calendar-event-click', (e) => {
  showEventDetails(e.detail.event);
});
```

### Booking System

```javascript
const calendar = document.querySelector('snice-calendar');

// Load bookings
const bookings = await fetchBookings();
calendar.events = bookings.map(b => ({
  id: b.id,
  title: b.customerName,
  start: b.date,
  color: b.confirmed ? '#4caf50' : '#ff9800'
}));

// Disable fully booked dates
const fullyBooked = await getFullyBookedDates();
calendar.disabledDates = fullyBooked;

// Handle new booking
calendar.addEventListener('calendar-change', (e) => {
  if (hasAvailability(e.detail.value)) {
    showBookingForm(e.detail.value);
  }
});
```

### Holiday Calendar

```javascript
calendar.events = [
  { id: 1, title: 'New Year', start: '2024-01-01', color: '#f44336' },
  { id: 2, title: 'Independence Day', start: '2024-07-04', color: '#2196f3' },
  { id: 3, title: 'Thanksgiving', start: '2024-11-28', color: '#ff9800' },
  { id: 4, title: 'Christmas', start: '2024-12-25', color: '#4caf50' }
];
```

### Meeting Scheduler

```javascript
const calendar = document.querySelector('snice-calendar');

// Show team meetings
calendar.events = teamMeetings.map(m => ({
  id: m.id,
  title: m.title,
  start: m.startTime,
  end: m.endTime,
  color: m.recurring ? '#9c27b0' : '#2196f3',
  data: m
}));

// Click to see meeting details
calendar.addEventListener('calendar-event-click', (e) => {
  const meeting = e.detail.event;
  showModal({
    title: meeting.title,
    attendees: meeting.data.attendees,
    location: meeting.data.location
  });
});
```

### Availability Checker

```javascript
// Mark unavailable dates
calendar.disabledDates = unavailableDates;

// Set date range
const today = new Date();
calendar.minDate = today;
calendar.maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);

// Handle selection
calendar.addEventListener('calendar-change', (e) => {
  checkAvailability(e.detail.value).then(slots => {
    if (slots.length > 0) {
      showTimeSlots(slots);
    } else {
      alert('No availability on this date');
    }
  });
});
```

### Multi-Event Days

```javascript
// Multiple events per day
calendar.events = [
  { id: 1, title: 'Morning Standup', start: '2024-06-15 09:00', color: '#2196f3' },
  { id: 2, title: 'Client Meeting', start: '2024-06-15 14:00', color: '#4caf50' },
  { id: 3, title: 'Team Sync', start: '2024-06-15 16:00', color: '#ff9800' }
];

// Get all events for a date
const date = new Date(2024, 5, 15);
const dayEvents = calendar.getEventsForDate(date);
console.log(`${dayEvents.length} events on ${date.toLocaleDateString()}`);
```

### Vacation Planner

```javascript
// Show approved vacations
calendar.events = vacations.map(v => ({
  id: v.id,
  title: `${v.employee} - Vacation`,
  start: v.startDate,
  end: v.endDate,
  color: '#9c27b0'
}));

// Block company holidays
calendar.disabledDates = companyHolidays;

// Request new vacation
calendar.addEventListener('calendar-change', (e) => {
  if (canRequestVacation(e.detail.value)) {
    showVacationRequestForm(e.detail.value);
  }
});
```

### Dynamic Event Updates

```javascript
// Add event
function addEvent(event) {
  calendar.events = [...calendar.events, event];
}

// Remove event
function removeEvent(id) {
  calendar.events = calendar.events.filter(e => e.id !== id);
}

// Update event
function updateEvent(id, updates) {
  calendar.events = calendar.events.map(e =>
    e.id === id ? { ...e, ...updates } : e
  );
}
```

## Accessibility

- Keyboard navigation (arrow keys)
- ARIA labels for dates and events
- Screen reader friendly
- Focus management

## Browser Support

- Modern browsers with Custom Elements v1 support
- Date formatting via Intl API
- Touch and mouse support
