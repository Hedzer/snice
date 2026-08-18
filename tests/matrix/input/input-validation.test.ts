/**
 * Matrix slice INPUT / VALIDATION — the documented constraint contract.
 *
 * Dimensions (docs/ai/components/input.md "Form and validation contract"):
 *   required x barred state                   4
 *   typeMismatch across the typed inputs      4
 *   patternMismatch                           4
 *   range: min / max / step                   6
 *   length: minlength / maxlength             6
 *   customError                               4
 *   constraint removal / recalculation        4
 *                                          ─────
 *                                            32 combos
 *
 * Documented contract under test, quoted:
 *   · "Native flags are forwarded: `valueMissing`, `typeMismatch`,
 *     `patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`,
 *     `badInput`, and user-input-only `tooShort`/`tooLong`."
 *   · "Changing a constraint or value recalculates immediately. Removing `min`,
 *     `max`, `step`, `pattern`, `minlength`, or `maxlength` removes it from the
 *     native proxy as well."
 *   · "`setCustomValidity(message)` controls `customError`; pass `''` to clear
 *     it. Calculated validity drives styling and `aria-invalid` and blocks
 *     validated submission."
 *   · "`invalid` and `errorText` are presentation only; they do not establish
 *     native constraint invalidity."
 *   · "`readonly` remains successful but is barred from validation. `loading`
 *     is inert and barred."
 *
 * it.fails policy: MATRIX-input-2 was pinned in this file and is fixed; every
 * assertion is the documented expectation and no combo is weakened.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, makeInput, nativeInput, typeInto, wait,
} from './input-support';

afterEach(() => { document.body.innerHTML = ''; });

describe('input matrix: valueMissing', () => {
  for (const state of ['plain', 'disabled', 'readonly', 'loading'] as const) {
    it(`required/${state}`, async () => {
      const c = combo({
        required: true,
        disabled: state === 'disabled',
        readonly: state === 'readonly',
        loading: state === 'loading',
      });
      const el = await makeInput(c);

      // Documented: a barred control does not participate in validation, and
      // its calculated invalid state does not reach the user.
      //
      // `el.validity` is deliberately NOT asserted for the barred states: the
      // component answers it from `internals.validity`, and happy-dom has no
      // `attachInternals()`, so the getter falls through to the inner native
      // input — which still carries `required` and answers for itself. That is
      // a fact about the environment, not about the component, so the two
      // component-owned surfaces are what this asserts. The barred
      // `validity` object itself is asserted in a real browser by
      // tests/live/matrix/input.
      const barred = state !== 'plain';
      expect(el.willValidate, `required/${state} willValidate`).toBe(!barred);
      expect(nativeInput(el).getAttribute('aria-invalid'), `required/${state} aria-invalid`)
        .toBe(String(!barred));
      if (!barred) {
        expect(el.validity.valueMissing, `required/${state} valueMissing`).toBe(true);
      }
    });
  }
});

describe('input matrix: typeMismatch', () => {
  const CASES: Array<{ type: 'email' | 'url'; value: string; mismatch: boolean }> = [
    { type: 'email', value: 'not-an-email', mismatch: true },
    { type: 'email', value: 'you@example.com', mismatch: false },
    { type: 'url', value: 'not a url', mismatch: true },
    { type: 'url', value: 'https://example.com', mismatch: false },
  ];

  for (const { type, value, mismatch } of CASES) {
    it(`${type}="${value}"`, async () => {
      const el = await makeInput(combo({ type }), { value });
      expect(el.validity.typeMismatch, `${type}="${value}" typeMismatch`).toBe(mismatch);
      expect(nativeInput(el).getAttribute('aria-invalid'), 'aria-invalid follows the calculation')
        .toBe(String(mismatch));
    });
  }
});

describe('input matrix: patternMismatch', () => {
  const PATTERN = '[A-Z]{3}';
  const CASES: Array<{ value: string; mismatch: boolean }> = [
    { value: 'ABC', mismatch: false },
    { value: 'abc', mismatch: true },
    { value: 'ABCD', mismatch: true },
    { value: '', mismatch: false },
  ];

  for (const { value, mismatch } of CASES) {
    it(`pattern=${PATTERN}/"${value}"`, async () => {
      const el = await makeInput(combo({ pattern: PATTERN }), { value });
      expect(nativeInput(el).getAttribute('pattern'), 'the pattern did not reach the native proxy')
        .toBe(PATTERN);
      expect(el.validity.patternMismatch, `"${value}" against ${PATTERN}`).toBe(mismatch);
    });
  }
});

describe('input matrix: range constraints', () => {
  const CASES: Array<{
    id: string; min: string; max: string; step: string; value: string;
    under: boolean; over: boolean; stepped: boolean;
  }> = [
    { id: 'inside', min: '1', max: '10', step: '', value: '5', under: false, over: false, stepped: false },
    { id: 'under', min: '1', max: '10', step: '', value: '0', under: true, over: false, stepped: false },
    { id: 'over', min: '1', max: '10', step: '', value: '11', under: false, over: true, stepped: false },
    { id: 'at-min', min: '1', max: '10', step: '', value: '1', under: false, over: false, stepped: false },
    { id: 'at-max', min: '1', max: '10', step: '', value: '10', under: false, over: false, stepped: false },
    { id: 'step-off', min: '0', max: '10', step: '2', value: '3', under: false, over: false, stepped: true },
  ];

  for (const testCase of CASES) {
    it(`number/${testCase.id}`, async () => {
      const el = await makeInput(
        combo({ type: 'number', min: testCase.min, max: testCase.max, step: testCase.step }),
        { value: testCase.value },
      );
      const native = nativeInput(el);
      expect(native.getAttribute('min'), 'min did not reach the native proxy').toBe(testCase.min);
      expect(native.getAttribute('max'), 'max did not reach the native proxy').toBe(testCase.max);

      expect(el.validity.rangeUnderflow, `${testCase.id} rangeUnderflow`).toBe(testCase.under);
      expect(el.validity.rangeOverflow, `${testCase.id} rangeOverflow`).toBe(testCase.over);
      if (testCase.step) {
        expect(el.validity.stepMismatch, `${testCase.id} stepMismatch`).toBe(testCase.stepped);
      }
    });
  }
});

describe('input matrix: length constraints are user-input only', () => {
  // The documented NEGATIVE — "an authored value never reports tooShort/tooLong"
  // — is not judgeable here: without `attachInternals()` the component's
  // `validity` getter falls through to the inner native input, and happy-dom's
  // native input applies the length flags to any value rather than only to a
  // dirty one. The positives below are component-observable and asserted;
  // the user-input-only gate is asserted in a real browser by
  // tests/live/matrix/input.
  it('a short AUTHORED value reaches the native proxy as a constraint', async () => {
    const el = await makeInput(combo({ minlength: 5 }), { value: 'ab' });
    expect(nativeInput(el).getAttribute('minlength'), 'minlength did not reach the native proxy')
      .toBe('5');
  });

  it('a short TYPED value reports tooShort', async () => {
    const el = await makeInput(combo({ minlength: 5 }));
    typeInto(el, 'ab');
    await wait(30);
    expect(el.validity.tooShort, 'a typed short value did not report tooShort').toBe(true);
  });

  it('an empty typed value does not report tooShort', async () => {
    const el = await makeInput(combo({ minlength: 5 }));
    typeInto(el, 'ab');
    await wait(30);
    typeInto(el, '');
    await wait(30);
    // An empty field is `valueMissing`'s business, not `tooShort`'s.
    expect(el.validity.tooShort, 'an empty field reported tooShort').toBe(false);
  });

  it('a long AUTHORED value reaches the native proxy as a constraint', async () => {
    const el = await makeInput(combo({ maxlength: 3 }), { value: 'abcdef' });
    expect(nativeInput(el).getAttribute('maxlength'), 'maxlength did not reach the native proxy')
      .toBe('3');
  });

  it('a long TYPED value reports tooLong', async () => {
    const el = await makeInput(combo({ maxlength: 3 }));
    typeInto(el, 'abcdef');
    await wait(30);
    expect(el.validity.tooLong, 'a typed long value did not report tooLong').toBe(true);
  });

  it('a value inside both bounds reports neither', async () => {
    const el = await makeInput(combo({ minlength: 2, maxlength: 6 }));
    typeInto(el, 'abcd');
    await wait(30);
    expect(el.validity.tooShort).toBe(false);
    expect(el.validity.tooLong).toBe(false);
  });
});

describe('input matrix: customError', () => {
  it('setCustomValidity sets customError and its message', async () => {
    const el = await makeInput(combo());
    el.setCustomValidity('Pick another one');
    await wait(30);

    expect(el.validity.customError, 'setCustomValidity did not set customError').toBe(true);
    expect(el.validationMessage, 'the custom message is not reported').toBe('Pick another one');
    expect(el.checkValidity(), 'a customError control reported itself valid').toBe(false);
  });

  it("setCustomValidity('') clears it", async () => {
    const el = await makeInput(combo());
    el.setCustomValidity('Pick another one');
    await wait(30);
    el.setCustomValidity('');
    await wait(30);

    expect(el.validity.customError, "setCustomValidity('') left customError set").toBe(false);
    expect(el.checkValidity(), 'a cleared control still reports itself invalid').toBe(true);
  });

  it('customError drives aria-invalid', async () => {
    const el = await makeInput(combo());
    el.setCustomValidity('Nope');
    await wait(30);
    expect(nativeInput(el).getAttribute('aria-invalid'), 'aria-invalid ignored the customError')
      .toBe('true');
  });

  it('an authored invalid does NOT establish a native constraint error', async () => {
    const el = await makeInput(combo({ invalid: true, support: 'error' }));
    // Documented: "`invalid` and `errorText` are presentation only".
    expect(el.checkValidity(), 'authored invalid blocked constraint validation').toBe(true);
    expect(el.validity.customError, 'authored invalid invented a customError').toBe(false);
    expect(nativeInput(el).getAttribute('aria-invalid'), 'authored invalid must still show')
      .toBe('true');
  });
});

describe('input matrix: recalculation and constraint removal', () => {
  it('changing the value recalculates immediately', async () => {
    const el = await makeInput(combo({ required: true }));
    expect(el.validity.valueMissing).toBe(true);

    el.value = 'filled';
    await wait(30);
    expect(el.validity.valueMissing, 'filling the field did not clear valueMissing').toBe(false);

    el.value = '';
    await wait(30);
    expect(el.validity.valueMissing, 'emptying the field did not restore valueMissing').toBe(true);
  });

  it('changing a constraint recalculates immediately', async () => {
    const el = await makeInput(combo({ type: 'number', max: '10' }), { value: '11' });
    expect(el.validity.rangeOverflow).toBe(true);

    el.max = '20';
    await wait(30);
    expect(el.validity.rangeOverflow, 'raising max did not clear rangeOverflow').toBe(false);
  });

  /**
   * MATRIX-input-2 (fixed) — a removed constraint used to stay on the native
   * proxy as an EMPTY attribute: the render bindings committed `null` as ''
   * (`min=${this.min || null}`). They now bind the framework's `nothing`
   * sentinel, which removes the attribute, exactly as the docs promise.
   */
  it('MATRIX-input-2 (fixed): removing min/max/step/pattern removes them from the native proxy', async () => {
    const el = await makeInput(
      combo({ type: 'number', min: '1', max: '10', step: '2', pattern: '\\d+' }),
      { value: '4' },
    );
    expect(nativeInput(el).hasAttribute('min')).toBe(true);

    el.min = '';
    el.max = '';
    el.step = '';
    el.pattern = '';
    await wait(30);

    // Re-queried on purpose: a re-render can replace the inner input, and a
    // stale reference would report the attributes of an element nobody sees.
    const native = nativeInput(el);
    const left = ['min', 'max', 'step', 'pattern'].filter(name => native.hasAttribute(name));
    expect(left, 'constraints survived their removal on the native proxy').toEqual([]);
  });

  /**
   * MATRIX-input-2 (fixed, same defect, the length half of the same sentence).
   */
  it('MATRIX-input-2 (fixed): removing minlength/maxlength removes them from the native proxy', async () => {
    const el = await makeInput(combo({ minlength: 3, maxlength: 6 }));
    expect(nativeInput(el).hasAttribute('minlength')).toBe(true);
    expect(nativeInput(el).hasAttribute('maxlength')).toBe(true);

    el.minlength = -1;
    el.maxlength = -1;
    await wait(30);

    const native = nativeInput(el);
    const left = ['minlength', 'maxlength'].filter(name => native.hasAttribute(name));
    expect(left, 'length constraints survived their removal').toEqual([]);
  });
});
