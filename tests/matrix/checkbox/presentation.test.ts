/**
 * snice-checkbox matrix — presentation slice.
 *
 * SIZING. The cross here is size x checkedness-state x gate (3 x 4 x 4 = 48),
 * with `required` and `invalid` ROTATED across it rather than crossed. That is
 * deliberate: `size` is a class hook, and `required`/`invalid` are single
 * attributes, so crossing them would quadruple the file to restate the same
 * mapping. The two axes that genuinely interact are checkedness (which decides
 * `aria-checked`, including the documented `mixed`) and the gate (which decides
 * native disabledness AND whether an unchecked `required` box reports an error
 * at all) — and those two ARE fully crossed.
 */
import { describe, it, afterEach, beforeEach } from 'vitest';
import { unmountAll, product, comboId, expectShape } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  SIZES, STATES, GATES, mountCheckbox, expectedShape, readShape, type CheckboxCombo,
} from './checkbox-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

describe('checkbox matrix: size x state x gate', () => {
  const combos = product({ size: SIZES, state: STATES, gate: GATES });
  combos.forEach((base, index) => {
    // The rotation: every (required, invalid) cell is visited across the cross,
    // and every combo carries a definite value for both.
    const combo: CheckboxCombo = {
      ...base,
      required: index % 2 === 0,
      invalid: index % 4 >= 2,
    };
    const label = comboId(combo);
    it(label, async () => {
      const el = await mountCheckbox(combo);
      expectShape(readShape(el), expectedShape(combo), label);
    });
  });
});
