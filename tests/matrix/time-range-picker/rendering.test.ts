/**
 * snice-time-range-picker matrix — the SLOT COLUMN the properties derive.
 *
 * Three documented properties decide, between them, exactly which slots exist
 * and what each one says:
 *
 *   · `granularity: 5|15|30|60 = 15` — the step between slots;
 *   · `startTime = '00:00'` / `endTime = '23:59'` — the window they span;
 *   · `format: '12h'|'24h' = '24h'` — each slot's caption.
 *
 * Nothing about that is approximate, so the matrix is their full cross —
 * 4 granularities x 2 windows x 2 formats = 16 combos — and every slot of every
 * combo is checked against `expectedSlots` / `expectedLabel`, which are the
 * documented arithmetic rather than a reading of the component.
 *
 * The widest combo (a full day at five-minute granularity) renders 288 slots,
 * so this slice is also the one that proves the column scales.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULTS, FORMATS, GRANULARITIES, Problems, WINDOWS, WINDOW_NAMES, checkShell,
  checkSlots, expectClean, expectedSlots, makePicker, removeComponent, slotTimes,
  toMinutes, vectorId, type Picker, type PickerVector,
} from './picker-support';
import { expect } from 'vitest';

let el: Picker | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const COMBOS: PickerVector[] = [];
for (const window of WINDOW_NAMES) {
  for (const granularity of GRANULARITIES) {
    for (const format of FORMATS) {
      COMBOS.push({ ...DEFAULTS, window, granularity, format });
    }
  }
}

describe('snice-time-range-picker matrix: slot column', () => {
  for (const vector of COMBOS) {
    it(vectorId(vector), async () => {
      el = await makePicker(vector);
      const problems = new Problems();
      checkShell(problems, el, vector);
      checkSlots(problems, el, vector);
      expectClean(problems, vectorId(vector));
    });
  }
});

describe('snice-time-range-picker matrix: window arithmetic', () => {
  it('a full day at each granularity holds exactly the slots the step allows', async () => {
    // 24 hours is 1440 minutes; the documented window ends at 23:59, so the
    // last slot is the last multiple of the granularity strictly below 24:00.
    const expected: Record<number, number> = { 5: 288, 15: 96, 30: 48, 60: 24 };
    for (const granularity of GRANULARITIES) {
      const vector: PickerVector = { ...DEFAULTS, window: 'day', granularity };
      el = await makePicker(vector);
      expect(slotTimes(el).length, `granularity=${granularity}`).toBe(expected[granularity]);
      expect(slotTimes(el)[0], `granularity=${granularity} first slot`).toBe('00:00');
      removeComponent(el as HTMLElement);
      el = null;
    }
  });

  it('the last slot is the last one that starts inside the window', async () => {
    for (const granularity of GRANULARITIES) {
      const vector: PickerVector = { ...DEFAULTS, window: 'day', granularity };
      el = await makePicker(vector);
      const slots = slotTimes(el);
      const last = slots[slots.length - 1];
      expect(toMinutes(last), `granularity=${granularity}`)
        .toBeLessThanOrEqual(toMinutes(WINDOWS.day.endTime));
      expect(toMinutes(last) + granularity, `granularity=${granularity} leaves room for another slot`)
        .toBeGreaterThan(toMinutes(WINDOWS.day.endTime));
      removeComponent(el as HTMLElement);
      el = null;
    }
  });

  it('an inclusive window keeps its closing slot', async () => {
    // The doc's `morning` window ends at 12:00, which IS a slot boundary at
    // every documented granularity, so the closing slot must be rendered.
    for (const granularity of GRANULARITIES) {
      const vector: PickerVector = { ...DEFAULTS, granularity };
      el = await makePicker(vector);
      expect(slotTimes(el).at(-1), `granularity=${granularity}`).toBe('12:00');
      expect(slotTimes(el)).toEqual(expectedSlots(vector));
      removeComponent(el as HTMLElement);
      el = null;
    }
  });

  it('the 12h format flips the period at noon and names midnight 12', async () => {
    // `format: '12h'|'24h' = '24h'`; the two edges a 12-hour clock gets wrong
    // are 00:00 (which is 12 AM, not 0 AM) and 12:00 (which is PM).
    el = await makePicker({ window: 'day', granularity: 60, format: '12h' });
    const captions = [...el.shadowRoot.querySelectorAll('.slot-time')]
      .map(node => (node.textContent ?? '').trim());
    expect(captions[0]).toBe('12:00 AM');
    expect(captions[11]).toBe('11:00 AM');
    expect(captions[12]).toBe('12:00 PM');
    expect(captions[13]).toBe('1:00 PM');
    expect(captions[23]).toBe('11:00 PM');
  });

  it('changing the granularity rebuilds the column', async () => {
    // doc lists `granularity` as a property, so a later assignment is as valid
    // as the authored attribute and must re-derive the whole column.
    el = await makePicker({ granularity: 60 });
    expect(slotTimes(el).length).toBe(5);
    el.granularity = 15;
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(slotTimes(el)).toEqual(expectedSlots({ ...DEFAULTS, granularity: 15 }));
  });

  it('changing the window rebuilds the column', async () => {
    el = await makePicker({ granularity: 60 });
    el.startTime = '09:00';
    el.endTime = '11:00';
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(slotTimes(el)).toEqual(['09:00', '10:00', '11:00']);
  });
});
