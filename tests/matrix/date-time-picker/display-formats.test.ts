/**
 * Matrix slice DATE-TIME-PICKER / DISPLAY — the presentation cross.
 *
 * Dimensions: dateFormat (7) x timeFormat (2) x showSeconds (2) = 28 combos.
 *
 * Documented contract (docs/ai/components/date-time-picker.md):
 *
 *   · "`dateFormat` and `timeFormat` control display/input presentation only;
 *     canonical form submission stays local ISO syntax."
 *   · Canonical form value: `showSeconds=false -> YYYY-MM-DDTHH:mm`,
 *     `showSeconds=true -> YYYY-MM-DDTHH:mm:ss`.
 *
 * Every combo therefore makes two claims at once, and the oracle checks both:
 * the visible text is the value rendered in the CONFIGURED format, and the
 * submitted value is the SAME instant in canonical local ISO — a component that
 * let the display leak into the submission would fail here on 27 of 28 combos.
 *
 * The value is fixed at 2026-03-10T14:05(:30) because it is the docs' own
 * example and because 14:05 is the hour that distinguishes a 12-hour clock from
 * a 24-hour one. The clock EDGES (midnight and noon, where 12-hour conversion
 * usually breaks) get their own combos below, crossed against both formats.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, beforeEach, afterEach } from 'vitest';
import {
  DATE_FORMATS, TIME_FORMATS,
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  displayProblems, expectClean, valueByName,
} from './date-time-picker-support';

describe('date-time-picker matrix: display formats', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const dateFormat of DATE_FORMATS) {
    for (const timeFormat of TIME_FORMATS) {
      for (const showSeconds of [false, true]) {
        const sample = valueByName(showSeconds ? 'canonical-seconds' : 'canonical');
        const id = `${dateFormat}/${timeFormat}/${showSeconds ? 'seconds' : 'minutes'}`;

        it(`${id}: shows the configured format and submits canonical ISO`, async () => {
          const attrs: Record<string, any> = {
            'date-format': dateFormat,
            'time-format': timeFormat,
          };
          if (showSeconds) attrs['show-seconds'] = true;

          const el = await mountPicker({ attrs, liveValue: sample.input });
          expectClean(displayProblems(el, sample, dateFormat, timeFormat, showSeconds), id);
        });
      }
    }
  }

  // ── The 12-hour clock's own edges ─────────────────────────────────────────
  // 00:00 and 12:00 are the two readings a 12-hour conversion gets wrong when
  // it is written as `hours % 12` without the "0 means 12" rule. They are
  // crossed against both time formats so the 24-hour rendering of the same
  // instant is checked in the same run.
  for (const name of ['midnight', 'noon']) {
    for (const timeFormat of TIME_FORMATS) {
      const sample = valueByName(name);
      const id = `${name}/${timeFormat}`;

      it(`${id}: renders the hour the documented clock calls it`, async () => {
        const el = await mountPicker({
          attrs: { 'date-format': 'yyyy-mm-dd', 'time-format': timeFormat },
          liveValue: sample.input,
        });
        expectClean(displayProblems(el, sample, 'yyyy-mm-dd', timeFormat, false), id);
      });
    }
  }
});
