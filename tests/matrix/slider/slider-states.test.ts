/**
 * snice-slider matrix — STATE SWITCHES.
 *
 * All 2^5 vectors of the five documented booleans — `disabled`, `readonly`,
 * `loading`, `required`, `invalid` — because the doc gives them overlapping
 * jobs and the overlaps are exactly where a component goes wrong:
 *
 *   "Disabled controls are omitted and barred."
 *   "Readonly/loading controls retain their successful value but are barred."
 *   "`invalid` alone is visual/ARIA only."
 *   "`required` is a marker and cannot create `valueMissing`."
 *
 * So three different switches bar interaction by three different routes, two of
 * them still submit, one is presentation only, and one is documented as
 * deliberately toothless. Thirty-two combos is the whole space, and the whole
 * space is what proves those four sentences do not contradict each other in
 * any corner.
 *
 * Every vector is judged by the full oracle (which already knows the tab-stop,
 * `aria-disabled`, spinner and `aria-invalid` consequences), and then by the
 * behavioural half: can the documented keyboard path still move the value?
 */
import { describe, it, afterAll, afterEach, beforeAll } from 'vitest';
import {
  SETTLE, STATE_FLAGS, type StateFlag,
  activeFlags, combo, exactParts, expect, expectSliderMatches, installInternalsMock,
  interactionDisabled, internalsFor, makeSlider, pressThumb, recordEvents,
  restoreInternalsMock, teardown, thumbOf, wait,
} from './slider-support';

describe('snice-slider matrix — states', () => {
  beforeAll(() => installInternalsMock());
  afterAll(() => restoreInternalsMock());
  afterEach(teardown);

  // ── all 2^5 vectors ──────────────────────────────────────────────────────
  for (let bits = 0; bits < (1 << STATE_FLAGS.length); bits++) {
    const vector = {} as Record<StateFlag, boolean>;
    STATE_FLAGS.forEach((flag, i) => { vector[flag] = !!((bits >> i) & 1); });
    const on = STATE_FLAGS.filter(flag => vector[flag]).join('+') || 'plain';

    it(`renders the documented state: ${on}`, async () => {
      const c = combo({ ...vector, value: 40, label: 'Volume' });
      const el = await makeSlider(c);
      expectSliderMatches(el, c);
    });

    it(`interaction is ${interactionDisabled(vector as any) || vector.readonly ? 'barred' : 'live'}: ${on}`, async () => {
      const c = combo({ ...vector, value: 40, min: 0, max: 100, step: 10 });
      const el = await makeSlider(c);
      const events = recordEvents(el);

      pressThumb(el, 'ArrowRight');
      await wait(SETTLE);

      // Disabled, loading and readonly all bar the documented input paths.
      const barred = vector.disabled || vector.loading || vector.readonly;
      expect(el.value, 'value after ArrowRight').toBe(barred ? 40 : 50);
      expect(events.log.length > 0, 'events emitted').toBe(!barred);
    });
  }

  // ── the three barring switches, one at a time ────────────────────────────
  for (const flag of ['disabled', 'readonly', 'loading'] as const) {
    it(`${flag} bars every documented key`, async () => {
      const el = await makeSlider(combo({ [flag]: true, value: 50, min: 0, max: 100, step: 5 } as any));
      const events = recordEvents(el);

      for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) {
        pressThumb(el, key);
      }
      await wait(SETTLE);

      expect(el.value, 'nothing moved').toBe(50);
      expect(events.log, 'and nothing was announced').toEqual([]);
    });
  }

  // ── the tab stop ─────────────────────────────────────────────────────────
  it('disabled and loading take the thumb out of the tab order', async () => {
    for (const flag of ['disabled', 'loading'] as const) {
      const el = await makeSlider(combo({ [flag]: true } as any));
      expect(thumbOf(el).getAttribute('tabindex'), `${flag} tabindex`).toBe('-1');
      expect(thumbOf(el).getAttribute('aria-disabled'), `${flag} aria-disabled`).toBe('true');
      teardown();
    }
  });

  it('readonly keeps the thumb focusable — it can be read, just not moved', async () => {
    const el = await makeSlider(combo({ readonly: true }));
    expect(thumbOf(el).getAttribute('tabindex')).toBe('0');
    expect(thumbOf(el).getAttribute('aria-disabled')).toBe('false');
  });

  it('focus() is a no-op on a barred slider', async () => {
    const el = await makeSlider(combo({ disabled: true, label: 'Volume' }));
    el.focus();
    expect(document.activeElement, 'a disabled control never takes focus').not.toBe(el);
  });

  // ── loading ──────────────────────────────────────────────────────────────
  it('loading renders the documented spinner part and removes it again', async () => {
    const el = await makeSlider(combo({ loading: true }));
    expect(exactParts(el, 'spinner').length).toBe(1);

    el.loading = false;
    await wait(SETTLE);
    expect(exactParts(el, 'spinner').length).toBe(0);
    expect(thumbOf(el).getAttribute('tabindex'), 'and hands interaction back').toBe('0');
  });

  // ── the form consequences ────────────────────────────────────────────────
  it('a disabled slider is barred from the form', async () => {
    // "Disabled controls are omitted and barred." The omission is the user
    // agent's own rule for a disabled form-associated element and needs a real
    // submission to observe — the visual tier's. What the component owes is
    // the barred state the UA reads.
    const el = await makeSlider(combo({ name: 'volume', disabled: true, value: 40 }));
    const input = el.shadowRoot.querySelector('input.slider-input') as HTMLInputElement;
    expect(input.disabled, 'the mirrored control is disabled').toBe(true);
    expect(el.willValidate, 'and validation is barred').toBe(false);
  });

  for (const flag of ['readonly', 'loading'] as const) {
    it(`a ${flag} slider still submits its value`, async () => {
      // "Readonly/loading controls retain their successful value but are barred."
      const el = await makeSlider(combo({ name: 'volume', [flag]: true, value: 40 } as any));
      expect(internalsFor(el).formValue).toBe('40');
    });
  }

  it('barred sliders do not participate in constraint validation', async () => {
    for (const flag of ['disabled', 'readonly', 'loading'] as const) {
      const el = await makeSlider(combo({ name: 'volume', [flag]: true } as any));
      expect(el.willValidate, `${flag} willValidate`).toBe(false);
      teardown();
    }
  });

  it('required alone cannot make the slider invalid', async () => {
    // "Like native input[type=range], a normalized numeric value is always
    // present; `required` is a marker and cannot create `valueMissing`."
    const el = await makeSlider(combo({ name: 'volume', required: true }));
    expect(activeFlags(el), 'no validity flags').toEqual([]);
    expect(el.checkValidity()).toBe(true);
    expect(internalsFor(el).formValue, 'and it still submits').toBe('0');
  });

  it('invalid alone is presentation, not validity', async () => {
    // "`invalid` alone is visual/ARIA only."
    const el = await makeSlider(combo({ name: 'volume', invalid: true, value: 30 }));
    expect(thumbOf(el).getAttribute('aria-invalid'), 'the ARIA state is set').toBe('true');
    expect(activeFlags(el), 'but no constraint is violated').toEqual([]);
    expect(el.checkValidity(), 'so the control is still valid').toBe(true);
    expect(internalsFor(el).formValue, 'and still submits').toBe('30');
  });

  it('toggling invalid at runtime moves the ARIA state with it', async () => {
    const el = await makeSlider(combo({ value: 30 }));
    expect(thumbOf(el).getAttribute('aria-invalid')).toBe('false');

    el.invalid = true;
    await wait(SETTLE);
    expect(thumbOf(el).getAttribute('aria-invalid')).toBe('true');

    el.invalid = false;
    await wait(SETTLE);
    expect(thumbOf(el).getAttribute('aria-invalid')).toBe('false');
  });

  it('the switches are independent — turning one off leaves the others', async () => {
    const el = await makeSlider(combo({
      disabled: true, readonly: true, loading: true, required: true, invalid: true,
    }));
    el.disabled = false;
    await wait(SETTLE);
    expect({
      disabled: el.disabled, readonly: el.readonly, loading: el.loading,
      required: el.required, invalid: el.invalid,
    }).toEqual({
      disabled: false, readonly: true, loading: true, required: true, invalid: true,
    });
  });
});
