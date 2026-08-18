/**
 * Matrix slice DATE-PICKER / DISPLAY FORMATS.
 *
 * Dimensions: format (7) x value sample (14) = 98 combos, plus the
 * format-accepts-its-own-text round trip (7 x 7 valid samples = 49) and the
 * separator-compatibility clause (6 numeric formats x 7 samples = 42).
 *
 * Documented contract:
 *   · "`format` controls visible/manual text only." The live value and the
 *     submitted value stay canonical whatever the display says — which is the
 *     entire reason this component keeps three separate strings.
 *   · The format names ARE their patterns: `dd/mm/yyyy` is two-digit day,
 *     slash, two-digit month, slash, four-digit year. `mmmm dd, yyyy` is the
 *     one exception, and its `mmmm` is the month's name.
 *   · "A valid string in the configured format also works; numeric `/` and `-`
 *     separators remain accepted for compatibility." So `15-03-2026` must be
 *     accepted under `dd/mm/yyyy`, and vice versa.
 *
 * Crossing every format with every sample is the point: an ambiguous date like
 * 2026-03-15 reads the same under several formats, so the samples deliberately
 * include days above 12 (where day/month order is decidable) and both edges of
 * a month (where an off-by-one is visible).
 *
 * it.fails policy: no finding is pinned in this file. (MATRIX-date-picker-1,
 * the `yyyy-mm-dd` swapped-separator rejection, was fixed and its rows run
 * unpinned as the regression guard.)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FORMATS, VALUES, valueByName,
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, canonical, display, withSwappedSeparator,
  displayProblems, expectClean, Problems, wait, SETTLE,
} from './date-picker-support';

describe('date-picker matrix: display formats', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const format of FORMATS) {
    for (const sample of VALUES) {
      const id = `${format}/${sample.name}`;

      it(`${id}: the display follows the format, the value stays canonical`, async () => {
        const el = await mountPicker({ attrs: { format }, liveValue: sample.input });
        expectClean(displayProblems(el, sample, format), id);
      });
    }
  }

  // ── "A valid string in the configured format also works" ──────────────────
  //
  // The round trip: render a date in a format, hand that exact text back
  // through the live `value` setter, and the control must arrive at the same
  // canonical date. A parser that only understands canonical text fails every
  // row of this; one that guesses the field order fails the rows where the day
  // is above twelve.
  const PARSEABLE = VALUES.filter(sample => sample.parts);

  for (const format of FORMATS) {
    for (const sample of PARSEABLE) {
      it(`${format}/${sample.name}: its own rendering is accepted back`, async () => {
        const text = display(sample.parts!, format);
        const el = await mountPicker({ attrs: { format }, liveValue: text });
        const facts = readFacts(el);
        const problems = new Problems();
        problems.eq(`"${text}" under "${format}"`, facts.value, canonical(sample.parts));
        problems.eq('and it renders back to the same text', facts.visible, text);
        expectClean(problems, `${format}/${sample.name}/round-trip`);
      });
    }
  }

  // ── "numeric `/` and `-` separators remain accepted for compatibility" ────
  //
  // MATRIX-date-picker-1 (fixed): `yyyy-mm-dd` used to reject the swapped
  // separator (`parseDate()` gave it a bare `return null` while every other
  // numeric format had a `[\/-]` branch). Its rows run unpinned as the
  // regression guard.
  for (const format of FORMATS) {
    for (const sample of PARSEABLE) {
      const swapped = withSwappedSeparator(sample.parts!, format);
      if (swapped === null) continue; // "mmmm dd, yyyy" has no numeric form
      const title = format === 'yyyy-mm-dd'
        ? `MATRIX-date-picker-1 (fixed): ${format}/${sample.name}: "${swapped}" is accepted for compatibility`
        : `${format}/${sample.name}: "${swapped}" is accepted for compatibility`;
      it(title, async () => {
        const el = await mountPicker({ attrs: { format }, liveValue: swapped });
        expect(el.value,
          `"${swapped}" was rejected under "${format}" — the compatibility`
          + ' separator is documented as accepted').toBe(canonical(sample.parts));
      });
    }
  }

  it('changing the format restyles the display without changing the value', async () => {
    // The clearest statement of "display only": one value, every format, and
    // the canonical string never moves.
    const sample = valueByName('canonical');
    const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy' }, liveValue: sample.input });
    for (const format of FORMATS) {
      el.format = format;
      await wait(SETTLE);
      const facts = readFacts(el);
      expect(facts.visible, `visible text under "${format}"`)
        .toBe(display(sample.parts!, format));
      expect(facts.value, `the value moved when the format changed to "${format}"`)
        .toBe(sample.input);
    }
  });

  it('the placeholder describes the configured format when none is authored', async () => {
    // `placeholder: string = ''` with a format-derived fallback: an empty field
    // has to tell the user which order to type in, or the compatibility clause
    // above is the only thing standing between them and the wrong date.
    //
    // Asserted as the FIELD ORDER rather than as an exact string: the docs pin
    // which order each format writes, not which words the hint spells it with,
    // so `mmmm dd, yyyy` is free to say "MONTH DD, YYYY" as long as the month
    // still comes first.
    const fieldOrder = (text: string): string[] => text.toLowerCase()
      .replace(/[^a-z]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(word => word.startsWith('y') ? 'year'
        : word.startsWith('d') ? 'day'
          : 'month');

    for (const format of FORMATS) {
      const el = await mountPicker({ attrs: { format } });
      const facts = readFacts(el);
      expect(facts.placeholder, `"${format}" left the field with no hint`).not.toBe('');
      expect(fieldOrder(facts.placeholder),
        `the placeholder "${facts.placeholder}" does not describe "${format}"'s field order`)
        .toEqual(fieldOrder(format));
    }
  });

  it('an authored placeholder wins over the format-derived one', async () => {
    const el = await mountPicker({
      attrs: { format: 'dd/mm/yyyy', placeholder: 'When do you arrive?' },
    });
    expect(readFacts(el).placeholder).toBe('When do you arrive?');
  });
});
