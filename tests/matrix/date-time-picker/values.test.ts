/**
 * Matrix slice DATE-TIME-PICKER / VALUES — the parse dimension.
 *
 * Dimensions: value sample (13) x showSeconds (2) = 26 combos.
 *
 * Documented contract:
 *   · Canonical form value — `showSeconds=false -> YYYY-MM-DDTHH:mm`,
 *     `showSeconds=true -> YYYY-MM-DDTHH:mm:ss`.
 *   · "Malformed/partial/impossible text stays visible, sets `badInput`, and
 *     contributes an empty form value."
 *   · "Date and time parts are strict and never roll" — the sharpest claim the
 *     component makes, and the reason the sample list carries February 30th,
 *     February 29th of a non-leap year, and 25:61. A rolling parser turns all
 *     three into a real instant and quietly submits the wrong one.
 *   · "DST gaps/repeated times remain unchanged local wall times."
 *   · The live `value` "does not reflect" — the `value` content attribute keeps
 *     the authored default whatever the live value becomes.
 *
 * `showSeconds` is crossed against every sample because it changes the shape of
 * the canonical string, and a component that truncated or padded incorrectly
 * would only fail on one of the two.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VALUES,
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, canonical, Problems, expectClean,
} from './date-time-picker-support';

describe('date-time-picker matrix: values', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const sample of VALUES) {
    for (const showSeconds of [false, true]) {
      const id = `${sample.name}/${showSeconds ? 'seconds' : 'minutes'}`;

      it(`${id}: ${sample.why}`, async () => {
        const attrs: Record<string, any> = { 'date-format': 'yyyy-mm-dd' };
        if (showSeconds) attrs['show-seconds'] = true;

        const el = await mountPicker({ attrs, liveValue: sample.input });
        const facts = readFacts(el);
        const problems = new Problems();

        // The live value is the string the caller assigned; it is never
        // rewritten behind their back.
        problems.eq('live value', facts.value, sample.input);

        // "…does not reflect": nothing was authored, so there is no attribute.
        problems.eq('value content attribute', facts.valueAttribute, null);
        problems.eq('reset default', facts.defaultValue, '');

        if (sample.parts) {
          problems.eq('canonical form value', facts.formValue, canonical(sample.parts, showSeconds));
          problems.eq('no validity complaint', facts.flags, []);
        } else {
          // "stays visible, sets badInput, contributes an empty form value" —
          // except for the empty string, which is simply an empty control.
          problems.eq('text stays visible', facts.visible, sample.input);
          problems.eq('form value', facts.formValue, '');
          problems.eq('validity flags', facts.flags, sample.input === '' ? [] : ['badInput']);
        }

        expectClean(problems, id);
      });
    }
  }

  // ── The strictness claim, stated as its own regression ────────────────────
  // "Date and time parts are strict and never roll". Written out rather than
  // folded into the loop, because the failure mode this guards against is a
  // parser that SUCCEEDS on the wrong instant, and the readable form of that
  // assertion is "the submitted value is not the rolled one".
  const ROLLS: Array<[string, string]> = [
    ['2026-02-30T10:00', '2026-03-02T10:00'],
    ['2026-02-29T10:00', '2026-03-01T10:00'],
    ['2026-03-10T25:61', '2026-03-11T02:01'],
    ['2026-04-31T08:00', '2026-05-01T08:00'],
    ['2026-13-01T08:00', '2027-01-01T08:00'],
  ];

  for (const [input, rolled] of ROLLS) {
    it(`strict: "${input}" never becomes "${rolled}"`, async () => {
      const el = await mountPicker({ liveValue: input });
      const facts = readFacts(el);

      expect(facts.formValue, `"${input}" rolled into a real instant`).not.toBe(rolled);
      expect(facts.formValue, `"${input}" should contribute nothing`).toBe('');
      expect(facts.flags).toEqual(['badInput']);
      expect(facts.visible, 'the impossible text stays visible').toBe(input);
    });
  }
});
