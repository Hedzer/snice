/**
 * Smoke slice of the snice-step-input matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the 216-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family, each chosen because it is the only place a
 * whole documented rule can break: the min-based lattice, the boundary cue,
 * `wrap`, the `value-change` contract, the barred states, and the
 * default/live/reset split. Structural assertions route through the matrix's
 * own oracle, so this file cannot drift into asserting something weaker than
 * the suite it stands in for.
 *
 * It also carries the two FIXED findings' marquee cases, kept where the
 * everyday loop runs them as regression guards (MATRIX-step-input-1/-2).
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { expectShape, click, unmountAll } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock, submittedEntry } from '../internals-mock';
import {
  mountStepInput, tick, normalize, expectedShape, readShape,
  incrementButton, decrementButton, inputPart, recordValueChange, pressKey,
  reachableMax,
} from './step-input-support';
import '../../../packages/components/src/step-input/snice-step-input';

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

describe('step-input matrix smoke', () => {
  it('a value snaps to the min-based lattice and clamps to the range', async () => {
    const vector = { min: 1, max: 21, step: 5 };
    const el = await mountStepInput(vector);
    el.value = 9;
    await tick(el);
    // The lattice is 1, 6, 11, 16, 21 — anchored at min, not at zero.
    expect(el.value).toBe(11);
    expect(normalize(9, 1, 21, 5)).toBe(11);

    el.value = 100;
    await tick(el);
    expect(el.value).toBe(21);
    expectShape(readShape(el), expectedShape(vector, 21), 'smoke/lattice');
  });

  it('the boundary disables the button that can no longer move', async () => {
    const el = await mountStepInput({ min: 0, max: 10, step: 5, defaultValue: 10 });
    expect(incrementButton(el)?.disabled, 'increment at max').toBe(true);
    expect(decrementButton(el)?.disabled, 'decrement at max').toBe(false);
    expect(reachableMax(0, 10, 5)).toBe(10);
  });

  it('wrap turns the boundary into a lap', async () => {
    const el = await mountStepInput({ min: 1, max: 12, step: 1, defaultValue: 12, wrap: true });
    expect(incrementButton(el)?.disabled, 'wrap left the button disabled').toBe(false);
    const seen = recordValueChange(el);
    el.increment();
    await tick(el);
    expect(el.value).toBe(1);
    expect(seen).toEqual([{ value: 1, oldValue: 12, isComponent: true }]);
  });

  it('every entry point takes the same documented step', async () => {
    for (const entry of ['method', 'button', 'key'] as const) {
      const el = await mountStepInput({ min: 0, max: 10, step: 2, defaultValue: 4 });
      const seen = recordValueChange(el);
      if (entry === 'method') el.increment();
      else if (entry === 'button') click(incrementButton(el));
      else pressKey(el, 'ArrowUp');
      await tick(el);

      expect(el.value, `${entry} step`).toBe(6);
      expect(inputPart(el)?.value, `${entry} rendered`).toBe('6');
      expect(seen, `${entry} events`).toEqual([{ value: 6, oldValue: 4, isComponent: true }]);
      el.remove();
    }
  });

  it('a disabled control refuses to move and submits nothing', async () => {
    const el = await mountStepInput({ name: 'qty', min: 0, max: 10, defaultValue: 4, disabled: true });
    const seen = recordValueChange(el);
    el.increment();
    click(incrementButton(el));
    pressKey(el, 'ArrowUp');
    await tick(el);
    expect(el.value).toBe(4);
    expect(seen).toEqual([]);
    expect(inputPart(el)?.disabled).toBe(true);
    expect(el.willValidate).toBe(false);
  });

  it('the value attribute is the default; reset restores it silently', async () => {
    const el = await mountStepInput({ name: 'qty', min: 0, max: 10, defaultValue: 5 });
    expect(el.defaultValue).toBe(5);
    expect(submittedEntry(el)).toEqual(['qty', '5']);

    el.value = 9;
    await tick(el);
    expect(el.defaultValue, 'assignment rewrote the default').toBe(5);
    expect(submittedEntry(el)).toEqual(['qty', '9']);

    const seen = recordValueChange(el);
    el.formResetCallback();
    await tick(el);
    expect(el.value).toBe(5);
    expect(seen, 'reset dispatched value-change').toEqual([]);
  });
});

/**
 * The FIXED findings' marquee cases, kept where the everyday loop runs them.
 * Both assert the DOCUMENTED behavior that the source now delivers.
 */
describe('step-input matrix smoke: fixed findings', () => {
  it(
    'MATRIX-step-input-1 (fixed): a step that cannot move the value dispatches nothing',
    async () => {
      // min=1 max=12 step=5 admits 1, 6, 11 — so 11 is the top, and stepping up
      // from it targets 12, which the lattice seats back on 11 before the
      // change guard: no move, no event.
      const el = await mountStepInput({ min: 1, max: 12, step: 5, defaultValue: 11 });
      expect(el.value).toBe(11);
      const seen = recordValueChange(el);
      el.increment();
      await tick(el);
      expect(el.value).toBe(11);
      expect(seen).toEqual([]);
    },
  );

  it(
    'MATRIX-step-input-2 (fixed): the boundary cue appears at the top value the lattice admits',
    async () => {
      const el = await mountStepInput({ min: 1, max: 12, step: 5, defaultValue: 12 });
      expect(el.value).toBe(11);
      expect(incrementButton(el)?.disabled,
        'increment is live at the highest value the control can hold').toBe(true);
    },
  );
});
