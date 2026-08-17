/**
 * Smoke slice of the snice-calendar matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/calendar/, ~300 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and it routes every assertion through
 * the matrix's own oracle so it cannot claim something the full suite does not.
 *
 * The marquee combos: the documented default month grid, the Monday-start
 * ISO week-number column, a day click, `no-day-select`, a ranged event chopped
 * at a week boundary, the "+N more" chip, and the standing finding.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, PINNED, Problems, captureEvents, checkCellSizing, checkChrome, checkDayGrid,
  checkNoDaySelect, checkSelection, checkToday, checkWeekNumbers, checkWeekdayStrip, click,
  clickDay, day, eventBars, isoDay, mountBare, mountCalendar, part, text, wait, SETTLE,
  type Vector,
} from './calendar-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const vector = { ...DEFAULTS } as Vector;

describe('calendar matrix smoke', () => {
  it('<snice-calendar> renders the current month with nothing selected', async () => {
    el = await mountBare();
    const problems = new Problems();
    const today = new Date();

    problems.equal((el as any).value, null, 'default value ("null = nothing selected")');
    checkChrome(problems, el, vector);
    checkWeekdayStrip(problems, el, vector);
    checkDayGrid(problems, el, vector, today);
    checkToday(problems, el, vector, today);
    checkSelection(problems, el, vector, today, null);
    checkCellSizing(problems, el, vector);
    checkNoDaySelect(problems, el, vector);

    expectClean(problems, 'smoke/defaults');
  });

  it('show-week-numbers adds a leading ISO column for a Monday-start week', async () => {
    const v = { ...vector, firstDayOfWeek: 1, showWeekNumbers: true } as Vector;
    el = await mountCalendar(v);
    const problems = new Problems();

    checkWeekdayStrip(problems, el, v);
    checkDayGrid(problems, el, v, PINNED);
    checkWeekNumbers(problems, el, v, PINNED);

    expectClean(problems, 'smoke/week-numbers');
  });

  it('a day click selects it and fires calendar-change', async () => {
    el = await mountCalendar(vector);
    const changes = captureEvents<{ value: Date }>(el, 'calendar-change');
    const problems = new Problems();

    const target = day(2026, 5, 17);
    await clickDay(problems, el, vector, PINNED, target);

    checkSelection(problems, el, vector, PINNED, target);
    if (problems.equal(changes.length, 1, 'calendar-change events')) {
      problems.equal(isoDay(changes[0].value), isoDay(target), 'calendar-change detail.value');
    }

    expectClean(problems, 'smoke/click');
  });

  it('no-day-select is display-only: no selection, no calendar-change', async () => {
    const v = { ...vector, noDaySelect: true } as Vector;
    el = await mountCalendar(v);
    const changes = captureEvents(el, 'calendar-change');
    const problems = new Problems();

    await clickDay(problems, el, v, PINNED, day(2026, 5, 17));

    checkSelection(problems, el, v, PINNED, null);
    checkNoDaySelect(problems, el, v);
    problems.equal(changes.length, 0, 'a display-only calendar fired calendar-change');

    expectClean(problems, 'smoke/no-day-select');
  });

  it('a ranged event is one bar per week row, chopped at the boundary', async () => {
    el = await mountCalendar(vector, {
      events: [{ id: 'c', title: 'Conf', start: day(2026, 5, 11), end: day(2026, 5, 16) }],
    });
    const problems = new Problems();
    const bars = eventBars(el);

    problems.equal(bars.length, 2, 'bars for a range crossing one week boundary');
    problems.equal(bars.map(bar => bar.classList.contains('calendar__event-bar--continues-right')),
      [true, false], 'continues-right per segment');
    problems.equal(bars.map(bar => bar.classList.contains('calendar__event-bar--continues-left')),
      [false, true], 'continues-left per segment');
    problems.check(bars.every(bar => text(bar).includes('Conf')), 'the title does not repeat');

    expectClean(problems, 'smoke/stripes');
  });

  it('a deep stack collapses into a "+N more" chip', async () => {
    // The doc's headless fallback is three lanes, so six events hide three.
    el = await mountCalendar(vector, {
      events: Array.from({ length: 6 }, (_, i) => ({
        id: `e${i}`, title: `Event ${i}`, start: day(2026, 5, 10),
      })),
    });
    const more = captureEvents<{ count: number }>(el, 'calendar-more-click');
    const problems = new Problems();

    problems.equal(eventBars(el).length, 3, 'visible bars');
    const chip = part(el, 'more-chip');
    if (problems.check(!!chip, 'no "+N more" chip')) {
      problems.equal(text(chip), '+3 more', 'chip text');
      click(chip);
      await wait(SETTLE);
      problems.equal(more.length, 1, 'calendar-more-click events');
      problems.equal(more[0]?.count, 3, 'calendar-more-click detail.count');
    }

    expectClean(problems, 'smoke/more-chip');
  });

  // MATRIX-calendar-1 — see tests/matrix/calendar/navigation.test.ts.
  // goToToday()/goToDate() are documented as navigation but also assign
  // `value` and dispatch `calendar-change`.
  it.fails('MATRIX-calendar-1: goToToday() leaves the selection alone', async () => {
    el = await mountCalendar(vector, { displayDate: day(2026, 5, 15), value: null });
    const changes = captureEvents(el, 'calendar-change');
    (el as any).goToToday();
    await wait(SETTLE);
    expect({ value: (el as any).value, changes: changes.length })
      .toEqual({ value: null, changes: 0 });
  });

  // MATRIX-calendar-2 — see tests/matrix/calendar/events.test.ts.
  // A ranged event vanishes from its own last day once the probe carries a
  // time of day, because the probe is compared raw against a midnight end.
  it.fails('MATRIX-calendar-2: a range covers its last day at 15:30 too', async () => {
    el = await mountCalendar(vector, {
      events: [{ id: 'r', title: 'Conf', start: day(2026, 5, 10), end: day(2026, 5, 14) }],
    });
    const found = (el as any).getEventsForDate(new Date(2026, 5, 14, 15, 30)) as Array<{ id: string }>;
    expect(found.map(e => e.id)).toEqual(['r']);
  });
});
