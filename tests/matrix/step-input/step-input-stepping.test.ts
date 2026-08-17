/**
 * MATRIX slice — snice-step-input: stepping, boundaries, and `wrap`.
 *
 * Dimensions (docs/ai/components/step-input.md):
 *   bounded range (3) x wrap (2) x start position (4) x direction (2) = 48,
 *   then the same range x wrap x position (24) again through the button and
 *   the arrow key, in both directions = 72 combos in total.
 *
 * The entry points are the documented ways a value moves by one step, and they
 * are crossed rather than sampled because the docs give them ONE contract and
 * three surfaces:
 *
 *   · `increment()` / `decrement()`  — "Increase/Decrease value by step";
 *   · the `+` / `-` buttons          — "Numeric stepper control with visible
 *                                       +/- buttons";
 *   · `ArrowUp` / `ArrowDown`        — "ArrowUp: increment by step".
 *
 * The start positions put the value where a DIFFERENT clause decides the
 * answer: on the minimum, in the middle, on the maximum, and off the lattice
 * entirely (which the mount normalizes before stepping even begins).
 *
 * Crossed with these:
 *   · `wrap: boolean = false  // wrap around at min/max boundaries` — a bounded
 *     control at its maximum wraps to the minimum instead of standing still;
 *   · "Buttons disabled at min/max (unless `wrap` is set)" — so without `wrap`
 *     the boundary is announced, not merely enforced;
 *   · "`value-change` -> `{ value, oldValue, component }`" — dispatched for a
 *     step that MOVES the value, and not for one that cannot.
 *
 * Every assertion is the DOCUMENTED expectation. Two combos diverge and are
 * pinned rather than softened:
 *
 *   MATRIX-step-input-1 — `min=1 max=12 step=5`, no `wrap`, value at the
 *     highest lattice point (11), `increment()`: the step targets `max` (12),
 *     the lattice snaps it straight back to 11, and a `value-change` carrying
 *     `{ value: 11, oldValue: 11 }` is dispatched for a value that never moved.
 *   MATRIX-step-input-2 — the same control at 11: `increment` stays ENABLED
 *     although no step can ever move the value, so the documented "Buttons
 *     disabled at min/max" cue never appears for a range whose width is not a
 *     whole number of steps.
 *
 * Both keep the documented assertion and are declared `it.fails`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, click, unmountAll } from '../matrix-utils';
import {
  mountStepInput, tick, normalize, expectedIncrement, expectedDecrement,
  expectedButtonDisabled, decrementButton, incrementButton, inputPart,
  recordValueChange, pressKey, emitsPhantomChange, reachableMax,
} from './step-input-support';
import '../../../packages/components/src/step-input/snice-step-input';

/** Bounded ranges — `wrap` has no meaning without both bounds. */
const RANGES = [
  { id: '0..10', min: 0, max: 10, step: 1 },
  // A min-anchored lattice whose points are 1, 6, 11 — so "the last point below
  // max" is 11, not 12.
  { id: '1..12/5', min: 1, max: 12, step: 5 },
  // A fractional lattice, where a naive `value + step` accumulates error.
  { id: '0..2/0.25', min: 0, max: 2, step: 0.25 },
] as const;

/** Where the value starts, in terms the range itself defines. */
const POSITIONS = ['at-min', 'middle', 'at-max', 'off-lattice'] as const;
type Position = typeof POSITIONS[number];

function startValue(range: typeof RANGES[number], position: Position): number {
  switch (position) {
    case 'at-min': return range.min;
    case 'at-max': return range.max;
    case 'middle': return normalize((range.min + range.max) / 2, range.min, range.max, range.step);
    // Deliberately between two lattice points; the mount normalizes it, and
    // the step then runs from THAT value.
    case 'off-lattice': return (range.min + range.max) / 2 + range.step / 3;
  }
}

afterEach(() => { unmountAll(); });

/**
 * The full cross of range x wrap x position x direction, each exercised through
 * every entry point that can express that direction.
 */
const STEP_COMBOS = product({
  range: RANGES,
  wrap: [false, true],
  position: POSITIONS,
  direction: ['up', 'down'] as const,
});

describe(`step-input matrix: stepping x boundaries x wrap (${STEP_COMBOS.length} combos)`, () => {
  for (const combo of STEP_COMBOS) {
    const { min, max, step } = combo.range;
    const start = normalize(startValue(combo.range, combo.position), min, max, step);
    const phantom = emitsPhantomChange(start, min, max, step, combo.wrap, combo.direction);
    const id = `${phantom ? 'MATRIX-step-input-1: ' : ''}${combo.range.id}`
      + `/${combo.wrap ? 'wrap' : 'clamp'}/${combo.position}/${combo.direction}`;

    (phantom ? it.fails : it)(id, async () => {
      const el = await mountStepInput({
        min, max, step, wrap: combo.wrap,
        defaultValue: startValue(combo.range, combo.position),
      });

      const before = el.value as number;
      // The mount already normalized the authored default, so the starting
      // point is a lattice point whatever the position asked for.
      expect(before, `${id} start normalized`)
        .toBe(normalize(startValue(combo.range, combo.position), min, max, step));

      const expected = combo.direction === 'up'
        ? expectedIncrement(before, min, max, step, combo.wrap)
        : expectedDecrement(before, min, max, step, combo.wrap);

      // The buttons announce the boundary BEFORE anything is pressed.
      const buttons = expectedButtonDisabled(before, min, max, combo.wrap, false);
      expect(decrementButton(el)?.disabled, `${id} decrement disabled`).toBe(buttons.decrement);
      expect(incrementButton(el)?.disabled, `${id} increment disabled`).toBe(buttons.increment);

      const seen = recordValueChange(el);
      if (combo.direction === 'up') el.increment(); else el.decrement();
      await tick(el);

      expect(el.value, `${id} value after step`).toBe(expected);
      expect(inputPart(el)?.value, `${id} rendered after step`).toBe(String(expected));

      // "value-change -> { value, oldValue, component }", and only when the
      // value actually moved.
      if (expected === before) {
        expect(seen, `${id} events for a step that changes nothing`).toEqual([]);
      } else {
        expect(seen, `${id} events`).toEqual([
          { value: expected, oldValue: before, isComponent: true },
        ]);
      }
    });
  }
});

/**
 * The same contract through the other three surfaces. One entry point per test
 * against the same expectation function, so a button that stepped differently
 * from `increment()` would fail here and nowhere else.
 */
describe('step-input matrix: every entry point takes the same step', () => {
  const SURFACE_COMBOS = product({
    range: RANGES,
    wrap: [false, true],
    position: POSITIONS,
  });

  for (const combo of SURFACE_COMBOS) {
    const id = `${combo.range.id}/${combo.wrap ? 'wrap' : 'clamp'}/${combo.position}`;

    const { min, max, step } = combo.range;
    const seated = normalize(startValue(combo.range, combo.position), min, max, step);
    const phantom = emitsPhantomChange(seated, min, max, step, combo.wrap, 'up')
      || emitsPhantomChange(seated, min, max, step, combo.wrap, 'down');

    (phantom ? it.fails : it)(
      `${phantom ? 'MATRIX-step-input-1: ' : ''}${id}: button and ArrowUp/ArrowDown`
      + ' agree with increment()/decrement()', async () => {
      const start = startValue(combo.range, combo.position);

      for (const direction of ['up', 'down'] as const) {
        const expectedFor = (value: number) => direction === 'up'
          ? expectedIncrement(value, min, max, step, combo.wrap)
          : expectedDecrement(value, min, max, step, combo.wrap);

        for (const entry of ['button', 'key'] as const) {
          const el = await mountStepInput({
            min, max, step, wrap: combo.wrap, defaultValue: start,
          });
          const before = el.value as number;
          const expected = expectedFor(before);
          const seen = recordValueChange(el);

          if (entry === 'button') {
            const button = direction === 'up' ? incrementButton(el) : decrementButton(el);
            // A disabled button cannot be pressed — that is what disabling it
            // is FOR, and clicking it anyway must change nothing.
            if (!button?.disabled) click(button);
          } else {
            pressKey(el, direction === 'up' ? 'ArrowUp' : 'ArrowDown');
          }
          await tick(el);

          expect(el.value, `${id}/${entry}/${direction}`).toBe(expected);
          if (expected !== before) {
            expect(seen, `${id}/${entry}/${direction} events`).toEqual([
              { value: expected, oldValue: before, isComponent: true },
            ]);
          } else {
            expect(seen, `${id}/${entry}/${direction} events`).toEqual([]);
          }
          el.remove();
        }
      }
    });
  }
});

/**
 * The documented usage example `<snice-step-input min="1" max="12" value="1"
 * wrap>`, walked all the way round in both directions. A wrap that only worked
 * once, or that skipped a point on the way back, cannot survive this.
 */
describe('step-input matrix: the documented wrap example goes all the way round', () => {
  it('1..12 with wrap steps 1→12 and back, hitting every point', async () => {
    const el = await mountStepInput({ min: 1, max: 12, step: 1, defaultValue: 1, wrap: true });
    const seenUp: number[] = [el.value];
    for (let i = 0; i < 12; i++) { el.increment(); await tick(el); seenUp.push(el.value); }
    // Twelve points, then back to the first.
    expect(seenUp).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]);

    const seenDown: number[] = [el.value];
    for (let i = 0; i < 12; i++) { el.decrement(); await tick(el); seenDown.push(el.value); }
    expect(seenDown).toEqual([1, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('without wrap the same control stops at each end and says so', async () => {
    const el = await mountStepInput({ min: 1, max: 12, step: 1, defaultValue: 12 });
    expect(incrementButton(el)?.disabled, 'increment at max').toBe(true);
    expect(decrementButton(el)?.disabled, 'decrement at max').toBe(false);
    const seen = recordValueChange(el);
    el.increment();
    await tick(el);
    expect(el.value).toBe(12);
    expect(seen).toEqual([]);

    el.value = 1;
    await tick(el);
    expect(decrementButton(el)?.disabled, 'decrement at min').toBe(true);
    expect(incrementButton(el)?.disabled, 'increment at min').toBe(false);
    el.decrement();
    await tick(el);
    expect(el.value).toBe(1);
  });
});

/**
 * FINDING MATRIX-step-input-2.
 *
 * "Buttons disabled at min/max (unless `wrap` is set)" is the documented
 * boundary cue: when a step can no longer move the value, the button says so.
 * In a range whose width is not a whole number of steps the maximum is not a
 * value the control can hold, so the cue is attached to a state the control can
 * never reach — and at the highest value it CAN hold, the increment button
 * stays enabled and does nothing.
 *
 * The assertion is not weakened: pressing the increment button at the top of a
 * range must either move the value or be disabled.
 */
describe('step-input matrix: the boundary cue at an unreachable maximum', () => {
  it.fails(
    'MATRIX-step-input-2: min=1 max=12 step=5 disables increment at its top value (11)',
    async () => {
      const el = await mountStepInput({ min: 1, max: 12, step: 5, defaultValue: 12 });
      // 12 is not on the lattice 1, 6, 11 — the control settles on 11.
      expect(el.value).toBe(11);
      expect(reachableMax(1, 12, 5)).toBe(11);
      expect(incrementButton(el)?.disabled,
        'increment is live at the highest value the control can hold').toBe(true);
    },
  );

  it('the same range with a whole number of steps does announce its boundary', async () => {
    // 1..11 step 5 has lattice points 1, 6, 11 and a maximum that IS one of
    // them, so the documented cue fires exactly as written.
    const el = await mountStepInput({ min: 1, max: 11, step: 5, defaultValue: 11 });
    expect(el.value).toBe(11);
    expect(reachableMax(1, 11, 5)).toBe(11);
    expect(incrementButton(el)?.disabled).toBe(true);
    expect(decrementButton(el)?.disabled).toBe(false);
  });
});
