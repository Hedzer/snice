/**
 * snice-checkbox matrix — form contract slice.
 *
 * SIZING. Two crosses, both taken straight from the "Form contract" section:
 *
 *   · SUBMISSION — checked x name x value x gate (2 x 2 x 3 x 4 = 48). Every
 *     axis is named in the rule ("Checked + enabled + non-empty `name`
 *     contributes `[name, value]`… `value` is exact, including an empty
 *     string"), and the gate axis carries the one cell that is easy to get
 *     wrong: `loading` blocks activation but must NOT withdraw the control from
 *     submission.
 *   · VALIDATION — required x checked x customValidity x gate (2 x 2 x 2 x 3 =
 *     24), which is the whole of "Unchecked `required` sets
 *     `validity.valueMissing`…" plus `setCustomValidity`.
 *
 * FormData itself is unavailable in happy-dom for form-associated custom
 * elements, so both are observed through the `setFormValue`/`setValidity` calls
 * that implement them — see tests/matrix/internals-mock.ts.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { unmountAll, product, comboId, settle } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  GATES, mountCheckbox, expectedEntry, readEntry, expectedFlags, readFlags,
  isBarred, type Gate,
} from './checkbox-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

/** The documented value shapes: the default, an authored one, and empty. */
const VALUES = [undefined, 'weekly', ''] as const;

describe('checkbox matrix: submission (checked x name x value x gate)', () => {
  for (const combo of product({
    checked: [false, true], name: ['', 'digest'], value: VALUES, gate: GATES,
  })) {
    const label = comboId({ ...combo, value: combo.value ?? 'default' });
    it(label, async () => {
      const el = await mountCheckbox({
        state: combo.checked ? 'on' : 'off',
        gate: combo.gate,
        name: combo.name,
        value: combo.value,
      });

      // The gate is an axis, not an input to the oracle: see `expectedEntry`.
      expect(readEntry(el), label).toEqual(expectedEntry(combo));
    });
  }
});

describe('checkbox matrix: validation (required x checked x custom x gate)', () => {
  // `loading` is excluded here only because it is asserted, in the same terms,
  // by its own test below: it must behave EXACTLY like `none`.
  const VALIDATION_GATES: Gate[] = ['none', 'disabled', 'fieldset'];

  for (const combo of product({
    required: [false, true], checked: [false, true],
    custom: ['', 'Pick one'], gate: VALIDATION_GATES,
  })) {
    const label = comboId(combo);
    it(label, async () => {
      const el = await mountCheckbox({
        state: combo.checked ? 'on' : 'off',
        gate: combo.gate,
        required: combo.required,
        name: 'digest',
      });
      if (combo.custom) el.setCustomValidity(combo.custom);
      await settle(el, 10);

      expect(readFlags(el), label).toEqual(expectedFlags(combo));

      // DOCUMENTED: "`willValidate`" is part of the public surface, and a
      // disabled control — authored or fieldset — does not participate.
      expect(el.willValidate, `${label}: willValidate`).toBe(!isBarred(combo.gate));
    });
  }

  it('setCustomValidity("") clears the customError it set', async () => {
    const el = await mountCheckbox({ name: 'digest', state: 'on' });
    el.setCustomValidity('Nope');
    await settle(el, 10);
    expect(readFlags(el)).toEqual(['customError']);

    el.setCustomValidity('');
    await settle(el, 10);
    expect(readFlags(el), 'an empty message must clear the error').toEqual([]);
  });

  it('loading keeps both submission and validation participation', async () => {
    // DOCUMENTED: "`loading` blocks pointer/programmatic activation but does not
    // change form submission or validation participation." This is the cell the
    // gate axis exists for.
    const el = await mountCheckbox({
      state: 'on', gate: 'loading', name: 'digest', value: 'weekly', required: true,
    });
    expect(readEntry(el)).toEqual(['digest', 'weekly']);
    expect(el.willValidate).toBe(true);

    el.checked = false;
    await settle(el, 10);
    expect(readFlags(el), 'an unchecked required loading box still reports valueMissing')
      .toEqual(['valueMissing']);
  });
});
