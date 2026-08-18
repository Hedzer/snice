/**
 * MATRIX slice — snice-timer INITIAL STATE.
 *
 * Dimensions: mode (2) x initial-time (0, 5, 60, 3725) = 8 combos.
 *
 * The documented contract (docs/ai/components/timer.md):
 *
 *     initialTime: number = 0;   // attr: initial-time, seconds (for timer mode)
 *
 *     <!-- Countdown (counts down from 60s) -->
 *     <snice-timer mode="timer" initial-time="60"></snice-timer>
 *
 * A timer authored with `initial-time="60"` is therefore a countdown standing at
 * 60 seconds: `getTime()` reads 60 and the display shows a minute. The
 * component seeds that state in `@ready` (MATRIX-timer-1/timer-2, FIXED), so
 * `start()` counts down from the authored time instead of completing in the
 * first frame. `reset()` still restores the same state from anywhere.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, finding, product, wait } from '../matrix-utils';
import {
  MODES, INITIAL_TIMES, mountTimer, initialState, displayText, parseDisplay,
  recordEvents, shapeProblems, type Mode,
} from './timer-support';
import '../../../packages/components/src/timer/snice-timer';

const COMBOS = product({ mode: MODES, initialTime: INITIAL_TIMES })
  .map(c => ({
    ...c,
    id: `${c.mode}/initial:${c.initialTime}`,
    // A stopwatch's documented initial state is 0 and it is rendered at 0; only
    // a timer with a non-zero initial time diverges.
    diverges: c.mode === 'timer' && c.initialTime > 0,
  }));

describe('timer matrix: the state a freshly authored timer stands at', () => {
  afterEach(() => unmountAll());

  for (const combo of COMBOS) {
    const declare = combo.diverges
      ? (name: string, fn: () => Promise<void>) => it(
        finding('MATRIX-timer-1 (fixed)', `${name}`), fn)
      : (name: string, fn: () => Promise<void>) => it(name, fn);

    declare(`${combo.id}: reads its documented initial state on mount`, async () => {
      const el = await mountTimer(combo.mode as Mode, combo.initialTime);
      const expected = initialState(combo.mode as Mode, combo.initialTime);

      expect(shapeProblems(el), combo.id).toEqual([]);
      expect(el.running, `${combo.id}: a timer nobody started is running`).toBe(false);
      expect(el.getTime(), `${combo.id}: getTime()`).toBe(expected);
      expect(parseDisplay(displayText(el)), `${combo.id}: display "${displayText(el)}"`)
        .toBeCloseTo(expected, 0);
    });
  }
});

describe('timer matrix: starting an authored countdown', () => {
  afterEach(() => unmountAll());

  for (const initialTime of [5, 60, 3725]) {
    it(
      finding('MATRIX-timer-2 (fixed)',
        `timer/initial:${initialTime}: start() counts down from the authored time`),
      async () => {
        const el = await mountTimer('timer', initialTime);
        const seen = recordEvents(el);
        el.start();
        await wait(150);

        // The documented behaviour: a countdown authored at `initial-time`
        // counts DOWN from it, so it is still running and has not completed.
        expect(seen.map(e => e.type), `timer/initial:${initialTime}: events`)
          .toEqual(['timer-start']);
        expect(el.running, 'a countdown with time left stopped').toBe(true);
        expect(el.getTime(), 'a countdown with time left reads 0').toBeGreaterThan(0);
        expect(el.getTime(), 'a countdown did not count down').toBeLessThan(initialTime);
      },
    );
  }
});
