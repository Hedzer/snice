/**
 * Matrix slice DATE-TIME-PICKER / VALIDITY — the documented mapping table.
 *
 * Dimensions: value sample (6) x required (2) x constraint set (5) = 60 combos.
 *
 * Documented contract:
 *
 *     required empty                -> valueMissing
 *     partial/malformed/impossible  -> badInput
 *     before `min`                  -> rangeUnderflow
 *     after `max`                   -> rangeOverflow
 *     custom message                -> customError
 *
 *   · "Date-only `min` starts at `00:00:00`; date-only `max` includes
 *     `23:59:59`." — the reason the `date-only` constraint set below uses the
 *     SAME day for both bounds: under the documented rule that day is entirely
 *     in range, and under a naive `T00:00` reading almost none of it is.
 *   · "Impossible constraints are ignored rather than normalized." — the
 *     `impossible` set carries February 30th and a non-date, and expects the
 *     control to behave as though no bound were set at all.
 *
 * The flags are read from `setValidity` (see matrix/internals-mock.ts): the
 * documented mapping IS a statement about which flags the control raises, and
 * happy-dom implements no native validity behind `ElementInternals`.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  validityProblems, expectClean, valueByName, readFacts, wait, SETTLE,
  type ValidityContext,
} from './date-time-picker-support';

/** Constraint sets, each isolating one documented clause. */
const CONSTRAINTS: Array<{ name: string; min: string; max: string }> = [
  { name: 'unbounded', min: '', max: '' },
  { name: 'datetime-bounds', min: '2026-03-10T09:30', max: '2026-03-20T17:45' },
  { name: 'min-only', min: '2026-03-15T00:00', max: '' },
  // The documented date-only rule: min opens the day at 00:00:00 and max closes
  // it at 23:59:59, so the whole of 2026-03-10 is in range.
  { name: 'date-only-same-day', min: '2026-03-10', max: '2026-03-10' },
  // "Impossible constraints are ignored rather than normalized."
  { name: 'impossible', min: '2026-02-30', max: 'whenever' },
];

const SAMPLES = ['empty', 'canonical', 'midnight', 'partial-date-only', 'malformed', 'impossible-date'];

describe('date-time-picker matrix: validity', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const sampleName of SAMPLES) {
    for (const required of [false, true]) {
      for (const constraint of CONSTRAINTS) {
        const sample = valueByName(sampleName);
        const id = `${sampleName}/${required ? 'required' : 'optional'}/${constraint.name}`;
        const context: ValidityContext = {
          required, min: constraint.min, max: constraint.max, barred: false,
        };

        it(`${id}: reports the documented flags`, async () => {
          const attrs: Record<string, any> = {};
          if (required) attrs.required = true;
          if (constraint.min) attrs.min = constraint.min;
          if (constraint.max) attrs.max = constraint.max;

          const el = await mountPicker({ attrs, liveValue: sample.input });
          expectClean(validityProblems(el, sample, context, false), id);
        });
      }
    }
  }

  // ── customError, the one flag the author sets directly ────────────────────

  it('setCustomValidity raises customError and keeps the value submitted', async () => {
    const el = await mountPicker({ liveValue: '2026-03-10T14:05' });
    el.setCustomValidity('pick another slot');
    await wait(SETTLE);

    const facts = readFacts(el);
    expect(facts.flags).toEqual(['customError']);
    expect(facts.validationMessage).toBe('pick another slot');
    // A custom message is about acceptability, not parseability: the value is
    // still what the control holds and still what it would submit.
    expect(facts.formValue).toBe('2026-03-10T14:05');
  });

  it('setCustomValidity("") clears customError', async () => {
    const el = await mountPicker({ liveValue: '2026-03-10T14:05' });
    el.setCustomValidity('nope');
    await wait(SETTLE);
    el.setCustomValidity('');
    await wait(SETTLE);

    expect(readFacts(el).flags).toEqual([]);
  });

  it('customError coexists with the flags the value earns', async () => {
    const el = await mountPicker({ attrs: { required: true }, liveValue: 'nonsense' });
    el.setCustomValidity('and also this');
    await wait(SETTLE);

    expect(readFacts(el).flags).toEqual(['badInput', 'customError', 'valueMissing']);
  });

  // ── The date-only boundary, stated exactly ────────────────────────────────

  it('a date-only min opens the day at 00:00:00', async () => {
    const el = await mountPicker({ attrs: { min: '2026-03-10' }, liveValue: '2026-03-10T00:00' });
    expect(readFacts(el).flags, 'midnight on the min day is inside the range').toEqual([]);
  });

  it('a date-only max includes 23:59:59', async () => {
    const el = await mountPicker({
      attrs: { max: '2026-03-10', 'show-seconds': true },
      liveValue: '2026-03-10T23:59:59',
    });
    expect(readFacts(el).flags, 'the last second of the max day is inside the range').toEqual([]);
  });

  it('a date-only max excludes the next day', async () => {
    const el = await mountPicker({ attrs: { max: '2026-03-10' }, liveValue: '2026-03-11T00:00' });
    expect(readFacts(el).flags).toEqual(['rangeOverflow']);
  });
});
