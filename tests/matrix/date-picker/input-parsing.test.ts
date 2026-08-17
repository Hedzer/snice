/**
 * Matrix slice DATE-PICKER / MANUAL INPUT.
 *
 * Dimensions: format (7) x typed-text sample (8) = 56 combos, plus the
 * partial-typing progression.
 *
 * Documented contract — and this is the clause that separates manual entry
 * from every other channel:
 *
 *   · "Manual partial/impossible text stays visible, but live `value` is `''`
 *     and `validity.badInput` is true."
 *
 * Programmatic assignment SANITIZES (values.test.ts owns that); typing does
 * not, because a field that erased what someone was halfway through typing
 * would be unusable. So the two channels are deliberately asserted to behave
 * differently on the very same strings.
 *
 *   · "`datepicker-input` — on every manual edit. value is canonical when
 *     valid/complete, otherwise `''`."
 *   · "Dates are strict" applies to typed text too: `02/30/2026` is not
 *     March 2nd.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FORMATS, mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, canonical, display, typeInto, recordEvents, namesOf,
  Problems, expectClean,
} from './date-picker-support';

/**
 * The typed samples, as MEANINGS rather than strings: each carries the calendar
 * parts a correct parse must reach, or `null` when the text cannot be a date at
 * all. The text itself is rendered per-format, so the same eight cases are
 * asked of every documented ordering.
 */
interface TypedSample {
  name: string;
  /** The parts to render into the format under test, when the text is a date. */
  parts: { year: number; month: number; day: number } | null;
  /** Text used verbatim when the sample is not a rendering of real parts. */
  literal?: string;
  why: string;
}

const TYPED: readonly TypedSample[] = [
  {
    name: 'complete', parts: { year: 2026, month: 3, day: 15 },
    why: 'a complete, valid date typed in the configured format is accepted',
  },
  {
    name: 'day-above-12', parts: { year: 2026, month: 5, day: 27 },
    why: 'a day above twelve makes the field ORDER decidable — a format that '
      + 'silently read it as a month would produce a different date',
  },
  {
    name: 'leap-day', parts: { year: 2024, month: 2, day: 29 },
    why: 'a real leap day typed by hand must still be accepted',
  },
  {
    name: 'impossible-feb-30', parts: { year: 2026, month: 2, day: 30 },
    why: '"Manual ... impossible text stays visible, but live value is \'\' and '
      + 'badInput is true" — and "Dates are strict", so it is not March 2nd',
  },
  {
    name: 'impossible-leap', parts: { year: 2026, month: 2, day: 29 },
    why: '2026 is not a leap year; typing it is bad input, not March 1st',
  },
  {
    name: 'partial', parts: null, literal: '03/1',
    why: '"Manual partial ... text stays visible" — the halfway state of typing',
  },
  {
    name: 'letters', parts: null, literal: 'tomorrow',
    why: 'free text is bad input, and it stays on screen',
  },
  {
    name: 'cleared', parts: null, literal: '',
    why: 'clearing the field is not bad input — it is an empty control',
  },
];

/** The exact text a sample types under a format. */
function textFor(sample: TypedSample, format: typeof FORMATS[number]): string {
  if (!sample.parts) return sample.literal ?? '';
  // `display()` renders the parts in the format's own order, which is exactly
  // what a user typing into that field would produce — including for the
  // impossible samples, whose parts are the ones the user meant.
  return display(sample.parts, format);
}

/** Is the sample a real calendar date? "Dates are strict", so this is exact. */
function isRealDate(parts: NonNullable<TypedSample['parts']>): boolean {
  return parts.day <= new Date(parts.year, parts.month, 0).getDate();
}

describe('date-picker matrix: manual input', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const format of FORMATS) {
    for (const sample of TYPED) {
      const id = `${format}/${sample.name}`;

      it(`${id}: ${sample.why}`, async () => {
        const el = await mountPicker({ attrs: { format } });
        const text = textFor(sample, format);
        const seen = recordEvents(el);
        await typeInto(el, text);

        const facts = readFacts(el);
        const problems = new Problems();
        const valid = !!sample.parts && isRealDate(sample.parts);
        const want = valid ? canonical(sample.parts) : '';

        // "stays visible" — whatever was typed is still in the field.
        problems.eq('the typed text stays visible', facts.visible, text);
        problems.eq('live value', facts.value, want);
        problems.eq('submitted value', facts.formValue, want);

        // "live value is '' and validity.badInput is true" — for anything that
        // is neither a date nor empty.
        const wantBadInput = text !== '' && !valid;
        problems.eq('validity flags', facts.flags, wantBadInput ? ['badInput'] : []);

        // "`datepicker-input` — on every manual edit. value is canonical when
        // valid/complete, otherwise ''."
        problems.eq('one datepicker-input per edit', namesOf(seen).filter(n => n === 'datepicker-input').length, 1);
        const emitted = seen.find(entry => entry.type === 'datepicker-input');
        problems.eq('datepicker-input detail.value', emitted?.detail?.value, want);
        problems.eq('datepicker-input names the component',
          emitted?.detail?.datePicker, el);

        expectClean(problems, id);
      });
    }
  }

  // ── Typing a date one character at a time ─────────────────────────────────
  //
  // The progression is the real user story behind "partial text stays
  // visible": every prefix of a valid date must survive on screen, report no
  // value, and report bad input — until the last character, which flips all
  // three at once.
  it('every prefix of a typed date is visible, empty and bad input until it completes',
    async () => {
      const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy' } });
      const full = '03/15/2026';
      for (let length = 1; length < full.length; length++) {
        const prefix = full.slice(0, length);
        await typeInto(el, prefix);
        const facts = readFacts(el);
        expect(facts.visible, `prefix "${prefix}" was rewritten`).toBe(prefix);
        expect(facts.value, `prefix "${prefix}" produced a value`).toBe('');
        expect(facts.flags, `prefix "${prefix}" validity`).toEqual(['badInput']);
      }
      await typeInto(el, full);
      const facts = readFacts(el);
      expect(facts.value, 'the completed date was not accepted').toBe('2026-03-15');
      expect(facts.flags, 'the completed date still reports bad input').toEqual([]);
    });

  it('typing over a valid date and leaving it partial drops the old value', async () => {
    // The dangerous case: a control that kept the previous canonical value
    // while showing half-typed text would submit a date the user is no longer
    // looking at.
    const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy' }, liveValue: '2026-03-15' });
    expect(el.value).toBe('2026-03-15');
    await typeInto(el, '03/1');
    const facts = readFacts(el);
    expect(facts.value, 'a stale value survived a partial edit').toBe('');
    expect(facts.formValue, 'a stale value would have been submitted').toBe('');
    expect(facts.flags).toEqual(['badInput']);
  });

  it('clearing the field by hand is empty, not bad input', async () => {
    const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy' }, liveValue: '2026-03-15' });
    await typeInto(el, '');
    const facts = readFacts(el);
    expect(facts.value).toBe('');
    expect(facts.flags, 'an emptied field reported bad input').toEqual([]);
  });
});
