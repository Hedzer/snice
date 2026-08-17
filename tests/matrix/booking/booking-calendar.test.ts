/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-booking matrix — the date picker's gates
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Step one is a month grid, and the docs give it three independent gates:
 *
 *   availableDates  "non-empty list disables all other days"
 *   minDate         attr `min-date`
 *   maxDate         attr `max-date`
 *
 * The cross is availableDates (3 shapes) x minDate (2) x maxDate (2) x variant
 * (2) = 24 combos, and every combo checks all 42 cells of the rendered month:
 * the number each one shows, whether it is disabled, and whether it is marked
 * as belonging to another month. One combo therefore makes 126 assertions
 * about the grid, which is what makes 24 of them enough.
 *
 * `availableDates` is also crossed over its documented input FORMS — the doc
 * types it `(Date | string)[]` and says a plain `YYYY-MM-DD`, a full ISO
 * timestamp and a `Date` all match "by calendar day".
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, removeComponent } from '../matrix-kit';
import {
  checkCalendar, dayCells, futureDaysThisMonth, ymd, midnight, monthGrid,
  isSelectable, regions, type CalendarRules,
} from './booking-support';

const TAG = 'snice-booking';
await import('../../../packages/components/src/booking/snice-booking');

afterEach(() => { document.body.innerHTML = ''; });

/** Two bookable days in the month the widget opens on. */
const FUTURE = futureDaysThisMonth(4);

describe('booking matrix: the month grid', () => {
  const combos = cross({
    dates: ['open', 'listed', 'listed-one'] as const,
    min: ['none', 'set'] as const,
    max: ['none', 'set'] as const,
    variant: ['stepper', 'inline'] as const,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      if (FUTURE.length < 3) return; // last days of a month: nothing to book
      const availableDates =
        combo.dates === 'open' ? []
          : combo.dates === 'listed-one' ? [FUTURE[1]]
            : [FUTURE[0], FUTURE[1], FUTURE[2]];
      const rules: CalendarRules = {
        availableDates,
        ...(combo.min === 'set' ? { minDate: FUTURE[1] } : {}),
        ...(combo.max === 'set' ? { maxDate: FUTURE[2] } : {}),
      };

      const el = await mount<HTMLElement>(TAG, {
        variant: combo.variant,
        ...(rules.minDate ? { 'min-date': rules.minDate } : {}),
        ...(rules.maxDate ? { 'max-date': rules.maxDate } : {}),
      }, { availableDates });

      const problems = new Problems();
      checkCalendar(el, rules, problems);
      // The calendar belongs to step one, which both variants show first.
      problems.check(regions(el).calendar, 'part="calendar" is missing');
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('booking matrix: availableDates accepts every documented form', () => {
  const forms = ['plain', 'iso', 'date-object'] as const;

  for (const form of forms) {
    it(`form=${form}`, async () => {
      if (!FUTURE.length) return;
      const day = FUTURE[0];
      const value =
        form === 'plain' ? day
          : form === 'iso' ? `${day}T09:30:00.000Z`
            : new Date(`${day}T12:00:00`);

      const el = await mount<HTMLElement>(TAG, {}, { availableDates: [value] });
      const grid = monthGrid();
      const cells = dayCells(el);
      const enabled = cells
        .map((cell, i) => (cell.disabled ? null : ymd(grid[i])))
        .filter(Boolean);
      expect(enabled, `the only bookable day for ${form}`).toEqual([day]);
      removeComponent(el);
    });
  }

  it('an ISO timestamp is matched by its calendar day, not its instant', async () => {
    if (!FUTURE.length) return;
    // Documented: "matched by calendar day". A timestamp late in the UTC day
    // must still light up its own local calendar day.
    const el = await mount<HTMLElement>(TAG, {}, {
      availableDates: [`${FUTURE[0]}T23:45:00`],
    });
    const grid = monthGrid();
    const enabled = dayCells(el)
      .map((cell, i) => (cell.disabled ? null : ymd(grid[i])))
      .filter(Boolean);
    expect(enabled).toEqual([FUTURE[0]]);
  });
});

describe('booking matrix: the past is never bookable', () => {
  it('yesterday is disabled even when it is listed as available', async () => {
    const yesterday = new Date(midnight());
    yesterday.setDate(yesterday.getDate() - 1);
    const el = await mount<HTMLElement>(TAG, {}, { availableDates: [ymd(yesterday)] });

    const grid = monthGrid();
    const problems = new Problems();
    dayCells(el).forEach((cell, i) => {
      problems.check(cell.disabled,
        `${ymd(grid[i])} is selectable in a calendar whose only listed day has passed`);
    });
    expectClean(problems, 'past date');
  });

  it('today is bookable when nothing narrows the calendar', async () => {
    const today = midnight();
    const el = await mount<HTMLElement>(TAG, {});
    const grid = monthGrid();
    const cell = dayCells(el)[grid.findIndex(date => date.getTime() === today.getTime())];
    expect(cell?.disabled, 'today is disabled in an open calendar').toBe(false);
    expect(cell?.getAttribute('class'), 'today is marked').toContain('booking__day--today');
    expect(isSelectable(today, { availableDates: [] }), 'the oracle agrees').toBe(true);
  });
});
