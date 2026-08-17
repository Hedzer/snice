/**
 * Matrix slice DATE-PICKER / VALUES — the parse dimension.
 *
 * Dimensions: value sample (14) x assignment channel (2: the `value` content
 * attribute, the live `value` property) = 28 combos, plus the strictness
 * regressions and the live/attribute separation.
 *
 * Documented contract:
 *   · "`value` is live canonical `YYYY-MM-DD` data or `''`; it is also the
 *     submitted value."
 *   · "Programmatic impossible/malformed dates sanitize to `''`."
 *   · "Dates are strict: month length and leap-year failures do not roll into
 *     another month." — the sharpest claim this component makes, and the reason
 *     the sample list carries February 30th, February 29th of three different
 *     years, and April 31st. A rolling parser turns every one of them into a
 *     real date and quietly submits the wrong one.
 *   · "`defaultValue` and the `value` attribute are the authored/reset
 *     default", and the attribute does not follow the live value.
 *
 * Both assignment channels are crossed against every sample because the docs
 * give them different jobs: the attribute seeds `defaultValue` as well as the
 * live value, the property seeds only the live value and dirties the control.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VALUES, mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, canonical, Problems, expectClean, wait, SETTLE,
} from './date-picker-support';

describe('date-picker matrix: values', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const sample of VALUES) {
    for (const channel of ['attribute', 'property'] as const) {
      const id = `${sample.name}/${channel}`;

      it(`${id}: ${sample.why}`, async () => {
        const el = channel === 'attribute'
          ? await mountPicker({ attrs: sample.input ? { value: sample.input } : {} })
          : await mountPicker({ liveValue: sample.input });
        const facts = readFacts(el);
        const problems = new Problems();
        const want = canonical(sample.parts);

        // "`value` is live canonical YYYY-MM-DD data or ''" — whatever went in,
        // what comes out is canonical or nothing.
        problems.eq('live value', facts.value, want);

        if (channel === 'attribute') {
          // "`defaultValue` ... Maps to the value content attribute and is
          // restored by form reset." It is the AUTHORED text, verbatim — the
          // canonicalisation guarantee belongs to `value`, which is why the
          // reset regression below checks what an impossible default restores
          // to rather than assuming the default was scrubbed on the way in.
          problems.eq('value content attribute is the author\'s own text',
            facts.valueAttribute, sample.input || null);
          problems.eq('reset default mirrors the attribute',
            facts.defaultValue, sample.input);
        } else {
          // A live assignment is not an authored default, so nothing is
          // written back to the attribute and the reset default stays empty.
          problems.eq('a live assignment writes no attribute', facts.valueAttribute, null);
          problems.eq('a live assignment leaves the reset default alone',
            facts.defaultValue, '');
        }

        // "it is also the submitted value" / "A named empty/invalid picker
        // contributes ''".
        problems.eq('submitted value', facts.formValue, want);

        // A programmatic assignment SANITIZES; it does not leave bad text on
        // screen and does not report bad input. (Manual typing is the other
        // story, and input-parsing.test.ts owns it.)
        if (!sample.parts) {
          problems.eq('nothing is left on screen', facts.visible, '');
          problems.eq('a sanitized assignment is not bad input', facts.flags, []);
        } else {
          problems.eq('no validity complaint', facts.flags, []);
        }

        expectClean(problems, id);
      });
    }
  }

  // ── The strictness claim, stated as its own regression ────────────────────
  //
  // "Dates are strict: month length and leap-year failures do not roll into
  // another month." Written out rather than folded into the loop, because the
  // failure this guards against is a parser that SUCCEEDS on the wrong day —
  // and the readable form of that assertion is "the value is not the rolled
  // one", named alongside what the roll would have been.
  const ROLLS: Array<[string, string]> = [
    ['2026-02-30', '2026-03-02'],
    ['2026-02-29', '2026-03-01'],
    ['1900-02-29', '1900-03-01'],
    ['2026-04-31', '2026-05-01'],
    ['2026-13-01', '2027-01-01'],
  ];

  for (const [impossible, rolled] of ROLLS) {
    it(`"${impossible}" does not roll into "${rolled}"`, async () => {
      const el = await mountPicker({ liveValue: impossible });
      expect(el.value, `"${impossible}" was accepted as a date`).not.toBe(rolled);
      expect(el.value, `"${impossible}" must sanitize to ""`).toBe('');
    });
  }

  it('a later live assignment leaves the authored default untouched', async () => {
    // The doc's own worked example: assigning through the property changes the
    // live value while `defaultValue` and the attribute keep the authored one.
    const el = await mountPicker({ attrs: { value: '2026-03-15' } });
    expect(el.value).toBe('2026-03-15');
    expect(el.defaultValue).toBe('2026-03-15');

    el.value = '2026-03-20';
    await wait(SETTLE);

    expect(el.value, 'the live value did not take the assignment').toBe('2026-03-20');
    expect(el.defaultValue, 'a live assignment overwrote the reset default')
      .toBe('2026-03-15');
    expect(el.getAttribute('value'), 'a live assignment reflected onto the attribute')
      .toBe('2026-03-15');
  });

  it('a reset from an impossible authored default still restores a canonical value',
    async () => {
      // `defaultValue` keeps the author's own text, so this is where the
      // canonical guarantee has to hold: "A form reset ... restores
      // `value = defaultValue`" must not smuggle "2026-02-30" into a `value`
      // the docs promise is "always canonical YYYY-MM-DD or ''".
      const el = await mountPicker({ attrs: { value: '2026-02-30', name: 'when' } });
      expect(el.value, 'an impossible authored default was accepted as a value').toBe('');
      el.value = '2026-03-15';
      await wait(SETTLE);
      // The reset is driven through `formResetCallback()`, exactly as the
      // browser drives it. happy-dom's `form.reset()` never reaches a
      // form-associated custom element, so calling it here would assert
      // nothing about the component — the same substitution the sibling
      // date-time-picker matrix makes.
      (el as any).formResetCallback();
      await wait(SETTLE);
      expect(el.value, 'a reset restored the impossible default verbatim').toBe('');
    });

  it('an empty assignment clears the live value without touching the default', async () => {
    const el = await mountPicker({ attrs: { value: '2026-03-15' } });
    el.value = '';
    await wait(SETTLE);
    expect(el.value).toBe('');
    expect(el.defaultValue).toBe('2026-03-15');
  });
});
