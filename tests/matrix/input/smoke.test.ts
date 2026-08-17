/**
 * Smoke slice of the snice-input matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/input/, 147 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle.
 *
 * The marquee: the fully-featured control (label, helper text, clearable, an
 * icon), the barred states, the password reveal, the dirty-value lifecycle,
 * the constraint contract, and the five events in order.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  blurNative, collectEvents, combo, commit, expectInputMatches, focusNative,
  makeInput, nativeInput, partOf, pressPart, readFacts, typeInto, wait,
} from './input-support';

afterEach(() => { document.body.innerHTML = ''; });

describe('input matrix smoke', () => {
  it('a fully-featured control renders every documented region', async () => {
    const c = combo({
      variant: 'filled', size: 'large', labelled: true, placeholder: true,
      support: 'helper', icons: 'prefix', clearable: true, required: true,
    });
    const el = await makeInput(c, { value: 'seed' });

    expectInputMatches(el, c, { value: 'seed' });
    expect(readFacts(el).clearShown, 'a clearable control with a value hides its clear button')
      .toBe(true);
  });

  it('loading and disabled both make the control inert', async () => {
    const loading = await makeInput(combo({ loading: true }), { value: 'kept' });
    expect(nativeInput(loading).disabled, 'a loading control is not inert').toBe(true);
    expect(partOf(loading, 'spinner'), 'a loading control shows no spinner').not.toBe(null);
    expect(loading.value, 'loading discarded the value').toBe('kept');
    expect(loading.willValidate, 'a loading control still validates').toBe(false);

    const disabled = await makeInput(combo({ disabled: true }), { value: 'kept' });
    expect(nativeInput(disabled).disabled, 'a disabled control is not inert').toBe(true);
  });

  it('the password reveal switches the native type both ways', async () => {
    const el = await makeInput(combo({ type: 'password', password: true }), { value: 'hunter2' });
    expect(nativeInput(el).type).toBe('password');

    pressPart(el, 'password-toggle');
    await wait(30);
    expect(nativeInput(el).type, 'the reveal did not show the password').toBe('text');

    pressPart(el, 'password-toggle');
    await wait(30);
    expect(nativeInput(el).type, 'the reveal did not hide the password again').toBe('password');
    expect(el.value, 'revealing changed the value').toBe('hunter2');
  });

  it('typing dirties the value and a reset restores the default', async () => {
    const el = await makeInput(combo(), { value: 'authored' });
    expect(el.defaultValue).toBe('authored');

    typeInto(el, 'typed');
    await wait(30);
    el.defaultValue = 'moved';
    await wait(30);
    expect(el.value, 'a dirty control followed its default').toBe('typed');

    el.formResetCallback();
    await wait(30);
    expect(el.value, 'reset did not restore the current default').toBe('moved');
  });

  it('the constraint contract calculates and clears', async () => {
    const el = await makeInput(combo({ required: true, pattern: '[A-Z]{3}' }));
    expect(el.validity.valueMissing, 'an empty required control is not missing').toBe(true);
    expect(nativeInput(el).getAttribute('aria-invalid')).toBe('true');

    el.value = 'abc';
    await wait(30);
    expect(el.validity.patternMismatch, 'a mismatching value is not reported').toBe(true);

    el.value = 'ABC';
    await wait(30);
    expect(el.checkValidity(), 'a satisfying value is still reported invalid').toBe(true);
    expect(nativeInput(el).getAttribute('aria-invalid')).toBe('false');

    el.setCustomValidity('Taken');
    await wait(30);
    expect(el.validity.customError, 'setCustomValidity did not set customError').toBe(true);
    el.setCustomValidity('');
    await wait(30);
    expect(el.validity.customError, "setCustomValidity('') did not clear it").toBe(false);
  });

  it('the five documented events fire in order with their details', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: 'seed' });
    const seen = collectEvents(el);

    focusNative(el);
    typeInto(el, 'hi');
    commit(el);
    pressPart(el, 'clear');
    blurNative(el);
    await wait(30);

    // Clearing empties the value (an input AND a commit) and returns focus to
    // the field, which is a focus the user can see and therefore one the
    // component announces.
    expect(seen.map(s => s.type), 'event order').toEqual([
      'input-focus', 'input-input', 'input-change',
      'input-clear', 'input-input', 'input-change', 'input-focus',
      'input-blur',
    ]);
    expect(seen[1].detail.value, 'input-input value').toBe('hi');
    expect(seen[0].detail.input, 'input-focus does not carry the input').toBe(el);
    expect(el.value, 'the clear control left a value behind').toBe('');
  });
});
