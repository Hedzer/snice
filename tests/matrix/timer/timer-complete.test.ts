/**
 * MATRIX slice — snice-timer reaching zero, and the control affordances.
 *
 * Dimensions: 3 countdown lengths that really run out (3) + the control set in
 * both running states across both modes (4) = 7 combos.
 *
 * The documented rules under test (docs/ai/components/timer.md):
 *   · `timer-complete -> { timer }` — "Countdown reached 0";
 *   · a completed countdown is no longer running and reads 0;
 *   · CSS parts `base` / `display` / `controls`, where `controls` is "The
 *     start/stop/reset button container" — so it offers a reset at all times and
 *     exactly one of start/pause, matching `running`;
 *   · a stopwatch never completes: it "counts up" with nothing to reach.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  MODES, mountTimer, recordEvents, shapeProblems, buttonTitles, run,
  displayText, parseDisplay, type Mode,
} from './timer-support';
import '../../../packages/components/src/timer/snice-timer';

describe('timer matrix: a countdown that reaches zero', () => {
  afterEach(() => unmountAll());

  // Short, real countdowns: the component drives them with its own rAF loop, so
  // the only honest way to assert completion is to let one run out.
  for (const initialTime of [0.2, 0.35, 0.5]) {
    it(`timer/initial:${initialTime}s: completes once, stops, and reads 0`, async () => {
      const el = await mountTimer('timer', initialTime);
      el.reset();
      await run(20);
      const seen = recordEvents(el);

      el.start();
      await run(Math.round(initialTime * 1000) + 400);

      expect(seen.filter(e => e.type === 'timer-complete'),
        `initial:${initialTime}: completion count`).toHaveLength(1);
      const complete = seen.find(e => e.type === 'timer-complete')!;
      expect(complete.detail.timer, 'timer-complete carries the wrong element').toBe(el);
      expect(el.running, 'a completed countdown is still running').toBe(false);
      expect(el.getTime(), 'a completed countdown must read 0').toBe(0);
      expect(parseDisplay(displayText(el)), `display "${displayText(el)}" after completion`).toBe(0);
      expect(shapeProblems(el), 'completed shape').toEqual([]);

      // Nothing may fire after the countdown is over.
      const after = seen.length;
      await run(300);
      expect(seen.length, 'a completed countdown kept emitting').toBe(after);
    }, 15_000);
  }
});

describe('timer matrix: the control set follows `running`', () => {
  afterEach(() => unmountAll());

  for (const mode of MODES) {
    it(`${mode}: idle offers start+reset, running offers pause+reset`, async () => {
      const el = await mountTimer(mode as Mode, 60);
      el.reset();
      await run(20);

      expect(buttonTitles(el), `${mode}: idle controls`).toEqual(['Start', 'Reset']);
      expect(shapeProblems(el), `${mode}: idle shape`).toEqual([]);

      el.start();
      await run(120);
      expect(el.running, `${mode}: start() did not set running`).toBe(true);
      expect(buttonTitles(el), `${mode}: running controls`).toEqual(['Pause', 'Reset']);
      expect(shapeProblems(el), `${mode}: running shape`).toEqual([]);

      el.stop();
      await run(60);
      expect(buttonTitles(el), `${mode}: controls after pausing`).toEqual(['Start', 'Reset']);
      expect(shapeProblems(el), `${mode}: paused shape`).toEqual([]);
    }, 15_000);
  }

  it('a stopwatch left running never announces completion', async () => {
    const el = await mountTimer('stopwatch', 0);
    const seen = recordEvents(el);
    el.start();
    await run(400);
    el.stop();
    expect(seen.map(e => e.type), 'stopwatch event sequence')
      .toEqual(['timer-start', 'timer-stop']);
    expect(el.getTime(), 'a stopwatch must have counted up').toBeGreaterThan(0.2);
  }, 15_000);

  it('the buttons in `controls` drive the timer the same way the methods do', async () => {
    const el = await mountTimer('stopwatch', 0);
    const seen = recordEvents(el);
    const controls = el.shadowRoot!.querySelector('[part~="controls"]') as HTMLElement;

    (controls.querySelector('button.start') as HTMLButtonElement).click();
    await run(120);
    expect(el.running, 'the start button did not start the timer').toBe(true);

    (controls.querySelector('button.pause') as HTMLButtonElement).click();
    await run(60);
    expect(el.running, 'the pause button did not stop the timer').toBe(false);

    (controls.querySelector('button.reset') as HTMLButtonElement).click();
    await run(60);
    expect(el.getTime(), 'the reset button did not restore the initial state').toBe(0);
    expect(seen.map(e => e.type), 'button-driven event sequence')
      .toEqual(['timer-start', 'timer-stop', 'timer-reset']);
  }, 15_000);
});
