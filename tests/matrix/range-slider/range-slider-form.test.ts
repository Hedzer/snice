/**
 * Matrix slice RANGE-SLIDER / FORM — the component as a form-associated custom
 * element.
 *
 * Contract (docs/ai/components/range-slider.md § Value and form lifecycle),
 * one clause per test:
 *
 *   · "Live endpoints are independent from authored `value-low`/`value-high`
 *     defaults."
 *   · "Each pristine endpoint follows its default; interaction, restore, or
 *     assignment dirties it."
 *   · "Form/restoration state is `\"low,high\"`; reset silently restores both
 *     latest defaults as one clamped ordered range."
 *   · "Repeated reset, reconnect, form moves, and disabled fieldsets preserve
 *     authored state."
 *   · "A named range contributes one `\"low,high\"` string to `FormData`."
 *   · "`setCustomValidity(message)` establishes `customError`, styles/names both
 *     thumbs as invalid, and blocks validated submission; pass `''` to clear."
 *   · "Disabled ranges are omitted and barred. Custom errors survive the
 *     temporary barred state and reappear when re-enabled."
 *
 * And from § Accessibility: "Associated labels name the thumbs as
 * `<label> minimum` and `<label> maximum`".
 *
 * ── Why this slice talks to ElementInternals ────────────────────────────────
 *
 * happy-dom attaches internals but implements none of the plumbing behind them:
 * `new FormData(form)` returns nothing for a form-associated custom element and
 * `form.reset()` never reaches `formResetCallback`. That is an ENVIRONMENT
 * limit, so this slice observes the component's own half of the contract —
 * the `setFormValue`/`setValidity` calls — through the shared
 * `tests/matrix/internals-mock.ts` recorder, and drives the platform's half by
 * invoking the callbacks the browser would invoke. The REAL `FormData`,
 * `form.reset()` and `<fieldset disabled>` algorithms are asserted in a real
 * engine by `tests/live/matrix/range-slider/range-slider-visual.spec.ts`, as
 * the recorder's own header prescribes.
 *
 * Dimensions: submission cross (named x disabled = 4), the pristine/dirty cross
 * (endpoint x mutation source = 6), reset repetition, the three documented
 * restore shapes, and the validity barrier sequence.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, unmountAll, product, settle, key } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, internalsFor, submittedEntry, activeFlags,
} from '../internals-mock';
import {
  range, attrsOf, rangeProblems, read, expectedFormValue, normalizePair,
  type RangeCombo,
} from './range-slider-support';

const mountRange = (c: RangeCombo) => mount<any>('snice-range-slider', attrsOf(c));

beforeEach(() => { installInternalsMock(); });
afterEach(() => { restoreInternalsMock(); unmountAll(); });

describe('range-slider matrix: the form value', () => {
  // ── "A named range contributes one `low,high` string" ────────────────────

  for (const point of product({ named: [true, false], disabled: [true, false] })) {
    const named = point.named as boolean;
    const disabled = point.disabled as boolean;
    const id = `named=${named} disabled=${disabled}`;

    it(`submission: ${id}`, async () => {
      const c = range({
        name: named ? 'span' : '', disabled,
        defaultValueLow: 20, defaultValueHigh: 80,
      });
      const el = await mountRange(c);

      // ONE string, in the documented shape, for a named control.
      expect(submittedEntry(el), id)
        .toEqual(named ? ['span', expectedFormValue(20, 80)] : null);
      // "…and barred": a disabled range carries no constraint state at all.
      expect(el.willValidate, `${id}: willValidate`).toBe(!disabled);
      if (disabled) expect(activeFlags(el), `${id}: flags while barred`).toEqual([]);
      expect(rangeProblems(el, c), id).toEqual([]);
    });
  }

  it('the form value follows the live endpoints, not the authored defaults', async () => {
    const el = await mountRange(range({
      name: 'span', step: 5, defaultValueLow: 20, defaultValueHigh: 80,
    }));
    el.valueLow = 35;
    await settle(el);

    expect(submittedEntry(el)).toEqual(['span', expectedFormValue(35, 80)]);
    expect(el.getAttribute('value-low'), 'the authored default was rewritten').toBe('20');
  });

  it('the restoration state is the same "low,high" string as the value', async () => {
    const el = await mountRange(range({ name: 'span', defaultValueLow: 20, defaultValueHigh: 80 }));
    const internals = internalsFor(el);
    expect(internals.formValue).toBe('20,80');
    expect(internals.state, 'the restoration state differs from the value').toBe('20,80');
  });

  it('every endpoint move republishes one ordered "low,high" pair', async () => {
    const el = await mountRange(range({ name: 'span', step: 5, defaultValueLow: 20, defaultValueHigh: 80 }));

    for (const [low, high] of [[35, 80], [35, 45], [90, 45]] as Array<[number, number]>) {
      el.valueLow = low;
      el.valueHigh = high;
      await settle(el);
      const [, value] = submittedEntry(el)!;
      const [gotLow, gotHigh] = value.split(',').map(Number);
      expect(value.split(',').length, 'the form value is not a pair').toBe(2);
      expect(gotLow, `"${value}" is not ordered`).toBeLessThanOrEqual(gotHigh);
      expect(value).toBe(expectedFormValue(el.valueLow, el.valueHigh));
    }
  });
});

describe('range-slider matrix: pristine, dirty and reset', () => {
  // ── "Each pristine endpoint follows its default; interaction, restore, or
  //     assignment dirties it." ──────────────────────────────────────────────

  for (const point of product({
    endpoint: ['low', 'high'] as const,
    source: ['assignment', 'keyboard', 'restore'] as const,
  })) {
    const endpoint = point.endpoint as 'low' | 'high';
    const source = point.source as 'assignment' | 'keyboard' | 'restore';

    it(`the ${endpoint} endpoint is dirtied by ${source}`, async () => {
      const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));

      switch (source) {
        case 'assignment':
          if (endpoint === 'low') el.valueLow = 40; else el.valueHigh = 60;
          break;
        case 'keyboard':
          key(endpoint === 'low' ? read(el).low.node : read(el).high.node, 'ArrowRight');
          break;
        case 'restore':
          // Documented as one of the three dirtying sources; it dirties BOTH.
          el.formStateRestoreCallback('40,60');
          break;
      }
      await settle(el);
      const dirtied = { low: el.valueLow as number, high: el.valueHigh as number };

      el.setAttribute('value-low', '5');
      el.setAttribute('value-high', '95');
      await settle(el);

      const dirtyLow = source === 'restore' || endpoint === 'low';
      const dirtyHigh = source === 'restore' || endpoint === 'high';
      expect(el.valueLow, 'the low endpoint').toBe(dirtyLow ? dirtied.low : 5);
      expect(el.valueHigh, 'the high endpoint').toBe(dirtyHigh ? dirtied.high : 95);
    });
  }

  it('a pristine range follows both defaults as they change', async () => {
    const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));
    el.setAttribute('value-low', '35');
    el.setAttribute('value-high', '65');
    await settle(el);
    expect({ low: el.valueLow, high: el.valueHigh }).toEqual({ low: 35, high: 65 });
  });

  // ── "reset silently restores both latest defaults as one clamped ordered
  //     range" ─────────────────────────────────────────────────────────────

  it('reset restores the latest defaults, ordered and clamped, without an event', async () => {
    const el = await mountRange(range({
      min: 0, max: 100, step: 5, name: 'span', defaultValueLow: 20, defaultValueHigh: 80,
    }));
    const seen: unknown[] = [];
    el.addEventListener('range-change', (e: Event) => seen.push((e as CustomEvent).detail));

    el.valueLow = 45;
    el.valueHigh = 55;
    await settle(el);

    // The LATEST defaults, authored inverted and out of range on purpose.
    el.setAttribute('value-low', '900');
    el.setAttribute('value-high', '-900');
    await settle(el);

    el.formResetCallback();
    await settle(el);

    const want = normalizePair(900, -900, 0, 100, 5);
    expect({ low: el.valueLow, high: el.valueHigh }, 'reset did not restore the latest defaults')
      .toEqual(want);
    expect(seen, 'reset was not silent').toEqual([]);
    expect(submittedEntry(el)).toEqual(['span', expectedFormValue(want.low, want.high)]);
  });

  it('repeated reset is idempotent and leaves the authored state alone', async () => {
    const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));
    el.valueLow = 40;
    await settle(el);

    for (let i = 0; i < 3; i++) { el.formResetCallback(); await settle(el); }

    expect({ low: el.valueLow, high: el.valueHigh }).toEqual({ low: 20, high: 80 });
    expect(el.getAttribute('value-low'), 'reset rewrote the authored state').toBe('20');
    expect(el.getAttribute('value-high'), 'reset rewrote the authored state').toBe('80');
  });

  it('reset after reset-then-dirty still lands on the defaults', async () => {
    const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));
    el.valueLow = 40;
    await settle(el);
    el.formResetCallback();
    await settle(el);
    el.valueHigh = 55;
    await settle(el);
    el.formResetCallback();
    await settle(el);

    expect({ low: el.valueLow, high: el.valueHigh }).toEqual({ low: 20, high: 80 });
  });

  it('reconnecting preserves the authored state', async () => {
    const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));
    el.valueHigh = 60;
    await settle(el);

    const parent = el.parentElement!;
    el.remove();
    parent.append(el);
    await settle(el);

    expect({ low: el.valueLow, high: el.valueHigh }).toEqual({ low: 20, high: 60 });
  });

  it('a disabled fieldset preserves the authored state and bars the control', async () => {
    const el = await mountRange(range({ name: 'span', defaultValueLow: 20, defaultValueHigh: 80 }));
    el.valueLow = 40;
    await settle(el);

    // Exactly what the browser does on entering a disabled fieldset, and on
    // leaving it again.
    el.formDisabledCallback(true);
    await settle(el);
    expect(el.willValidate, 'a fieldset-disabled range still validates').toBe(false);
    key(read(el).low.node, 'ArrowRight');
    await settle(el);
    expect(el.valueLow, 'a fieldset-disabled range moved on a key press').toBe(40);

    el.formDisabledCallback(false);
    await settle(el);
    expect({ low: el.valueLow, high: el.valueHigh }, 'the barred state rewrote the endpoints')
      .toEqual({ low: 40, high: 80 });
    expect(el.willValidate).toBe(true);
  });

  // ── "Form/restoration state is `low,high`" ───────────────────────────────

  for (const [state, want] of [
    ['30,70', { low: 30, high: 70 }],
    ['70,30', { low: 30, high: 70 }],       // ordered on the way in
    ['-40,400', { low: 0, high: 100 }],     // clamped on the way in
  ] as Array<[string, { low: number; high: number }]>) {
    it(`a browser restore of "${state}" lands on ${want.low},${want.high}`, async () => {
      const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));
      el.formStateRestoreCallback(state);
      await settle(el);
      expect({ low: el.valueLow, high: el.valueHigh }).toEqual(want);
    });
  }

  for (const state of ['', '30', '30,70,90', 'a,b', null] as Array<string | null>) {
    it(`a restore of ${JSON.stringify(state)} is not a "low,high" pair and is ignored`, async () => {
      const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));
      el.formStateRestoreCallback(state);
      await settle(el);
      expect({ low: el.valueLow, high: el.valueHigh }).toEqual({ low: 20, high: 80 });
    });
  }
});

describe('range-slider matrix: validity', () => {
  it('a normalized range carries no residual min/max/step error', async () => {
    const c = range({ min: 0, max: 100, step: 7, defaultValueLow: -20, defaultValueHigh: 999 });
    const el = await mountRange(c);

    expect(activeFlags(el), 'a normalized range still reports a constraint error').toEqual([]);
    expect(el.checkValidity(), 'a normalized range is invalid').toBe(true);
    expect(rangeProblems(el, c)).toEqual([]);
  });

  it('setCustomValidity establishes customError and names both thumbs invalid', async () => {
    const el = await mountRange(range({ name: 'span' }));
    el.setCustomValidity('pick a narrower span');
    await settle(el);

    expect(activeFlags(el)).toEqual(['customError']);
    expect(el.validationMessage).toBe('pick a narrower span');
    expect(el.checkValidity()).toBe(false);
    const r = read(el);
    expect(r.low.ariaInvalid, 'the low thumb is not named invalid').toBe('true');
    expect(r.high.ariaInvalid, 'the high thumb is not named invalid').toBe('true');
  });

  it('an empty message clears the custom error', async () => {
    const el = await mountRange(range({ name: 'span' }));
    el.setCustomValidity('nope');
    await settle(el);
    el.setCustomValidity('');
    await settle(el);

    expect(activeFlags(el)).toEqual([]);
    expect(el.validationMessage).toBe('');
    expect(el.checkValidity()).toBe(true);
    expect(read(el).low.ariaInvalid, 'the low thumb stayed named invalid').toBe('false');
  });

  it('a custom error survives the barred state and reappears when re-enabled', async () => {
    const el = await mountRange(range({ name: 'span' }));
    el.setCustomValidity('nope');
    await settle(el);

    el.setAttribute('disabled', '');
    await settle(el);
    expect(el.willValidate, 'a disabled range still validates').toBe(false);
    expect(activeFlags(el), 'a barred range still carries flags').toEqual([]);

    el.removeAttribute('disabled');
    await settle(el);
    expect(el.willValidate).toBe(true);
    expect(activeFlags(el), 'the custom error did not survive the barred state')
      .toEqual(['customError']);
    expect(el.validationMessage).toBe('nope');
  });

  it('a barred range reports valid rather than failing', async () => {
    const el = await mountRange(range({ name: 'span', disabled: true }));
    el.setCustomValidity('nope');
    await settle(el);
    expect(el.willValidate).toBe(false);
    expect(el.checkValidity(), 'a barred control reported failure').toBe(true);
  });
});

describe('range-slider matrix: labels', () => {
  it('an associated label names both thumbs "<label> minimum" and "<label> maximum"', async () => {
    const label = document.createElement('label');
    label.setAttribute('for', 'span');
    label.textContent = 'Price';
    document.body.append(label);

    const el = await mountRange(range({ name: 'span' }));
    el.id = 'span';
    // Re-run the association now that the id matches, the way a page that
    // authored both in markup would have had it from the start.
    el.remove();
    document.body.append(el);
    await settle(el);

    const r = read(el);
    expect(r.low.ariaLabel, 'the low thumb is not named after its label').toBe('Price minimum');
    expect(r.high.ariaLabel, 'the high thumb is not named after its label').toBe('Price maximum');
  });

  it('with no label the thumbs still carry the two documented names', async () => {
    const el = await mountRange(range({ name: 'span' }));
    const r = read(el);
    expect(r.low.ariaLabel, 'the low thumb has no accessible name').toMatch(/minimum$/);
    expect(r.high.ariaLabel, 'the high thumb has no accessible name').toMatch(/maximum$/);
  });
});
