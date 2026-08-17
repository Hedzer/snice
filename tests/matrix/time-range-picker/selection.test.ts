/**
 * snice-time-range-picker matrix — the SELECTION, from `value` and from the API.
 *
 *   doc: `value = ''` — "JSON array of TimeRange[]", with a worked example
 *        `<snice-time-range-picker value='[{"start":"09:00","end":"11:00"}]'>`;
 *   doc: `getSelectedRanges()` — "Returns TimeRange[]";
 *   doc: `setSelectedRanges(ranges)` — "Set selections programmatically";
 *   doc: `clearSelection()` — "Clear all selections";
 *   doc: `header` — "The header with label and selected value display".
 *
 * Those five sentences describe ONE fact — which slots are chosen — reachable
 * through four surfaces that must agree: the rendered `aria-selected` flags,
 * `getSelectedRanges()`, the header's display, and `value` itself.
 * `checkSelection` asserts all of them together, so a combo cannot pass by
 * getting one right.
 *
 * The matrix crosses four documented value shapes against three granularities
 * and both selection modes: 4 x 3 x 2 = 24 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, checkSelection, checkShell, checkSlots, expectClean,
  expectedDisplay, headerValue, json, makePicker, removeComponent, selectedIndices,
  slotTimes, wait, type Picker, type PickerVector, type TimeRange,
} from './picker-support';

let el: Picker | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

/**
 * Four value shapes, all on slot boundaries at every granularity below so the
 * combo is about the documented parsing and not about alignment (which
 * MATRIX-time-range-picker-1 pins separately).
 */
const VALUES: Array<{ name: string; ranges: TimeRange[] }> = [
  { name: 'none', ranges: [] },
  { name: 'one-slot', ranges: [{ start: '09:00', end: '09:00' }] },
  { name: 'one-span', ranges: [{ start: '09:00', end: '10:00' }] },
  { name: 'two-spans', ranges: [{ start: '08:00', end: '09:00' }, { start: '11:00', end: '11:00' }] },
];

const GRANS = [15, 30, 60] as const;

describe('snice-time-range-picker matrix: value', () => {
  for (const { name, ranges } of VALUES) {
    for (const granularity of GRANS) {
      for (const multiple of [false, true]) {
        const vector: PickerVector = {
          ...DEFAULTS, granularity, multiple, value: ranges.length ? json(...ranges) : '',
        };
        const id = `${name}/gran=${granularity}/${multiple ? 'multiple' : 'single'}`;
        it(id, async () => {
          el = await makePicker(vector);
          const problems = new Problems();
          checkShell(problems, el, vector);
          checkSlots(problems, el, vector);
          checkSelection(problems, el, vector, ranges);
          expectClean(problems, id);
        });
      }
    }
  }
});

describe('snice-time-range-picker matrix: the selection API', () => {
  it('setSelectedRanges puts exactly those ranges on screen', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 30 };
    el = await makePicker(vector);
    const ranges: TimeRange[] = [{ start: '09:00', end: '10:00' }];
    el.setSelectedRanges(ranges);
    await wait(30);

    const problems = new Problems();
    checkSelection(problems, el, vector, ranges);
    expectClean(problems, 'setSelectedRanges');
  });

  it('setSelectedRanges replaces whatever was selected before', async () => {
    // "Set selections programmatically" — set, not add.
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 30, value: json({ start: '08:00', end: '08:30' }),
    };
    el = await makePicker(vector);
    const ranges: TimeRange[] = [{ start: '11:00', end: '11:30' }];
    el.setSelectedRanges(ranges);
    await wait(30);

    const problems = new Problems();
    checkSelection(problems, el, { ...vector, value: json(...ranges) }, ranges);
    expectClean(problems, 'setSelectedRanges/replace');
  });

  it('setSelectedRanges announces the change', async () => {
    // doc: `time-range-change → { ranges, component }`, the event that means
    // "the selection is now this".
    el = await makePicker({ granularity: 30 });
    const seen: any[] = [];
    el.addEventListener('time-range-change', (event: Event) => seen.push((event as CustomEvent).detail));
    el.setSelectedRanges([{ start: '09:00', end: '09:30' }]);
    await wait(30);
    expect(seen.length).toBe(1);
    expect(seen[0].ranges).toEqual([{ start: '09:00', end: '09:30' }]);
    expect(seen[0].component).toBe(el);
  });

  it('clearSelection empties every surface at once', async () => {
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 30, value: json({ start: '09:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    expect(selectedIndices(el).length).toBeGreaterThan(0);

    const seen: any[] = [];
    el.addEventListener('time-range-change', (event: Event) => seen.push((event as CustomEvent).detail));
    el.clearSelection();
    await wait(30);

    const problems = new Problems();
    checkSelection(problems, el, { ...vector, value: '' }, []);
    problems.equal(el.value, '', 'value after clearSelection()');
    problems.equal(seen.length, 1, 'clearSelection() announcements');
    expectClean(problems, 'clearSelection');
  });

  it('the header reads "No selection" until something is selected', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60 };
    el = await makePicker(vector);
    expect(headerValue(el)).toBe('No selection');
    expect(expectedDisplay([], vector)).toBe('No selection');
  });

  it('the header names the span a selection actually covers', async () => {
    // A selected run reads to the END of its last slot: choosing the 09:00 and
    // 10:00 slots of an hourly picker is an 09:00–11:00 booking, not 09:00–10:00.
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, value: json({ start: '09:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    expect(headerValue(el)).toBe('09:00 - 11:00');
  });

  it('the header formats its span in the documented 12h clock', async () => {
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, format: '12h', value: json({ start: '09:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    expect(headerValue(el)).toBe('9:00 AM - 11:00 AM');
  });

  it('the value round-trips through getSelectedRanges', async () => {
    // doc gives `value` and `getSelectedRanges()` the same `TimeRange[]` shape,
    // so what goes in must come back out.
    for (const granularity of GRANS) {
      const ranges: TimeRange[] = [{ start: '09:00', end: '10:00' }];
      el = await makePicker({ granularity, value: json(...ranges) });
      expect(el.getSelectedRanges(), `granularity=${granularity}`).toEqual(ranges);
      removeComponent(el as HTMLElement);
      el = null;
    }
  });

  it('malformed value JSON selects nothing instead of throwing', async () => {
    // `value` is a string property, so anything can be written to it; the
    // documented result of "a JSON array of TimeRange[]" not being one is that
    // there is no selection to show.
    el = await makePicker({ granularity: 60, value: 'not json at all' });
    expect(selectedIndices(el)).toEqual([]);
    expect(el.getSelectedRanges()).toEqual([]);
    expect(headerValue(el)).toBe('No selection');
  });

  it('a value naming times outside the window selects nothing', async () => {
    // The morning window is 08:00–12:00; a range in the evening has no slots.
    el = await makePicker({ granularity: 60, value: json({ start: '20:00', end: '21:00' }) });
    expect(selectedIndices(el)).toEqual([]);
    expect(slotTimes(el)).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00']);
  });
});
