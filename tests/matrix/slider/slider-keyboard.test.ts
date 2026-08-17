/**
 * snice-slider matrix — KEYBOARD AND EVENTS.
 *
 * "Arrow keys: adjust by step. Home/End: min/max." plus the two documented
 * events, `slider-input` ("During drag") and `slider-change` ("After commit").
 *
 * The cross is KEY x STARTING POSITION x RANGE. Each key has a documented
 * destination that depends on where the thumb already is, and the two ends of
 * the range are where those destinations collapse: an ArrowLeft at `min` must
 * stay at `min` rather than walk off the lattice, and an ArrowRight at `max`
 * must stay at `max`. A slider that clamps in one direction and not the other
 * is a one-line bug and an invisible one at any interior position.
 *
 * Ranges include a fractional lattice, because "adjust by step" with
 * `step = 0.1` is where floating-point drift shows up as `0.30000000000000004`
 * in the value read-out.
 *
 * This is also where the event contract lives, because the keyboard is the
 * documented value path this tier can drive at all — a pointer drag measures
 * `getBoundingClientRect()`, which is zero without layout, so dragging belongs
 * to the visual tier.
 */
import { describe, it, afterAll, afterEach, beforeAll } from 'vitest';
import {
  SETTLE,
  combo, effectiveStep, expect, expectSliderMatches, expectedValue, installInternalsMock,
  makeSlider, pressThumb, recordEvents, restoreInternalsMock, teardown, textOf, thumbOf,
  valueLabelOf, wait,
} from './slider-support';

/** Every documented key and the value it is documented to produce. */
const KEYS: Array<{
  key: string;
  target: (value: number, min: number, max: number, step: number) => number;
}> = [
  { key: 'ArrowRight', target: (v, _min, max, s) => Math.min(max, v + effectiveStep(s)) },
  { key: 'ArrowUp', target: (v, _min, max, s) => Math.min(max, v + effectiveStep(s)) },
  { key: 'ArrowLeft', target: (v, min, _max, s) => Math.max(min, v - effectiveStep(s)) },
  { key: 'ArrowDown', target: (v, min, _max, s) => Math.max(min, v - effectiveStep(s)) },
  { key: 'Home', target: (_v, min) => min },
  { key: 'End', target: (_v, _min, max) => max },
  { key: 'PageUp', target: (v, _min, max, s) => Math.min(max, v + effectiveStep(s) * 10) },
  { key: 'PageDown', target: (v, min, _max, s) => Math.max(min, v - effectiveStep(s) * 10) },
];

const RANGES = [
  { min: 0, max: 100, step: 5 },
  { min: 0, max: 10, step: 1 },
  { min: 0, max: 1, step: 0.1 },
  { min: -50, max: 50, step: 10 },
];

describe('snice-slider matrix — keyboard', () => {
  beforeAll(() => installInternalsMock());
  afterAll(() => restoreInternalsMock());
  afterEach(teardown);

  // ── key x range x position ───────────────────────────────────────────────
  for (const entry of KEYS) {
    for (const range of RANGES) {
      it(`${entry.key} on ${range.min}..${range.max}@${range.step}`, async () => {
        const middle = expectedValue(
          range.min + (range.max - range.min) / 2, range.min, range.max, range.step,
        );
        const problems: string[] = [];

        for (const start of [range.min, middle, range.max]) {
          const el = await makeSlider(combo({ ...range, value: start }));
          const from = el.value;
          const events = recordEvents(el);

          pressThumb(el, entry.key);
          await wait(SETTLE);

          const wanted = expectedValue(
            entry.target(from, range.min, range.max, range.step),
            range.min, range.max, range.step,
          );
          if (el.value !== wanted) {
            problems.push(`from ${from}: ${el.value}, expected ${wanted}`);
          }
          // "During drag" then "After commit": one of each, in that order.
          if (events.log.join(',') !== 'slider-input,slider-change') {
            problems.push(`from ${from}: events ${events.log.join(',') || 'none'}`);
          }
          if (el.value < range.min || el.value > range.max) {
            problems.push(`from ${from}: ${el.value} left the range`);
          }
          teardown();
        }
        expect(problems, `${entry.key} on ${range.min}..${range.max}@${range.step}`).toEqual([]);
      });
    }
  }

  // ── the boundaries hold ──────────────────────────────────────────────────
  it('ArrowLeft at min stays at min', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 5, value: 0 }));
    pressThumb(el, 'ArrowLeft');
    await wait(SETTLE);
    expect(el.value).toBe(0);
  });

  it('ArrowRight at max stays at max', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 5, value: 100 }));
    pressThumb(el, 'ArrowRight');
    await wait(SETTLE);
    expect(el.value).toBe(100);
  });

  it('PageUp cannot overshoot max', async () => {
    const el = await makeSlider(combo({ min: 0, max: 10, step: 1, value: 5 }));
    pressThumb(el, 'PageUp');
    await wait(SETTLE);
    expect(el.value).toBe(10);
  });

  it('PageDown cannot undershoot min', async () => {
    const el = await makeSlider(combo({ min: 0, max: 10, step: 1, value: 5 }));
    pressThumb(el, 'PageDown');
    await wait(SETTLE);
    expect(el.value).toBe(0);
  });

  it('Home and End land exactly on the documented bounds', async () => {
    const el = await makeSlider(combo({ min: 5, max: 25, step: 5, value: 15 }));
    pressThumb(el, 'Home');
    await wait(SETTLE);
    expect(el.value).toBe(5);

    pressThumb(el, 'End');
    await wait(SETTLE);
    expect(el.value).toBe(25);
  });

  // ── keys the slider does not own ─────────────────────────────────────────
  it('an unrelated key changes nothing and announces nothing', async () => {
    const el = await makeSlider(combo({ value: 40 }));
    const events = recordEvents(el);
    for (const key of ['a', 'Tab', 'Enter', ' ', 'Escape']) pressThumb(el, key);
    await wait(SETTLE);
    expect(el.value).toBe(40);
    expect(events.log).toEqual([]);
  });

  // ── the event contract ───────────────────────────────────────────────────
  it('each key press emits slider-input then slider-change with { value, slider }', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 10, value: 40 }));
    const events = recordEvents(el);

    pressThumb(el, 'ArrowRight');
    await wait(SETTLE);

    expect(events.log).toEqual(['slider-input', 'slider-change']);
    expect(events.details).toEqual([
      { value: 50, slider: el },
      { value: 50, slider: el },
    ]);
  });

  it('the events bubble and are composed', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 10, value: 40 }));
    const seen: string[] = [];
    const listener = (event: Event) => seen.push(event.type);
    document.addEventListener('slider-input', listener);
    document.addEventListener('slider-change', listener);

    pressThumb(el, 'ArrowRight');
    await wait(SETTLE);

    document.removeEventListener('slider-input', listener);
    document.removeEventListener('slider-change', listener);
    expect(seen).toEqual(['slider-input', 'slider-change']);
  });

  it('a press that cannot move the value still reports the value it kept', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 10, value: 100 }));
    const events = recordEvents(el);
    pressThumb(el, 'ArrowRight');
    await wait(SETTLE);
    expect(el.value).toBe(100);
    expect(events.details.map((detail: any) => detail.value)).toEqual([100, 100]);
  });

  // ── the keyboard walks the lattice, not the reals ────────────────────────
  it('repeated presses walk the fractional lattice without drifting', async () => {
    const el = await makeSlider(combo({ min: 0, max: 1, step: 0.1, value: 0, showValue: true }));
    const seen: number[] = [];
    for (let i = 0; i < 10; i++) {
      pressThumb(el, 'ArrowRight');
      await wait(10);
      seen.push(el.value);
    }
    expect(seen).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    expect(textOf(valueLabelOf(el)), 'and the read-out shows a clean number').toBe('1.0');
  });

  it('a walk up and back down returns to where it started', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 7, value: 0 }));
    for (let i = 0; i < 5; i++) { pressThumb(el, 'ArrowRight'); await wait(5); }
    for (let i = 0; i < 5; i++) { pressThumb(el, 'ArrowLeft'); await wait(5); }
    expect(el.value).toBe(0);
  });

  it('the rendered shape stays consistent after a keyboard walk', async () => {
    const c = combo({ min: 0, max: 100, step: 10, value: 30, showValue: true, showTicks: true });
    const el = await makeSlider(c);
    pressThumb(el, 'ArrowRight');
    pressThumb(el, 'ArrowRight');
    await wait(SETTLE);
    expectSliderMatches(el, combo({ ...c, value: 50, id: 'after walk' }));
  });

  it('aria-valuenow tracks each key press', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 25, value: 0 }));
    for (const expected of ['25', '50', '75', '100', '100']) {
      pressThumb(el, 'ArrowUp');
      await wait(10);
      expect(thumbOf(el).getAttribute('aria-valuenow')).toBe(expected);
    }
  });

  it('the keyboard dirties the control, so it stops following the default', async () => {
    // "Pointer/touch/keyboard input, restore, or any assignment dirties it."
    const el = await makeSlider(combo({ defaultValue: 20, min: 0, max: 100, step: 10 }));
    pressThumb(el, 'ArrowRight');
    await wait(SETTLE);
    expect(el.value).toBe(30);

    el.defaultValue = 80;
    await wait(SETTLE);
    expect(el.value, 'dirty controls ignore default changes').toBe(30);
  });
});
