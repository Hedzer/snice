/**
 * snice-switch — render matrix.
 *
 * 3 sizes x {checked} x {disabled} x {loading} x {required} x {stateLabels}
 * = 96 combos, each asserted against `expectedShape` (docs-derived).
 * `invalid` is folded in as a second pass over the same vector rather than a
 * seventh axis, because it is documented as presentation-only and interacts
 * with exactly one output (`aria-invalid`).
 */
import { describe, it, afterEach } from 'vitest';
import { product, comboId, expectShape } from '../matrix-utils';
import {
  SIZES, mountSwitch, expectedShape, readShape, type SwitchCombo,
} from './switch-support';

const combos = product({
  size: SIZES,
  checked: [false, true],
  disabled: [false, true],
  loading: [false, true],
  required: [false, true],
  stateLabels: [false, true],
});

afterEach(() => { document.body.innerHTML = ''; });

describe('snice-switch render matrix', () => {
  for (const base of combos) {
    const combo = { ...base, invalid: false } as SwitchCombo;
    it(comboId(combo), async () => {
      const el = await mountSwitch(combo);
      expectShape(readShape(el), expectedShape(combo), comboId(combo));
    });
  }
});

/**
 * `invalid` is "visual/ARIA presentation only": it must set `aria-invalid` and
 * must NOT make the control constraint-invalid. Sampled across the vectors where
 * the calculated error could collide with it (required x checked x blocked).
 */
describe('snice-switch invalid presentation matrix', () => {
  const invalidCombos = product({
    checked: [false, true],
    disabled: [false, true],
    loading: [false, true],
    required: [false, true],
  });
  for (const base of invalidCombos) {
    const combo = { ...base, size: 'medium', stateLabels: false, invalid: true } as SwitchCombo;
    it(comboId(combo), async () => {
      const el = await mountSwitch(combo);
      expectShape(readShape(el), expectedShape(combo), comboId(combo));
    });
  }
});
