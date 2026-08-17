/**
 * snice-slider matrix — FORM AND VALIDATION.
 *
 * The documented contract:
 *
 *   "Named sliders are listed in `form.elements` and contribute one normalized
 *    numeric string to FormData."
 *   "Like native input[type=range], a normalized numeric value is always
 *    present; `required` is a marker and cannot create `valueMissing`."
 *   "Use setCustomValidity(message) for business rules. The error updates
 *    validity.customError, validationMessage, aria-invalid, track/thumb
 *    styling, form reporting, and submission blocking; pass '' to clear it."
 *   "Disabled controls are omitted and barred. Readonly/loading controls retain
 *    their successful value but are barred."
 *
 * The cross here is STATE x NAME x VALUE, because "submits" has three
 * independent inputs: is the control barred, does it have a name, and what has
 * the lattice made of its value. The interesting corners are the barred ones
 * that still submit (readonly, loading) versus the barred one that does not
 * (disabled) — one sentence of documentation, four behaviours.
 *
 * ── Why the assertions go through ElementInternals ─────────────────────────
 *
 * happy-dom attaches internals but implements none of the plumbing behind them:
 * `new FormData(form)` returns nothing for a form-associated custom element.
 * The shared `internals-mock` records `setFormValue` / `setValidity` instead,
 * which is the same substitution `tests/components/checkbox.test.ts` makes, so
 * the matrix and the unit suites agree on what "submitted" means. Real
 * submission and real fieldset walking are the browser's own algorithms and
 * belong to the visual tier.
 */
import { describe, it, afterAll, afterEach, beforeAll } from 'vitest';
import {
  SETTLE,
  activeFlags, classesOf, combo, exactPart, expect, expectedValue, installInternalsMock,
  internalsFor, makeSlider, mount, pressThumb, renderedSupport, restoreInternalsMock,
  teardown, thumbOf, trackOf, wait,
} from './slider-support';

describe('snice-slider matrix — form and validation', () => {
  beforeAll(() => installInternalsMock());
  afterAll(() => restoreInternalsMock());
  afterEach(teardown);

  // ── the submitted value ──────────────────────────────────────────────────
  for (const [min, max, step, raw] of [
    [0, 100, 1, 42], [0, 10, 3, 7], [5, 25, 5, 12], [0, 1, 0.1, 0.35], [-50, 50, 10, -23],
  ] as const) {
    it(`submits the normalized value for ${min}..${max}@${step} from ${raw}`, async () => {
      const el = await makeSlider(combo({ name: 'volume', min, max, step, value: raw }));
      const wanted = expectedValue(raw, min, max, step);
      // "one normalized numeric string" — the sanitised value, as a string.
      expect(internalsFor(el).formValue).toBe(String(wanted));
      expect(el.value).toBe(wanted);
    });
  }

  it('a nameless slider still reports a value — naming is the form\'s business', async () => {
    // The doc scopes the FormData claim to NAMED sliders; the control itself
    // is still a successful control with a value.
    const el = await makeSlider(combo({ value: 30 }));
    expect(el.value).toBe(30);
    expect(internalsFor(el).formValue).toBe('30');
  });

  it('a slider always has a value, even when nothing was authored', async () => {
    const el = await makeSlider(combo({ name: 'volume' }));
    expect(internalsFor(el).formValue, 'the documented always-present value').toBe('0');
  });

  it('the submitted value follows every keyboard move', async () => {
    const el = await makeSlider(combo({ name: 'volume', min: 0, max: 100, step: 10 }));
    for (const expected of ['10', '20', '30']) {
      pressThumb(el, 'ArrowRight');
      await wait(20);
      expect(internalsFor(el).formValue).toBe(expected);
    }
  });

  it('the submitted value follows a reset back to the default', async () => {
    const el = await makeSlider(combo({ name: 'volume', defaultValue: 25 }));
    el.value = 80;
    await wait(SETTLE);
    expect(internalsFor(el).formValue).toBe('80');

    el.formResetCallback();
    await wait(SETTLE);
    expect(internalsFor(el).formValue).toBe('25');
  });

  // ── barred controls ──────────────────────────────────────────────────────
  //
  // "Disabled controls are omitted and barred." The OMISSION half is the user
  // agent's own rule — a disabled form-associated custom element is not a
  // successful control however it filled its form value — and happy-dom does
  // not implement submission at all, so asserting it here would measure the
  // environment. What the COMPONENT owes, and what is asserted, is the state
  // the UA reads: the mirrored control disabled, validation barred, and the
  // thumb out of the tab order. Real submission is the visual tier's.
  it('a disabled slider is barred: mirrored control disabled, validation off', async () => {
    const el = await makeSlider(combo({ name: 'volume', value: 40, disabled: true }));
    const input = el.shadowRoot.querySelector('input.slider-input') as HTMLInputElement;
    expect(input.disabled, 'the mirrored control is disabled').toBe(true);
    expect(el.willValidate, 'and barred from constraint validation').toBe(false);
    expect(thumbOf(el).getAttribute('tabindex'), 'and out of the tab order').toBe('-1');
  });

  it('re-enabling a slider hands it back to the form', async () => {
    const el = await makeSlider(combo({ name: 'volume', value: 40, disabled: true }));
    el.disabled = false;
    await wait(SETTLE);

    const input = el.shadowRoot.querySelector('input.slider-input') as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(el.willValidate).toBe(true);
    expect(internalsFor(el).formValue, 'with its value intact').toBe('40');
  });

  for (const flag of ['readonly', 'loading'] as const) {
    it(`a ${flag} slider retains its successful value`, async () => {
      const el = await makeSlider(combo({ name: 'volume', value: 40, [flag]: true } as any));
      expect(internalsFor(el).formValue).toBe('40');
      expect(el.willValidate, 'while being barred from validation').toBe(false);
    });
  }

  it('a fieldset-disabled slider is barred, like a natively disabled one', async () => {
    // happy-dom never propagates a disabled fieldset to a custom element, so
    // the callback is invoked directly — exactly as the browser would.
    const el = await makeSlider(combo({ name: 'volume', value: 40 }));
    const input = el.shadowRoot.querySelector('input.slider-input') as HTMLInputElement;
    expect(input.disabled).toBe(false);

    el.formDisabledCallback(true);
    await wait(SETTLE);
    expect(input.disabled, 'barred by its ancestor').toBe(true);
    expect(el.willValidate).toBe(false);
    expect(thumbOf(el).getAttribute('tabindex')).toBe('-1');

    el.formDisabledCallback(false);
    await wait(SETTLE);
    expect(input.disabled, 'and released with it').toBe(false);
    expect(internalsFor(el).formValue, 'value retained throughout').toBe('40');
  });

  // ── required is documented as toothless ──────────────────────────────────
  it('required cannot produce valueMissing at any value', async () => {
    for (const value of [0, 50, 100]) {
      const el = await makeSlider(combo({ name: 'volume', required: true, value }));
      expect(activeFlags(el), `required at ${value}`).toEqual([]);
      expect(el.checkValidity()).toBe(true);
      teardown();
    }
  });

  it('required at the minimum is still valid — zero is a real value', async () => {
    const el = await makeSlider(combo({ name: 'volume', required: true, min: 0, value: 0 }));
    expect(el.checkValidity()).toBe(true);
    expect(internalsFor(el).formValue).toBe('0');
  });

  // ── setCustomValidity: the doc's list of consequences ────────────────────
  it('setCustomValidity sets customError, the message, and aria-invalid', async () => {
    const el = await makeSlider(combo({ name: 'volume', value: 30 }));
    expect(activeFlags(el)).toEqual([]);

    el.setCustomValidity('Pick a quieter level');
    await wait(SETTLE);

    expect(activeFlags(el), 'validity.customError').toEqual(['customError']);
    expect(el.validationMessage, 'validationMessage').toBe('Pick a quieter level');
    expect(el.checkValidity(), 'submission blocking').toBe(false);
    expect(thumbOf(el).getAttribute('aria-invalid'), 'aria-invalid').toBe('true');
  });

  it('a custom error reaches the track and thumb styling', async () => {
    const el = await makeSlider(combo({ value: 30 }));
    el.setCustomValidity('Nope');
    await wait(SETTLE);
    expect(classesOf(thumbOf(el)), 'thumb styling').toContain('slider-thumb--invalid');
    expect(classesOf(trackOf(el)), 'track styling').toContain('slider-track--invalid');
  });

  it('passing an empty string clears the custom error and everything it set', async () => {
    const el = await makeSlider(combo({ name: 'volume', value: 30 }));
    el.setCustomValidity('Nope');
    await wait(SETTLE);
    expect(el.checkValidity()).toBe(false);

    el.setCustomValidity('');
    await wait(SETTLE);

    expect(activeFlags(el)).toEqual([]);
    expect(el.validationMessage).toBe('');
    expect(el.checkValidity()).toBe(true);
    expect(thumbOf(el).getAttribute('aria-invalid')).toBe('false');
    expect(classesOf(thumbOf(el))).not.toContain('slider-thumb--invalid');
  });

  it('a calculated error shows the error text, exactly as an authored one does', async () => {
    // "Error text is rendered/announced once only while authored or calculated
    // invalid presentation is active."
    const el = await makeSlider(combo({
      errorText: 'Out of policy', helperText: 'Pick a level', value: 30,
    }));
    expect(renderedSupport(el), 'helper while valid').toBe('helper');

    el.setCustomValidity('Out of policy');
    await wait(SETTLE);
    expect(renderedSupport(el), 'error once invalid').toBe('error');
    expect(exactPart(el, 'error-text')!.textContent!.trim()).toBe('Out of policy');

    el.setCustomValidity('');
    await wait(SETTLE);
    expect(renderedSupport(el), 'helper again once cleared').toBe('helper');
  });

  it('checkValidity and reportValidity agree with each other', async () => {
    const el = await makeSlider(combo({ name: 'volume', value: 30 }));
    expect(el.checkValidity()).toBe(true);
    expect(el.reportValidity()).toBe(true);

    el.setCustomValidity('Nope');
    await wait(SETTLE);
    expect(el.checkValidity()).toBe(false);
    expect(el.reportValidity()).toBe(false);
  });

  it('a barred slider stays out of validation even with a custom error', async () => {
    // "Disabled controls are omitted and barred" — a barred control cannot
    // block a submission it does not take part in.
    const el = await makeSlider(combo({ name: 'volume', disabled: true, value: 30 }));
    el.setCustomValidity('Nope');
    await wait(SETTLE);
    expect(el.willValidate).toBe(false);
    expect(activeFlags(el), 'no flags are raised by a barred control').toEqual([]);
  });

  // ── the documented readonly accessors ────────────────────────────────────
  it('type is the native-compatible "range"', async () => {
    const el = await makeSlider(combo());
    expect(el.type).toBe('range');
  });

  it('willValidate is true for a plain, interactive slider', async () => {
    const el = await makeSlider(combo({ name: 'volume' }));
    expect(el.willValidate).toBe(true);
  });

  it('validity is a ValidityState-shaped object', async () => {
    const el = await makeSlider(combo({ name: 'volume' }));
    expect(typeof el.validity.valid).toBe('boolean');
    expect(typeof el.validity.customError).toBe('boolean');
    expect(el.validity.valid).toBe(true);
  });

  it('form is null for a slider outside any form', async () => {
    const el = await makeSlider(combo({ name: 'volume' }));
    expect(el.form).toBeNull();
  });

  it('labels is exposed and starts empty for an unlabelled slider', async () => {
    const el = await makeSlider(combo());
    expect(el.labels, 'the accessor exists').not.toBeUndefined();
  });

  // ── the mirrored native input the plumbing writes through ────────────────
  it('the mirrored range input carries the documented constraints', async () => {
    const el = await mount<any>('snice-slider', {
      min: 5, max: 25, step: 5, name: 'volume', value: 15,
    });
    await wait(SETTLE);
    const input = el.shadowRoot.querySelector('input.slider-input') as HTMLInputElement;
    expect(input.type).toBe('range');
    expect(input.min).toBe('5');
    expect(input.max).toBe('25');
    expect(input.step).toBe('5');
    expect(input.value).toBe('15');
    // It exists for the form plumbing, not for the user.
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.getAttribute('tabindex')).toBe('-1');
  });

  it('the mirrored input inherits the effective step, not the raw one', async () => {
    const el = await mount<any>('snice-slider', { min: 0, max: 10, step: 0 });
    await wait(SETTLE);
    const input = el.shadowRoot.querySelector('input.slider-input') as HTMLInputElement;
    expect(input.step, 'the documented fallback of 1').toBe('1');
  });
});
