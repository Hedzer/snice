/**
 * snice-time-range-picker matrix — the DRAG GESTURE and the three events.
 *
 * The component's headline is "click-and-drag range selection", and the doc
 * gives the gesture three announcements with three different jobs:
 *
 *   · `time-range-select   → { start, component }` — "Drag begins";
 *   · `time-range-complete → { range, ranges, component }` — "Drag ends";
 *   · `time-range-change   → { ranges, component }` — the selection is now this.
 *
 * and three switches that change what a gesture does:
 *
 *   · `multiple: boolean = false` — accumulate ranges, or replace;
 *   · `readonly: boolean = false` — show a selection, refuse to change it;
 *   · `disabled: boolean = false` — the same, plus dimmed.
 *
 * The matrix crosses the gesture against 3 granularities x 2 selection modes x
 * 3 interactivity states = 18 combos, then pins the individual event contracts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, capturePicker, checkSelection, clickSlot, drag, expectClean,
  json, makePicker, pressSlot, removeComponent, selectedIndices, slotTimes,
  vectorId, wait, type Picker, type PickerVector, type TimeRange,
} from './picker-support';

let el: Picker | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const GRANS = [15, 30, 60] as const;
const STATES = ['live', 'readonly', 'disabled'] as const;

describe('snice-time-range-picker matrix: drag across three slots', () => {
  for (const granularity of GRANS) {
    for (const multiple of [false, true]) {
      for (const state of STATES) {
        const vector: PickerVector = {
          ...DEFAULTS,
          granularity,
          multiple,
          readonly: state === 'readonly',
          disabled: state === 'disabled',
        };
        const id = `${vectorId(vector)}/${state}`;
        it(id, async () => {
          el = await makePicker(vector);
          const slots = slotTimes(el);
          const seen = capturePicker(el);

          await drag(el, 1, 3);

          const interactive = state === 'live';
          const expected: TimeRange[] = interactive
            ? [{ start: slots[1], end: slots[3] }]
            : [];

          const problems = new Problems();
          checkSelection(problems, el, vector, expected);
          problems.equal(
            seen.map(event => event.type).join(','),
            interactive ? 'time-range-select,time-range-complete,time-range-change' : '',
            'the dispatched event sequence',
          );
          expectClean(problems, id);
        });
      }
    }
  }
});

describe('snice-time-range-picker matrix: event details', () => {
  it('time-range-select names the slot the drag began on', async () => {
    // doc: `time-range-select → { start, component } — Drag begins`.
    el = await makePicker({ granularity: 30 });
    const seen = capturePicker(el);
    await drag(el, 2, 4);
    const select = seen.find(event => event.type === 'time-range-select')!;
    expect(select.detail.start).toBe(slotTimes(el)[2]);
    expect(select.detail.component).toBe(el);
  });

  it('time-range-complete carries the finished range AND the whole selection', async () => {
    // doc: `time-range-complete → { range, ranges, component } — Drag ends`.
    // Two fields with two meanings: what this gesture produced, and what is
    // selected now. In `multiple` mode they differ, which is the point.
    el = await makePicker({ granularity: 60, multiple: true, value: json({ start: '08:00', end: '08:00' }) });
    const seen = capturePicker(el);
    await drag(el, 2, 3);

    const complete = seen.find(event => event.type === 'time-range-complete')!;
    expect(complete.detail.range).toEqual({ start: '10:00', end: '11:00' });
    expect(complete.detail.ranges).toEqual([
      { start: '08:00', end: '08:00' },
      { start: '10:00', end: '11:00' },
    ]);
    expect(complete.detail.component).toBe(el);
  });

  it('a backwards drag selects the same span as a forwards one', async () => {
    // A range has no direction; dragging up from 11:00 to 09:00 is the same
    // booking as dragging down from 09:00 to 11:00.
    const vector: PickerVector = { ...DEFAULTS, granularity: 60 };
    el = await makePicker(vector);
    await drag(el, 3, 1);
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '09:00', end: '11:00' }]);
    expectClean(problems, 'backwards drag');
  });

  it('a single-mode drag replaces the previous selection', async () => {
    // `multiple: boolean = false` — one range at a time.
    const vector: PickerVector = { ...DEFAULTS, granularity: 60 };
    el = await makePicker(vector);
    await drag(el, 0, 1);
    await drag(el, 3, 4);
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '11:00', end: '12:00' }]);
    expectClean(problems, 'single replace');
  });

  it('a multiple-mode drag accumulates ranges', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60, multiple: true };
    el = await makePicker(vector);
    await drag(el, 0, 1);
    await drag(el, 3, 4);
    const problems = new Problems();
    checkSelection(problems, el, vector, [
      { start: '08:00', end: '09:00' },
      { start: '11:00', end: '12:00' },
    ]);
    expectClean(problems, 'multiple accumulate');
  });

  it('a single-slot click selects exactly that slot', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 30 };
    el = await makePicker(vector);
    await clickSlot(el, 4);
    const slots = slotTimes(el);
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: slots[4], end: slots[4] }]);
    expectClean(problems, 'single click');
  });

  it('the value property follows every gesture', async () => {
    // `value` is documented as the JSON form of the selection, so a gesture
    // that changes the selection has to change `value` too — that is what makes
    // the picker usable inside a form.
    el = await makePicker({ granularity: 60 });
    await drag(el, 1, 2);
    expect(JSON.parse(el.value)).toEqual([{ start: '09:00', end: '10:00' }]);
  });
});

describe('snice-time-range-picker matrix: keyboard', () => {
  for (const state of STATES) {
    it(`Enter on a slot (${state})`, async () => {
      const vector: PickerVector = {
        ...DEFAULTS,
        granularity: 60,
        readonly: state === 'readonly',
        disabled: state === 'disabled',
      };
      el = await makePicker(vector);
      const seen = capturePicker(el);
      await pressSlot(el, 2, 'Enter');

      const interactive = state === 'live';
      const problems = new Problems();
      checkSelection(problems, el, vector, interactive ? [{ start: '10:00', end: '10:00' }] : []);
      problems.equal(
        seen.map(event => event.type).join(','),
        interactive ? 'time-range-complete,time-range-change' : '',
        'the dispatched event sequence',
      );
      expectClean(problems, `keyboard/${state}`);
    });
  }

  it('Space selects the same slot Enter does', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60 };
    el = await makePicker(vector);
    await pressSlot(el, 1, ' ');
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '09:00', end: '09:00' }]);
    expectClean(problems, 'keyboard/space');
  });

  it('a second Enter in multiple mode deselects the slot', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60, multiple: true };
    el = await makePicker(vector);
    await pressSlot(el, 1, 'Enter');
    expect(selectedIndices(el)).toEqual([1]);
    await pressSlot(el, 1, 'Enter');
    const problems = new Problems();
    checkSelection(problems, el, vector, []);
    expectClean(problems, 'keyboard/toggle');
  });

  it('a second Enter in single mode keeps exactly one slot selected', async () => {
    const vector: PickerVector = { ...DEFAULTS, granularity: 60 };
    el = await makePicker(vector);
    await pressSlot(el, 1, 'Enter');
    await pressSlot(el, 3, 'Enter');
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '11:00', end: '11:00' }]);
    expectClean(problems, 'keyboard/single');
  });
});

describe('snice-time-range-picker matrix: readonly keeps what it was given', () => {
  it('a readonly picker still shows the value it was authored with', async () => {
    // `readonly` is documented next to `disabled` as a separate switch, and the
    // difference between them is only about interaction — a readonly picker
    // still displays its selection.
    const vector: PickerVector = {
      ...DEFAULTS, granularity: 60, readonly: true, value: json({ start: '09:00', end: '10:00' }),
    };
    el = await makePicker(vector);
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '09:00', end: '10:00' }]);
    expectClean(problems, 'readonly display');
  });

  it('the programmatic API still works on a readonly picker', async () => {
    // `readonly` stops the USER, not the page. `setSelectedRanges` is
    // documented without a readonly caveat.
    const vector: PickerVector = { ...DEFAULTS, granularity: 60, readonly: true };
    el = await makePicker(vector);
    el.setSelectedRanges([{ start: '10:00', end: '10:00' }]);
    await wait(30);
    const problems = new Problems();
    checkSelection(problems, el, vector, [{ start: '10:00', end: '10:00' }]);
    expectClean(problems, 'readonly api');
  });
});
