/**
 * MATRIX slice — snice-countdown rendered reading.
 *
 * Dimensions (docs/ai/components/countdown.md):
 *   format (3) x variant (3) x duration (6 for dhms, 4 for hms, 4 for ms)
 *   = 42 combos
 *
 * The durations are chosen per format so each one stays INSIDE that format's own
 * units — `hms` never gets a multi-day target here, `ms` never gets a multi-hour
 * one. The overflow question ("what does hours+minutes+seconds read when three
 * days remain?") is a separate slice, countdown-overflow.test.ts, because that
 * is where a documented divergence lives and mixing it into this cross would
 * bury it.
 *
 * Time is frozen (`Date` only, `setInterval` untouched), so every expected
 * reading is exact — no tolerance windows, no second-boundary flake.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, beforeEach, afterEach } from 'vitest';
import { expectShape, unmountAll } from '../matrix-utils';
import {
  FORMATS, VARIANTS, DURATIONS, freezeClock, thawClock,
  mountCountdown, expectedShape, readShape, type CountdownCombo,
} from './countdown-support';
import '../../../packages/components/src/countdown/snice-countdown';

const COMBOS: CountdownCombo[] = FORMATS.flatMap(format =>
  VARIANTS.flatMap(variant =>
    DURATIONS[format].map(duration => ({
      id: `${format}/${variant}/${duration.id}`,
      format, variant, duration,
    }))));

describe('countdown matrix: format x variant x remaining time', () => {
  beforeEach(() => freezeClock());
  afterEach(() => { unmountAll(); thawClock(); });

  for (const combo of COMBOS) {
    it(`${combo.id}: renders the documented segments, values and separators`, async () => {
      const el = await mountCountdown(combo);
      expectShape(readShape(el, combo), expectedShape(combo), combo.id);
    });
  }
});
