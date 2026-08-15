/**
 * Matrix slice DATE-TIME-PICKER / INPUT PARSING — the other half of
 * "presentation".
 *
 * Dimensions: dateFormat (7) x timeFormat (2) x showSeconds (2) = 28 combos.
 *
 * Documented contract: "`dateFormat` and `timeFormat` control display/input
 * presentation only". Display is checked in display-formats.test.ts; INPUT is
 * checked here, by the only test that can prove both halves agree — a round
 * trip. The text the control renders for a value is typed straight back into
 * the control, and must produce the same canonical submission it started from.
 *
 * A component that renders `10/03/2026` under `dd/mm/yyyy` but reads it back as
 * October 3rd passes a display test and a parse test written separately, and
 * fails here. That is the whole reason this slice exists.
 *
 * The unparseable half of the dimension — "Malformed/partial/impossible text
 * stays visible, sets `badInput`, and contributes an empty form value" — is
 * crossed against the same formats at the end, because a format that accepts
 * garbage is as broken as one that rejects its own output.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DATE_FORMATS, TIME_FORMATS,
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, typeInto, commit, wait, canonical, valueByName, SETTLE,
} from './date-time-picker-support';

describe('date-time-picker matrix: input parsing', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const dateFormat of DATE_FORMATS) {
    for (const timeFormat of TIME_FORMATS) {
      for (const showSeconds of [false, true]) {
        const sample = valueByName(showSeconds ? 'canonical-seconds' : 'canonical');
        const id = `${dateFormat}/${timeFormat}/${showSeconds ? 'seconds' : 'minutes'}`;
        const attrs: Record<string, any> = {
          'date-format': dateFormat,
          'time-format': timeFormat,
        };
        if (showSeconds) attrs['show-seconds'] = true;

        it(`${id}: reads back the exact text it renders`, async () => {
          const source = await mountPicker({ attrs, liveValue: sample.input });
          const shown = readFacts(source).visible;
          expect(shown, `combo ${id} rendered nothing to read back`).not.toBe('');

          const target = await mountPicker({ attrs });
          typeInto(target, shown);
          commit(target);
          await wait(SETTLE);

          const facts = readFacts(target);
          expect(facts.flags, `combo ${id} rejected its own rendering "${shown}"`).toEqual([]);
          expect(facts.formValue, `combo ${id} round trip`)
            .toBe(canonical(sample.parts, showSeconds));
        });
      }
    }
  }

  // ── Text no format may accept ─────────────────────────────────────────────
  for (const dateFormat of DATE_FORMATS) {
    const id = `${dateFormat}/garbage`;

    it(`${id}: unparseable text stays visible, sets badInput, submits nothing`, async () => {
      const el = await mountPicker({ attrs: { 'date-format': dateFormat } });
      typeInto(el, 'the tenth of never');
      commit(el);
      await wait(SETTLE);

      const facts = readFacts(el);
      expect(facts.visible, `combo ${id}`).toBe('the tenth of never');
      expect(facts.flags, `combo ${id}`).toEqual(['badInput']);
      expect(facts.formValue, `combo ${id}`).toBe('');
    });
  }
});
