/**
 * MATRIX slice — snice-timer control sequences.
 *
 * Dimensions: mode (2) x initial-time (0, 5, 60, 3725) x sequence (6)
 * = 48 combos.
 *
 * Every sequence begins with `reset()`, which is documented as "Reset to initial
 * state" — that is how a combo reaches the state the docs describe before the
 * behaviour under test starts. (The fact that a freshly authored countdown does
 * NOT already stand there is a separate, unweakened finding; see
 * timer-initial-state.test.ts. Mixing it into this cross would bury 48 combos
 * under one defect instead of testing what they exist to test.)
 *
 * The documented rules under test (docs/ai/components/timer.md):
 *   · a stopwatch "counts up", a timer is a "Countdown (counts down from 60s)";
 *   · `stop()` — "Stop/pause timer", so a later `start()` RESUMES from the
 *     paused reading rather than restarting;
 *   · `reset()` — "Reset to initial state", from anywhere;
 *   · `running` is true between start and stop;
 *   · `timer-start`/`timer-stop`/`timer-reset` carry `{ timer, time }`, and the
 *     `time` they carry is the timer's reading at that moment;
 *   · `timer-complete` carries `{ timer }` when a "Countdown reached 0".
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  MODES, INITIAL_TIMES, mountTimer, initialState, shapeProblems, recordEvents,
  run, type Mode, type TimerElement,
} from './timer-support';
import '../../../packages/components/src/timer/snice-timer';

/** Long enough for the component's own rAF loop to move the clock. */
const TICK = 140;

const SEQUENCES = [
  'reset',
  'start',
  'start-stop',
  'start-stop-start',
  'start-reset',
  'reset-start-reset-start',
] as const;
type Sequence = typeof SEQUENCES[number];

const COMBOS = MODES.flatMap(mode =>
  INITIAL_TIMES.flatMap(initialTime =>
    SEQUENCES.map(sequence => ({
      id: `${mode}/initial:${initialTime}/${sequence}`,
      mode, initialTime, sequence,
    }))));

/**
 * A timer whose countdown has nothing left to count reaches 0 the moment it is
 * started, which is exactly what `timer-complete` is documented to announce.
 */
const finishesImmediately = (mode: Mode, initialTime: number) =>
  mode === 'timer' && initialTime === 0;

/** The documented direction of travel while running. */
function expectMoved(
  el: TimerElement, mode: Mode, before: number, label: string,
): void {
  if (mode === 'stopwatch') {
    expect(el.getTime(), `${label}: a stopwatch must count up`).toBeGreaterThan(before);
  } else {
    expect(el.getTime(), `${label}: a countdown must count down`).toBeLessThan(before);
    expect(el.getTime(), `${label}: a countdown must not pass zero`).toBeGreaterThanOrEqual(0);
  }
}

describe('timer matrix: mode x initial-time x control sequence', () => {
  afterEach(() => unmountAll());

  for (const combo of COMBOS) {
    it(combo.id, async () => {
      const mode = combo.mode as Mode;
      const el = await mountTimer(mode, combo.initialTime);
      const initial = initialState(mode, combo.initialTime);
      const seen = recordEvents(el);

      // Reach the documented initial state.
      el.reset();
      await run(20);
      expect(el.getTime(), `${combo.id}: reset() did not reach the initial state`).toBe(initial);
      expect(el.running, `${combo.id}: reset() left the timer running`).toBe(false);
      expect(seen.map(e => e.type), `${combo.id}: reset() event`).toEqual(['timer-reset']);
      expect(seen[0].detail.time, `${combo.id}: timer-reset carries the wrong time`).toBe(initial);
      expect(seen[0].detail.timer, `${combo.id}: timer-reset carries the wrong element`).toBe(el);
      expect(shapeProblems(el), `${combo.id}: idle shape`).toEqual([]);

      if (combo.sequence === 'reset') return;

      // ── start ────────────────────────────────────────────────────────────
      const beforeStart = el.getTime();
      el.start();
      await run(TICK);

      const startEvents = seen.filter(e => e.type === 'timer-start');
      expect(startEvents, `${combo.id}: start() fired no timer-start`).toHaveLength(1);
      expect(startEvents[0].detail.timer, `${combo.id}: timer-start element`).toBe(el);

      if (finishesImmediately(mode, combo.initialTime)) {
        // A countdown of zero seconds has reached 0; the documented answer is
        // `timer-complete`, and the timer is no longer running.
        expect(seen.some(e => e.type === 'timer-complete'),
          `${combo.id}: an empty countdown never announced completion`).toBe(true);
        expect(el.running, `${combo.id}: an empty countdown is still running`).toBe(false);
        expect(el.getTime(), `${combo.id}: an empty countdown must read 0`).toBe(0);
        expect(shapeProblems(el), `${combo.id}: completed shape`).toEqual([]);
        return;
      }

      expect(el.running, `${combo.id}: start() did not set running`).toBe(true);
      expectMoved(el, mode, beforeStart, combo.id);
      expect(shapeProblems(el), `${combo.id}: running shape`).toEqual([]);

      if (combo.sequence === 'start') return;

      if (combo.sequence === 'start-reset') {
        el.reset();
        await run(20);
        expect(el.getTime(), `${combo.id}: reset() from running did not restore the initial state`)
          .toBe(initial);
        expect(el.running, `${combo.id}: reset() left the timer running`).toBe(false);
        const resets = seen.filter(e => e.type === 'timer-reset');
        expect(resets, `${combo.id}: reset() fired no second timer-reset`).toHaveLength(2);
        expect(resets[1].detail.time, `${combo.id}: the second timer-reset carries the wrong time`)
          .toBe(initial);
        expect(shapeProblems(el), `${combo.id}: shape after reset`).toEqual([]);
        return;
      }

      // ── stop ─────────────────────────────────────────────────────────────
      el.stop();
      await run(40);
      const paused = el.getTime();
      const stops = seen.filter(e => e.type === 'timer-stop');
      expect(stops, `${combo.id}: stop() fired no timer-stop`).toHaveLength(1);
      expect(stops[0].detail.time, `${combo.id}: timer-stop carries a different time than getTime()`)
        .toBeCloseTo(paused, 5);
      expect(el.running, `${combo.id}: stop() did not clear running`).toBe(false);
      expect(shapeProblems(el), `${combo.id}: paused shape`).toEqual([]);

      // A stopped timer stays stopped: nothing may move while it is paused.
      await run(TICK);
      expect(el.getTime(), `${combo.id}: a paused timer kept moving`).toBe(paused);

      if (combo.sequence === 'start-stop') return;

      if (combo.sequence === 'start-stop-start') {
        // "Stop/pause": a restart RESUMES from the paused reading.
        el.start();
        await run(TICK);
        expect(el.running, `${combo.id}: the resumed timer is not running`).toBe(true);
        expectMoved(el, mode, paused, `${combo.id} (resumed)`);
        expect(seen.filter(e => e.type === 'timer-start'),
          `${combo.id}: the resume fired no second timer-start`).toHaveLength(2);
        expect(shapeProblems(el), `${combo.id}: resumed shape`).toEqual([]);
        return;
      }

      // 'reset-start-reset-start': a full round trip back to the initial state
      // and away from it again.
      el.reset();
      await run(20);
      expect(el.getTime(), `${combo.id}: the second reset did not restore the initial state`)
        .toBe(initial);
      el.start();
      await run(TICK);
      expect(el.running, `${combo.id}: the restarted timer is not running`).toBe(true);
      expectMoved(el, mode, initial, `${combo.id} (restarted)`);
      expect(shapeProblems(el), `${combo.id}: restarted shape`).toEqual([]);
    }, 15_000);
  }
});
