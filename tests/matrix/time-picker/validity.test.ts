/**
 * Matrix slice TIME-PICKER / VALIDITY — the documented flag table.
 *
 * Contract (docs/ai/components/time-picker.md § Validation):
 *   `valueMissing`  = `required && canonicalValue === ''`
 *   `badInput`      = non-empty visible text that cannot be parsed in the
 *                     active display format
 *   `rangeUnderflow`= exact time before a valid `min-time`
 *   `rangeOverflow` = exact time after a valid `max-time`
 *   `stepMismatch`  = minute not divisible by the effective step, or a VISIBLE
 *                     second not divisible by it
 *   `customError`   = non-empty `setCustomValidity(message)`
 *   "…malformed constraints are ignored and boundaries are inclusive."
 *   "Supported steps: 1|5|10|15|30, default 15. … Invalid runtime step values
 *    safely fall back to 15."
 *   "`invalid` is visual/ARIA presentation only; it does not change native
 *    validity."
 *
 * Dimensions: the range cross (value 7 x constraint pair 4 = 28), the step
 * cross (step 7 x value 5 = 35), the required cross, the malformed-constraint
 * sweep, and the custom-error sequence.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, product } from '../matrix-utils';
import {
  picker, comboId, mountPicker, pickerProblems, expectedFlags, expectedInitial,
  effectiveStep, installInternalsMock, restoreInternalsMock, activeFlags, read,
  STEPS, type TimeCombo,
} from './time-picker-support';

describe('time-picker matrix: validity', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  // ── Range: inclusive boundaries, ignored malformed constraints ──────────

  const RANGES: Array<[string, string]> = [
    ['', ''],                       // no constraint at all
    ['09:00', '17:00'],             // the pair the docs print
    ['09:00', ''],                  // a lower bound only
    ['', '17:00'],                  // an upper bound only
  ];
  const TIMES = ['00:00', '08:59', '09:00', '13:00', '17:00', '17:01', '23:59'];

  for (const point of product({ range: RANGES, value: TIMES })) {
    const [minTime, maxTime] = point.range as [string, string];
    const c: TimeCombo = picker({
      defaultValue: point.value as string, minTime, maxTime, step: 1, name: 'when',
    });

    it(`range: ${comboId(c)}`, async () => {
      const el = await mountPicker(c);
      const want = expectedFlags(c, expectedInitial(c));

      // The documented rule, restated: boundaries are INCLUSIVE.
      const value = point.value as string;
      const expectUnder = Boolean(minTime) && value < minTime;
      const expectOver = Boolean(maxTime) && value > maxTime;
      expect(want.includes('rangeUnderflow'), `${value} vs min ${minTime}`).toBe(expectUnder);
      expect(want.includes('rangeOverflow'), `${value} vs max ${maxTime}`).toBe(expectOver);

      expect(activeFlags(el), comboId(c)).toEqual(want);
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  for (const malformed of ['9:00', '09', 'nine', '09:00:00:00', '25:00']) {
    it(`a malformed min-time "${malformed}" is ignored`, async () => {
      const c = picker({ defaultValue: '00:00', minTime: malformed, step: 1, name: 'when' });
      const el = await mountPicker(c);
      expect(activeFlags(el), 'a malformed constraint was enforced').toEqual([]);
      expect(pickerProblems(el, c)).toEqual([]);
    });
  }

  it('a seconds-resolution constraint is honoured at seconds resolution', async () => {
    const c = picker({
      defaultValue: '09:00:10', minTime: '09:00:30', showSeconds: true, step: 1, name: 'when',
    });
    const el = await mountPicker(c);
    expect(activeFlags(el)).toEqual(['rangeUnderflow']);
    expect(pickerProblems(el, c)).toEqual([]);
  });

  // ── Step: the documented lattice and the documented fallback ────────────

  for (const point of product({
    step: [...STEPS, 7, 0],
    value: ['09:00', '09:05', '09:10', '09:15', '09:30'],
  })) {
    const step = point.step as number;
    const c: TimeCombo = picker({ defaultValue: point.value as string, step, name: 'when' });

    it(`step: ${comboId(c)}`, async () => {
      const el = await mountPicker(c);

      // "Invalid runtime step values safely fall back to 15."
      const effective = effectiveStep(step);
      expect(effective, `step=${step}`).toBe((STEPS as readonly number[]).includes(step) ? step : 15);

      const minutes = Number((point.value as string).slice(3, 5));
      const want = minutes % effective === 0 ? [] : ['stepMismatch'];
      expect(activeFlags(el), comboId(c)).toEqual(want);
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  it('a visible second off the lattice is a step mismatch; a hidden one is not', async () => {
    const shown = picker({ defaultValue: '09:00:07', showSeconds: true, step: 5, name: 'when' });
    const el = await mountPicker(shown);
    expect(activeFlags(el), 'a displayed second off the lattice passed').toEqual(['stepMismatch']);
    expect(pickerProblems(el, shown)).toEqual([]);
    unmountAll();

    const hidden = picker({ defaultValue: '09:00:07', showSeconds: false, step: 5, name: 'when' });
    const el2 = await mountPicker(hidden);
    expect(activeFlags(el2), 'a second nobody can see was graded').toEqual([]);
    expect(pickerProblems(el2, hidden)).toEqual([]);
  });

  it('the step also decides which minute options exist', async () => {
    for (const step of STEPS) {
      const c = picker({ step, name: 'when' });
      const el = await mountPicker(c);
      expect(read(el).minutes!.labels.length, `step=${step}`).toBe(60 / step);
      expect(pickerProblems(el, c)).toEqual([]);
      unmountAll();
    }
  });

  // ── required ────────────────────────────────────────────────────────────

  for (const point of product({ required: [true, false], value: ['', '09:00', 'nonsense'] })) {
    const c: TimeCombo = picker({
      required: point.required as boolean, defaultValue: point.value as string,
      step: 1, name: 'when',
    });

    it(`required: ${comboId(c)}`, async () => {
      const el = await mountPicker(c);
      const want = expectedFlags(c, expectedInitial(c));
      const value = point.value as string;
      expect(want.includes('valueMissing'), `required=${point.required} value="${value}"`)
        .toBe(Boolean(point.required) && value !== '09:00');
      expect(activeFlags(el), comboId(c)).toEqual(want);
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  // ── customError ─────────────────────────────────────────────────────────

  it('setCustomValidity establishes customError and an empty message clears it', async () => {
    const c = picker({ defaultValue: '09:00', step: 1, name: 'when' });
    const el = await mountPicker(c);
    expect(activeFlags(el)).toEqual([]);

    el.setCustomValidity('choose a working hour');
    await (el as any).rendered;
    expect(activeFlags(el)).toEqual(['customError']);
    expect(el.validationMessage).toBe('choose a working hour');
    expect(el.checkValidity()).toBe(false);

    el.setCustomValidity('');
    await (el as any).rendered;
    expect(activeFlags(el)).toEqual([]);
    expect(el.validationMessage).toBe('');
    expect(el.checkValidity()).toBe(true);
    expect(pickerProblems(el, c)).toEqual([]);
  });

  it('a custom error joins the constraint flags rather than replacing them', async () => {
    const c = picker({ defaultValue: '08:00', minTime: '09:00', step: 1, name: 'when' });
    const el = await mountPicker(c);
    el.setCustomValidity('too early');
    await (el as any).rendered;
    expect(activeFlags(el)).toEqual(['customError', 'rangeUnderflow']);
  });

  // ── "invalid is visual/ARIA presentation only" ──────────────────────────

  it('the invalid property shows without changing native validity', async () => {
    const c = picker({ defaultValue: '09:00', invalid: true, step: 1, name: 'when' });
    const el = await mountPicker(c);

    expect(activeFlags(el), 'the visual invalid flag reached constraint validation').toEqual([]);
    expect(el.checkValidity(), 'the visual invalid flag failed validation').toBe(true);
    expect(read(el).ariaInvalid, 'the visual invalid flag is not announced').toBe('true');
    expect(pickerProblems(el, c)).toEqual([]);
  });

  // ── Barred states carry no flags at all ─────────────────────────────────

  for (const barrier of ['disabled', 'readonly', 'loading'] as const) {
    it(`${barrier} bars validation even with everything wrong at once`, async () => {
      const c = picker({
        [barrier]: true,
        defaultValue: 'nonsense', required: true, minTime: '09:00', maxTime: '17:00',
        step: 15, name: 'when',
      } as Partial<TimeCombo>);
      const el = await mountPicker(c);

      expect(activeFlags(el), `${barrier} still reported flags`).toEqual([]);
      expect(el.willValidate, `${barrier} still validates`).toBe(false);
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }
});
