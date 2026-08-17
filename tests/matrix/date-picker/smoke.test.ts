/**
 * Smoke slice of the snice-date-picker matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full 449-case date-picker matrix runs only via
 * `npm run test:matrix`. This file deliberately lives at `smoke.test.ts` so
 * it stays collected by the everyday loop.
 *
 * What it covers, and why that is the right subset — one combo per feature
 * family, chosen so a family that breaks cannot hide:
 *   · display     — a non-default format renders its own text and still
 *                   submits canonical `YYYY-MM-DD`;
 *   · parsing     — the exact rendering typed back in (the round trip the
 *                   whole `format` dimension rests on);
 *   · strictness  — February 30th never becomes March 2nd;
 *   · values      — a programmatic impossible date sanitizes to '';
 *   · validity    — the documented mapping, on a value under `min`;
 *   · form        — a named empty picker contributes '';
 *   · chrome      — error replaces helper and owns the single describedby;
 *   · live/default — a dirty control ignores a later default change;
 *   · findings    — the marquee regressions, pinned so a FIX shows up here
 *                   immediately rather than only in the matrix tier.
 *
 * Every assertion routes through the matrix's own oracle
 * (matrix/date-picker/date-picker-support.ts) so this file cannot drift into
 * asserting something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  displayProblems, readFacts, valueByName, typeInto, submittedEntry, dayButtons,
  expectedFlags, expectedFormValue, wait, SETTLE, canonical, expectClean,
} from './date-picker-support';

describe('date-picker matrix smoke', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  it('display: a non-default format still submits canonical YYYY-MM-DD', async () => {
    const sample = valueByName('canonical');
    const el = await mountPicker({ attrs: { format: 'dd/mm/yyyy' }, liveValue: sample.input });

    expectClean(displayProblems(el, sample, 'dd/mm/yyyy'), 'dd/mm/yyyy');
    expect(readFacts(el).visible).toBe('15/03/2026');
    expect(readFacts(el).formValue).toBe('2026-03-15');
  });

  it('parsing: the control reads back the exact text it renders', async () => {
    const el = await mountPicker({ attrs: { format: 'mmmm dd, yyyy' } });
    typeInto(el, 'March 15, 2026');

    const facts = readFacts(el);
    expect(facts.value).toBe('2026-03-15');
    expect(facts.flags).toEqual([]);
  });

  it('strictness: an impossible typed date stays visible and submits nothing', async () => {
    const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy' } });
    await typeInto(el, '02/30/2026');
    const facts = readFacts(el);

    expect(facts.visible, 'Feb 30 must not roll into Mar 2').toBe('02/30/2026');
    expect(facts.formValue).toBe('');
    expect(facts.flags).toEqual(['badInput']);
  });

  it('values: a programmatic impossible date sanitizes to ""', async () => {
    const el = await mountPicker({ liveValue: '2026-02-30' });
    const facts = readFacts(el);

    expect(facts.value).toBe('');
    expect(facts.visible).toBe('');
    expect(facts.flags).toEqual([]);
  });

  it('validity: required-empty reports valueMissing; min/max bound the calendar', async () => {
    // The range flags themselves are environment-unobservable here — happy-dom's
    // proxy input clears a value outside min/max — so this smoke combo mirrors
    // the validity tier's own substitution (validity.test.ts): the flag mapping
    // on a shape this environment CAN produce, plus the component's own reading
    // of the bounds through the disabled calendar days.
    const empty = await mountPicker({ attrs: { required: true } });
    const facts = readFacts(empty);
    expect(facts.flags).toEqual(expectedFlags(facts.value, {
      required: true, min: '', max: '', barred: false,
    }));
    expect(facts.flags).toEqual(['valueMissing']);

    const bounded = await mountPicker({
      attrs: { min: '2026-03-10', open: true },
      liveValue: '2026-03-15',
    });
    await wait(SETTLE);
    const disabled = dayButtons(bounded)
      .filter(button => button.disabled)
      .map(button => button.getAttribute('data-date'));
    expect(disabled, 'the day below the minimum stayed enabled').toContain('2026-03-09');
    expect(disabled, 'the inclusive minimum itself was disabled').not.toContain('2026-03-10');
  });

  it('form: a named empty picker contributes ""', async () => {
    const el = await mountPicker({ attrs: { name: 'arrival' } });
    const facts = readFacts(el);

    expect(facts.formValue).toBe(expectedFormValue(facts.value, { disabled: false }));
    expect(submittedEntry(el)).toEqual(['arrival', '']);
  });

  it('chrome: an error replaces the helper and owns the single describedby', async () => {
    const el = await mountPicker({
      attrs: {
        label: 'Arrival', 'helper-text': 'Pick your arrival day',
        'error-text': 'That day is taken', invalid: true,
      },
    });

    const facts = readFacts(el);
    expect(facts.presentParts).toContain('error-text');
    expect(facts.presentParts).not.toContain('helper-text');
    expect(facts.errorRole).toBe('alert');
    expect(facts.describedNodeIds).toHaveLength(1);
    expect(facts.flags, 'errorText must not establish native invalidity').toEqual([]);
  });

  it('live/default: a dirty control ignores a later default change', async () => {
    const el = await mountPicker({ attrs: { value: '2026-03-15' } });
    el.value = '2026-04-01';
    await wait(SETTLE);

    el.setAttribute('value', '2026-05-05');
    await wait(SETTLE);

    expect(el.value, 'a dirty live value survives').toBe('2026-04-01');
    expect(el.defaultValue).toBe('2026-05-05');

    (el as any).formResetCallback();
    await wait(SETTLE);
    expect(el.value, 'reset restores the current default').toBe('2026-05-05');
  });

  // The marquee regressions, kept at full strength. See
  // matrix/date-picker/display-formats.test.ts (MATRIX-date-picker-1) and
  // matrix/date-picker/chrome.test.ts (MATRIX-date-picker-2).
  it.fails('MATRIX-date-picker-1: yyyy-mm-dd accepts the swapped separator for compatibility', async () => {
    const sample = valueByName('canonical');
    const el = await mountPicker({ attrs: { format: 'yyyy-mm-dd' }, liveValue: '2026/03/15' });
    expect(el.value,
      '"2026/03/15" was rejected under "yyyy-mm-dd" — the compatibility'
      + ' separator is documented as accepted').toBe(canonical(sample.parts));
  });

  it.fails('MATRIX-date-picker-2: the calendar popup is named "<accessible name> calendar"', async () => {
    const el = await mountPicker({ attrs: { label: 'Arrival', open: true } });
    await wait(SETTLE);
    expect(readFacts(el).calendarName,
      'the calendar popup carries no accessible name').toBe('Arrival calendar');
  });
});
