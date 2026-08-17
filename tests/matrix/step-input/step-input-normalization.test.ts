/**
 * MATRIX slice — snice-step-input: the documented normalization lattice.
 *
 * Dimensions (docs/ai/components/step-input.md, "Value and form lifecycle"):
 *   assigned value (6) x constraint range (4) x step (4) = 96 combos
 *
 * "Values clamp and snap to a `min`-based step lattice; zero, negative, or
 * non-finite steps fall back to `1`." That single sentence is the whole
 * contract this slice grades, and it has more corners than it looks:
 *
 *   · a value below `min` or above `max` clamps, and clamping happens BEFORE
 *     snapping, so the snap can push it back out at either end;
 *   · the lattice is anchored at `min`, not at zero, so `min=1 step=5` admits
 *     1, 6, 11 — never 0, 5, 10;
 *   · a range whose width is not a whole number of steps has a last legal point
 *     strictly below `max`, and the value must land on THAT, not on `max`;
 *   · a `step` of 0 or -2 is not a lattice at all and falls back to 1.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, unmountAll } from '../matrix-utils';
import {
  mountStepInput, tick, normalize, inputPart, recordValueChange,
} from './step-input-support';
import '../../../packages/components/src/step-input/snice-step-input';

/**
 * Constraint ranges, each chosen so a DIFFERENT part of the sentence decides
 * the answer.
 */
const RANGES = [
  // No bounds at all: the lattice is anchored at zero and nothing clamps.
  { id: 'unbounded', min: undefined, max: undefined },
  // A plain range whose width is a whole number of unit steps.
  { id: '0..10', min: 0, max: 10 },
  // A min-anchored lattice that shares no point with a zero-anchored one.
  { id: '1..12', min: 1, max: 12 },
  // Negative territory, and a width that is NOT a whole number of 5s, so the
  // "last legal point below max" branch has to fire.
  { id: '-7..7', min: -7, max: 7 },
] as const;

const STEPS = [1, 0.5, 5, 0] as const;
const VALUES = [-9, 0, 3, 7.4, 12, 100] as const;

const COMBOS = product({ range: RANGES, step: STEPS, value: VALUES });

afterEach(() => { unmountAll(); });

describe(`step-input matrix: the normalization lattice (${COMBOS.length} combos)`, () => {
  for (const combo of COMBOS) {
    const id = `${combo.range.id}/step=${combo.step}/assign=${combo.value}`;
    it(id, async () => {
      const el = await mountStepInput({
        min: combo.range.min,
        max: combo.range.max,
        step: combo.step,
      });
      const seen = recordValueChange(el);

      el.value = combo.value;
      await tick(el);

      const expected = normalize(
        combo.value,
        combo.range.min ?? -Infinity,
        combo.range.max ?? Infinity,
        combo.step,
      );
      expect(el.value, `value ${id}`).toBe(expected);
      // The rendered input always shows the NORMALIZED number, never the raw
      // assignment: `value` is documented as "live normalized state".
      expect(inputPart(el)?.value, `rendered ${id}`).toBe(String(expected));
      // "any live assignment dirties it" — assignment is not a user change, so
      // it is not a `value-change` either. The docs list `value-change` under
      // the user-facing surface and describe assignment as state, not an event.
      expect(seen, `events ${id}`).toEqual([]);
    });
  }
});

/**
 * The lattice's own arithmetic, asserted directly so the rule is legible
 * without reading the oracle. Each case names the clause it comes from.
 */
describe('step-input matrix: the documented lattice, case by case', () => {
  const CASES: Array<{ why: string; args: [number, number, number, number]; want: number }> = [
    { why: 'clamps above max', args: [100, 0, 10, 1], want: 10 },
    { why: 'clamps below min', args: [-100, 0, 10, 1], want: 0 },
    { why: 'snaps to the nearest unit step', args: [3.4, 0, 10, 1], want: 3 },
    { why: 'snaps up at the halfway point', args: [3.5, 0, 10, 1], want: 4 },
    { why: 'anchors the lattice at min, not zero', args: [3, 1, 12, 5], want: 1 },
    { why: 'anchors the lattice at min, not zero (next point)', args: [5, 1, 12, 5], want: 6 },
    { why: 'never exceeds max even when the lattice would', args: [12, 1, 12, 5], want: 11 },
    { why: 'a fractional step is a lattice too', args: [3.3, 0, 10, 0.5], want: 3.5 },
    { why: 'step 0 falls back to 1', args: [3.6, 0, 10, 0], want: 4 },
    { why: 'a negative step falls back to 1', args: [3.6, 0, 10, -2], want: 4 },
    { why: 'a non-finite step falls back to 1', args: [3.6, 0, 10, NaN], want: 4 },
    { why: 'an unbounded lattice is anchored at zero', args: [7.4, -Infinity, Infinity, 5], want: 5 },
  ];

  for (const { why, args, want } of CASES) {
    it(`${why}: normalize(${args.join(', ')}) = ${want}`, async () => {
      expect(normalize(...args)).toBe(want);
      const [value, min, max, step] = args;
      const el = await mountStepInput({
        min: Number.isFinite(min) ? min : undefined,
        max: Number.isFinite(max) ? max : undefined,
        step,
      });
      el.value = value;
      await tick(el);
      expect(el.value).toBe(want);
    });
  }
});

/**
 * "Normalization leaves no residual min/max/step mismatch."
 *
 * Graded against the LATTICE ITSELF rather than against `input.validity`. The
 * native reading is the better assertion and it is made — in the visual tier
 * (tests/live/matrix/step-input), where a real engine computes it. happy-dom's
 * ValidityState is not usable for this claim: a plain, component-free
 * `<input type="number" min="1" max="12" step="5" value="1">` reports
 * `stepMismatch` there, and `min=""` (HTML's "no minimum") reports
 * `rangeUnderflow` for any negative value. Both are correct per this
 * environment and wrong per HTML, whose step base IS the `min` attribute — so
 * asserting them here would grade the environment, not the component.
 */
describe('step-input matrix: normalization leaves no residual mismatch', () => {
  for (const range of RANGES) {
    for (const step of STEPS) {
      const id = `${range.id}/step=${step}`;
      it(id, async () => {
        const el = await mountStepInput({ min: range.min, max: range.max, step });
        const min = range.min ?? -Infinity;
        const max = range.max ?? Infinity;
        const unit = Number.isFinite(step) && step > 0 ? step : 1;
        const base = Number.isFinite(min) ? min : 0;

        for (const value of VALUES) {
          el.value = value;
          await tick(el);
          const settled = el.value as number;
          expect(settled, `${id} still in range after ${value}`)
            .toBeGreaterThanOrEqual(min);
          expect(settled, `${id} still in range after ${value}`)
            .toBeLessThanOrEqual(max);
          // On the lattice: an exact number of steps from the anchor, up to the
          // precision a double can name.
          const steps = (settled - base) / unit;
          expect(Math.abs(steps - Math.round(steps)), `${id} off-lattice after ${value}`)
            .toBeLessThan(1e-9);
        }
      });
    }
  }
});

/**
 * A non-finite assignment is not a number the control can hold. The docs give
 * `value: number` with no other spelling, and every documented operation on it
 * ("clamp and snap") is undefined on NaN — so the last good value stands.
 */
describe('step-input matrix: a non-finite assignment cannot displace a value', () => {
  for (const bad of [NaN, Infinity, -Infinity]) {
    it(`assigning ${bad} leaves the value alone`, async () => {
      const el = await mountStepInput({ defaultValue: 4, min: 0, max: 10 });
      expect(el.value).toBe(4);
      el.value = bad;
      await tick(el);
      expect(el.value).toBe(4);
      expect(inputPart(el)?.value).toBe('4');
    });
  }
});
