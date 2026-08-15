/**
 * Smoke slice of the snice-availability matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full availability matrix runs only via
 * `npm run test:matrix`. This file lives at `smoke.test.ts` so it stays
 * collected, and it samples one combo per feature family:
 *   · structure  — granularity/window/format decide the rows and the labels;
 *   · value      — a range vector marks exactly its slots available;
 *   · gesture    — a drag selects a band and reports it on release;
 *   · readonly   — the same gesture changes nothing;
 *   · preset     — Business Hours means Mon-Fri 09:00-17:00;
 *   · method     — clear() empties the value and reports it.
 *
 * Every assertion routes through the matrix oracle (`checkGrid` in
 * matrix/availability/availability-support.ts), so this file cannot assert
 * something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, all, click } from '../matrix-utils';
import {
  checkGrid, collectChanges, combo, dragOverCell, expectNoProblems,
  isActive, makeAvailability, pressCell, releasePointer,
} from './availability-support';

const settle = () => new Promise(resolve => setTimeout(resolve, 20));

describe('availability matrix smoke', () => {
  afterEach(() => unmountAll());

  it('structure: a 30-minute 8-18 grid in 24h reads as documented', async () => {
    const c = combo({ granularity: 30, window: [8, 18], format: '24h' });
    const el = await makeAvailability(c);
    expectNoProblems(checkGrid(el, c), 'g30/8-18/24h');
  });

  it('value: a weekday band marks exactly its slots available', async () => {
    const c = combo({
      granularity: 60, window: [8, 18],
      ranges: [{ day: 0, start: '09:00', end: '17:00' }, { day: 4, start: '13:00', end: '15:00' }],
    });
    const el = await makeAvailability(c);
    expectNoProblems(checkGrid(el, c), 'weekday band');
  });

  it('gesture: a drag selects a band and reports it on release', async () => {
    const el = await makeAvailability(combo({ granularity: 60, window: [9, 17] }));
    const changes = collectChanges(el);
    pressCell(el, 3, 0);
    dragOverCell(el, 3, 1);
    releasePointer();
    await settle();
    expect((el as any).getAvailability()).toEqual([{ day: 3, start: '09:00', end: '11:00' }]);
    expect(changes).toHaveLength(1);
  });

  it('readonly: the same gesture changes nothing', async () => {
    const el = await makeAvailability(combo({ granularity: 60, window: [9, 17], readonly: true }));
    const changes = collectChanges(el);
    pressCell(el, 3, 0);
    releasePointer();
    await settle();
    expect(isActive(el, 3, 0)).toBe(false);
    expect(changes).toHaveLength(0);
  });

  it('preset: Business Hours means Mon-Fri 09:00-17:00', async () => {
    const el = await makeAvailability(combo({ granularity: 60, window: [8, 18] }));
    const button = all<HTMLElement>(el, '.availability__preset')
      .find(node => (node.textContent ?? '').trim() === 'Business Hours');
    click(button!);
    await settle();
    expect((el as any).getAvailability()).toEqual(
      [0, 1, 2, 3, 4].map(day => ({ day, start: '09:00', end: '17:00' })),
    );
  });

  it('method: clear() empties the value and reports it', async () => {
    const el = await makeAvailability(combo({
      granularity: 60, window: [8, 18], ranges: [{ day: 2, start: '10:00', end: '12:00' }],
    }));
    const changes = collectChanges(el);
    (el as any).clear();
    await settle();
    expect((el as any).getAvailability()).toEqual([]);
    expect(changes.at(-1)!.value).toEqual([]);
  });
});
