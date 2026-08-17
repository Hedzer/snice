/**
 * snice-calendar matrix — the month grid.
 *
 * The cross: `view` (3) x `first-day-of-week` (2) x `show-week-numbers` (2) x
 * `highlight-today` (2) x `cell-sizing` (2) x `locale` (2) = 96 combos, each
 * judged by the whole oracle at once: the container parts and the view they
 * advertise, the weekday strip, the 42-day window, the week-number column and
 * the grid columns it shifts, the today marking, and the two per-cell modes.
 *
 * Every expectation comes from docs/ai/components/calendar.md via
 * tests/matrix/calendar/calendar-support.ts — the 42-day window and the
 * weekday rotation are computed there from the documented rules, not copied
 * from the component.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, PINNED, Problems, checkCellSizing, checkChrome, checkDayGrid, checkNoDaySelect,
  checkSelection, checkToday, checkWeekNumbers, checkWeekdayStrip, day, dayCells, mountBare,
  mountCalendar, weekdayCells, type Vector,
} from './calendar-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = cross({
  view: ['month', 'week', 'day'] as const,
  firstDayOfWeek: [0, 1],
  showWeekNumbers: [false, true],
  highlightToday: [true, false],
  cellSizing: ['square', 'stretch'] as const,
  locale: ['en-US', 'de-DE'],
});

describe('calendar matrix: the month grid', () => {
  for (const combo of combos) {
    const vector = { ...DEFAULTS, ...combo } as Vector;
    it(combo.id, async () => {
      el = await mountCalendar(vector);
      const problems = new Problems();

      checkChrome(problems, el, vector);
      checkWeekdayStrip(problems, el, vector);
      checkDayGrid(problems, el, vector, PINNED);
      checkWeekNumbers(problems, el, vector, PINNED);
      checkToday(problems, el, vector, PINNED);
      checkCellSizing(problems, el, vector);
      checkNoDaySelect(problems, el, vector);
      // Nothing was selected, and the doc's initial state is "nothing selected".
      checkSelection(problems, el, vector, PINNED, null);

      expectClean(problems, combo.id);
    });
  }
});

describe('calendar matrix: the grid follows the month it displays', () => {
  // The 42-day window is a function of the displayed month and the documented
  // start of week; a calendar that renders one month's window while claiming
  // another is the failure this catches. Months chosen for their shapes: a
  // February that fits exactly, a 31-day month starting on a Sunday, a leap
  // February, and a December that runs into the next year.
  const months = [
    day(2026, 1, 10),  // Feb 2026 — starts Sunday, 28 days
    day(2026, 2, 10),  // Mar 2026 — starts Sunday, 31 days
    day(2028, 1, 10),  // Feb 2028 — leap year
    day(2026, 11, 10), // Dec 2026 — runs into January
  ];
  for (const firstDayOfWeek of [0, 1]) {
    for (const displayDate of months) {
      const vector = { ...DEFAULTS, firstDayOfWeek, showWeekNumbers: true } as Vector;
      const id = `${displayDate.getFullYear()}-${displayDate.getMonth() + 1}/first=${firstDayOfWeek}`;
      it(id, async () => {
        el = await mountCalendar(vector, { displayDate });
        const problems = new Problems();

        checkDayGrid(problems, el, vector, displayDate);
        checkWeekNumbers(problems, el, vector, displayDate);
        problems.equal((el as any).getDisplayedMonth(),
          { month: displayDate.getMonth(), year: displayDate.getFullYear() },
          'getDisplayedMonth()');

        expectClean(problems, id);
      });
    }
  }
});

describe('calendar matrix: the documented defaults', () => {
  it('<snice-calendar></snice-calendar> renders a month grid with nothing selected', async () => {
    el = await mountBare();
    const problems = new Problems();
    const calendar = el as any;

    problems.equal(calendar.value, null, 'default value ("null = nothing selected")');
    problems.equal(calendar.view, DEFAULTS.view, 'default view');
    problems.equal(calendar.events, [], 'default events');
    problems.equal(calendar.disabledDates, [], 'default disabledDates');
    problems.equal(calendar.highlightToday, DEFAULTS.highlightToday, 'default highlightToday');
    problems.equal(calendar.showWeekNumbers, DEFAULTS.showWeekNumbers, 'default showWeekNumbers');
    problems.equal(calendar.firstDayOfWeek, DEFAULTS.firstDayOfWeek, 'default firstDayOfWeek');
    problems.equal(calendar.locale, DEFAULTS.locale, 'default locale');
    problems.equal(calendar.noDaySelect, DEFAULTS.noDaySelect, 'default noDaySelect');
    problems.equal(calendar.cellSizing, DEFAULTS.cellSizing, 'default cellSizing');

    problems.equal(dayCells(el).length, 42, 'day cells');
    problems.equal(weekdayCells(el).length, 7, 'weekday cells');
    // Documented: the bare calendar displays the current month.
    const today = new Date();
    problems.equal(calendar.getDisplayedMonth(),
      { month: today.getMonth(), year: today.getFullYear() }, 'getDisplayedMonth()');

    const vector = { ...DEFAULTS } as Vector;
    checkChrome(problems, el, vector);
    checkWeekdayStrip(problems, el, vector);
    checkDayGrid(problems, el, vector, today);
    checkWeekNumbers(problems, el, vector, today);
    checkToday(problems, el, vector, today);
    // "today is marked by highlightToday, not by a selection"
    checkSelection(problems, el, vector, today, null);

    expectClean(problems, 'defaults');
  });
});
