/**
 * Matrix slice TIME-PICKER / INPUT PARSING — what typing produces.
 *
 * Contract (docs/ai/components/time-picker.md § Canonical contract):
 *   "Keyboard input uses the active display. With `showSeconds`, displayed
 *    seconds are required."
 *   "Partial/malformed text is preserved, sets `badInput`, and submits `''`
 *    instead of malformed text."
 *   "Always local wall-clock time." — nothing rolls over.
 *   "Successful `FormData` value: `HH:mm`, or `HH:mm:ss` when `showSeconds`."
 *
 * Dimensions: typed sample (16) x format (2) x showSeconds (2) = 64 combos.
 * Each is graded twice: once by the documented parse restated here, and once by
 * the whole-control oracle.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, product } from '../matrix-utils';
import {
  picker, comboId, mountPicker, pickerProblems, read, typeInto, canonical,
  parseDisplay, installInternalsMock, restoreInternalsMock, internalsFor,
  FORMATS, type TimePickerFormat, type TimeCombo,
} from './time-picker-support';

/** One typed string per documented clause, in both clock languages. */
const TYPED: readonly string[] = [
  '',              // cleared by hand
  '14:05',         // 24-hour display
  '14:05:10',      // 24-hour display with seconds
  '9:05',          // an unpadded hour — legal to TYPE in 24-hour display
  '2:05 PM',       // the 12-hour display the docs print
  '2:05:10 PM',    // …with seconds
  '2:05 pm',       // lower case: the same time, typed casually
  '12:00 AM',      // midnight on a 12-hour clock
  '12:00 PM',      // noon on a 12-hour clock
  '14',            // partial
  '14:',           // partial
  '2:05',          // a 12-hour time with no period
  '13:05 PM',      // a 12-hour display hour that does not exist
  '25:00',         // impossible hour
  '14:61',         // impossible minute
  'lunchtime',     // malformed
];

describe('time-picker matrix: input parsing', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  for (const point of product({
    typed: TYPED,
    format: FORMATS,
    showSeconds: [false, true],
  })) {
    const typed = point.typed as string;
    const c: TimeCombo = picker({
      format: point.format as TimePickerFormat,
      showSeconds: point.showSeconds as boolean,
      step: 1,
      name: 'when',
    });

    it(`typing "${typed}" into ${comboId(c)}`, async () => {
      const el = await mountPicker(c);
      await typeInto(el, typed);

      // The documented parse, restated so a wrong oracle cannot hide behind
      // itself: the ACTIVE DISPLAY decides, and seconds are required when they
      // are displayed.
      const parts = parseDisplay(typed, c.format, c.showSeconds);
      const want = {
        visible: typed,                                     // preserved, always
        canonical: parts ? canonical(parts, c.showSeconds) : '',
      };

      expect(read(el).inputValue, 'the typed text was not preserved').toBe(typed);
      expect(internalsFor(el).formValue, `"${typed}" submitted the wrong value`)
        .toBe(want.canonical);
      expect(pickerProblems(el, c, want), `typing "${typed}" into ${comboId(c)}`).toEqual([]);
    });
  }

  // ── "With showSeconds, displayed seconds are required" ───────────────────

  for (const format of FORMATS) {
    it(`${format}: a minute-only string is rejected once seconds are displayed`, async () => {
      const minuteOnly = format === '12h' ? '2:05 PM' : '14:05';
      const withSeconds = format === '12h' ? '2:05:10 PM' : '14:05:10';

      const without = picker({ format, showSeconds: false, step: 1, name: 'when' });
      const el = await mountPicker(without);
      await typeInto(el, minuteOnly);
      expect(internalsFor(el).formValue, 'a minute-only string was rejected without showSeconds')
        .toBe('14:05');
      unmountAll();

      const shown = picker({ format, showSeconds: true, step: 1, name: 'when' });
      const el2 = await mountPicker(shown);
      await typeInto(el2, minuteOnly);
      expect(internalsFor(el2).formValue, 'a minute-only string was accepted with showSeconds')
        .toBe('');
      expect(pickerProblems(el2, shown, { visible: minuteOnly, canonical: '' })).toEqual([]);

      await typeInto(el2, withSeconds);
      expect(internalsFor(el2).formValue).toBe('14:05:10');
    });
  }

  // ── The active display is the only language accepted ────────────────────

  it('a 12-hour string is not accepted while the display is 24-hour', async () => {
    const c = picker({ format: '24h', step: 1, name: 'when' });
    const el = await mountPicker(c);
    await typeInto(el, '2:05 PM');
    expect(internalsFor(el).formValue).toBe('');
    expect(pickerProblems(el, c, { visible: '2:05 PM', canonical: '' })).toEqual([]);
  });

  it('a bare 24-hour string is not accepted while the display is 12-hour', async () => {
    const c = picker({ format: '12h', step: 1, name: 'when' });
    const el = await mountPicker(c);
    await typeInto(el, '14:05');
    expect(internalsFor(el).formValue).toBe('');
    expect(pickerProblems(el, c, { visible: '14:05', canonical: '' })).toEqual([]);
  });

  it('typing over a valid time with malformed text drops the submitted value', async () => {
    const c = picker({ defaultValue: '09:30', step: 1, name: 'when' });
    const el = await mountPicker(c);
    expect(internalsFor(el).formValue).toBe('09:30');

    await typeInto(el, '09:');
    expect(internalsFor(el).formValue, 'malformed text was still submitted').toBe('');
    expect(pickerProblems(el, c, { visible: '09:', canonical: '' })).toEqual([]);
  });

  it('typing an empty string is an empty control, not bad input', async () => {
    const c = picker({ defaultValue: '09:30', step: 1, name: 'when' });
    const el = await mountPicker(c);
    await typeInto(el, '');
    expect(pickerProblems(el, c, { visible: '', canonical: '' })).toEqual([]);
  });

  // ── Changing the display re-prints what was typed ───────────────────────

  it('switching format re-prints the same time without rewriting the default', async () => {
    const c = picker({ defaultValue: '14:05', format: '24h', step: 1, name: 'when' });
    const el = await mountPicker(c);
    expect(read(el).inputValue).toBe('14:05');

    el.setAttribute('format', '12h');
    await (el as any).rendered;

    expect(read(el).inputValue, 'the display did not follow the format').toBe('2:05 PM');
    expect(el.defaultValue, 'changing the format rewrote the reset default').toBe('14:05');
    expect(internalsFor(el).formValue, 'the submitted value changed with the display')
      .toBe('14:05');
  });

  it('switching showSeconds changes the submitted precision, not the default', async () => {
    const c = picker({ defaultValue: '14:05:10', showSeconds: true, step: 1, name: 'when' });
    const el = await mountPicker(c);
    expect(internalsFor(el).formValue).toBe('14:05:10');

    el.removeAttribute('show-seconds');
    await (el as any).rendered;

    expect(internalsFor(el).formValue, 'the precision did not follow showSeconds').toBe('14:05');
    expect(read(el).inputValue).toBe('14:05');
    expect(el.defaultValue, 'showSeconds rewrote the reset default').toBe('14:05:10');
  });
});
