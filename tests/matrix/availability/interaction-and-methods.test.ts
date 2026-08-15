/**
 * snice-availability matrix — gestures, presets, methods and events.
 *
 * Documented surface exercised here:
 *   · "Toggle cells by click or drag", and `readonly` withdrawing that;
 *   · "Presets: Business Hours, Weekdays Only, Clear All";
 *   · `getAvailability()`, `setAvailability(ranges)`, `clear()`;
 *   · `availability-change` → `{ value: AvailabilityRange[] }`.
 *
 * 22 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, all, click } from '../matrix-utils';
import {
  checkGrid, collectChanges, combo, comboName, dragOverCell, expectNoProblems,
  isActive, makeAvailability, pressCell, releasePointer,
} from './availability-support';

const PRESETS = ['Business Hours', 'Weekdays Only', 'Clear All'] as const;

function preset(el: HTMLElement, name: string): HTMLElement | undefined {
  return all<HTMLElement>(el, '.availability__preset')
    .find(button => (button.textContent ?? '').trim() === name);
}

describe('availability matrix — gestures', () => {
  afterEach(() => unmountAll());

  for (const granularity of [30, 60]) {
    for (const readonly of [false, true]) {
      const c = combo({ granularity, window: [9, 17], readonly });

      it(`${comboName(c)} — a click on an empty slot`, async () => {
        const el = await makeAvailability(c);
        const changes = collectChanges(el);
        pressCell(el, 0, 0);
        releasePointer();
        await new Promise(resolve => setTimeout(resolve, 20));

        if (readonly) {
          expect(isActive(el, 0, 0), 'readonly grid toggled a cell').toBe(false);
          expect(changes.length, 'readonly grid emitted availability-change').toBe(0);
          expect((el as any).getAvailability()).toEqual([]);
        } else {
          expect(isActive(el, 0, 0), 'click did not mark the slot available').toBe(true);
          expect(changes.length, 'no availability-change on release').toBe(1);
          expect(changes[0].value).toEqual([
            { day: 0, start: '09:00', end: granularity === 60 ? '10:00' : '09:30' },
          ]);
        }
      });

      it(`${comboName(c)} — a drag across three slots`, async () => {
        const el = await makeAvailability(c);
        const changes = collectChanges(el);
        pressCell(el, 2, 0);
        dragOverCell(el, 2, 1);
        dragOverCell(el, 2, 2);
        releasePointer();
        await new Promise(resolve => setTimeout(resolve, 20));

        if (readonly) {
          expect((el as any).getAvailability()).toEqual([]);
          expect(changes.length).toBe(0);
        } else {
          expect((el as any).getAvailability()).toEqual([
            { day: 2, start: '09:00', end: granularity === 60 ? '12:00' : '10:30' },
          ]);
          expect(changes.length).toBe(1);
        }
      });

      it(`${comboName(c)} — a click on an available slot withdraws it`, async () => {
        const seeded = combo({
          granularity, window: [9, 17], readonly,
          ranges: [{ day: 1, start: '09:00', end: '11:00' }],
        });
        const el = await makeAvailability(seeded);
        const changes = collectChanges(el);
        pressCell(el, 1, 0);
        releasePointer();
        await new Promise(resolve => setTimeout(resolve, 20));

        if (readonly) {
          expect(isActive(el, 1, 0), 'readonly grid withdrew a slot').toBe(true);
          expect(changes.length).toBe(0);
        } else {
          expect(isActive(el, 1, 0), 'click did not withdraw the slot').toBe(false);
          expect(changes[0].value).toEqual([
            { day: 1, start: granularity === 60 ? '10:00' : '09:30', end: '11:00' },
          ]);
        }
      });
    }
  }
});

describe('availability matrix — presets', () => {
  afterEach(() => unmountAll());

  for (const window of [[0, 24], [8, 18]] as const) {
    for (const granularity of [30, 60]) {
      const c = combo({ granularity, window });

      it(`${comboName(c)} — every documented preset is offered`, async () => {
        const el = await makeAvailability(c);
        expectNoProblems(
          PRESETS.filter(name => !preset(el, name)).map(name => `preset "${name}" missing`),
          comboName(c),
        );
      });

      it(`${comboName(c)} — Business Hours selects Mon-Fri 09:00-17:00`, async () => {
        const el = await makeAvailability(c);
        const changes = collectChanges(el);
        click(preset(el, 'Business Hours')!);
        await new Promise(resolve => setTimeout(resolve, 20));
        const expected = [0, 1, 2, 3, 4].map(day => ({ day, start: '09:00', end: '17:00' }));
        expect((el as any).getAvailability()).toEqual(expected);
        expect(changes.length, 'preset did not report availability-change').toBe(1);
        expect(changes[0].value).toEqual(expected);
      });

      it(`${comboName(c)} — Weekdays Only selects the whole window Mon-Fri`, async () => {
        const el = await makeAvailability(c);
        click(preset(el, 'Weekdays Only')!);
        await new Promise(resolve => setTimeout(resolve, 20));
        const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
        expect((el as any).getAvailability()).toEqual(
          [0, 1, 2, 3, 4].map(day => ({ day, start: pad(window[0]), end: pad(window[1]) })),
        );
      });

      it(`${comboName(c)} — Clear All empties the value`, async () => {
        const seeded = combo({ granularity, window, ranges: [{ day: 0, start: '10:00', end: '12:00' }] });
        const el = await makeAvailability(seeded);
        const changes = collectChanges(el);
        click(preset(el, 'Clear All')!);
        await new Promise(resolve => setTimeout(resolve, 20));
        expect((el as any).getAvailability()).toEqual([]);
        expect(changes.at(-1)!.value).toEqual([]);
        expectNoProblems(checkGrid(el, combo({ granularity, window })), 'cleared grid');
      });
    }
  }
});

describe('availability matrix — methods', () => {
  afterEach(() => unmountAll());

  it('setAvailability(ranges) is what getAvailability() returns', async () => {
    const el = await makeAvailability(combo({ granularity: 30, window: [8, 18] }));
    const ranges = [
      { day: 0, start: '09:00', end: '17:00' },
      { day: 1, start: '09:00', end: '17:00' },
    ];
    (el as any).setAvailability(ranges);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect((el as any).getAvailability()).toEqual(ranges);
  });

  it('setAvailability(ranges) repaints the grid', async () => {
    const el = await makeAvailability(combo({ granularity: 60, window: [8, 18] }));
    const ranges = [{ day: 6, start: '13:00', end: '16:00' }];
    (el as any).setAvailability(ranges);
    await new Promise(resolve => setTimeout(resolve, 20));
    expectNoProblems(
      checkGrid(el, combo({ granularity: 60, window: [8, 18], ranges })),
      'after setAvailability',
    );
  });

  it('clear() removes all availability and reports the change', async () => {
    const el = await makeAvailability(combo({
      granularity: 60, window: [8, 18], ranges: [{ day: 0, start: '09:00', end: '17:00' }],
    }));
    const changes = collectChanges(el);
    (el as any).clear();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect((el as any).getAvailability()).toEqual([]);
    expect(changes.at(-1)!.value).toEqual([]);
  });

  it('getAvailability() hands back a copy, not the live value array', async () => {
    const el = await makeAvailability(combo({
      granularity: 60, window: [8, 18], ranges: [{ day: 0, start: '09:00', end: '10:00' }],
    }));
    const taken = (el as any).getAvailability();
    taken.push({ day: 5, start: '00:00', end: '01:00' });
    expect((el as any).getAvailability()).toHaveLength(1);
  });

  it('availability-change crosses the shadow boundary (bubbles, composed)', async () => {
    const el = await makeAvailability(combo({ granularity: 60, window: [9, 17] }));
    const seen: any[] = [];
    document.addEventListener('availability-change', event => seen.push((event as CustomEvent).detail));
    (el as any).clear();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(seen.length).toBeGreaterThan(0);
    expect(Array.isArray(seen[0].value)).toBe(true);
  });
});
