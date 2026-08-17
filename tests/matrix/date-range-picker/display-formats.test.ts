/**
 * Matrix slice DATE-RANGE-PICKER / DISPLAY FORMATS.
 *
 * Dimensions: format (7 documented) x authored form (3: canonical strings,
 * configured-display-format strings, swapped-separator strings) = 19 combos,
 * plus the format-change immutability pass over every format.
 *
 * Documented contract:
 *   · "`format` controls visible text and formatted-string parsing. Changing
 *     it never changes already parsed live/default state or submitted values."
 *   · "Live strings, authored reset defaults, display formatting, and
 *     canonical submitted fields are separate."
 *   · "Accept canonical YYYY-MM-DD or the configured display format" — and,
 *     keeping the date-picker compatibility clause, the numeric `/` and `-`
 *     spellings of the configured order both parse.
 *   · "Calendar and preset selection write live strings in the configured
 *     display format." (asserted in events.test.ts; here it is the REPARSE
 *     direction that matters: a live string written under one format must not
 *     silently change meaning because the format later changed.)
 *
 * The format-change combo asserts the sharpest version of the immutability
 * clause: a live string whose fresh parse under the NEW format would be a
 * DIFFERENT DAY still submits the day it was parsed as.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product } from '../matrix-utils';
import {
  FORMATS, mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  formEntries, expectedEntries, activeFlags, expectedFlags,
  displayOf, withSwappedSeparator, wait, SETTLE,
  type DateRangeFormat,
} from './date-range-picker-support';

const START = { year: 2026, month: 3, day: 1 };
const END = { year: 2026, month: 3, day: 15 };

type Form = 'canonical' | 'display' | 'swapped';

const FORMS: readonly Form[] = ['canonical', 'display', 'swapped'];

/** The authored start/end strings for a form: the format's own spelling, the
 *  canonical spelling, or the other numeric separator. */
function authored(form: Form, format: DateRangeFormat): { start: string; end: string } | null {
  const canonical = {
    start: '2026-03-01',
    end: '2026-03-15',
  };
  if (form === 'canonical') return canonical;
  const display = {
    start: displayOf(START, format),
    end: displayOf(END, format),
  };
  if (form === 'display') return display;
  const swapped = {
    start: withSwappedSeparator(display.start, format),
    end: withSwappedSeparator(display.end, format),
  };
  // 'mmmm dd, yyyy' has no numeric form and 'yyyy-mm-dd' IS canonical: the
  // swapped-separator axis does not exist for them.
  return swapped.start ? swapped : null;
}

const FORMAT_COMBOS = product({
  format: FORMATS,
  form: FORMS,
}).filter((c): c is { format: DateRangeFormat; form: Form } =>
  authored(c.form, c.format) !== null);

describe('date-range-picker matrix: display formats', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  for (const { format, form } of FORMAT_COMBOS) {
    const strings = authored(form, format)!;
    const id = `${format}/${form}`;

    it(`${id}: same range, three spellings, one canonical submission`, async () => {
      // Whatever spelling the author used, the visible text is the format's
      // own and the submission is canonical — the "separate" clause.
      const el = await mountRange({
        attrs: { name: 'stay', format, start: strings.start, end: strings.end },
      });

      expect(el.start, `${id} live start preserved verbatim`).toBe(strings.start);
      expect(el.end, `${id} live end preserved verbatim`).toBe(strings.end);
      expect(el.defaultStart, `${id} the authored default keeps the author's text`)
        .toBe(strings.start);

      const input = el.shadowRoot!.querySelector<HTMLInputElement>('.input')!;
      expect(input.value, `${id} visible text`).toBe(
        `${displayOf(START, format)}  —  ${displayOf(END, format)}`);

      expect(formEntries(el), `${id} submission`).toEqual(
        [['stay-start', '2026-03-01'], ['stay-end', '2026-03-15']]);
      expect(activeFlags(el), `${id} a valid pair in any spelling is valid`).toEqual([]);
    });
  }

  // ── The immutability clause, per format ────────────────────────────────────
  for (const format of FORMATS) {
    it(`changing to ${format} never changes live state or submitted values`, async () => {
      // Authored under dd/mm/yyyy, then lived-forward; the format change must
      // be a DISPLAY change only.
      const el = await mountRange({
        attrs: {
          name: 'stay',
          format: 'dd/mm/yyyy',
          start: '01/03/2026', // 1 March
          end: '15/03/2026',
        },
      });
      expect(formEntries(el)).toEqual([['stay-start', '2026-03-01'], ['stay-end', '2026-03-15']]);

      el.format = format;
      await wait(SETTLE);

      expect(el.start, 'the live start string changed on a format change').toBe('01/03/2026');
      expect(el.end, 'the live end string changed on a format change').toBe('15/03/2026');
      expect(el.defaultStart, 'the authored default changed on a format change').toBe('01/03/2026');
      expect(el.getAttribute('start'), 'the content attribute changed on a format change')
        .toBe('01/03/2026');
      expect(formEntries(el), 'the submitted values changed on a format change').toEqual(
        [['stay-start', '2026-03-01'], ['stay-end', '2026-03-15']]);
      expect(activeFlags(el)).toEqual([]);
      // The visible text re-renders in the new format (the one thing the
      // clause allows format to control).
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('.input')!;
      expect(input.value).toBe(`${displayOf(START, format)}  —  ${displayOf(END, format)}`);
    });
  }

  it('a reparse under the new format would be a different day — and must not happen', async () => {
    // '11/03/2026' under dd/mm/yyyy is 11 March. Under mm-dd-yyyy the same
    // string means 3 November. "Changing it never changes already parsed
    // live/default state or submitted values" — the submission must stay
    // 2026-03-11 even though a fresh parse of the live string would differ.
    const el = await mountRange({
      attrs: { name: 'stay', format: 'dd/mm/yyyy', start: '11/03/2026', end: '21/03/2026' },
    });
    expect(formEntries(el)).toEqual([['stay-start', '2026-03-11'], ['stay-end', '2026-03-21']]);

    el.format = 'mm-dd-yyyy';
    await wait(SETTLE);

    expect(formEntries(el), 'the range silently changed meaning on a format change').toEqual(
      [['stay-start', '2026-03-11'], ['stay-end', '2026-03-21']]);
    expect(activeFlags(el)).toEqual([]);
  });

  it('an endpoint authored in the display format parses under that format only', async () => {
    // The same string '03/04/2026' is March 4 under mm/dd/yyyy and April 3
    // under dd/mm/yyyy — the configured format decides, and the submission
    // proves which one was used.
    const us = await mountRange({
      attrs: { name: 'stay', format: 'mm/dd/yyyy', start: '03/04/2026', end: '03/05/2026' },
    });
    expect(formEntries(us)).toEqual([['stay-start', '2026-03-04'], ['stay-end', '2026-03-05']]);

    const eu = await mountRange({
      attrs: { name: 'stay', format: 'dd/mm/yyyy', start: '03/04/2026', end: '03/05/2026' },
    });
    expect(formEntries(eu)).toEqual([['stay-start', '2026-04-03'], ['stay-end', '2026-05-03']]);
  });

  it('a format string that matches no documented spelling is an impossible endpoint', async () => {
    // 'March 15, 2026' is only parseable under 'mmmm dd, yyyy'; under a
    // numeric format it is malformed and must stay observable, submit '',
    // and set badInput.
    const el = await mountRange({
      attrs: { name: 'stay', format: 'mm/dd/yyyy', start: 'March 15, 2026', end: '2026-03-20' },
    });
    expect(el.start).toBe('March 15, 2026');
    expect(formEntries(el)).toEqual([['stay-start', ''], ['stay-end', '2026-03-20']]);
    expect(activeFlags(el)).toEqual(
      expectedFlags('March 15, 2026', '2026-03-20', {
        required: false, min: '', max: '', format: 'mm/dd/yyyy', barred: false,
      }));
  });
});
