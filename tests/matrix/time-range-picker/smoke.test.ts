/**
 * Smoke slice of the snice-time-range-picker matrix — the everyday-loop tier.
 *
 * The full matrix (`tests/matrix/time-range-picker/`, 67 combos across the slot
 * column, `value` parsing, the drag gesture and blocked ranges) is excluded
 * from the default Vitest include and runs via `npm run test:matrix`. This file
 * lives at `smoke.test.ts` so it stays collected, and every assertion routes
 * through the matrix's own oracle, so it cannot claim less than the suite it
 * stands in for.
 *
 * The marquee combos: the documented default column, the 12h captions, a
 * `value` round-trip, the drag gesture with its three events, `multiple`, a
 * blocked range, and the two standing findings.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, capturePicker, checkSelection, checkShell, checkSlots, drag,
  expectClean, headerValue, json, makePicker, removeComponent, selectedIndices,
  slotTimes, wait, type Picker, type PickerVector,
} from './picker-support';

let el: Picker | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('time-range-picker matrix smoke', () => {
  it('the documented default granularity derives the whole column', async () => {
    const vector: PickerVector = { ...DEFAULTS };
    el = await makePicker(vector);
    const problems = new Problems();
    checkShell(problems, el, vector);
    checkSlots(problems, el, vector);
    expectClean(problems, 'smoke/column');
    expect(slotTimes(el)[0]).toBe('08:00');
    expect(slotTimes(el).at(-1)).toBe('12:00');
  });

  it('the 12h format captions every slot on a twelve-hour clock', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60, window: 'day', format: '12h' };
    el = await makePicker(vector);
    const problems = new Problems();
    checkSlots(problems, el, vector);
    expectClean(problems, 'smoke/12h');
  });

  it('an authored value selects, displays and round-trips', async () => {
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, value: json({ start: '09:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '09:00', end: '10:00' }]);
    expectClean(problems, 'smoke/value');
    expect(headerValue(el)).toBe('09:00 - 11:00');
  });

  it('a drag announces select, complete and change in that order', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60 };
    el = await makePicker(vector);
    const seen = capturePicker(el);
    await drag(el, 1, 3);

    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '09:00', end: '11:00' }]);
    expectClean(problems, 'smoke/drag');
    expect(seen.map(event => event.type))
      .toEqual(['time-range-select', 'time-range-complete', 'time-range-change']);
  });

  it('multiple accumulates ranges where single replaces them', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60, multiple: true };
    el = await makePicker(vector);
    await drag(el, 0, 0);
    await drag(el, 3, 4);
    const problems = new Problems();
    checkSelection(problems, el, vector, [
      { start: '08:00', end: '08:00' },
      { start: '11:00', end: '12:00' },
    ]);
    expectClean(problems, 'smoke/multiple');
  });

  it('a blocked range refuses the slots it names', async () => {
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, disabledRanges: json({ start: '10:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    const problems = new Problems();
    checkSlots(problems, el, vector);
    expectClean(problems, 'smoke/blocked');
    expect(el.isSlotDisabled('10:00')).toBe(true);
    await drag(el, 2, 2);
    expect(selectedIndices(el)).toEqual([]);
  });

  it('clearSelection empties every surface', async () => {
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, value: json({ start: '09:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    el.clearSelection();
    await wait(30);
    const problems = new Problems();
    checkSelection(problems, el, { ...vector, value: '' }, []);
    expectClean(problems, 'smoke/clear');
  });

  // ── Standing findings — see tests/matrix/time-range-picker/ ────────────────

  // MATRIX-time-range-picker-1: an off-boundary `disabled-ranges` entry is
  // resolved by exact slot string, so it blocks nothing.
  it.fails('MATRIX-time-range-picker-1: an off-boundary disabled range blocks the slots it covers', async () => {
    el = await makePicker({ granularity: 15, disabledRanges: json({ start: '12:10', end: '12:50' }) });
    el.startTime = '12:00';
    el.endTime = '13:00';
    await wait(30);
    expect(el.isSlotDisabled('12:15')).toBe(true);
  });

  // MATRIX-time-range-picker-2: the same lookup on `value`, so an off-boundary
  // value selects nothing.
  it.fails('MATRIX-time-range-picker-2: an off-boundary value selects the slots it covers', async () => {
    el = await makePicker({ granularity: 60, value: json({ start: '09:30', end: '11:30' }) });
    expect(selectedIndices(el)).toEqual([2, 3]);
  });
});
