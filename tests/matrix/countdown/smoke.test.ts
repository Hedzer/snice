/**
 * Smoke slice of the snice-countdown matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (see
 * vitest.config.ts); the 59-combo matrix runs only via `npm run test:matrix`.
 * This file is the standing cost the everyday loop DOES pay, and it lives
 * at `smoke.test.ts` so it stays collected.
 *
 * Four marquee combos, one per documented rule with nowhere else to break: the
 * dhms reading of a real remaining time, the segment/separator structure each
 * format promises, the finished state (`.complete` + `countdown-complete`), and
 * the tick detail. Every assertion routes through the matrix's own oracle
 * (`expectedShape` / `readShape`), so this file cannot drift into asserting
 * something weaker than the suite it stands in for.
 *
 * The clock is frozen, so this file costs milliseconds, not seconds — the
 * matrix owns the real-clock zero-crossing tests.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { expectShape, unmountAll, mount } from '../matrix-utils';
import {
  DAY, HOUR, MINUTE, SECOND, freezeClock, thawClock, targetFor,
  mountCountdown, expectedShape, readShape, readValues, separators, segments,
  recordEvents, settle, type CountdownCombo,
} from './countdown-support';
import '../../../packages/components/src/countdown/snice-countdown';

const RUNNING = { id: '3d4h5m6s', ms: 3 * DAY + 4 * HOUR + 5 * MINUTE + 6 * SECOND };

describe('countdown matrix smoke', () => {
  beforeEach(() => freezeClock());
  afterEach(() => { unmountAll(); thawClock(); });

  it('dhms reads days, hours, minutes and seconds of the time remaining', async () => {
    const combo: CountdownCombo = {
      id: 'smoke/dhms', format: 'dhms', variant: 'simple', duration: RUNNING,
    };
    const el = await mountCountdown(combo);
    expect(readValues(el)).toEqual([3, 4, 5, 6]);
    expectShape(readShape(el, combo), expectedShape(combo), combo.id);
  });

  it('each format renders its own segments, with a separator between each pair', async () => {
    for (const [format, count] of [['dhms', 4], ['hms', 3], ['ms', 2]] as const) {
      const combo: CountdownCombo = {
        id: `smoke/${format}`, format, variant: 'flip',
        duration: { id: '5m30s', ms: 5 * MINUTE + 30 * SECOND },
      };
      const el = await mountCountdown(combo);
      expect(segments(el), `${format} segment count`).toHaveLength(count);
      expect(separators(el), `${format} separator count`).toHaveLength(count - 1);
      expectShape(readShape(el, combo), expectedShape(combo), combo.id);
    }
  });

  it('a target in the past finishes: .complete on the host, zeroes on screen', async () => {
    const combo: CountdownCombo = {
      id: 'smoke/complete', format: 'dhms', variant: 'circular',
      duration: { id: 'zero', ms: 0 },
    };
    const el = await mountCountdown(combo);
    expect(el.classList.contains('complete')).toBe(true);
    expect(readValues(el)).toEqual([0, 0, 0, 0]);
    expectShape(readShape(el, combo), expectedShape(combo), combo.id);
  });

  it('countdown-tick carries the four units plus a total; completion carries none', async () => {
    const el = await mount<HTMLElement>('snice-countdown', { format: 'dhms' });
    const seen = recordEvents(el);
    (el as any).target = targetFor(RUNNING.ms);
    await settle(el, 5);

    const tick = seen.find(e => e.type === 'countdown-tick');
    expect(tick, 'no countdown-tick fired').toBeTruthy();
    expect({
      days: tick!.detail.days, hours: tick!.detail.hours,
      minutes: tick!.detail.minutes, seconds: tick!.detail.seconds,
    }).toEqual({ days: 3, hours: 4, minutes: 5, seconds: 6 });
    expect(tick!.detail.total).toBeGreaterThan(0);

    (el as any).target = targetFor(-MINUTE);
    await settle(el, 5);
    const complete = seen.find(e => e.type === 'countdown-complete');
    expect(complete, 'no countdown-complete fired').toBeTruthy();
    // `countdown-complete -> void`: no payload. A CustomEvent with nothing set
    // reports `detail: null`, which is the same claim.
    expect(complete!.detail ?? undefined).toBeUndefined();
  });
});
