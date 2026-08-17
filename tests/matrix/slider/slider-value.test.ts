/**
 * snice-slider matrix — THE VALUE LATTICE.
 *
 * One documented sentence carries this whole file: "`value` is live
 * clamped/stepped state; `defaultValue` reflects the `value` attribute. The
 * step lattice starts at `min`, matching native range. Zero, negative, or
 * non-finite steps fall back to `1`."
 *
 * The cross is RANGE x STEP x RAW VALUE. Ranges are chosen so the lattice does
 * and does not divide the span evenly (`0..10@3` leaves 10 off the lattice),
 * so it starts somewhere other than zero (`5..25@5`), and so it is fractional
 * (`0..1@0.1`, the case where naive arithmetic produces 0.30000000000000004).
 * Raw values are chosen at and beyond both bounds, on and between lattice
 * points, and at the exact midpoint between two of them.
 *
 * Every combo is judged against `expectedValue()` — the documented native-range
 * sanitisation written out in `slider-support.ts`, not a copy of the
 * component's own function.
 *
 * The second half is the documented dirty-value lifecycle: "Pristine state
 * follows default changes. Pointer/touch/keyboard input, restore, or any
 * assignment dirties it." and "Reset/restoration are silent."
 */
import { describe, it, afterAll, afterEach, beforeAll } from 'vitest';
import {
  SETTLE,
  combo, expect, expectSliderMatches, expectedValue, installInternalsMock, makeSlider,
  recordEvents, restoreInternalsMock, teardown, thumbOf, wait,
} from './slider-support';

/** Ranges chosen so the lattice divides the span evenly — and so it does not. */
const RANGES = [
  { min: 0, max: 100, step: 1 },
  { min: 0, max: 10, step: 2 },
  { min: 0, max: 10, step: 3 },
  { min: 5, max: 25, step: 5 },
  { min: -50, max: 50, step: 10 },
  { min: 0, max: 1, step: 0.1 },
  { min: 0, max: 100, step: 33 },
];

/** Raw inputs at, between and beyond the interesting points of each range. */
function rawValues(min: number, max: number, step: number): number[] {
  const span = max - min;
  return [
    min - span, min - step, min,
    min + step / 2, min + step, min + span / 3, min + span / 2,
    max - step, max - step / 2, max, max + step, max + span,
  ];
}

describe('snice-slider matrix — value lattice', () => {
  beforeAll(() => installInternalsMock());
  afterAll(() => restoreInternalsMock());
  afterEach(teardown);

  // ── range x step x raw value ─────────────────────────────────────────────
  for (const range of RANGES) {
    it(`snaps every probe onto the ${range.min}..${range.max}@${range.step} lattice`, async () => {
      const problems: string[] = [];
      for (const raw of rawValues(range.min, range.max, range.step)) {
        const el = await makeSlider(combo({ ...range, value: raw }));
        const wanted = expectedValue(raw, range.min, range.max, range.step);
        if (el.value !== wanted) problems.push(`${raw} -> ${el.value}, expected ${wanted}`);
        // Whatever it snapped to must be inside the documented bounds.
        if (el.value < range.min || el.value > range.max) {
          problems.push(`${raw} -> ${el.value} is outside [${range.min}, ${range.max}]`);
        }
        teardown();
      }
      expect(problems, `${range.min}..${range.max}@${range.step}`).toEqual([]);
    });

    it(`the whole rendered shape agrees at ${range.min}..${range.max}@${range.step}`, async () => {
      const c = combo({ ...range, value: range.min + (range.max - range.min) / 2, showValue: true });
      const el = await makeSlider(c);
      expectSliderMatches(el, c);
    });
  }

  // ── the documented step fallbacks ────────────────────────────────────────
  for (const step of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
    it(`step=${String(step)} falls back to a lattice of 1`, async () => {
      const c = combo({ min: 0, max: 10, step, value: 3.4 });
      const el = await makeSlider(c);
      // Documented: zero, negative or non-finite steps behave as `step = 1`.
      expect(el.value).toBe(expectedValue(3.4, 0, 10, 1));
      expect(el.value).toBe(3);
    });
  }

  // ── clamping ─────────────────────────────────────────────────────────────
  it('a value below min clamps up to min', async () => {
    const el = await makeSlider(combo({ min: 10, max: 20, value: -100 }));
    expect(el.value).toBe(10);
  });

  it('a value above max clamps down onto the last lattice point', async () => {
    const el = await makeSlider(combo({ min: 0, max: 10, step: 3, value: 999 }));
    // 0, 3, 6, 9 — 12 would be past `max`.
    expect(el.value).toBe(9);
  });

  it('an inverted range collapses to min', async () => {
    const el = await makeSlider(combo({ min: 10, max: 0, value: 5 }));
    expect(el.value).toBe(expectedValue(5, 10, 0, 1));
    expect(el.value).toBe(10);
  });

  it('a non-finite assignment is ignored rather than adopted', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, value: 40 }));
    el.value = Number.NaN;
    await wait(SETTLE);
    expect(el.value, 'NaN never becomes the value').toBe(40);
  });

  it('a negative range keeps its own lattice origin', async () => {
    const c = combo({ min: -50, max: 50, step: 10, value: -23 });
    const el = await makeSlider(c);
    expectSliderMatches(el, c);
    expect(el.value).toBe(-20);
  });

  // ── the lattice re-runs when the constraints move ────────────────────────
  it('narrowing max pulls the value back onto the lattice', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, value: 90 }));
    el.max = 50;
    await wait(SETTLE);
    expect(el.value).toBe(50);
  });

  it('raising min pushes the value up', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, value: 10 }));
    el.min = 40;
    await wait(SETTLE);
    expect(el.value).toBe(40);
  });

  it('coarsening the step re-snaps the value', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 1, value: 47 }));
    el.step = 10;
    await wait(SETTLE);
    expect(el.value).toBe(expectedValue(47, 0, 100, 10));
    expect(el.value).toBe(50);
  });

  it('aria-valuenow follows the sanitised value, not the raw one', async () => {
    const el = await makeSlider(combo({ min: 0, max: 10, step: 3, value: 999 }));
    expect(thumbOf(el).getAttribute('aria-valuenow')).toBe('9');
  });

  // ── default vs live value ────────────────────────────────────────────────
  it('the value attribute is the documented defaultValue channel', async () => {
    const el = await makeSlider(combo({ defaultValue: 30 }));
    expect(el.defaultValue, 'the attribute reaches defaultValue').toBe(30);
    expect(el.value, 'and seeds the live value while pristine').toBe(30);
  });

  it('a pristine slider follows its default when the default changes', async () => {
    const el = await makeSlider(combo({ defaultValue: 30 }));
    el.defaultValue = 70;
    await wait(SETTLE);
    expect(el.value, 'pristine state follows default changes').toBe(70);
  });

  it('a dirtied slider stops following its default', async () => {
    const el = await makeSlider(combo({ defaultValue: 30 }));
    el.value = 55;
    await wait(SETTLE);

    el.defaultValue = 70;
    await wait(SETTLE);
    expect(el.value, 'any assignment dirties it').toBe(55);
    expect(el.defaultValue, 'while the default still records the author\'s intent').toBe(70);
  });

  it('assigning value does not rewrite the authored default', async () => {
    const el = await makeSlider(combo({ defaultValue: 30 }));
    el.value = 80;
    await wait(SETTLE);
    expect(el.defaultValue).toBe(30);
  });

  it('reset returns the slider to its current default, silently', async () => {
    const el = await makeSlider(combo({ defaultValue: 30 }));
    el.value = 80;
    await wait(SETTLE);

    const events = recordEvents(el);
    el.formResetCallback();
    await wait(SETTLE);

    expect(el.value, 'back to the default').toBe(30);
    expect(events.log, 'reset/restoration are silent').toEqual([]);
  });

  it('a repeated reset is idempotent', async () => {
    const el = await makeSlider(combo({ defaultValue: 25 }));
    el.value = 90;
    await wait(SETTLE);
    el.formResetCallback();
    el.formResetCallback();
    await wait(SETTLE);
    expect(el.value).toBe(25);
  });

  it('reset re-pristines the slider so it follows the default again', async () => {
    const el = await makeSlider(combo({ defaultValue: 30 }));
    el.value = 80;
    await wait(SETTLE);
    el.formResetCallback();
    await wait(SETTLE);

    el.defaultValue = 60;
    await wait(SETTLE);
    expect(el.value, 'pristine again after reset').toBe(60);
  });

  it('a restored value is adopted and dirties the control, silently', async () => {
    const el = await makeSlider(combo({ defaultValue: 30 }));
    const events = recordEvents(el);

    el.formStateRestoreCallback('75');
    await wait(SETTLE);
    expect(el.value, 'the restored value wins').toBe(75);
    expect(events.log, 'restoration is silent').toEqual([]);

    el.defaultValue = 10;
    await wait(SETTLE);
    expect(el.value, 'restore dirties the control').toBe(75);
  });

  it('a restored value still crosses the lattice', async () => {
    const el = await makeSlider(combo({ min: 0, max: 10, step: 3 }));
    el.formStateRestoreCallback('7');
    await wait(SETTLE);
    expect(el.value).toBe(expectedValue(7, 0, 10, 3));
    expect(el.value).toBe(6);
  });

  it('assigning value never emits an event by itself', async () => {
    // The documented events are "During drag" and "After commit" — a script
    // that sets the value already knows it did.
    const el = await makeSlider(combo({ value: 10 }));
    const events = recordEvents(el);
    el.value = 60;
    await wait(SETTLE);
    expect(events.log).toEqual([]);
    expect(el.value).toBe(60);
  });
});
