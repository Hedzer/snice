/**
 * MATRIX slice — snice-countdown events and the complete state.
 *
 * Dimensions: 3 formats x {already finished, still running} for the event
 * contract (6), plus the live zero-crossing, the target-change restart, and the
 * disposal rule (5) = 11 combos.
 *
 * The documented rules under test (docs/ai/components/countdown.md):
 *   · `countdown-tick -> { days, hours, minutes, seconds, total }` — "Fires
 *     every second";
 *   · `countdown-complete -> void` — "Countdown reached zero";
 *   · "`.complete` class added to host on finish".
 *
 * The zero-crossing tests use the REAL clock, because what they assert is that
 * the component's own one-second interval does the transition. Everything else
 * freezes `Date` for an exact reading.
 */
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { unmountAll, finding, wait } from '../matrix-utils';
import {
  FORMATS, DAY, HOUR, MINUTE, SECOND,
  freezeClock, thawClock, targetFor, mountCountdown, recordEvents,
  readValues, expectedValues, segments, settle,
} from './countdown-support';
import { mount } from '../matrix-utils';
import '../../../packages/components/src/countdown/snice-countdown';

const RUNNING = { id: '3d4h5m6s', ms: 3 * DAY + 4 * HOUR + 5 * MINUTE + 6 * SECOND };

describe('countdown matrix: the tick contract', () => {
  beforeEach(() => freezeClock());
  afterEach(() => { unmountAll(); thawClock(); });

  for (const format of FORMATS) {
    it(`${format}: a running countdown ticks with the full documented detail`, async () => {
      // The detail is documented as the four units plus a total, independently
      // of `format`: the format is about DISPLAY, the event about the value.
      const el = await mount<HTMLElement>('snice-countdown', { format });
      const seen = recordEvents(el);
      (el as any).target = targetFor(RUNNING.ms);
      await settle(el, 5);

      const ticks = seen.filter(e => e.type === 'countdown-tick');
      expect(ticks.length, `${format}: no countdown-tick on start`).toBeGreaterThan(0);
      const detail = ticks[ticks.length - 1].detail;
      expect({
        days: detail.days, hours: detail.hours,
        minutes: detail.minutes, seconds: detail.seconds,
      }).toEqual({ days: 3, hours: 4, minutes: 5, seconds: 6 });
      expect(typeof detail.total, `${format}: total is not a number`).toBe('number');
      expect(detail.total, `${format}: total must be the time still to run`).toBeGreaterThan(0);
      expect(seen.some(e => e.type === 'countdown-complete'),
        `${format}: a running countdown announced completion`).toBe(false);
    });

    it(`${format}: a target already in the past announces completion, not a tick`, async () => {
      const el = await mount<HTMLElement>('snice-countdown', { format });
      const seen = recordEvents(el);
      (el as any).target = targetFor(-5 * MINUTE);
      await settle(el, 5);

      expect(seen.map(e => e.type), `${format}: event sequence`).toEqual(['countdown-complete']);
      expect(el.classList.contains('complete'),
        `${format}: no .complete class on a finished countdown`).toBe(true);
      expect(readValues(el), `${format}: a finished countdown must read zero`)
        .toEqual(expectedValues(format, 0));
    });
  }
});

describe('countdown matrix: crossing zero', () => {
  afterEach(() => unmountAll());

  it('a countdown that runs out completes exactly once and zeroes every segment', async () => {
    // Real clock: this asserts the component's OWN one-second interval fires the
    // transition, which is the whole point of the rule.
    const el = await mount<HTMLElement>('snice-countdown', { format: 'ms' });
    const seen = recordEvents(el);
    (el as any).target = new Date(Date.now() + 900).toISOString();
    await wait(1400);

    expect(seen.filter(e => e.type === 'countdown-complete'), 'completion count')
      .toHaveLength(1);
    expect(el.classList.contains('complete'), 'no .complete class after finishing').toBe(true);
    expect(readValues(el), 'a finished countdown must read zero').toEqual([0, 0]);
  }, 10_000);

  it('every segment still carries its own value and label after completion', async () => {
    const el = await mount<HTMLElement>('snice-countdown', {
      format: 'dhms', target: new Date(Date.now() - 1000).toISOString(),
    });
    await settle(el, 5);
    expect(segments(el)).toHaveLength(4);
    expect(readValues(el)).toEqual([0, 0, 0, 0]);
  });
});

describe('countdown matrix: retargeting a finished countdown', () => {
  beforeEach(() => freezeClock());
  afterEach(() => { unmountAll(); thawClock(); });

  it('a new future target restarts the countdown and it reads the new time', async () => {
    const el = await mount<HTMLElement>('snice-countdown', {
      format: 'dhms', target: targetFor(-MINUTE),
    });
    await settle(el, 5);
    expect(readValues(el)).toEqual([0, 0, 0, 0]);

    (el as any).target = targetFor(RUNNING.ms);
    await settle(el, 5);
    expect(readValues(el), 'the restarted countdown must read the new target')
      .toEqual(expectedValues('dhms', RUNNING.ms));
  });

  it.fails(
    finding('MATRIX-countdown-3',
      'retarget/future-after-complete: `.complete` stays on the host while the'
      + ' countdown is running again — the class documented as "added on finish"'
      + ' now marks a countdown that has not finished'),
    async () => {
      const el = await mount<HTMLElement>('snice-countdown', {
        format: 'dhms', target: targetFor(-MINUTE),
      });
      await settle(el, 5);
      expect(el.classList.contains('complete'), 'finished countdown is marked').toBe(true);

      (el as any).target = targetFor(RUNNING.ms);
      await settle(el, 5);
      expect(readValues(el)).toEqual(expectedValues('dhms', RUNNING.ms));
      expect(el.classList.contains('complete'),
        'a countdown with time left is still marked complete').toBe(false);
    },
  );

  it('a countdown removed from the document stops ticking', async () => {
    const el = await mount<HTMLElement>('snice-countdown', {
      format: 'ms', target: targetFor(2 * MINUTE),
    });
    const seen = recordEvents(el);
    el.remove();
    await wait(1200);
    expect(seen, 'a disconnected countdown kept emitting').toHaveLength(0);
  }, 10_000);
});
