/**
 * snice-time-range-picker matrix — BLOCKED SLOTS.
 *
 *   doc: `disabledRanges = ''` (attr `disabled-ranges`) — "JSON array of
 *        TimeRange[]", with the worked example
 *        `disabled-ranges='[{"start":"12:00","end":"13:00"}]'`;
 *   doc: `isSlotDisabled(time)` — "Check if time slot is disabled".
 *
 * A blocked slot has to be blocked everywhere at once: reported by the method,
 * marked in the tree, skipped by a `value` that covers it, and skipped by a
 * drag that crosses it. The matrix crosses three block shapes against three
 * granularities (9 combos) and then asserts each of those four consequences.
 *
 * This file also carries the picker's two findings, both about the same missing
 * idea: the documented JSON ranges are matched by EXACT slot string rather than
 * by the span they name.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, capturePicker, checkSelection, checkSlots, drag, expectClean,
  indicesFor, json, makePicker, pressSlot, removeComponent, selectedIndices,
  slotNodes, slotTimes, wait, type Picker, type PickerVector, type TimeRange,
} from './picker-support';

let el: Picker | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const GRANS = [15, 30, 60] as const;

/** Three block shapes, all on slot boundaries at every granularity above. */
const BLOCKS: Array<{ name: string; ranges: TimeRange[] }> = [
  { name: 'one-slot', ranges: [{ start: '09:00', end: '09:00' }] },
  { name: 'one-span', ranges: [{ start: '09:00', end: '10:00' }] },
  { name: 'two-spans', ranges: [{ start: '08:00', end: '08:00' }, { start: '11:00', end: '12:00' }] },
];

describe('snice-time-range-picker matrix: disabled ranges', () => {
  for (const { name, ranges } of BLOCKS) {
    for (const granularity of GRANS) {
      const vector: PickerVector = { ...DEFAULTS, granularity, disabledRanges: json(...ranges) };
      const id = `${name}/gran=${granularity}`;
      it(id, async () => {
        el = await makePicker(vector);
        const slots = slotTimes(el);
        const blocked = new Set(indicesFor(vector.disabledRanges, slots));

        const problems = new Problems();
        checkSlots(problems, el, vector);

        // doc: `isSlotDisabled(time)` must agree with what the tree shows.
        slots.forEach((time, index) => {
          problems.equal(el!.isSlotDisabled(time), blocked.has(index),
            `isSlotDisabled("${time}")`);
        });
        problems.check(blocked.size > 0, 'the combo blocked no slot at all');
        expectClean(problems, id);
      });
    }
  }
});

describe('snice-time-range-picker matrix: what a block refuses', () => {
  it('a drag that starts on a blocked slot does nothing at all', async () => {
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, disabledRanges: json({ start: '09:00', end: '09:00' }),
    };
    el = await makePicker(vector);
    const seen = capturePicker(el);
    await drag(el, 1, 3);

    const problems = new Problems();
    checkSelection(problems, el, vector, []);
    problems.equal(seen.map(event => event.type).join(','), '',
      'a drag from a blocked slot announced something');
    expectClean(problems, 'drag from blocked');
  });

  it('a drag that crosses a blocked slot selects around it', async () => {
    // The block is a hole in the span, not a wall: the slots either side of it
    // are still selectable, so the gesture produces two ranges.
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, disabledRanges: json({ start: '10:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    await drag(el, 1, 3);

    const problems = new Problems();
    checkSelection(problems, el, vector, [
      { start: '09:00', end: '09:00' },
      { start: '11:00', end: '11:00' },
    ]);
    expectClean(problems, 'drag across blocked');
  });

  it('a value that covers a blocked slot skips it', async () => {
    // Both documented JSON properties describe the same slots; when they
    // disagree the block wins, or a page could select a slot it just disabled.
    const vector: PickerVector = {
      ...DEFAULTS,
      granularity: 60,
      disabledRanges: json({ start: '10:00', end: '10:00' }),
      value: json({ start: '09:00', end: '11:00' }),
    };
    el = await makePicker(vector);
    const problems = new Problems();
    checkSlots(problems, el, vector);
    problems.equal(selectedIndices(el).join(','), '1,3',
      'a blocked slot inside the value was selected anyway');
    expectClean(problems, 'value over blocked');
  });

  it('Enter on a blocked slot selects nothing', async () => {
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, disabledRanges: json({ start: '09:00', end: '09:00' }),
    };
    el = await makePicker(vector);
    const seen = capturePicker(el);
    await pressSlot(el, 1, 'Enter');
    expect(selectedIndices(el)).toEqual([]);
    expect(seen).toEqual([]);
  });

  it('a blocked slot is out of the tab order', async () => {
    // `tabindex="-1"` is the tree's own statement that the slot cannot be
    // reached, and it is what stops a keyboard user landing on a dead option.
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, disabledRanges: json({ start: '09:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    expect(slotNodes(el).map(node => node.getAttribute('tabindex')))
      .toEqual(['0', '-1', '-1', '0', '0']);
  });

  it('malformed disabled-ranges JSON blocks nothing instead of throwing', async () => {
    el = await makePicker({ granularity: 60, disabledRanges: '{{{' });
    expect(slotNodes(el).map(node => node.getAttribute('aria-disabled')))
      .toEqual(['false', 'false', 'false', 'false', 'false']);
  });

  it('a later disabled-ranges assignment re-blocks the column', async () => {
    el = await makePicker({ granularity: 60 });
    expect(el.isSlotDisabled('10:00')).toBe(false);
    el.disabledRanges = json({ start: '10:00', end: '10:00' });
    await wait(30);
    expect(el.isSlotDisabled('10:00')).toBe(true);
    expect(slotNodes(el)[2].getAttribute('aria-disabled')).toBe('true');
  });
});

// ── Findings ────────────────────────────────────────────────────────────────

describe('snice-time-range-picker matrix: findings', () => {
  /**
   * MATRIX-time-range-picker-1 — a `disabled-ranges` entry whose ends are not
   * exact slot times blocks nothing.
   *
   * `docs/ai/components/time-range-picker.md` documents
   * `disabledRanges: string = ''  // attr: disabled-ranges, JSON array of
   * TimeRange[]` with `interface TimeRange { start: string; end: string }`, and
   * places no restriction on the two strings. The component resolves each end
   * by looking the string up in its slot list, so a range whose ends do not
   * land exactly on a slot start resolves to -1 and the WHOLE entry is dropped
   * in silence — a page that writes `disabled-ranges='[{"start":"12:10",
   * "end":"12:50"}]'` against a 15-minute picker gets a picker with nothing
   * blocked and no error.
   *
   * Policy (.ai/fuzzing.md): the assertion stays correct and the test is
   * pinned.
   */
  it.fails('MATRIX-time-range-picker-1: an off-boundary disabled range blocks the slots it covers', async () => {
    // Slots at 12:00, 12:15, 12:30, 12:45, 13:00 — the range covers 12:15 and
    // 12:30, and neither of its own ends is a slot time.
    el = await makePicker({
      granularity: 15,
      disabledRanges: json({ start: '12:10', end: '12:50' }),
    });
    el.startTime = '12:00';
    el.endTime = '13:00';
    await wait(30);

    expect(el.isSlotDisabled('12:15'), 'a slot inside an off-boundary blocked range is selectable')
      .toBe(true);
    expect(el.isSlotDisabled('12:30')).toBe(true);
  });

  /**
   * MATRIX-time-range-picker-2 — a `value` entry whose ends are not exact slot
   * times selects nothing.
   *
   * The same lookup, on the other documented JSON property. doc:
   * `value: string = ''  // JSON array of TimeRange[]`, with the worked example
   * `value='[{"start":"09:00","end":"11:00"}]'`. Change the granularity to 60
   * and the same page's `09:30` becomes a string no slot carries, so the
   * selection silently disappears — the picker renders as if `value` were
   * empty, and `getSelectedRanges()` agrees with it.
   */
  it.fails('MATRIX-time-range-picker-2: an off-boundary value selects the slots it covers', async () => {
    el = await makePicker({
      granularity: 60,
      value: json({ start: '09:30', end: '11:30' }),
    });
    // The 10:00 and 11:00 slots start inside 09:30–11:30.
    expect(selectedIndices(el), 'an off-boundary value selected nothing at all')
      .toEqual([2, 3]);
  });
});
