/**
 * Matrix slice TIME-PICKER / VALUES — the canonical value, and how each display
 * format prints it.
 *
 * Contract (docs/ai/components/time-picker.md § Canonical contract):
 *   "Display: `format=\"24h\"` uses `14:05`; `format=\"12h\"` uses `2:05 PM`."
 *   "Successful `FormData` value: `HH:mm`, or `HH:mm:ss` when `showSeconds`."
 *   "Always local wall-clock time. No date, time zone, UTC conversion, or
 *    localized form value."
 *   "Programmatic canonical input: zero-padded `HH:mm` or `HH:mm:ss`."
 *   "Partial/malformed text is preserved, sets `badInput`, and submits `''`."
 *
 * Dimensions: value sample (14) x format (2) x showSeconds (2) = 56 combos,
 * plus the round-trip and the boundary hours.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, product } from '../matrix-utils';
import {
  picker, comboId, mountPicker, pickerProblems, read, expectedInitial,
  parseCanonical, display, canonical, installInternalsMock, restoreInternalsMock, internalsFor,
  FORMATS, type TimePickerFormat,
} from './time-picker-support';

interface ValueSample {
  name: string;
  input: string;
  /** The documented parse, or null when the string is partial/malformed. */
  valid: boolean;
  why: string;
}

/** One sample per documented sentence about the value. */
const VALUES: readonly ValueSample[] = [
  { name: 'empty', input: '', valid: false, why: 'the documented default: nothing shown, nothing submitted' },
  { name: 'canonical', input: '14:05', valid: true, why: 'the exact string the docs print' },
  { name: 'canonical-seconds', input: '14:05:10', valid: true, why: 'the seconds form the docs print' },
  { name: 'midnight', input: '00:00', valid: true, why: 'the low boundary of a local wall clock' },
  { name: 'midnight-seconds', input: '00:00:00', valid: true, why: 'the low boundary with seconds' },
  { name: 'noon', input: '12:00', valid: true, why: '12 is the hour where a 12-hour clock turns over' },
  { name: 'one-minute-to-midnight', input: '23:59', valid: true, why: 'the high boundary' },
  { name: 'last-second', input: '23:59:59', valid: true, why: 'the high boundary with seconds' },
  { name: 'unpadded', input: '9:05', valid: false, why: 'canonical input is documented as ZERO-PADDED' },
  { name: 'hour-only', input: '14', valid: false, why: 'partial text' },
  { name: 'trailing-colon', input: '14:', valid: false, why: 'partial text' },
  { name: 'impossible-hour', input: '25:00', valid: false, why: 'wall-clock time never rolls into the next day' },
  { name: 'impossible-minute', input: '14:61', valid: false, why: 'wall-clock time never rolls into the next hour' },
  { name: 'words', input: 'lunchtime', valid: false, why: 'malformed text' },
];

describe('time-picker matrix: values', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  for (const point of product({
    sample: VALUES,
    format: FORMATS,
    showSeconds: [false, true],
  })) {
    const sample = point.sample as ValueSample;
    const c = picker({
      defaultValue: sample.input,
      format: point.format as TimePickerFormat,
      showSeconds: point.showSeconds as boolean,
      // Step 1 keeps this slice about the VALUE: every minute is on the
      // lattice, so no combo here can trip `stepMismatch`.
      step: 1,
      name: 'when',
    });

    it(`${sample.name}: ${comboId(c)}`, async () => {
      const el = await mountPicker(c);
      const want = expectedInitial(c);

      // The documented parse, restated so a wrong oracle cannot hide.
      const parts = parseCanonical(sample.input);
      expect(Boolean(parts), `${sample.name} — ${sample.why}`).toBe(sample.valid);
      expect(want.visible).toBe(parts ? display(parts, c.format, c.showSeconds) : sample.input);
      expect(want.canonical).toBe(parts ? canonical(parts, c.showSeconds) : '');

      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  // ── The two documented display strings, spelled out ──────────────────────

  it('24h prints 14:05 and 12h prints 2:05 PM', async () => {
    const asIs = picker({ defaultValue: '14:05', format: '24h', step: 5 });
    expect(read(await mountPicker(asIs)).inputValue).toBe('14:05');
    unmountAll();

    const twelve = picker({ defaultValue: '14:05', format: '12h', step: 5 });
    expect(read(await mountPicker(twelve)).inputValue).toBe('2:05 PM');
  });

  it('showSeconds extends both displays and the submitted value', async () => {
    const c = picker({ defaultValue: '14:05:10', format: '12h', showSeconds: true, step: 1, name: 'when' });
    const el = await mountPicker(c);
    expect(read(el).inputValue).toBe('2:05:10 PM');
    expect(el.value).toBe('14:05:10');
    expect(pickerProblems(el, c)).toEqual([]);
  });

  it('without showSeconds the submitted value drops the seconds it was given', async () => {
    // "Successful FormData value: HH:mm" — the precision is the control's, not
    // the author's.
    const c = picker({ defaultValue: '14:05:10', showSeconds: false, step: 1, name: 'when' });
    const el = await mountPicker(c);
    expect(internalsFor(el).formValue).toBe('14:05');
    expect(read(el).inputValue).toBe('14:05');
    expect(pickerProblems(el, c)).toEqual([]);
  });

  // ── The 12-hour clock, hour by hour ─────────────────────────────────────

  for (const [input, shown] of [
    ['00:00', '12:00 AM'],
    ['00:30', '12:30 AM'],
    ['01:00', '1:00 AM'],
    ['11:59', '11:59 AM'],
    ['12:00', '12:00 PM'],
    ['12:01', '12:01 PM'],
    ['13:00', '1:00 PM'],
    ['23:59', '11:59 PM'],
  ] as Array<[string, string]>) {
    it(`12h prints ${input} as ${shown}`, async () => {
      const c = picker({ defaultValue: input, format: '12h', step: 1, name: 'when' });
      const el = await mountPicker(c);
      expect(read(el).inputValue).toBe(shown);
      // …and the value that goes to the form is still the canonical one.
      expect(el.value).toBe(input);
      expect(pickerProblems(el, c)).toEqual([]);
    });
  }

  // ── Round trip ──────────────────────────────────────────────────────────

  for (const format of FORMATS) {
    it(`a ${format} display round-trips back to the same canonical value`, async () => {
      for (const input of ['00:00', '07:30', '12:00', '14:05', '23:45']) {
        const c = picker({ defaultValue: input, format, step: 1, name: 'when' });
        const el = await mountPicker(c);
        expect(el.value, `${input} in ${format}`).toBe(input);
        unmountAll();
      }
    });
  }

  it('the live value is not reflected to the value attribute', async () => {
    const c = picker({ defaultValue: '09:00', step: 1, name: 'when' });
    const el = await mountPicker(c);
    el.value = '17:30';
    await (el as any).rendered;

    expect(el.value).toBe('17:30');
    expect(el.getAttribute('value'), 'the live value reflected to the attribute').toBe('09:00');
    expect(el.defaultValue, 'the live value rewrote the default').toBe('09:00');
  });

  it('a malformed assignment is preserved and submits nothing', async () => {
    const c = picker({ step: 1, name: 'when' });
    const el = await mountPicker(c);
    el.value = '25:61';
    await (el as any).rendered;

    expect(read(el).inputValue, 'the malformed text was not preserved').toBe('25:61');
    expect(pickerProblems(el, c, { visible: '25:61', canonical: '' })).toEqual([]);
  });
});
