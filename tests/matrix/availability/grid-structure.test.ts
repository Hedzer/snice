/**
 * snice-availability matrix — grid structure.
 *
 * Crosses every documented shape dimension: `granularity` (15/30/60) x the hour
 * window (`start-hour`/`end-hour`) x `format` (12h/24h) x `readonly`. The oracle
 * (`checkGrid`) asserts the documented grid: parts `base`/`header`/`grid`,
 * 7 Mon-Sun columns, one row per time slot, and hour labels in the requested
 * format. 36 combos.
 */
import { describe, it, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  FORMATS, GRANULARITIES, WINDOWS,
  checkGrid, combo, comboName, expectNoProblems, makeAvailability,
} from './availability-support';

describe('availability matrix — grid structure', () => {
  afterEach(() => unmountAll());

  for (const granularity of GRANULARITIES) {
    for (const window of WINDOWS) {
      for (const format of FORMATS) {
        for (const readonly of [false, true]) {
          const c = combo({ granularity, window, format, readonly });
          it(comboName(c), async () => {
            const el = await makeAvailability(c);
            expectNoProblems(checkGrid(el, c), comboName(c));
          });
        }
      }
    }
  }
});
