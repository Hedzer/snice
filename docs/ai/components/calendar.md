# snice-calendar

Calendar with date selection and event support.

## Properties

```typescript
value: Date | string = new Date();
view: 'month'|'week'|'day' = 'month';
events: CalendarEvent[] = [];
minDate: Date | string = '';           // attribute: min-date
maxDate: Date | string = '';           // attribute: max-date
disabledDates: (Date | string)[] = []; // attribute: disabled-dates
highlightToday: boolean = true;        // attribute: highlight-today
showWeekNumbers: boolean = false;      // attribute: show-week-numbers
firstDayOfWeek: number = 0;            // attribute: first-day-of-week (0=Sun, 1=Mon)
locale: string = 'en-US';
```

## Methods

- `goToToday()` - Navigate to today
- `goToDate(date: Date | string)` - Navigate to specific date
- `previousMonth()` / `nextMonth()` - Navigate months
- `previousWeek()` / `nextWeek()` - Navigate weeks
- `previousDay()` / `nextDay()` - Navigate days
- `getDisplayedMonth()` - Returns `{ month: number; year: number }`
- `getEventsForDate(date: Date | string)` - Returns `CalendarEvent[]`

## Events

- `calendar-change` -> `{ value: Date, calendar: SniceCalendarElement }`
- `calendar-event-click` -> `{ event: CalendarEvent, calendar: SniceCalendarElement }`

## CSS Parts

- `base` - Main calendar container
- `header` - Header with title and navigation buttons
- `grid` - Day cells grid

## Basic Usage

```html
<snice-calendar></snice-calendar>
```

```typescript
import 'snice/components/calendar/snice-calendar';

calendar.events = [
  { id: 1, title: 'Meeting', start: new Date(), color: '#2196f3' }
];

calendar.addEventListener('calendar-change', (e) => {
  console.log('Selected:', e.detail.value);
});
```

## Keyboard Navigation

- Arrow keys: navigate dates
- Enter: select date
- Tab: move between controls

## Accessibility

- Keyboard navigation with arrow keys
- ARIA labels for dates and events
- Screen reader friendly
- Focus management
