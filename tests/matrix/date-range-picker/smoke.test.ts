/**
 * Smoke slice of the snice-date-range-picker matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the ~230-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family of docs/ai/components/date-range-picker.md:
 * the chrome/parts shape, the reflection pass, the strict endpoint parse, the
 * display-format separation, the two-field submission, the validity mapping,
 * and the open calendar grid. Every structural assertion routes through the
 * matrix's own oracle (`expectedShape`/`readShape`, `expectedFlags`,
 * `expectedEntries`), so this file cannot drift into asserting something
 * weaker than the suite it stands in for.
 *
 * BUDGET: a few seconds. New feature combinations belong in the matrix.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { expectShape } from '../matrix-utils';
import {
  mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  readShape, expectedShape, expectedAxes, readAxes, expectedFlags, activeFlags,
  formEntries, expectedEntries, dayButtons, weekdayHeaders, expectedWeekdays,
  click, recordEvents, namesOf, viewOn, wait, SETTLE,
  type RangeCombo,
} from './date-range-picker-support';

const combo = (over: Partial<RangeCombo> = {}): RangeCombo => ({
  size: 'medium', variant: 'outlined', disabled: false, readonly: false,
  loading: false, required: false, invalid: false, clearable: false,
  hasValue: false, helperText: '', errorText: '', channel: 'attr', ...over,
});

describe('date-range-picker matrix smoke', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  it('a bare picker renders the documented parts, closed and inert', async () => {
    const c = combo();
    const el = await mountRange({});
    expectShape(readShape(el), expectedShape(c), 'smoke/bare shape');
    expect(el.start).toBe('');
    expect(el.end).toBe('');
  });

  it('every style axis reaches the attribute the stylesheet selects on', async () => {
    // The PROPERTY channel is the interesting one: `:host([size=…]) .calendar`
    // cannot see a JS assignment that never reflects.
    const c = combo({ size: 'large', variant: 'filled', clearable: true, required: true, channel: 'prop' });
    const el = await mountRange({
      props: { size: 'large', variant: 'filled', clearable: true, required: true },
    });
    expectShape(readAxes(el, c), expectedAxes(c), 'smoke/axes');
    expect(el.getAttribute('size')).toBe('large');
    expect(el.getAttribute('variant')).toBe('filled');
  });

  it('an impossible endpoint stays observable, submits "", and flags badInput', async () => {
    // "An impossible live ... endpoint remains observable as its exact string,
    // submits `''`, sets `badInput`, and never mutates its peer."
    const el = await mountRange({
      attrs: { name: 'stay', end: '2026-03-20' },
      live: { start: '2026-02-30' },
    });
    expect(el.start).toBe('2026-02-30');
    expect(el.end).toBe('2026-03-20');
    expect(formEntries(el)).toEqual([['stay-start', ''], ['stay-end', '2026-03-20']]);
    expect(activeFlags(el)).toEqual(['badInput']);
  });

  it('a display-format pair shows formatted but submits canonical', async () => {
    const el = await mountRange({
      attrs: {
        name: 'booking', format: 'dd/mm/yyyy',
        start: '10/03/2026', end: '20/03/2026',
      },
    });
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('.input')!.value)
      .toBe('10/03/2026  —  20/03/2026');
    expect(formEntries(el)).toEqual(expectedEntries(
      'booking', '10/03/2026', '20/03/2026', 'dd/mm/yyyy'));
    expect(formEntries(el)).toEqual([
      ['booking-start', '2026-03-10'], ['booking-end', '2026-03-20']]);
  });

  it('required + empty is valueMissing; reversed is customError; barred is silent', async () => {
    const required = await mountRange({ attrs: { required: true } });
    expect(activeFlags(required)).toEqual(expectedFlags(
      '', '', { required: true, min: '', max: '', format: 'mm/dd/yyyy', barred: false }));

    const reversed = await mountRange({
      live: { start: '2026-03-20', end: '2026-03-10' },
    });
    expect(activeFlags(reversed)).toEqual(['customError']);
    expect(reversed.start).toBe('2026-03-20');

    const barred = await mountRange({
      attrs: { required: true, disabled: true },
    });
    expect(activeFlags(barred)).toEqual([]);
  });

  it('an open calendar derives its grid, and two clicks select a range', async () => {
    const el = await mountRange({ attrs: { 'first-day-of-week': 1 } });
    await viewOn(el, '2026-03-01');
    el.open();
    await wait(SETTLE);

    expect(weekdayHeaders(el)).toEqual(expectedWeekdays(1));
    const dates = dayButtons(el).map(b => b.getAttribute('data-date'));
    expect(dates[0]).toBe('2026-03-01');
    expect(dates.filter(d => d!.startsWith('2026-03')).length).toBe(31);

    const seen = recordEvents(el);
    const pick = (iso: string) =>
      dayButtons(el).find(b => b.getAttribute('data-date') === iso)!;
    click(pick('2026-03-05'));
    click(pick('2026-03-12'));
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['03/05/2026', '03/12/2026']);
    expect(seen[0].type).toBe('daterange-change');
    expect(seen[0].detail).toMatchObject({ startIso: '2026-03-05', endIso: '2026-03-12' });
  });
});
