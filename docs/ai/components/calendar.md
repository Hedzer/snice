# snice-calendar

Calendar with date selection and event support.

## Properties

```typescript
value: Date | string = new Date();
view: 'month'|'week'|'day' = 'month';
events: CalendarEvent[] = [];
minDate: Date | string = '';           // attribute: min-date
maxDate: Date | string = '';           // attribute: max-date
disabledDates: (Date | string)[] = []; // JS-only; no attribute
highlightToday: boolean = true;        // attribute: highlight-today
showWeekNumbers: boolean = false;      // attribute: show-week-numbers
firstDayOfWeek: number = 0;            // attribute: first-day-of-week (0=Sun, 1=Mon)
locale: string = 'en-US';
noDaySelect: boolean = false;          // attribute: no-day-select — display-only: day clicks don't select/highlight or fire calendar-change; event bars stay interactive
cellSizing: 'square'|'stretch' = 'square'; // attribute: cell-sizing — square: cells as tall as the column is wide; stretch: rows collapse to content + event-lane reservation
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
  { id: 1, title: 'Meeting', start: new Date(), color: '#2196f3' },
  { id: 2, title: 'Conf', start: '2026-06-04', end: '2026-06-10' } // ranged
];
// Ranged events render as continuous stripes: one bar per week row, chopped
// at week boundaries (squared corners on the continuing side, title repeats).
// Concurrent events stack into lanes (start asc, longer first on ties);
// max 3 lanes, deeper stacks collapse to a per-day "+N more" chip.
// Bars: part="event-bar", click -> calendar-event-click.
// Styling: color -> background; avatar?: string | {src?,name?,alt?} ->
// <snice-avatar> on each bar (part="event-avatar"; name -> initials fallback);
// className?: string -> added to bar classes AND part list, so
// ::part(<className>) themes specific events from outside.
// Tooltips: event.tooltip?: string (static), or on the element:
//   eventTooltip: (event) => string | Node | Promise<string | Node>  // lazy/rich; wins over event.tooltip
// Stale async results discarded on pointer-leave. Overlay part="event-tooltip".
// Popovers (click-to-open, interactive; STRICT per-event opt-in):
//   event.popover?: boolean | string | Node | (() => Node)
//   Resolution: inline content -> element eventPopover(event) => string|Node|Promise
//   -> @request('calendar/event-popover') {event} (answer with @respond) -> warn+close.
//   role="dialog" part="event-popover"; Escape/outside-click dismiss, focus returns
//   to bar; loading state while pending; stale results discarded.
//   Bars with popover: role="button" tabindex=0, Enter/Space opens.
//   calendar-event-click still fires. closeEventPopover() closes programmatically.

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
