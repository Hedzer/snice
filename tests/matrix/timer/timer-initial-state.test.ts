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
 * 60 seconds: `getTime()` reads 60 and the display shows a minute. The component
 * instead starts every mode at 0 and only reaches `initialTime` if `reset()` is
 * called by hand — so the documented markup above renders a timer that has
 * already run out, and `start()` on it fires `timer-complete` immediately
 * instead of counting down.
 *
 * Per .ai/fuzzing.md the assertions below are the DOCUMENTED ones and are NOT
 * weakened: the divergent combos are declared `it.fails` with a finding id, so
 * the day the component is fixed this suite goes red and the findings close.
 * The combos that agree with the docs (every stopwatch, and a timer whose
 * initial time really is 0) run as ordinary passing tests in the same cross.
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
      ? (name: string, fn: () => Promise<void>) => it.fails(
        finding('MATRIX-timer-1',
          `${name} — an authored countdown stands at 0, not at its initial-time`), fn)
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
    it.fails(
      finding('MATRIX-timer-2',
        `timer/initial:${initialTime}: start() on an authored countdown finishes it`
        + ' immediately — timer-complete fires in the same frame and the display'
        + ' never leaves 0'),
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
