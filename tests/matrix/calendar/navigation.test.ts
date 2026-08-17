/**
 * snice-calendar matrix — the documented navigation methods.
 *
 * The cross: navigation method (6) x starting date (4) = 24 combos, each
 * asserting where `getDisplayedMonth()` lands AND that the grid really re-drew
 * to that month — a component that moves its internal cursor without redrawing
 * passes a getter-only test and shows the wrong month.
 *
 * Documented:
 *   · `previousMonth()` / `nextMonth()` — "Navigate months"
 *   · `previousWeek()` / `nextWeek()`   — "Navigate weeks"
 *   · `previousDay()` / `nextDay()`     — "Navigate days"
 *   · `goToToday()`                     — "Navigate to today"
 *   · `goToDate(date)`                  — "Navigate to specific date"
 *   · `getDisplayedMonth()`             — `{ month, year }`
 *
 * The starting dates are chosen for the cases month arithmetic gets wrong:
 * the 31st of a month whose neighbour is shorter, the turn of the year, a leap
 * day, and an ordinary mid-month date.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkDayGrid, day, isoDay, mountCalendar, wait, SETTLE,
  type Vector,
} from './calendar-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const vector = { ...DEFAULTS } as Vector;

const DAY_MS = 24 * 60 * 60 * 1000;

const STARTS = [
  day(2026, 5, 15),  // ordinary mid-month
  day(2026, 0, 31),  // the 31st, whose next month has 28 days
  day(2026, 11, 31), // the turn of the year
  day(2028, 1, 29),  // a leap day
];

interface Step {
  name: string;
  run: (calendar: any) => void;
  /** The date the documented step moves the display to. */
  next: (from: Date) => Date;
}

const STEPS: Step[] = [
  {
    name: 'previousMonth',
    run: c => c.previousMonth(),
    // "Navigate months" — one month back. The component's cursor becomes the
    // first of that month, so only the month/year are asserted.
    next: from => day(from.getFullYear(), from.getMonth() - 1, 1),
  },
  {
    name: 'nextMonth',
    run: c => c.nextMonth(),
    next: from => day(from.getFullYear(), from.getMonth() + 1, 1),
  },
  {
    name: 'previousWeek',
    run: c => c.previousWeek(),
    next: from => new Date(from.getTime() - 7 * DAY_MS),
  },
  {
    name: 'nextWeek',
    run: c => c.nextWeek(),
    next: from => new Date(from.getTime() + 7 * DAY_MS),
  },
  {
    name: 'previousDay',
    run: c => c.previousDay(),
    next: from => new Date(from.getTime() - DAY_MS),
  },
  {
    name: 'nextDay',
    run: c => c.nextDay(),
    next: from => new Date(from.getTime() + DAY_MS),
  },
];

describe('calendar matrix: navigation', () => {
  for (const step of STEPS) {
    for (const start of STARTS) {
      const id = `${step.name}/from=${isoDay(start)}`;
      it(id, async () => {
        el = await mountCalendar(vector, { displayDate: start });
        const problems = new Problems();
        const calendar = el as any;

        const landed = step.next(start);
        step.run(calendar);
        await wait(SETTLE);

        problems.equal(calendar.getDisplayedMonth(),
          { month: landed.getMonth(), year: landed.getFullYear() },
          `getDisplayedMonth() after ${step.name}()`);
        // …and the grid really moved with it.
        checkDayGrid(problems, el, vector, landed);

        expectClean(problems, id);
      });
    }
  }

  it('navigation is reversible', async () => {
    el = await mountCalendar(vector, { displayDate: day(2026, 5, 15) });
    const problems = new Problems();
    const calendar = el as any;

    for (const [forward, back] of [
      ['nextMonth', 'previousMonth'], ['nextWeek', 'previousWeek'], ['nextDay', 'previousDay'],
    ] as const) {
      const before = calendar.getDisplayedMonth();
      calendar[forward]();
      calendar[back]();
      await wait(SETTLE);
      problems.equal(calendar.getDisplayedMonth(), before, `${forward}() then ${back}()`);
    }

    expectClean(problems, 'reversible');
  });
});

describe('calendar matrix: goToDate', () => {
  // `goToDate(date: Date | string)` — both documented forms have to land on the
  // same month, and the grid has to redraw to it.
  for (const target of [day(2027, 2, 8), day(2026, 0, 1), day(2028, 1, 29)]) {
    for (const form of ['Date', 'string'] as const) {
      const id = `goToDate(${form})/${isoDay(target)}`;
      it(id, async () => {
        el = await mountCalendar(vector);
        const problems = new Problems();
        const calendar = el as any;

        calendar.goToDate(form === 'Date' ? target : `${isoDay(target)}T12:00:00`);
        await wait(SETTLE);

        problems.equal(calendar.getDisplayedMonth(),
          { month: target.getMonth(), year: target.getFullYear() }, 'getDisplayedMonth()');
        checkDayGrid(problems, el, vector, target);

        expectClean(problems, id);
      });
    }
  }

  it('goToToday() displays the current month', async () => {
    el = await mountCalendar(vector, { displayDate: day(2020, 0, 1) });
    const problems = new Problems();
    const calendar = el as any;

    calendar.goToToday();
    await wait(SETTLE);

    const today = new Date();
    problems.equal(calendar.getDisplayedMonth(),
      { month: today.getMonth(), year: today.getFullYear() }, 'getDisplayedMonth()');
    checkDayGrid(problems, el, vector, today);

    expectClean(problems, 'goToToday');
  });
});

/**
 * MATRIX-calendar-1
 *
 * Combo:    a calendar with nothing selected (`value === null`, the documented
 *           initial state), then `goToToday()` — or equally `goToDate(d)`.
 * Expected: navigation moves the DISPLAY. The doc lists both methods under
 *           "Navigate to…", lists `value` separately as the selection, and is
 *           explicit that "today is marked by highlightToday, not by a
 *           selection" — so navigating leaves `value` alone and fires no
 *           `calendar-change`, exactly as `nextMonth()`/`nextWeek()`/`nextDay()`
 *           already do.
 * Actual:   `goToToday()` and `goToDate()` also assign `this.value` and
 *           dispatch `calendar-change`. Merely scrolling the view to a month —
 *           the thing a "next month" button does — announces a selection the
 *           user never made, paints the selected background over today's own
 *           highlight, and sets `aria-selected="true"` on a day nobody chose.
 *           The other six navigation methods do none of this, so the same
 *           gesture reports a selection or not depending on which documented
 *           navigation method was used.
 */
describe('calendar matrix: navigation does not select', () => {
  for (const method of ['goToToday', 'goToDate'] as const) {
    it.fails(`MATRIX-calendar-1: ${method}() leaves the selection alone`, async () => {
      el = await mountCalendar(vector, { displayDate: day(2026, 5, 15), value: null });
      const events = captureEvents(el, 'calendar-change');
      const calendar = el as any;

      if (method === 'goToToday') calendar.goToToday();
      else calendar.goToDate(day(2026, 8, 4));
      await wait(SETTLE);

      expect({ value: calendar.value, changes: events.length })
        .toEqual({ value: null, changes: 0 });
    });
  }

  it('previousMonth/nextMonth/Week/Day leave the selection alone', async () => {
    el = await mountCalendar(vector, { displayDate: day(2026, 5, 15), value: null });
    const events = captureEvents(el, 'calendar-change');
    const problems = new Problems();
    const calendar = el as any;

    for (const step of STEPS) {
      step.run(calendar);
      await wait(SETTLE);
      problems.equal(calendar.value, null, `${step.name}() assigned a selection`);
    }
    problems.equal(events.length, 0, 'navigation fired calendar-change');

    expectClean(problems, 'navigation/no-selection');
  });
});
