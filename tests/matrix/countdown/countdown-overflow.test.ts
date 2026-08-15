/**
 * MATRIX slice — snice-countdown FORMAT OVERFLOW.
 *
 * Dimensions: the two short formats x a remaining time that exceeds their
 * leading unit x 3 variants = 6 combos.
 *
 * The documented contract (docs/components/countdown.md, Properties table):
 *
 *     format | 'dhms' | 'hms' | 'ms' | Display format: days+hours+minutes+
 *            |        |       |      | seconds, hours+minutes+seconds, or
 *            |        |       |      | minutes+seconds
 *
 * A format therefore chooses the UNITS the remaining time is expressed in. An
 * hours+minutes+seconds reading of three days and four hours is 76 hours, and a
 * minutes+seconds reading of two hours and three minutes is 123 minutes. The
 * component instead computes days/hours/minutes/seconds once and renders only
 * the columns the format names, so the magnitudes above the leading unit are
 * silently dropped and the countdown reads a time that is not the time
 * remaining.
 *
 * Per .ai/fuzzing.md the assertion below is the DOCUMENTED one and is NOT
 * weakened: the tests are declared `it.fails`, so the day the component is
 * fixed this suite goes red and the finding can be closed.
 */
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { unmountAll, finding } from '../matrix-utils';
import {
  VARIANTS, DAY, HOUR, MINUTE, SECOND,
  freezeClock, thawClock, mountCountdown, expectedValues, readValues,
  type CountdownCombo,
} from './countdown-support';
import '../../../packages/components/src/countdown/snice-countdown';

const OVERFLOWS = [
  {
    id: 'hms/3d4h5m6s',
    findingId: 'MATRIX-countdown-1',
    format: 'hms' as const,
    duration: { id: '3d4h5m6s', ms: 3 * DAY + 4 * HOUR + 5 * MINUTE + 6 * SECOND },
    why: 'hours+minutes+seconds silently drops the days: 76 hours reads as 04',
  },
  {
    id: 'ms/2h3m4s',
    findingId: 'MATRIX-countdown-2',
    format: 'ms' as const,
    duration: { id: '2h3m4s', ms: 2 * HOUR + 3 * MINUTE + 4 * SECOND },
    why: 'minutes+seconds silently drops the hours: 123 minutes reads as 03',
  },
];

describe('countdown matrix: a short format must still express the whole remaining time', () => {
  beforeEach(() => freezeClock());
  afterEach(() => { unmountAll(); thawClock(); });

  for (const overflow of OVERFLOWS) {
    for (const variant of VARIANTS) {
      const combo: CountdownCombo = {
        id: `${overflow.id}/${variant}`,
        format: overflow.format,
        variant,
        duration: overflow.duration,
      };

      it.fails(finding(overflow.findingId, `${combo.id}: ${overflow.why}`), async () => {
        const el = await mountCountdown(combo);
        expect(readValues(el), combo.id)
          .toEqual(expectedValues(combo.format, combo.duration.ms));
      });
    }
  }
});
