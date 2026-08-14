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
| `disabledDates` | `(Date \| string)[]` | `[]` | Disabled dates (JS-only; no attribute) |
| `highlightToday` (attr: `highlight-today`) | `boolean` | `true` | Highlight today's date |
| `noDaySelect` (attr: `no-day-select`) | `boolean` | `false` | Display-only mode: day clicks neither select/highlight nor fire `calendar-change`; event bars stay interactive |
| `cellSizing` (attr: `cell-sizing`) | `'square' \| 'stretch'` | `'square'` | `square` keeps day cells as tall as the column is wide; `stretch` lets rows collapse to their content and event-lane reservation |
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
  color?: string;      // bar background
  className?: string;  // extra class(es) on the bars, also exposed as ::part names
  avatar?: string | CalendarEventAvatar; // string is shorthand for { src }
  tooltip?: string;    // static tooltip text for the bars
  popover?: boolean | string | Node | (() => Node); // click-to-open details card (see Event Popovers)
  data?: any;
}

interface CalendarEventAvatar {
  src?: string;   // image URL
  name?: string;  // initials fallback (rendered with <snice-avatar>)
  alt?: string;
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
| `calendar-more-click` | `{ date: Date, count: number, calendar: SniceCalendarElement }` | Fired when a day's `+N more` chip is clicked (or activated with Enter/Space). The day is not selected and `calendar-change` does not fire |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Description |
|------|-------------|
| `base` | The main calendar container |
| `header` | The header with month title and navigation buttons |
| `grid` | The day cells grid |
| `more-chip` | A day's `+N more` overflow chip |
| `event-bar` | An event stripe (plus any `className` you set on the event) |
| `event-avatar` | The `<snice-avatar>` rendered at the start of an event bar |
| `event-tooltip` | The shared tooltip overlay shown on event hover |
| `event-popover` | The popover opened by a `popover`-enabled event |

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
  { id: 2, title: 'Project Deadline', start: new Date(2024, 5, 20), color: '#f44336' },
  { id: 3, title: 'Conference', start: new Date(2024, 5, 18), end: new Date(2024, 5, 24), color: '#16a34a' }
];
```

Events render as continuous stripes, the way professional calendars draw them:
an event with an `end` date spans all of its days as one bar per week row,
chopped at week boundaries with squared corners so consecutive rows read as a
single bar (the title repeats on each row). Concurrent events stack into
lanes — earlier start first, longer event first on ties. Up to three lanes are
shown; days with deeper stacks get a `+N more` chip. Each bar exposes a
`part="event-bar"` for styling and dispatches `calendar-event-click` when
clicked.

The `+N more` chip is a control of its own: it exposes `part="more-chip"`, is
keyboard-reachable (`role="button"`, Enter/Space), and dispatches
`calendar-more-click` with the day it belongs to and how many events are
hidden there. Its click never falls through to day selection, so opening a
day view does not change the selected date:

```typescript
calendar.addEventListener('calendar-more-click', (e) => {
  // e.detail.date  -> the day whose events overflowed
  // e.detail.count -> how many events are hidden on that day
  showDayAgenda(e.detail.date, calendar.getEventsForDate(e.detail.date));
});
```

```css
snice-calendar::part(more-chip) { color: #2563eb; }
```

Bars are styleable per event: `color` sets the background, `avatar` renders a
small `<snice-avatar>` at the start of each bar (`part="event-avatar"`) — an
image when `src` is given, initials from `name` otherwise — and `className` is
added to the bar's classes **and** its part list, so a specific kind of event
can be themed from outside the component:

```css
snice-calendar::part(event-bar) { font-weight: 500; }
snice-calendar::part(urgent) { background: crimson; }
```

```typescript
calendar.events = [
  { id: 1, title: 'Incident review', start: '2024-06-18', className: 'urgent',
    avatar: { src: '/avatars/sre-lead.png', name: 'Robin Kim' } }
];
```

### Event Tooltips

A per-event `tooltip` string shows on hover. For rich or lazily-loaded
content, set the `eventTooltip` provider on the calendar — it runs when the
pointer enters a bar and may return text, a DOM node, or a promise of either;
results that resolve after the pointer left are discarded. The provider wins
over `event.tooltip`. The overlay exposes `part="event-tooltip"`.

```typescript
calendar.eventTooltip = async (event) => {
  const details = await fetchEventDetails(event.id);
  const node = document.createElement('div');
  node.innerHTML = `<strong>${event.title}</strong><p>${details.attendees} attendees</p>`;
  return node;
};
```

### Event Popovers

Tooltips are for glancing; popovers are for interacting. An event that sets
`popover` opens a click-anchored details card (`role="dialog"`,
`part="event-popover"`) that holds focus, and closes on Escape (focus returns
to the bar) or an outside click. `calendar-event-click` still dispatches.
Popovers are **strictly per-event opt-in** — events without `popover` never
open a card and never issue a request.

Content resolves in this order:

1. **Inline** — `popover` is a string, a Node, or a Node factory.
2. **Provider** — `popover: true` and the element's `eventPopover` callback:
   `(event) => string | Node | Promise<string | Node>`. A loading state shows
   while a promise is pending; results arriving after close are discarded.
3. **Request channel** — `popover: true` with no provider issues
   `@request('calendar/event-popover')` with `{ event }`; any
   `@respond('calendar/event-popover')` controller can return the content.
   With no responder either, the card closes and a dev warning is logged.

```typescript
// Inline
calendar.events = [
  { id: 1, title: 'Standup', start: '2024-06-18', popover: 'Room 4, 10:00' }
];

// Lazy provider
calendar.events = [{ id: 2, title: 'Conf', start: '2024-06-20', popover: true }];
calendar.eventPopover = async (event) => detailsCard(await fetchEvent(event.id));

// Request channel — the calendar stays generic, a controller owns the data
@controller('agenda-controller')
class AgendaController implements IController {
  element: HTMLElement | null = null;
  private ctx!: Context;
  async attach() {}
  async detach() {}

  @context()
  receiveContext(ctx: Context) { this.ctx = ctx; }

  @respond('calendar/event-popover')
  async details({ event }: { event: CalendarEvent }) {
    const data = await this.ctx.fetch(`/api/events/${event.id}`).then(r => r.json());
    return renderDetailsCard(data);
  }
}
```

Bars with a popover are keyboard-operable (`role="button"`, `tabindex="0"`,
Enter/Space opens). Close programmatically with
`calendar.closeEventPopover()`.

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
