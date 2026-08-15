/**
 * Smoke slice of the snice-date-time-picker matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), the same way `tests/matrix/table` is; the full
 * 275-case date-time-picker matrix runs only via `npm run test:matrix`. This
 * file deliberately lives at `smoke.test.ts` so it stays collected by the
 * everyday loop.
 *
 * What it covers, and why that is the right subset — one combo per feature
 * family, chosen so a family that breaks cannot hide:
 *   · display     — a non-ISO date format on a 12-hour clock, the combination
 *                   where a display leak into the submitted value shows up;
 *   · parsing     — the same rendering typed straight back in (the round trip
 *                   the whole `dateFormat` dimension rests on);
 *   · strictness  — February 30th never becomes March 2nd;
 *   · validity    — the documented mapping, on a value under `min`;
 *   · chrome      — helper/error exclusivity and the describedby rule;
 *   · panel       — the 12-hour clock's period column and independent naming;
 *   · live/default — a dirty control ignores a later default change;
 *   · findings    — the marquee regression, pinned so a FIX shows up here
 *                   immediately rather than only in the matrix tier.
 *
 * Every assertion routes through the matrix's own oracle
 * (matrix/date-time-picker/date-time-picker-support.ts) so this file cannot
 * drift into asserting something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  displayProblems, validityProblems, chromeProblems, panelProblems, expectClean,
  readFacts, valueByName, typeInto, commit, collectEvents, sequence,
  wait, SETTLE, canonical,
  type ChromeSpec,
} from './date-time-picker-support';

describe('date-time-picker matrix smoke', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  it('display: a non-ISO format on a 12-hour clock still submits canonical ISO', async () => {
    const sample = valueByName('canonical');
    const el = await mountPicker({
      attrs: { 'date-format': 'dd/mm/yyyy', 'time-format': '12h' },
      liveValue: sample.input,
    });

    expectClean(displayProblems(el, sample, 'dd/mm/yyyy', '12h', false), 'dd/mm/yyyy/12h');
    expect(readFacts(el).visible).toBe('10/03/2026 2:05 PM');
    expect(readFacts(el).formValue).toBe('2026-03-10T14:05');
  });

  it('parsing: the control reads back the exact text it renders', async () => {
    const attrs = { 'date-format': 'mmmm dd, yyyy', 'time-format': '12h' };
    const source = await mountPicker({ attrs, liveValue: '2026-03-10T14:05' });
    const shown = readFacts(source).visible;

    const target = await mountPicker({ attrs });
    typeInto(target, shown);
    commit(target);
    await wait(SETTLE);

    expect(readFacts(target).flags).toEqual([]);
    expect(readFacts(target).formValue).toBe('2026-03-10T14:05');
  });

  it('strictness: an impossible date stays visible and submits nothing', async () => {
    const sample = valueByName('impossible-date');
    const el = await mountPicker({ liveValue: sample.input });
    const facts = readFacts(el);

    expect(facts.visible).toBe('2026-02-30T10:00');
    expect(facts.formValue, 'Feb 30 must not roll into Mar 2').toBe('');
    expect(facts.flags).toEqual(['badInput']);
  });

  it('validity: a value before min reports rangeUnderflow', async () => {
    const sample = valueByName('canonical');
    const el = await mountPicker({
      attrs: { min: '2026-03-15T00:00' },
      liveValue: sample.input,
    });

    expectClean(
      validityProblems(el, sample, { required: false, min: '2026-03-15T00:00', max: '', barred: false }, false),
      'canonical/min-only',
    );
    expect(readFacts(el).flags).toEqual(['rangeUnderflow']);
    expect(readFacts(el).formValue).toBe(canonical(sample.parts, false));
  });

  it('chrome: an error replaces the helper and owns the single describedby', async () => {
    const spec: ChromeSpec = {
      variant: 'dropdown', label: 'Appointment',
      helperText: 'Local time, please', errorText: 'That slot is gone',
      loading: false, clearable: true, disabled: false, readonly: false,
      invalid: true, hasText: true,
    };
    const el = await mountPicker({
      attrs: {
        label: spec.label, 'helper-text': spec.helperText, 'error-text': spec.errorText,
        clearable: true, invalid: true,
      },
      liveValue: '2026-03-10T14:05',
    });

    expectClean(chromeProblems(el, spec), 'dropdown/both/labelled');
    const facts = readFacts(el);
    expect(facts.presentParts).toContain('error-text');
    expect(facts.presentParts).not.toContain('helper-text');
    expect(facts.describedNodeIds).toHaveLength(1);
  });

  it('panel: a 12-hour clock with seconds names four independent time columns', async () => {
    const el = await mountPicker({
      attrs: { 'time-format': '12h', 'show-seconds': true, label: 'Appointment' },
    });
    expectClean(panelProblems(el, '12h', true, 'Appointment'), 'dropdown/12h/seconds/labelled');
    expect(readFacts(el).timeUnits).toEqual(['hours', 'minutes', 'seconds', 'period']);
  });

  it('live/default: a dirty control ignores a later default change', async () => {
    const el = await mountPicker({ attrs: { value: '2026-03-10T14:05' } });
    el.value = '2026-04-01T08:00';
    await wait(SETTLE);

    el.setAttribute('value', '2026-05-05T05:05');
    await wait(SETTLE);

    expect(el.value, 'a dirty live value survives').toBe('2026-04-01T08:00');
    expect(el.defaultValue).toBe('2026-05-05T05:05');

    (el as any).formResetCallback();
    await wait(SETTLE);
    expect(el.value, 'reset restores the current default').toBe('2026-05-05T05:05');
  });

  it('events: clear emits clear then change', async () => {
    const el = await mountPicker({ attrs: { clearable: true }, liveValue: '2026-03-10T14:05' });
    const seen = collectEvents(el, ['datetimepicker-clear', 'datetime-change']);

    el.clear();
    await wait(SETTLE);

    expect(sequence(seen)).toEqual(['datetimepicker-clear', 'datetime-change']);
  });

  // The marquee regression, kept at full strength. See
  // matrix/date-time-picker/events.test.ts (MATRIX-date-time-picker-1).
  it.fails('MATRIX-date-time-picker-1 open() announces one open', async () => {
    const el = await mountPicker({});
    const seen = collectEvents(el, ['datetimepicker-open']);

    el.open();
    await wait(SETTLE);

    expect(readFacts(el).panelOpen).toBe(true);
    expect(sequence(seen)).toEqual(['datetimepicker-open']);
  });
});
