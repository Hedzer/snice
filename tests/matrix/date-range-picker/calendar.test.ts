/**
 * Matrix slice DATE-RANGE-PICKER / CALENDAR — the open panel's grid.
 *
 * Dimensions: columns (2: the documented "supported layouts: 1 or 2") x
 * firstDayOfWeek (3: 0=Sunday default, 1=Monday, 6=Saturday) x bounds
 * (2: none, inclusive min/max) = 12 combos, plus the selection-paint flags
 * and the navigation regressions.
 *
 * Documented contract:
 *   · "columns: number = 1; // supported layouts: 1 or 2" — a dual-column
 *     picker shows the start month AND its successor.
 *   · "`firstDayOfWeek: number = 0; // first-day-of-week; 0=Sunday`".
 *   · "`min`/`max`: inclusive bounds applied to both endpoints ...
 *     out-of-range days are disabled."
 *   · "Impossible constraints are ignored rather than normalized."
 *   · "Calendar days, presets, month/year navigation, and Today are labeled
 *     buttons." — the days carry `aria-label` of their formatted date, the
 *     month/year nav buttons are labeled, and the grid is a role=grid of
 *     role=gridcell days.
 *   · The doc's view anchoring: an open calendar shows the start endpoint's
 *     month ("For dual column, show the start month" is the implementation
 *     of the documented convenience; the matrix asserts the weaker,
 *     documented-adjacent fact that the start month is VISIBLE when a start
 *     is held, because selection cannot proceed otherwise).
 *
 * happy-dom performs no layout, so this slice owns the grid's VALUE truth
 * (which days render, which are disabled, which are flagged); the panel's
 * geometry and paint belong to tests/live/matrix/date-range-picker.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product } from '../matrix-utils';
import {
  mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  dayButtons, weekdayHeaders, expectedWeekdays, expectedMonthDates,
  expectedDisabledDates, click, press, wait, SETTLE,
} from './date-range-picker-support';

/**
 * A fixed month whose layout the oracle derives: March 2026 starts on a
 * Sunday (firstDayOfWeek=0 needs no leading empties) and has 31 days.
 */
const VIEW = { year: 2026, month: 3 };
const MIN = '2026-03-10';
const MAX = '2026-03-20';

describe('date-range-picker matrix: calendar grid', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  const combos = product({
    columns: [1, 2],
    firstDayOfWeek: [0, 1, 6],
    bounded: [false, true],
  });

  for (const { columns, firstDayOfWeek, bounded } of combos) {
    const id = `columns=${columns}/fdw=${firstDayOfWeek}/${bounded ? 'minmax' : 'unbounded'}`;

    it(`${id}: the month grid derives from the calendar, the week start, and the bounds`,
      async () => {
        const el = await mountRange({
          attrs: {
            columns,
            'first-day-of-week': firstDayOfWeek,
            min: bounded ? MIN : undefined,
            max: bounded ? MAX : undefined,
            start: '2026-03-10',
            end: '2026-03-20',
          },
        });
        el.open();
        await wait(SETTLE);

        // Weekday headers rotate from the configured first day. A dual-column
        // panel paints one header row per month, each identical.
        const headers = weekdayHeaders(el);
        expect(headers.length, `${id} weekday header count`).toBe(7 * columns);
        for (let row = 0; row < columns; row++) {
          expect(headers.slice(row * 7, row * 7 + 7), `${id} weekday row ${row}`).toEqual(
            expectedWeekdays(firstDayOfWeek));
        }

        // Every day of the start month renders, once, in order.
        const march = dayButtons(el)
          .map(button => button.getAttribute('data-date')!)
          .filter(date => date.startsWith('2026-03'));
        expect(march, `${id} March renders once, in order`).toEqual(
          expectedMonthDates(VIEW.year, VIEW.month));

        // A dual-column layout shows the successor month too.
        const april = dayButtons(el)
          .map(button => button.getAttribute('data-date')!)
          .filter(date => date.startsWith('2026-04'));
        expect(april.length, `${id} dual layout did not show April`).toEqual(
          columns === 2 ? expectedMonthDates(2026, 4).length : 0);

        // "out-of-range days are disabled" with INCLUSIVE boundaries.
        const disabled = dayButtons(el)
          .filter(button => button.disabled)
          .map(button => button.getAttribute('data-date')!)
          .filter(date => date.startsWith('2026-03'));
        expect(disabled, `${id} disabled days`).toEqual(
          bounded ? expectedDisabledDates(VIEW.year, VIEW.month, MIN, MAX) : []);

        // The boundary days themselves stay selectable.
        if (bounded) {
          const byDate = new Map(dayButtons(el).map(b => [b.getAttribute('data-date'), b]));
          expect(byDate.get('2026-03-10')!.disabled, `${id} min boundary disabled`).toBe(false);
          expect(byDate.get('2026-03-20')!.disabled, `${id} max boundary disabled`).toBe(false);
        }

        // "Calendar days ... are labeled buttons": each day announces its
        // formatted date and is a gridcell of the grid.
        const first = dayButtons(el)[0];
        expect(first.getAttribute('aria-label')).toBe('03/01/2026');
        expect(first.getAttribute('role')).toBe('gridcell');
        expect(el.shadowRoot!.querySelector('.calendar-days')!.getAttribute('role'))
          .toBe('grid');

        // A held range flags its endpoints and interior as selected.
        const start = dayButtons(el).find(b => b.getAttribute('data-date') === '2026-03-10')!;
        const mid = dayButtons(el).find(b => b.getAttribute('data-date') === '2026-03-15')!;
        const end = dayButtons(el).find(b => b.getAttribute('data-date') === '2026-03-20')!;
        expect(start.getAttribute('aria-selected'), `${id} start flagged`).toBe('true');
        expect(mid.getAttribute('aria-selected'), `${id} interior flagged`).toBe('true');
        expect(end.getAttribute('aria-selected'), `${id} end flagged`).toBe('true');
        const outside = dayButtons(el).find(b => b.getAttribute('data-date') === '2026-03-05')!;
        expect(outside.getAttribute('aria-selected'), `${id} a day outside the range flagged`)
          .toBe('false');
      });
  }

  it('impossible bounds disable nothing', async () => {
    // "Impossible constraints are ignored rather than normalized."
    const el = await mountRange({
      attrs: { min: '2026-02-31', max: '2026-04-31', start: '2026-03-01', end: '2026-03-31' },
    });
    el.open();
    await wait(SETTLE);
    expect(dayButtons(el).filter(button => button.disabled)).toEqual([]);
  });

  it('display-format bounds disable the same days canonical ones would', async () => {
    const el = await mountRange({
      attrs: {
        format: 'dd/mm/yyyy', min: '10/03/2026', max: '20/03/2026',
        start: '2026-03-01', end: '2026-03-31',
      },
    });
    el.open();
    await wait(SETTLE);
    const disabled = dayButtons(el)
      .filter(button => button.disabled)
      .map(button => button.getAttribute('data-date')!)
      .filter(date => date.startsWith('2026-03'));
    expect(disabled).toEqual(expectedDisabledDates(2026, 3, MIN, MAX));
  });

  // ── Navigation: "month/year navigation, and Today are labeled buttons" ────
  it('month navigation is labeled and moves one month at a time', async () => {
    const el = await mountRange({
      attrs: { start: '2026-03-01', end: '2026-03-31' },
    });
    el.open();
    await wait(SETTLE);
    const nav = (name: string) =>
      el.shadowRoot!.querySelector<HTMLButtonElement>(`[data-nav="${name}"]`)!;

    expect(nav('prev-month').getAttribute('aria-label')).toBe('Previous month');
    expect(nav('next-month').getAttribute('aria-label')).toBe('Next month');
    expect(el.shadowRoot!.querySelector('.month-label')!.textContent).toContain('March');

    click(nav('next-month'));
    await wait(SETTLE);
    expect(el.shadowRoot!.querySelector('.month-label')!.textContent).toContain('April');

    click(nav('prev-month'));
    await wait(SETTLE);
    expect(el.shadowRoot!.querySelector('.month-label')!.textContent).toContain('March');
  });

  it('the year view offers twelve labeled years and a year selection returns to days', async () => {
    const el = await mountRange({
      attrs: { start: '2026-03-01', end: '2026-03-31' },
    });
    el.open();
    await wait(SETTLE);

    click(el.shadowRoot!.querySelector<HTMLButtonElement>('[data-nav="show-years"]')!);
    await wait(SETTLE);

    const years = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[data-year]')];
    expect(years).toHaveLength(12);
    expect(years.every(button => !!button.textContent?.trim()), 'a year is unlabeled').toBe(true);

    click(el.shadowRoot!.querySelector<HTMLButtonElement>('[data-year="2024"]')!);
    await wait(SETTLE);
    expect(el.shadowRoot!.querySelector('.year-button')!.textContent).toContain('2024');
    // Back on the days grid, the new month renders.
    expect(dayButtons(el).length).toBeGreaterThan(0);
  });

  it('Today is a labeled control that returns the view to the current month', async () => {
    const el = await mountRange({
      attrs: { start: '2026-03-01', end: '2026-03-31' },
    });
    el.open();
    await wait(SETTLE);
    const today = el.shadowRoot!.querySelector('[data-nav="today"]')!;
    expect(today.textContent!.trim()).toBe('Today');

    click(today as HTMLElement);
    await wait(SETTLE);
    const now = new Date();
    expect(el.shadowRoot!.querySelector('.month-label')!.textContent)
      .toContain(['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'][now.getMonth()]);
  });

  it('a dual-column panel shows two consecutive, distinct months', async () => {
    const el = await mountRange({
      attrs: { columns: 2, start: '2026-03-01', end: '2026-03-31' },
    });
    el.open();
    await wait(SETTLE);
    const labels = [...el.shadowRoot!.querySelectorAll('.month-label')]
      .map(node => node.textContent!.trim());
    expect(labels).toEqual(['March', 'April']);
  });

  it('Escape closes the open calendar from the range input', async () => {
    // "Enter/Space opens from the range input; Escape closes."
    const el = await mountRange({});
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.input')!;

    press(input, 'Enter');
    await wait(SETTLE);
    expect(el.showCalendar).toBe(true);

    press(input, 'Escape');
    await wait(SETTLE);
    expect(el.showCalendar).toBe(false);
    expect(el.shadowRoot!.querySelector('.calendar')!.hasAttribute('hidden')).toBe(true);
  });
});
