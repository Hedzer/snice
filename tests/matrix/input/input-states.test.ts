/**
 * Matrix slice INPUT / STATES — the documented switches and how they interact.
 *
 * Dimensions (docs/ai/components/input.md):
 *   all 2^4 vectors of {disabled, readonly, loading, clearable}   16
 *   required x invalid                                             4
 *   password reveal x type                                         4
 *   runtime toggles                                                4
 *                                                                ─────
 *                                                                 28 combos
 *
 * Documented contract under test:
 *   · "Disabled controls are omitted. `readonly` remains successful but is
 *     barred from validation. `loading` is inert and barred while preserving
 *     its successful value." — so `disabled` and `loading` both reach the
 *     native control's `disabled`, and `readonly` reaches `readOnly`;
 *   · "`invalid` and `errorText` are presentation only; they do not establish
 *     native constraint invalidity";
 *   · "`aria-invalid` reflects authored or calculated invalid state";
 *   · "Clear button and password toggle have aria-label";
 *   · `password` is documented alongside `type="password"`, and the reveal
 *     switches the native type to `text`.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  TYPES,
  combo, comboId, expectInputMatches, makeInput, nativeInput, partOf, pressPart, readFacts, wait,
} from './input-support';

afterEach(() => { document.body.innerHTML = ''; });

const VALUE = 'hello';

describe('input matrix: the barred states', () => {
  for (let bits = 0; bits < 16; bits++) {
    const c = combo({
      disabled: !!(bits & 1),
      readonly: !!(bits & 2),
      loading: !!(bits & 4),
      clearable: !!(bits & 8),
    });
    it(comboId(c) || 'plain', async () => {
      const el = await makeInput(c, { value: VALUE });
      expectInputMatches(el, c, { value: VALUE });

      // Documented: a barred control is not validated, so it cannot report a
      // constraint error — but it keeps its successful value.
      expect(el.value, `combo ${comboId(c)} lost its value`).toBe(VALUE);
      if (c.disabled || c.readonly || c.loading) {
        expect(el.willValidate, `combo ${comboId(c)} still participates in validation`).toBe(false);
      }
    });
  }
});

describe('input matrix: required and invalid', () => {
  for (const required of [false, true]) {
    for (const invalid of [false, true]) {
      const c = combo({ required, invalid });
      it(comboId(c) || 'neither', async () => {
        const el = await makeInput(c);
        expectInputMatches(el, c);

        // Documented: "`invalid` … is presentation only; it does not establish
        // native constraint invalidity."
        expect(el.validity.customError, `combo ${comboId(c)} invented a customError`).toBe(false);
        expect(el.validity.valueMissing, `combo ${comboId(c)} valueMissing`).toBe(required);
        // …and `aria-invalid` reflects EITHER source.
        expect(nativeInput(el).getAttribute('aria-invalid'))
          .toBe(String(invalid || required));
      });
    }
  }
});

describe('input matrix: the password reveal', () => {
  for (const type of ['password', 'text'] as const) {
    for (const password of [false, true]) {
      const c = combo({ type, password });
      it(comboId(c), async () => {
        const el = await makeInput(c, { value: 'hunter2' });
        expectInputMatches(el, c, { value: 'hunter2' });

        const toggle = partOf(el, 'password-toggle');
        // Documented: the toggle belongs to `type="password"` WITH `password`.
        expect(toggle !== null, `combo ${comboId(c)} password toggle presence`)
          .toBe(type === 'password' && password);
        if (!toggle) return;

        // Documented: "Clear button and password toggle have aria-label".
        const before = toggle.getAttribute('aria-label') ?? '';
        expect(before.length, 'the password toggle has no aria-label').toBeGreaterThan(0);

        pressPart(el, 'password-toggle');
        await wait(30);
        expect(nativeInput(el).type, 'the reveal did not show the password').toBe('text');
        expect(partOf(el, 'password-toggle')?.getAttribute('aria-label'),
          `the toggle still says "${before}" after revealing`).not.toBe(before);
        // …and the value is untouched by the reveal.
        expect(el.value, 'revealing the password changed the value').toBe('hunter2');

        pressPart(el, 'password-toggle');
        await wait(30);
        expect(nativeInput(el).type, 'the second press did not hide the password').toBe('password');
      });
    }
  }
});

describe('input matrix: every documented type reaches the native control', () => {
  for (const type of TYPES) {
    it(`type=${type}`, async () => {
      const c = combo({ type });
      const el = await makeInput(c);
      expect(nativeInput(el).getAttribute('type'), `type=${type} did not reach the native input`)
        .toBe(type);
      expect(el.type).toBe(type);
    });
  }
});

describe('input matrix: runtime state toggles', () => {
  it('turning disabled on and off re-arms the control', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: VALUE });
    expect(readFacts(el).clearShown, 'the clear control is hidden on an editable field with a value')
      .toBe(true);

    el.disabled = true;
    await wait(30);
    expect(nativeInput(el).disabled, 'disabled=true did not reach the native input').toBe(true);
    expect(readFacts(el).clearShown, 'a disabled field still offers to clear itself').toBe(false);
    expect(el.value, 'disabling the control changed its value').toBe(VALUE);

    el.disabled = false;
    await wait(30);
    expect(nativeInput(el).disabled, 'disabled=false left the native input disabled').toBe(false);
    expect(readFacts(el).clearShown, 're-enabling did not bring the clear control back').toBe(true);
  });

  it('turning loading on makes the control inert and gives it back', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: VALUE });

    el.loading = true;
    await wait(30);
    // Documented: "loading is inert and barred while preserving its successful value".
    expect(nativeInput(el).disabled, 'a loading control is not inert').toBe(true);
    expect(partOf(el, 'spinner'), 'a loading control shows no [part="spinner"]').not.toBe(null);
    expect(el.value, 'loading discarded the value').toBe(VALUE);
    expect(el.willValidate, 'a loading control still participates in validation').toBe(false);

    el.loading = false;
    await wait(30);
    expect(nativeInput(el).disabled, 'the control stayed inert after loading finished').toBe(false);
    expect(partOf(el, 'spinner'), 'the spinner outlived the loading state').toBe(null);
  });

  it('turning readonly on bars validation but keeps the value successful', async () => {
    const el = await makeInput(combo({ required: true }), { value: '' });
    expect(el.validity.valueMissing, 'an empty required field is not reporting valueMissing').toBe(true);

    el.readonly = true;
    await wait(30);
    expect(nativeInput(el).readOnly, 'readonly did not reach the native input').toBe(true);
    expect(el.willValidate, 'a readonly control still participates in validation').toBe(false);

    el.readonly = false;
    await wait(30);
    expect(el.validity.valueMissing, 'clearing readonly did not restore the constraint').toBe(true);
  });

  it('switching type keeps every documented region', async () => {
    // Empty on purpose: `typeMismatch` is documented as forwarded, so a value
    // that is legal for `text` and illegal for `email` would be asserting the
    // validation contract here instead of the structural one. The mismatch
    // itself is asserted in input-validation.test.ts.
    const c = combo({ labelled: true, support: 'helper', clearable: true });
    const el = await makeInput(c);

    for (const type of TYPES) {
      el.type = type;
      await wait(30);
      expectInputMatches(el, { ...c, type });
    }
  });
});
