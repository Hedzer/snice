/**
 * Smoke slice of the snice-timer matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (see
 * vitest.config.ts); the 66-combo matrix runs only via `npm run test:matrix`.
 * This file is the standing cost the everyday loop DOES pay, and it lives
 * at `smoke.test.ts` so it stays collected.
 *
 * Three marquee combos, one per documented rule with nowhere else to break: the
 * stopwatch's count-up plus its event trio, the countdown's count-down after the
 * documented `reset()`, and the control set following `running`. Every
 * assertion routes through the matrix's own oracle (`shapeProblems`), so this
 * file cannot drift into asserting something weaker than the suite it stands in
 * for.
 *
 * BUDGET: under 1s. The matrix owns the sequences that need a real second of
 * wall clock (a countdown actually running out), and the 48-combo control
 * cross. New feature combinations belong there, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  mountTimer, shapeProblems, recordEvents, buttonTitles, run,
  displayText, parseDisplay,
} from './timer-support';
import '../../../packages/components/src/timer/snice-timer';

describe('timer matrix smoke', () => {
  afterEach(() => unmountAll());

  it('a stopwatch counts up, pauses where it stopped, and reports both', async () => {
    const el = await mountTimer('stopwatch', 0);
    const seen = recordEvents(el);
    expect(el.getTime()).toBe(0);
    expect(shapeProblems(el), 'idle shape').toEqual([]);

    el.start();
    await run(140);
    expect(el.running).toBe(true);
    const runningTime = el.getTime();
    expect(runningTime, 'a stopwatch that did not move').toBeGreaterThan(0);

    el.stop();
    await run(120);
    expect(el.running).toBe(false);
    expect(el.getTime(), 'a paused stopwatch kept moving').toBe(runningTime);
    expect(seen.map(e => e.type)).toEqual(['timer-start', 'timer-stop']);
    expect(seen[1].detail.time).toBeCloseTo(runningTime, 5);
    expect(seen[1].detail.timer).toBe(el);
    expect(shapeProblems(el), 'paused shape').toEqual([]);
  });

  it('reset() puts a countdown at its initial-time, and start() counts down from there', async () => {
    const el = await mountTimer('timer', 60);
    el.reset();
    await run(20);
    expect(el.getTime(), 'reset() did not reach the documented initial state').toBe(60);
    expect(parseDisplay(displayText(el))).toBeCloseTo(60, 0);

    el.start();
    await run(140);
    expect(el.running).toBe(true);
    expect(el.getTime(), 'a countdown must count down').toBeLessThan(60);
    expect(el.getTime(), 'a countdown must not pass zero').toBeGreaterThan(0);
    expect(shapeProblems(el), 'running shape').toEqual([]);
  });

  it('the control set follows `running`: start+reset when idle, pause+reset when running', async () => {
    const el = await mountTimer('stopwatch', 0);
    expect(buttonTitles(el)).toEqual(['Start', 'Reset']);

    el.start();
    await run(120);
    expect(buttonTitles(el)).toEqual(['Pause', 'Reset']);
    expect(shapeProblems(el), 'running shape').toEqual([]);

    el.stop();
    await run(80);
    expect(buttonTitles(el)).toEqual(['Start', 'Reset']);
  });
});
