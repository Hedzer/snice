# snice-calendar

Calendar with date selection and event support.

## Properties

```typescript
value: Date | string | null = null;    // null = nothing selected (initial state); today is marked by highlightToday, not by a selection
view: 'month'|'week'|'day' = 'month';
events: CalendarEvent[] = [];
minDate: Date | string = '';           // attribute: min-date
maxDate: Date | string = '';           // attribute: max-date
disabledDates: (Date | string)[] = []; // JS-only; no attribute
highlightToday: boolean = true;        // attribute: highlight-today
showWeekNumbers: boolean = false;      // attribute: show-week-numbers — adds a leading week-number column (ISO-8601 when firstDayOfWeek=1, otherwise the week containing Jan 1 is week 1)
firstDayOfWeek: number = 0;            // attribute: first-day-of-week (0=Sun, 1=Mon)
locale: string = 'en-US';
noDaySelect: boolean = false;          // attribute: no-day-select — display-only: day clicks don't select/highlight or fire calendar-change; event bars stay interactive
cellSizing: 'square'|'stretch' = 'square'; // attribute: cell-sizing — square: cells as tall as the column is wide; stretch: rows collapse to content (every event lane shown). Sizes the cell, and the cell's height sets the visible event-lane count
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
- `calendar-more-click` -> `{ date: Date, count: number, calendar: SniceCalendarElement }` — "+N more" chip clicked; does NOT fire `calendar-change`

## CSS Parts

- `base` - Main calendar container
- `header` - Header with title and navigation buttons
- `grid` - Day cells grid
- `more-chip` - Per-day "+N more" overflow chip
- `week-number` / `week-number-header` - Week-number column cells (`show-week-numbers`)
- `event-bar` / `event-avatar` / `event-tooltip` / `event-popover` - Event bar internals

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
// Concurrent events stack into lanes (start asc, longer first on ties).
// Visible lanes are DERIVED PER WEEK from the day cell's height (see
// "Event-lane budget"); deeper stacks collapse to a per-day "+N more" chip.
// Chip: part="more-chip", role="button" tabindex=0 (Enter/Space), click ->
// calendar-more-click { date, count }; the click never falls through to day
// selection. Use it to open your own day/agenda view:
//   calendar.addEventListener('calendar-more-click',
//     (e) => showDay(e.detail.date, e.detail.count));
// Bars: part="event-bar", click -> calendar-event-click.
// Styling: color -> background; avatar?: string | {src?,name?,alt?} ->
// <snice-avatar> on each bar (part="event-avatar"; name -> initials fallback);
//   Adornment, not payload: a bar segment narrower than 4.5rem renders the
//   title alone (class calendar__event-bar--compact, tighter padding) — the
//   avatar would leave ~3 characters in a default-width month cell. Measured
//   per segment, so a multi-day span keeps it; re-decided on resize.
// className?: string -> added to bar classes AND part list, so
// ::part(<className>) themes specific events from outside.
// Tooltips: event.tooltip?: string (static), or on the element:
//   eventTooltip: (event) => string | Node | Promise<string | Node>  // lazy/rich; wins over event.tooltip
// Stale async results discarded on pointer-leave. Overlay part="event-tooltip";
//   surface = --snice-tooltip-bg / --snice-tooltip-color (same pair as
//   <snice-tooltip>), so it stays legible in both themes.
// Popovers (click-to-open, interactive; STRICT per-event opt-in):
//   event.popover?: boolean | string | Node | (() => Node)
//   Resolution: inline content -> element eventPopover(event) => string|Node|Promise
//   -> @request('calendar/event-popover') {event} (answer with @respond) -> warn+close.
//   role="dialog" part="event-popover"; Escape/outside-click dismiss, focus returns
//   to bar; loading state while pending; stale results discarded.
//   Bars with popover: role="button" tabindex=0, Enter/Space opens.
//   calendar-event-click still fires. closeEventPopover() closes programmatically.
// Overlay placement (both tooltip and popover): position: absolute inside
//   ::part(base), NOT viewport-fixed — :host has `contain: layout style`, which
//   makes the host the containing block for fixed descendants. Anchored to the
//   bar (popover below / tooltip above), flipped at the viewport edge, clamped
//   horizontally. Containment also makes the host a stacking context, so while
//   an overlay shows the host carries a read-only `overlay-open` attribute and
//   z-index: var(--snice-z-floating, 1000); restyle via
//   snice-calendar[overlay-open] { z-index: ... }.

calendar.addEventListener('calendar-change', (e) => {
  console.log('Selected:', e.detail.value);
});
```

## Event-Lane Budget

Visible lanes per week = how many fit the day cell's height. No flat cap.

```
lanes = max(1, floor((cellHeight - 2.125rem - chip) / 1.375rem))
chip  = 1rem when the stack overflows (the "+N more" strip), else 0
```

Cell height comes from whatever sizes the cell:
- `cell-sizing="square"` (default): `100cqw / 7` — the column width; wider calendar -> taller cells -> more lanes. Capped by the built-in `max-width: 37.5rem` (~5.4rem cell -> 2 lanes, 1 with the chip); lift with `::part(base) { max-width: none }`. Narrow calendars show fewer lanes than the flat 3-lane cap this replaced.
- Definite host height: `snice-calendar { height: 40rem }` (or a sized flex/grid parent) — the six week rows share the room under the header, so the budget grows with it.
- `cell-sizing="stretch"` with no imposed height: no budget — rows collapse to content and every lane is shown, no chip.

Notes:
- Re-derived on resize (`@observe('resize')`) — no need to re-assign `events`.
- Row reservation is a floor, applied only when the cell is shorter than the stack it shows: 3.5rem for one lane, 4.5rem for one lane + chip. Above that all rows stay equal; below it (square cells under ~4.5rem, i.e. calendars under ~500px wide) the busy row still grows.
- No layout to measure (headless DOM, `display: none`, detached) -> falls back to 3 lanes.

```typescript
// Same events, more visible lanes:
calendar.style.height = '40rem';
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
