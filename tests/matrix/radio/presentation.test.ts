/**
 * snice-radio matrix — presentation slice.
 *
 * SIZING. variant x size x gate x checked (2 x 3 x 4 x 2 = 48), with
 * `required`, `invalid` and `description` ROTATED across the cross. The four
 * axes that are crossed are the ones that genuinely interact: `variant` decides
 * whether the `content`/`description` parts exist at all, `gate` decides
 * whether the dot or the spinner is rendered AND whether an unchecked required
 * member reports a calculated error, and `checked` decides that error with it.
 */
import { describe, it, afterEach, beforeEach, expect } from 'vitest';
import { unmountAll, product, comboId, expectShape, finding } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  SIZES, VARIANTS, GATES, DESCRIPTION, mountGroup, expectedShape, readShape,
  shadowSuffixAssigned, type RadioCombo,
} from './radio-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

describe('radio matrix: variant x size x gate x checked', () => {
  const combos = product({ variant: VARIANTS, size: SIZES, gate: GATES, checked: [false, true] });
  combos.forEach((base, index) => {
    const combo: RadioCombo = {
      ...base,
      required: index % 2 === 0,
      invalid: index % 4 >= 2,
      description: index % 3 === 0,
    };
    const label = comboId(combo);
    it(label, async () => {
      const [radio] = await mountGroup([{
        variant: combo.variant,
        size: combo.size,
        gate: combo.gate,
        required: combo.required,
        invalid: combo.invalid,
        description: combo.description ? DESCRIPTION : undefined,
        defaultChecked: combo.checked,
      }]);

      expectShape(readShape(radio), expectedShape(combo), label);
    });
  });
});

describe('radio matrix: the suffix slot', () => {
  /** DOCUMENTED ("Presentation"): "Slot: `suffix`" — listed unconditionally. */
  const assertSuffix = async (variant: typeof VARIANTS[number]) => {
    const [radio] = await mountGroup([{ variant, suffix: true }]);
    expect(shadowSuffixAssigned(radio), `${variant}: suffix`).toEqual(['$29/mo']);
  };

  it('block: the suffix slot projects its content', () => assertSuffix('block'));

  // FINDING MATRIX-radio-1. The docs list `suffix` as a slot of the component,
  // with no variant qualification; the example that uses it happens to be a
  // block radio, but nothing says the slot belongs to that presentation. The
  // render function only emits `<slot name="suffix">` inside its `block`
  // branch, so a default-variant radio silently drops authored suffix content.
  // The assertion is the documented one and stays as it is.
  it.fails(
    finding('MATRIX-radio-1', 'variant="default" renders no suffix slot, so slotted suffix content is dropped'),
    () => assertSuffix('default'),
  );
});
