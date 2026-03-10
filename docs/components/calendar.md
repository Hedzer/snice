<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/calendar.md -->

# Calendar Component

Display and select dates with event support, date restrictions, and locale-aware formatting.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `Date \| string` | `new Date()` | Selected date |
| `view` | `'month' \| 'week' \| 'day'` | `'month'` | Calendar view |
| `events` | `CalendarEvent[]` | `[]` | Calendar events |
| `minDate` (attr: `min-date`) | `Date \| string` | `''` | Minimum selectable date |
| `maxDate` (attr: `max-date`) | `Date \| string` | `''` | Maximum selectable date |
| `disabledDates` (attr: `disabled-dates`) | `(Date \| string)[]` | `[]` | Disabled dates |
| `highlightToday` (attr: `highlight-today`) | `boolean` | `true` | Highlight today's date |
| `showWeekNumbers` (attr: `show-week-numbers`) | `boolean` | `false` | Show week numbers |
| `firstDayOfWeek` (attr: `first-day-of-week`) | `number` | `0` | First day of week (0=Sun, 1=Mon) |
| `locale` | `string` | `'en-US'` | Locale for formatting |

### CalendarEvent Interface

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

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `goToToday()` | -- | `void` | Navigate to today's date |
| `goToDate()` | `date: Date \| string` | `void` | Navigate to specific date |
| `previousMonth()` | -- | `void` | Navigate to previous month |
| `nextMonth()` | -- | `void` | Navigate to next month |
| `previousWeek()` | -- | `void` | Navigate to previous week |
| `nextWeek()` | -- | `void` | Navigate to next week |
| `previousDay()` | -- | `void` | Navigate to previous day |
| `nextDay()` | -- | `void` | Navigate to next day |
| `getDisplayedMonth()` | -- | `{ month: number; year: number }` | Get currently displayed month |
| `getEventsForDate()` | `date: Date \| string` | `CalendarEvent[]` | Get events for specific date |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `calendar-change` | `{ value: Date, calendar: SniceCalendarElement }` | Fired when selected date changes |
| `calendar-event-click` | `{ event: CalendarEvent, calendar: SniceCalendarElement }` | Fired when an event is clicked |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Description |
|------|-------------|
| `base` | The main calendar container |
| `header` | The header with month title and navigation buttons |
| `grid` | The day cells grid |

```css
snice-calendar::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-calendar::part(header) {
  padding: 1rem;
  font-weight: 600;
}
```

## Basic Usage

```html
<snice-calendar></snice-calendar>
```

```typescript
import 'snice/components/calendar/snice-calendar';

calendar.addEventListener('calendar-change', (e) => {
  console.log('Selected date:', e.detail.value);
});
```

## Examples

### With Events

Use the `events` property to display events on the calendar.

```typescript
calendar.events = [
  { id: 1, title: 'Team Meeting', start: new Date(2024, 5, 15, 10, 0), color: '#2196f3' },
  { id: 2, title: 'Project Deadline', start: new Date(2024, 5, 20), color: '#f44336' }
];
```

### Date Restrictions

Use `min-date` and `max-date` to constrain the selectable date range.

```html
<snice-calendar min-date="2024-01-01" max-date="2024-12-31"></snice-calendar>
```

### Disabled Dates

Use the `disabledDates` property to prevent selection of specific dates.

```javascript
calendar.disabledDates = [
  new Date(2024, 5, 10),
  new Date(2024, 5, 11),
  new Date(2024, 5, 12)
];
```

### Week Starting Monday

Use `first-day-of-week` to change the starting day.

```html
<snice-calendar first-day-of-week="1"></snice-calendar>
```

### Locale

Use the `locale` attribute for locale-aware date formatting.

```html
<snice-calendar locale="fr-FR"></snice-calendar>
```

### With Week Numbers

Set `show-week-numbers` to display ISO week numbers.

```html
<snice-calendar show-week-numbers></snice-calendar>
```

### Programmatic Navigation

Use methods to control navigation from JavaScript.

```javascript
calendar.goToToday();
calendar.goToDate(new Date(2024, 11, 25));
calendar.previousMonth();
calendar.nextMonth();
```

### Event Handling

Listen for date selection and event clicks.

```javascript
calendar.addEventListener('calendar-change', (e) => {
  console.log('Date selected:', e.detail.value);
});

calendar.addEventListener('calendar-event-click', (e) => {
  showEventDetails(e.detail.event);
});
```

### Booking System

Combine events, disabled dates, and event handling for a booking workflow.

```typescript
const bookings = await fetchBookings();
calendar.events = bookings.map(b => ({
  id: b.id,
  title: b.customerName,
  start: b.date,
  color: b.confirmed ? '#4caf50' : '#ff9800'
}));

calendar.disabledDates = await getFullyBookedDates();

calendar.addEventListener('calendar-change', (e) => {
  if (hasAvailability(e.detail.value)) {
    showBookingForm(e.detail.value);
  }
});
```

### Multi-Event Days

Use `getEventsForDate()` to query events for a specific date.

```javascript
calendar.events = [
  { id: 1, title: 'Morning Standup', start: '2024-06-15 09:00', color: '#2196f3' },
  { id: 2, title: 'Client Meeting', start: '2024-06-15 14:00', color: '#4caf50' },
  { id: 3, title: 'Team Sync', start: '2024-06-15 16:00', color: '#ff9800' }
];

const dayEvents = calendar.getEventsForDate(new Date(2024, 5, 15));
console.log(`${dayEvents.length} events on this date`);
```

## Keyboard Navigation

- Arrow keys to navigate between dates
- Enter to select a date
- Tab to move between controls

## Accessibility

- Keyboard navigation with arrow keys
- ARIA labels for dates and events
- Screen reader friendly
- Focus management
