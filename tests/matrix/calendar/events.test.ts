/**
 * snice-calendar matrix — events: the lookup, the stripes, and the overflow
 * chip.
 *
 * Two crosses:
 *   · `getEventsForDate` — event shape (5) x probe day (6) = 30 combos. The doc
 *     defines a single-day event as `{ start }` and a ranged one as
 *     `{ start, end }`, and `start`/`end` are `Date | string`, so both forms of
 *     both ends are crossed against a probe on either side of the range, on
 *     each boundary, and inside it.
 *   · the stripes — event set (4) x `show-week-numbers` (2) = 8 combos, each
 *     asserting the documented stripe model: "Ranged events render as
 *     continuous stripes: one bar per week row, chopped at week boundaries
 *     (squared corners on the continuing side, title repeats). Concurrent
 *     events stack into lanes (start asc, longer first on ties)."
 *
 * SIMULATION BOUNDARY. The doc's lane budget is derived from a measured cell
 * height, and names its own headless fallback: "No layout to measure (headless
 * DOM, `display: none`, detached) -> falls back to 3 lanes." That fallback is
 * what this tier asserts against; the measured budget is the visual tier's.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, PINNED, Problems, captureEvents, click, day, eventBars, isoDay, dayCells,
  mountCalendar, monthWindow, part, parts, text, wait, SETTLE, type Vector,
} from './calendar-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const vector = { ...DEFAULTS } as Vector;

/** The documented headless fallback: "falls back to 3 lanes". */
const HEADLESS_LANES = 3;

// ── getEventsForDate ────────────────────────────────────────────────────────

const asString = (date: Date) => `${isoDay(date)}T09:00:00`;

interface Shape {
  name: string;
  event: Record<string, unknown>;
  /** The days the documented definition says this event covers. */
  covers: (date: Date) => boolean;
}

const START = day(2026, 5, 10);
const END = day(2026, 5, 14);

const SHAPES: Shape[] = [
  {
    name: 'single/Date',
    event: { id: 's1', title: 'Standup', start: START },
    covers: date => isoDay(date) === isoDay(START),
  },
  {
    name: 'single/string',
    event: { id: 's2', title: 'Standup', start: asString(START) },
    covers: date => isoDay(date) === isoDay(START),
  },
  {
    name: 'ranged/Date+Date',
    event: { id: 'r1', title: 'Conf', start: START, end: END },
    covers: date => date >= START && date <= END,
  },
  {
    name: 'ranged/string+string',
    event: { id: 'r2', title: 'Conf', start: asString(START), end: asString(END) },
    covers: date => date >= START && date <= END,
  },
  {
    name: 'ranged/Date+string',
    event: { id: 'r3', title: 'Conf', start: START, end: asString(END) },
    covers: date => date >= START && date <= END,
  },
];

const PROBES = [
  day(2026, 5, 9),   // the day before it starts
  START,             // the first day
  day(2026, 5, 12),  // the middle
  END,               // the last day
  day(2026, 5, 15),  // the day after it ends
  day(2026, 6, 1),   // a different month entirely
];

/**
 * MATRIX-calendar-2
 *
 * Combo:    a ranged event `{ start: 2026-06-10, end: 2026-06-14 }`, then
 *           `getEventsForDate()` for the LAST day of the range with any
 *           time-of-day on it — `'2026-06-14T15:30:00'`, or the equivalent
 *           `Date`. Any `start`/`end` form, any probe form.
 * Expected: `[the event]`. `getEventsForDate(date: Date | string)` is
 *           documented as a per-DAY lookup returning `CalendarEvent[]`, and
 *           both documented argument types carry a time of day — a `Date` always
 *           does, and the doc's own event example uses `new Date()`. June 14 is
 *           inside `2026-06-04..2026-06-10`-style ranges the doc describes as
 *           "ranged", so the last day of a range is a day the event covers.
 * Actual:   `[]`. The lookup normalizes the event's `start` and `end` to local
 *           midnight but compares them against the probe's RAW timestamp, so
 *           any probe later than 00:00:00 on the final day sorts after the
 *           range's end. A multi-day event is therefore missing from its own
 *           last day for all but one instant of it — including for the natural
 *           call `calendar.getEventsForDate(new Date())` on the day a
 *           conference ends. Single-day events are unaffected: they take a
 *           separate same-day path that compares calendar days rather than
 *           timestamps, so the two documented event shapes disagree about what
 *           "on this date" means.
 */
const missesLastDay = (shape: Shape, probe: Date, form: 'Date' | 'string') =>
  shape.name.startsWith('ranged/') && isoDay(probe) === isoDay(END)
  // The `Date` probes below are local midnight, the one instant the comparison
  // still admits; the `string` probes carry 15:30.
  && form === 'string';

describe('calendar matrix: getEventsForDate', () => {
  for (const combo of cross({ shape: SHAPES, probe: PROBES, form: ['Date', 'string'] as const })) {
    const shape = combo.shape as Shape;
    const probe = combo.probe as Date;
    const form = combo.form as 'Date' | 'string';
    const finding = missesLastDay(shape, probe, form);
    const id = `${finding ? 'MATRIX-calendar-2: ' : ''}${shape.name}/probe=${isoDay(probe)}/as=${form}`;

    (finding ? it.fails : it)(id, async () => {
      el = await mountCalendar(vector, { events: [shape.event] });
      const problems = new Problems();

      const found = (el as any).getEventsForDate(
        form === 'Date' ? probe : `${isoDay(probe)}T15:30:00`,
      ) as Array<{ id: string }>;

      problems.equal(found.map(e => e.id), shape.covers(probe) ? [shape.event.id] : [],
        `getEventsForDate(${isoDay(probe)})`);

      expectClean(problems, id);
    });
  }

  // The same defect through the other documented argument type: a `Date` is
  // never "just a day", and `new Date()` is the doc's own idiom.
  it.fails('MATRIX-calendar-2: a Date carrying a time still finds the range\'s last day', async () => {
    el = await mountCalendar(vector, {
      events: [{ id: 'r', title: 'Conf', start: START, end: END }],
    });
    const midAfternoon = new Date(END.getFullYear(), END.getMonth(), END.getDate(), 15, 30);
    expect(((el as any).getEventsForDate(midAfternoon) as Array<{ id: string }>).map(e => e.id))
      .toEqual(['r']);
  });

  it('every other day of a range is found whatever time the probe carries', async () => {
    el = await mountCalendar(vector, {
      events: [{ id: 'r', title: 'Conf', start: START, end: END }],
    });
    const problems = new Problems();
    for (let d = 10; d < 14; d++) {
      const probe = new Date(2026, 5, d, 15, 30);
      problems.equal(
        ((el as any).getEventsForDate(probe) as Array<{ id: string }>).map(e => e.id), ['r'],
        `getEventsForDate(2026-06-${d} 15:30)`);
    }
    expectClean(problems, 'mid-range-with-time');
  });

  it('an empty calendar finds nothing on any day', async () => {
    el = await mountCalendar(vector);
    const problems = new Problems();
    for (const probe of PROBES) {
      problems.equal((el as any).getEventsForDate(probe), [], `getEventsForDate(${isoDay(probe)})`);
    }
    expectClean(problems, 'no-events');
  });

  it('every event covering a day is returned, in the order they were given', async () => {
    const events = SHAPES.map(shape => shape.event);
    el = await mountCalendar(vector, { events });
    const problems = new Problems();

    const covering = SHAPES.filter(shape => shape.covers(day(2026, 5, 12))).map(s => s.event.id);
    problems.equal(
      ((el as any).getEventsForDate(day(2026, 5, 12)) as Array<{ id: string }>).map(e => e.id),
      covering, 'getEventsForDate on a day four events cover');

    expectClean(problems, 'multiple');
  });
});

// ── The stripes ─────────────────────────────────────────────────────────────

/** Bars for one event id, in document order. */
const barsFor = (host: HTMLElement, id: string) =>
  eventBars(host).filter(bar => bar.getAttribute('data-event-id') === id);

/** `grid-column: a / b` — the half-open column range a bar occupies. */
const columnsOf = (bar: HTMLElement) =>
  bar.style.gridColumn.split('/').map(piece => Number(piece.trim()));

interface EventSet {
  name: string;
  events: Array<Record<string, unknown>>;
  /** Bars per event id, derived from the documented one-bar-per-week-row rule. */
  expected: Record<string, number>;
}

const SETS: EventSet[] = [
  {
    name: 'single-day',
    events: [{ id: 'a', title: 'Standup', start: day(2026, 5, 10), color: '#2196f3' }],
    expected: { a: 1 },
  },
  {
    name: 'within-one-week',
    // Wed 10th to Fri 12th of June 2026, all inside one Sunday-start week row.
    events: [{ id: 'b', title: 'Sprint', start: day(2026, 5, 10), end: day(2026, 5, 12) }],
    expected: { b: 1 },
  },
  {
    name: 'across-two-weeks',
    // Thu 11th to Tue 16th — chopped at the Saturday/Sunday week boundary.
    events: [{ id: 'c', title: 'Conf', start: day(2026, 5, 11), end: day(2026, 5, 16) }],
    expected: { c: 2 },
  },
  {
    name: 'across-three-weeks',
    events: [{ id: 'd', title: 'Roadshow', start: day(2026, 5, 3), end: day(2026, 5, 20) }],
    expected: { d: 3 },
  },
];

describe('calendar matrix: event stripes', () => {
  for (const combo of cross({ set: SETS, showWeekNumbers: [false, true] })) {
    const set = combo.set as EventSet;
    const v = { ...vector, showWeekNumbers: combo.showWeekNumbers } as Vector;
    const id = `${set.name}/week-numbers=${combo.showWeekNumbers}`;

    it(id, async () => {
      el = await mountCalendar(v, { events: set.events });
      const problems = new Problems();
      const window = monthWindow(PINNED, v.firstDayOfWeek);
      // Documented: "adds a LEADING week-number column", so every explicitly
      // placed grid child — the stripes included — moves one column right.
      const offset = v.showWeekNumbers ? 1 : 0;

      for (const [eventId, wantBars] of Object.entries(set.expected)) {
        const bars = barsFor(el, eventId);
        if (!problems.equal(bars.length, wantBars, `bars for event ${eventId}`)) continue;

        const source = set.events.find(e => e.id === eventId)!;
        const start = source.start as Date;
        const end = (source.end as Date | undefined) ?? start;

        // One bar per week row, each chopped to that row, and the segments put
        // back together must be exactly the documented date range.
        const covered: string[] = [];
        bars.forEach((bar, i) => {
          const [from, to] = columnsOf(bar);
          const row = Number(bar.style.gridRow);
          problems.check(Number.isFinite(row) && row >= 2,
            `bar ${i} of ${eventId} is not on a week row (grid-row ${bar.style.gridRow})`);
          const week = row - 2;
          for (let col = from; col < to; col++) {
            covered.push(isoDay(window[week * 7 + (col - 1 - offset)]));
          }
          // "squared corners on the continuing side": the first segment of a
          // multi-row stripe continues right, the last continues left, and the
          // middle ones do both.
          problems.equal(bar.classList.contains('calendar__event-bar--continues-left'), i > 0,
            `bar ${i} of ${eventId} continues-left`);
          problems.equal(bar.classList.contains('calendar__event-bar--continues-right'),
            i < bars.length - 1, `bar ${i} of ${eventId} continues-right`);
          // "title repeats" — every segment carries the event's title.
          problems.check(text(bar).includes(source.title as string),
            `bar ${i} of ${eventId} does not repeat the title`);
          // `part="event-bar"`, plus any className the event asked for.
          problems.equal(bar.getAttribute('part'), 'event-bar', `bar ${i} of ${eventId} part`);
        });

        const wantDays: string[] = [];
        for (let d = new Date(start); d <= end; d = day(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
          wantDays.push(isoDay(d));
        }
        problems.equal(covered, wantDays, `days covered by event ${eventId}`);

        if (source.color) {
          problems.check(bars.every(bar => !!bar.style.background),
            `event ${eventId} declares a color that never reached the bar`);
        }
      }

      expectClean(problems, id);
    });
  }

  it('className rides along on the part attribute, so ::part() can reach one event', async () => {
    el = await mountCalendar(vector, {
      events: [{ id: 'x', title: 'Deploy', start: day(2026, 5, 10), className: 'urgent flagged' }],
    });
    const problems = new Problems();
    const bar = barsFor(el, 'x')[0];

    problems.equal(bar?.getAttribute('part'), 'event-bar urgent flagged', 'bar part list');
    problems.check(bar?.classList.contains('urgent') && bar?.classList.contains('flagged'),
      'className did not reach the bar class list');
    problems.equal(parts(el, 'urgent').length, 1, 'elements exposing ::part(urgent)');

    expectClean(problems, 'className');
  });

  it('concurrent events stack: start ascending, longer first on ties', async () => {
    // Documented: "Concurrent events stack into lanes (start asc, longer first
    // on ties)." Three events on the same Wednesday, declared out of order.
    el = await mountCalendar(vector, {
      events: [
        { id: 'short', title: 'Short', start: day(2026, 5, 10) },
        { id: 'long', title: 'Long', start: day(2026, 5, 10), end: day(2026, 5, 12) },
        { id: 'early', title: 'Early', start: day(2026, 5, 9), end: day(2026, 5, 11) },
      ],
    });
    const problems = new Problems();

    const lane = (id: string) => Number(barsFor(el!, id)[0]?.getAttribute('data-lane'));
    problems.equal(lane('early'), 0, 'the earliest start takes lane 0');
    problems.equal(lane('long'), 1, 'the longer of the two same-day events takes the next lane');
    problems.equal(lane('short'), 2, 'the shorter same-day event stacks last');

    expectClean(problems, 'lanes');
  });

  it('clicking a bar fires calendar-event-click and never selects the day', async () => {
    const event = { id: 'a', title: 'Standup', start: day(2026, 5, 10) };
    el = await mountCalendar(vector, { events: [event] });
    const clicks = captureEvents<{ event: { id: string }; calendar: HTMLElement }>(
      el, 'calendar-event-click');
    const changes = captureEvents(el, 'calendar-change');
    const problems = new Problems();

    click(barsFor(el, 'a')[0]);
    await wait(SETTLE);

    if (problems.equal(clicks.length, 1, 'calendar-event-click events')) {
      problems.equal(clicks[0].event.id, 'a', 'calendar-event-click detail.event');
      problems.check(clicks[0].calendar === el, 'calendar-event-click detail.calendar');
    }
    // The bar's click is the bar's — it does not fall through to day selection.
    problems.equal(changes.length, 0, 'a bar click also fired calendar-change');
    problems.equal((el as any).value, null, 'a bar click also selected the day');

    expectClean(problems, 'bar-click');
  });
});

// ── The "+N more" chip ──────────────────────────────────────────────────────

describe('calendar matrix: the "+N more" chip', () => {
  /** `n` single-day events, all on the same day, so they stack `n` deep. */
  const stack = (n: number) => Array.from({ length: n }, (_, i) => ({
    id: `e${i}`, title: `Event ${i}`, start: day(2026, 5, 10), color: '#2196f3',
  }));

  for (const depth of [1, 2, 3, 4, 7]) {
    it(`${depth} concurrent events`, async () => {
      el = await mountCalendar(vector, { events: stack(depth) });
      const problems = new Problems();

      const visible = Math.min(depth, HEADLESS_LANES);
      const hidden = depth - visible;

      problems.equal(eventBars(el).length, visible,
        `visible bars against the documented headless budget of ${HEADLESS_LANES} lanes`);

      const chip = part(el, 'more-chip');
      if (hidden === 0) {
        problems.check(!chip, 'a chip appeared with nothing hidden behind it');
      } else if (problems.check(!!chip, `${hidden} events hidden but no "+N more" chip`)) {
        problems.equal(text(chip), `+${hidden} more`, 'chip text');
        problems.equal(chip!.getAttribute('role'), 'button', 'chip role');
        problems.equal(chip!.getAttribute('tabindex'), '0', 'chip tabindex');
        problems.check(!!chip!.getAttribute('aria-label'), 'chip has no aria-label');
      }

      expectClean(problems, `depth=${depth}`);
    });
  }

  it('the chip reports its day and count, and never selects the day', async () => {
    el = await mountCalendar(vector, { events: stack(6) });
    const more = captureEvents<{ date: Date; count: number; calendar: HTMLElement }>(
      el, 'calendar-more-click');
    const changes = captureEvents(el, 'calendar-change');
    const problems = new Problems();

    click(part(el, 'more-chip'));
    await wait(SETTLE);

    if (problems.equal(more.length, 1, 'calendar-more-click events')) {
      problems.equal(isoDay(more[0].date), isoDay(day(2026, 5, 10)), 'detail.date');
      problems.equal(more[0].count, 6 - HEADLESS_LANES, 'detail.count');
      problems.check(more[0].calendar === el, 'detail.calendar');
    }
    // Documented: the chip "does NOT fire calendar-change" and "the click never
    // falls through to day selection".
    problems.equal(changes.length, 0, 'the chip fired calendar-change');
    problems.equal((el as any).value, null, 'the chip selected the day');

    expectClean(problems, 'chip-click');
  });

  it('preventDefault() on calendar-more-click suppresses the built-in panel', async () => {
    el = await mountCalendar(vector, { events: stack(6) });
    const problems = new Problems();
    el.addEventListener('calendar-more-click', (event) => event.preventDefault());

    click(part(el, 'more-chip'));
    await wait(SETTLE);

    const panel = part(el, 'event-popover');
    problems.check(!panel || (panel as HTMLElement).hidden,
      'the built-in day panel opened despite preventDefault()');

    expectClean(problems, 'chip-prevented');
  });

  it('the built-in panel lists the hidden events when nobody cancels', async () => {
    el = await mountCalendar(vector, { events: stack(6) });
    const problems = new Problems();

    click(part(el, 'more-chip'));
    await wait(SETTLE);

    const panel = part(el, 'event-popover') as HTMLElement | null;
    if (problems.check(!!panel && !panel.hidden, 'the built-in day panel did not open')) {
      problems.equal(panel!.getAttribute('role'), 'dialog', 'panel role');
      problems.check(!!part(el, 'more-panel-date'), 'no [part="more-panel-date"] heading');
      const list = part(el, 'more-list');
      problems.equal(list?.getAttribute('role'), 'list', 'more-list role');
      problems.equal(parts(el, 'more-item').length, 6 - HEADLESS_LANES,
        'one more-item per hidden event');
      problems.equal(parts(el, 'more-dot').length, 6 - HEADLESS_LANES,
        'one colour dot per hidden event');
    }

    expectClean(problems, 'chip-panel');
  });

  it('an event outside the displayed grid draws nothing', async () => {
    el = await mountCalendar(vector, {
      events: [{ id: 'far', title: 'Far', start: day(2027, 0, 5) }],
    });
    const problems = new Problems();
    problems.equal(eventBars(el).length, 0, 'bars for an event in another year');
    problems.equal(dayCells(el).filter(c => c.querySelector('.calendar__more')).length, 0,
      'chips for an event in another year');
    expectClean(problems, 'off-grid');
  });
});
