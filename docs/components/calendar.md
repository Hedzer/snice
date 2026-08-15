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
| `value` | `Date \| string \| null` | `null` | Selected date. `null` means nothing is selected — a fresh calendar marks today via `highlightToday`, it does not select it |
| `view` | `'month' \| 'week' \| 'day'` | `'month'` | Calendar view |
| `events` | `CalendarEvent[]` | `[]` | Calendar events |
| `minDate` (attr: `min-date`) | `Date \| string` | `''` | Minimum selectable date |
| `maxDate` (attr: `max-date`) | `Date \| string` | `''` | Maximum selectable date |
| `disabledDates` | `(Date \| string)[]` | `[]` | Disabled dates (JS-only; no attribute) |
| `highlightToday` (attr: `highlight-today`) | `boolean` | `true` | Highlight today's date |
| `noDaySelect` (attr: `no-day-select`) | `boolean` | `false` | Display-only mode: day clicks neither select/highlight nor fire `calendar-change`; event bars stay interactive |
| `cellSizing` (attr: `cell-sizing`) | `'square' \| 'stretch'` | `'square'` | `square` keeps day cells as tall as the column is wide; `stretch` lets rows collapse to their content. Either way the cell's height is what sets how many event lanes are visible — see [Event lanes and the `+N more` chip](#event-lanes-and-the-n-more-chip) |
| `showWeekNumbers` (attr: `show-week-numbers`) | `boolean` | `false` | Add a leading week-number column — see [With week numbers](#with-week-numbers) |
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
| `closeEventPopover()` | `options?: { returnFocus?: boolean }` | — | Closes the shared overlay — either an event popover or the `+N more` day panel |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `calendar-change` | `{ value: Date, calendar: SniceCalendarElement }` | Fired when selected date changes |
| `calendar-event-click` | `{ event: CalendarEvent, calendar: SniceCalendarElement }` | Fired when an event is clicked |
| `calendar-more-click` | `{ date: Date, count: number, calendar: SniceCalendarElement }` | Fired when a day's `+N more` chip is clicked (or activated with Enter/Space). The day is not selected and `calendar-change` does not fire. **Cancelable** — calling `preventDefault()` suppresses the [built-in day panel](#the-n-more-chip-and-its-built-in-day-panel) |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Description |
|------|-------------|
| `base` | The main calendar container |
| `header` | The header with month title and navigation buttons |
| `grid` | The day cells grid |
| `more-chip` | A day's `+N more` overflow chip |
| `more-panel-date` | The date heading inside the chip's built-in day panel |
| `more-list` | The list of hidden events inside the chip's built-in day panel |
| `more-item` | One hidden-event entry in that list |
| `more-dot` | The colour dot on a hidden-event entry |
| `week-number` | A week-number cell in the `show-week-numbers` column |
| `week-number-header` | The empty corner cell above the week-number column |
| `event-bar` | An event stripe (plus any `className` you set on the event) |
| `event-avatar` | The `<snice-avatar>` at the start of an event bar (segments ≥ `4.5rem` only) |
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
lanes — earlier start first, longer event first on ties. How many lanes are
visible is derived from the room a day cell has, week by week (see
[Event lanes and the `+N more` chip](#event-lanes-and-the-n-more-chip)); days
with deeper stacks get a `+N more` chip. Each bar exposes a
`part="event-bar"` for styling and dispatches `calendar-event-click` when
clicked.

### Event lanes and the `+N more` chip

There is no fixed lane limit. Each week shows as many 1.375rem lanes as fit in
its day cells, above the 2.125rem day-number strip, keeping 1rem for the
`+N more` chip when the stack runs deeper than the cell; at least one lane is
always drawn. So the visible depth follows whatever gives the cell its height:

- **`cell-sizing="square"` (the default).** The cell is as tall as the column is
  wide (`100cqw / 7`), so a wider calendar shows more lanes. Note the built-in
  `max-width: 37.5rem`: at the widest default calendar a cell is about 5.4rem,
  which affords two lanes (one once the chip claims its strip). Lift the cap
  with `snice-calendar::part(base) { max-width: none }`, or give the calendar a
  height, to go deeper. Narrow calendars therefore show fewer stripes than the
  flat three-lane cap this replaced — give the calendar room if you want more.
- **A height of your own.** Give the calendar a definite height — an inline
  `height`, a CSS rule, or a sized flex/grid parent — and its six week rows
  share the room under the header. A full-page calendar shows seven or eight
  stripes a day instead of collapsing them into a chip:

  ```css
  snice-calendar { height: 100%; }   /* inside a sized layout slot */
  ```

- **`cell-sizing="stretch"` with no height imposed.** Rows collapse to their
  content, so there is no budget to run out of: every lane is drawn and no chip
  appears.

The count is re-derived whenever the calendar's box changes, so resizing the
window or the layout slot is enough — you do not need to re-assign `events`.

A busy week does not grow taller than the rest of the grid as long as its cells
can hold the stack they show: one lane needs 3.5rem, and one lane plus the
`+N more` chip needs 4.5rem. Below that the row still stretches to that floor —
so with the default square sizing, calendars under roughly 500px wide (a cell
under 4.5rem) keep the uneven row the reservation produces. When there is no
layout to measure at all (a headless DOM, a detached or `display: none`
calendar) the calendar falls back to three lanes.

### Sizing inside a constrained host

The month fits its own host box. A host that gives the calendar less height
than the square baseline would like does not clip the bottom weeks:

- **Auto height (the default).** The week rows take the square baseline and a
  busy row grows by its lane reservation; the host ends up as tall as that
  comes to.
- **A definite height with room to spare.** The six rows share the surplus and
  the lane budget grows with them.
- **A height that is too small** — an inline `height`, a `max-height`, an
  `aspect-ratio`, or a sized flex/grid parent — the rows are capped at their
  equal share of the room under the header, so all six weeks stay inside the
  box. The lane budget follows the compressed row: events that no longer fit
  collapse into the `+N more` chip rather than being drawn past the bottom of
  their cell, and a row too short for even one lane shows the chip alone.

Two limits are worth knowing:

- The calendar can only measure **its own** box. An ancestor that clips or
  scrolls while leaving the calendar's own height unconstrained (a fixed-height
  wrapper with `overflow: hidden` around an auto-height calendar, or a flex item
  without `min-height: 0`) is invisible to it — put the constraint on the
  calendar, not around it.
- A week row can never be shorter than its own padding and rules (~17px at the
  default spacing). Below roughly a 200px host the rows have compressed as far
  as they physically can and the grid overflows again rather than stacking one
  week over the next.
- `view="week"` and `view="day"` set their own, much taller row minimums and are
  not capped.

A month grid is a header, a weekday strip and six square-ish week rows, so its
natural box is **taller than it is wide**. `aspect-ratio: 1` on the host is
therefore not a neutral size hint — it asks the grid to give up about a week and
a half of height, and everything the calendar can still show has to be squeezed
into what is left. Constrain the width and let the height follow:

```html
<snice-calendar style="min-width: 360px; max-width: 26rem; width: 100%"></snice-calendar>
```

### The `+N more` chip and its built-in day panel

The `+N more` chip is a control of its own: it exposes `part="more-chip"`, is
keyboard-reachable (`role="button"`, Enter/Space), and dispatches
`calendar-more-click` with the day it belongs to and how many events are
hidden there. Its click never falls through to day selection, so opening a
day view does not change the selected date.

The chip does something useful on its own — no wiring required. Activating it
opens the calendar's shared overlay listing exactly the events that day hid:

- The panel is the same element the event popover uses (`role="dialog"`,
  `part="event-popover"`), so it dismisses on Escape or an outside press,
  takes focus while open, and hands focus back to the chip when it closes.
- Its `aria-label` names the day. Inside are a date heading
  (`part="more-panel-date"`) and a list (`part="more-list"`) of buttons
  (`part="more-item"`), each showing the event's colour dot
  (`part="more-dot"`) and title.
- Clicking an entry fires `calendar-event-click`. If that event carries
  `popover` content the same overlay drills into it; otherwise the panel
  closes.

To replace the default with your own day view, cancel the event:

```typescript
calendar.addEventListener('calendar-more-click', (e) => {
  e.preventDefault();          // the built-in panel does not open
  // e.detail.date  -> the day whose events overflowed
  // e.detail.count -> how many events are hidden on that day
  showDayAgenda(e.detail.date, calendar.getEventsForDate(e.detail.date));
});
```

Leave the event uncancelled and both happen: your listener runs and the panel
still opens.

```css
snice-calendar::part(more-chip) { color: #2563eb; }
snice-calendar::part(more-item) { font-size: 0.9rem; }
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

The title is the payload and the avatar is an adornment, so a bar only carries
the avatar when its segment has room for both. A segment narrower than `4.5rem`
— a single day in a 400px-wide month grid is about 57px — renders the title
alone and halves its inline padding to hand the title every pixel; the bar is
marked `calendar__event-bar--compact` for styling. The measurement is per
segment, so the same event keeps its avatar in a week where it spans several
days, and the decision is re-taken whenever the calendar is resized.

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
over `event.tooltip`. The overlay exposes `part="event-tooltip"`, and paints on
the shared tooltip surface — `--snice-tooltip-bg` / `--snice-tooltip-color`
(the same pair `<snice-tooltip>` uses) restyle it in both themes.

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

### Overlay Placement

Both overlays — the hover tooltip and the click popover — are anchored inside
the calendar's own box (`::part(base)`), not to the viewport. The host declares
`contain: layout style`, which makes it the containing block for any
`position: fixed` descendant, so a viewport-anchored overlay would be offset by
the calendar's own position on the page. They are placed next to their bar
(popover below, tooltip above), flipped to the other side when the viewport
edge is in the way, and clamped to it horizontally.

Layout containment also makes the host a stacking context, so an open overlay
cannot paint above content that follows the calendar on its own. While a
tooltip or popover is showing, the host therefore carries an `overlay-open`
attribute and lifts itself with `z-index: var(--snice-z-floating, 1000)`. The
attribute is set and cleared by the component — treat it as read-only state,
and match on it to restyle the lift:

```css
/* Keep the calendar under a sticky app header while an overlay is open. */
snice-calendar[overlay-open] { z-index: 20; }
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

### With week numbers

Set `show-week-numbers` to add a leading column that numbers each week row.

```html
<snice-calendar show-week-numbers></snice-calendar>
```

The numbering follows the start of the week:

- `first-day-of-week="1"` (Monday) numbers weeks by **ISO-8601** — week 1 is the
  week holding the year's first Thursday, so a January grid can open on week 52
  or 53 of the previous year.
- Any other start of week uses the common civil rule: **the week containing
  January 1 is week 1**, counted from the year the week ends in.

```html
<!-- ISO week numbers, Monday-first -->
<snice-calendar show-week-numbers first-day-of-week="1" locale="de-DE"></snice-calendar>
```

Style the column with `::part(week-number)` and `::part(week-number-header)`, or
resize it with the `--calendar-week-number-width` custom property (default
`2.25rem`).

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
