/**
 * snice-availability matrix — value <-> grid mapping.
 *
 * `value: AvailabilityRange[]` with `day` 0=Mon…6=Sun and `"HH:MM"` bounds is
 * the component's whole data contract. These combos cross the documented slot
 * sizes and hour windows against range vectors that exercise the edges the docs
 * imply: nothing set, one weekday band, several days at once, a band that runs
 * past `end-hour`, and a band that starts before `start-hour`.
 *
 * 30 combos + 3 findings.
 */
import { describe, it, afterEach } from 'vitest';
import { unmountAll, finding } from '../matrix-utils';
import type { AvailabilityRange } from '../../../packages/components/src/availability/snice-availability.types';
import {
  GRANULARITIES,
  checkGrid, combo, comboName, expectNoProblems, makeAvailability, readGrid,
} from './availability-support';

/** Range vectors, all aligned to every documented granularity (15/30/60). */
const RANGE_SETS: Array<{ name: string; ranges: AvailabilityRange[] }> = [
  { name: 'none', ranges: [] },
  { name: 'one-weekday', ranges: [{ day: 0, start: '09:00', end: '17:00' }] },
  {
    name: 'weekdays',
    ranges: [0, 1, 2, 3, 4].map(day => ({ day, start: '09:00', end: '17:00' })),
  },
  { name: 'weekend', ranges: [{ day: 5, start: '10:00', end: '12:00' }, { day: 6, start: '10:00', end: '12:00' }] },
  { name: 'past-end-hour', ranges: [{ day: 2, start: '16:00', end: '23:00' }] },
  { name: 'before-start-hour', ranges: [{ day: 3, start: '06:00', end: '10:00' }] },
];

describe('availability matrix — value mapping', () => {
  afterEach(() => unmountAll());

  for (const granularity of GRANULARITIES) {
    for (const window of [[0, 24], [8, 18]] as const) {
      for (const set of RANGE_SETS) {
        const c = combo({ granularity, window, ranges: set.ranges });
        it(`${comboName(c)} ${set.name}`, async () => {
          const el = await makeAvailability(c);
          expectNoProblems(checkGrid(el, c), `${comboName(c)} ${set.name}`);
        });
      }
    }
  }

  // ── Findings ──────────────────────────────────────────────────────────────

  /**
   * A range whose bounds do not land on a slot boundary still fully contains
   * whole slots, and those slots are available. `granularity` is documented as
   * the slot size, not as a constraint on the values `value` may carry — the
   * bounds are plain `"HH:MM"` strings.
   */
  it.fails(
    finding('MATRIX-availability-1', 'a range offset from the slot grid marks no slots available at all'),
    async () => {
      const c = combo({ granularity: 30, window: [9, 17], ranges: [{ day: 0, start: '09:15', end: '11:15' }] });
      const el = await makeAvailability(c);
      // 09:30-10:00, 10:00-10:30 and 10:30-11:00 lie entirely inside the range.
      expectNoProblems(checkGrid(el, c), 'offset range');
    },
  );

  /**
   * Same defect reached from the other direction: `startHour` itself offsets the
   * grid, so an on-the-hour range is off-grid whenever the window does not start
   * on a slot boundary of its own.
   */
  it.fails(
    finding('MATRIX-availability-2', 'an hour-aligned range is dropped when granularity is 15 and the range starts mid-slot'),
    async () => {
      const c = combo({ granularity: 15, window: [9, 12], ranges: [{ day: 1, start: '09:05', end: '10:05' }] });
      const el = await makeAvailability(c);
      // 09:15-09:30, 09:30-09:45 and 09:45-10:00 are wholly inside 09:05-10:05.
      expectNoProblems(checkGrid(el, c), 'mid-slot range');
    },
  );

  /**
   * `value` is documented as a list of ranges; nothing says the list must be
   * sorted or disjoint. Two overlapping ranges for one day describe the union.
   */
  it('overlapping ranges for one day describe their union', async () => {
    const c = combo({
      granularity: 60,
      window: [8, 18],
      ranges: [
        { day: 4, start: '09:00', end: '12:00' },
        { day: 4, start: '11:00', end: '14:00' },
      ],
    });
    const el = await makeAvailability(c);
    expectNoProblems(checkGrid(el, c), 'overlapping ranges');
  });

  it('an empty value vector leaves every slot unavailable', async () => {
    const c = combo({ granularity: 60, window: [8, 18] });
    const el = await makeAvailability(c);
    expectNoProblems(
      [...readGrid(el).activeKeys].map(key => `slot ${key} available with no ranges set`),
      'empty value',
    );
  });
});
