/**
 * Smoke slice of the snice-slider matrix — the everyday-loop tier.
 *
 * One combo per feature family, so a family that breaks cannot hide:
 *
 *   · presentation — variant/size/vertical modifiers and the documented parts;
 *   · lattice      — clamping and snapping onto the min-based step lattice;
 *   · keyboard     — an arrow key moves by one step and emits both events;
 *   · states       — a barred slider refuses the keyboard;
 *   · form         — the normalized value reaches the form, disabled omits it;
 *   · validation   — setCustomValidity and its documented consequences.
 *
 * Structure routes through the matrix oracle (`expectSliderMatches`).
 *
 * BUDGET: under 1s. New combos go in the matrix, never here.
 */
import { describe, it, afterAll, afterEach, beforeAll } from 'vitest';
import {
  SETTLE,
  activeFlags, classesOf, combo, exactParts, expect, expectSliderMatches, expectedValue,
  installInternalsMock, internalsFor, makeSlider, pressThumb, recordEvents,
  renderedSupport, restoreInternalsMock, teardown, thumbOf, wait,
} from './slider-support';

describe('slider matrix smoke', () => {
  beforeAll(() => installInternalsMock());
  afterAll(() => restoreInternalsMock());
  afterEach(teardown);

  it('presentation: variant, size, vertical and the documented parts', async () => {
    const c = combo({
      variant: 'primary', size: 'large', vertical: true, label: 'Volume',
      showValue: true, showTicks: true, min: 0, max: 10, step: 2, value: 6,
    });
    const el = await makeSlider(c);
    expectSliderMatches(el, c);
    expect(exactParts(el, 'thumb').length).toBe(1);
  });

  it('lattice: values clamp into range and snap onto the min-based lattice', async () => {
    const el = await makeSlider(combo({ min: 5, max: 25, step: 5, value: 999 }));
    expect(el.value).toBe(expectedValue(999, 5, 25, 5));
    expect(el.value).toBe(25);

    el.value = 7;
    await wait(SETTLE);
    expect(el.value).toBe(5);
  });

  it('keyboard: an arrow moves one step and emits input then change', async () => {
    const el = await makeSlider(combo({ min: 0, max: 100, step: 10, value: 40 }));
    const events = recordEvents(el);

    pressThumb(el, 'ArrowRight');
    await wait(SETTLE);

    expect(el.value).toBe(50);
    expect(events.log).toEqual(['slider-input', 'slider-change']);
    expect(events.details[1]).toEqual({ value: 50, slider: el });
    expect(thumbOf(el).getAttribute('aria-valuenow')).toBe('50');
  });

  it('states: a barred slider refuses the keyboard', async () => {
    for (const flag of ['disabled', 'readonly', 'loading'] as const) {
      const el = await makeSlider(combo({ [flag]: true, value: 40, step: 10 } as any));
      const events = recordEvents(el);
      pressThumb(el, 'End');
      await wait(SETTLE);
      expect(el.value, `${flag} holds the value`).toBe(40);
      expect(events.log, `${flag} announces nothing`).toEqual([]);
      teardown();
    }
  });

  it('form: the normalized value is submitted, and disabled bars the control', async () => {
    const el = await makeSlider(combo({ name: 'volume', min: 0, max: 10, step: 3, value: 7 }));
    expect(internalsFor(el).formValue).toBe('6');

    el.disabled = true;
    await wait(SETTLE);
    const input = el.shadowRoot.querySelector('input.slider-input') as HTMLInputElement;
    expect(input.disabled, 'the mirrored control is disabled').toBe(true);
    expect(el.willValidate, 'and validation is barred').toBe(false);
  });

  it('validation: setCustomValidity blocks, styles and announces; "" clears it', async () => {
    const el = await makeSlider(combo({
      name: 'volume', helperText: 'Pick a level', errorText: 'Out of policy', value: 30,
    }));
    expect(renderedSupport(el)).toBe('helper');

    el.setCustomValidity('Out of policy');
    await wait(SETTLE);
    expect(activeFlags(el)).toEqual(['customError']);
    expect(el.checkValidity()).toBe(false);
    expect(thumbOf(el).getAttribute('aria-invalid')).toBe('true');
    expect(classesOf(thumbOf(el))).toContain('slider-thumb--invalid');
    expect(renderedSupport(el)).toBe('error');

    el.setCustomValidity('');
    await wait(SETTLE);
    expect(el.checkValidity()).toBe(true);
    expect(renderedSupport(el)).toBe('helper');
  });
});
