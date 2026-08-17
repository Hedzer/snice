/**
 * snice-split-pane matrix — the documented keyboard path.
 *
 * Documented: "Divider keyboard-accessible with arrow keys" and "Mouse, touch,
 * and keyboard input supported". So the arrow keys ALONG the split resize the
 * pane, the arrow keys ACROSS it do not (the divider is an ARIA separator whose
 * orientation is the cross axis), `disabled` makes all of them inert, and every
 * resize the keyboard performs is a documented resize: bounded by the two
 * minimums and announced by `pane-resize`.
 *
 * The step SIZE is deliberately not asserted — the docs name no step, so
 * pinning one would be an expectation read off the component rather than off
 * the documentation. What is asserted is everything the docs do fix: the
 * direction of travel, the bounds, the event, and inertness when disabled.
 *
 * The cross: `direction` (2) x key (4) x `disabled` (2) = 16 combos, plus the
 * bound and snap slices below.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, crossAxisKeys, decreaseKey, increaseKey,
  mountSplitPane, pressDivider, pressDividerMany, snapped, type Direction, type ResizeDetail,
} from './split-pane-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

type Role = 'decrease' | 'increase' | 'cross-first' | 'cross-second';

const keyFor = (direction: Direction, role: Role): string => {
  if (role === 'decrease') return decreaseKey(direction);
  if (role === 'increase') return increaseKey(direction);
  return crossAxisKeys(direction)[role === 'cross-first' ? 0 : 1];
};

const combos = cross({
  direction: ['horizontal', 'vertical'] as const,
  role: ['decrease', 'increase', 'cross-first', 'cross-second'] as const,
  disabled: [false, true],
});

describe('split-pane matrix: arrow keys on the divider', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      const direction = combo.direction as Direction;
      const role = combo.role as Role;
      const key = keyFor(direction, role);
      el = await mountSplitPane({
        ...DEFAULTS, direction, primarySize: 50, disabled: combo.disabled,
      });
      const events = captureEvents<ResizeDetail>(el, 'pane-resize');
      const problems = new Problems();

      await pressDivider(el, key);
      const after = (el as any).primarySize as number;

      // A disabled split pane cannot be resized by any input, and an arrow key
      // across the split is not a resize gesture in either state.
      const shouldMove = !combo.disabled && (role === 'decrease' || role === 'increase');

      if (!shouldMove) {
        problems.equal(after, 50, `${key} on a ${combo.disabled ? 'disabled' : 'cross-axis'} divider`);
        problems.equal(events.length, 0, `${key} emitted pane-resize`);
      } else if (role === 'decrease') {
        problems.check(after < 50, `${key} did not shrink the primary pane (${after})`);
        problems.check(after >= DEFAULTS.minPrimarySize,
          `${key} took the primary pane below minPrimarySize (${after})`);
        problems.check(events.length > 0, `${key} emitted no pane-resize`);
      } else {
        problems.check(after > 50, `${key} did not grow the primary pane (${after})`);
        problems.check(after <= 100 - DEFAULTS.minSecondarySize,
          `${key} took the secondary pane below minSecondarySize (${after})`);
        problems.check(events.length > 0, `${key} emitted no pane-resize`);
      }

      if (events.length) {
        const last = events[events.length - 1];
        problems.equal(last.primarySize, after, `${key}: detail.primarySize`);
        problems.equal(last.secondarySize, 100 - after, `${key}: detail.secondarySize`);
        problems.check(last.splitPane === el, `${key}: detail.splitPane`);
      }

      expectClean(problems, combo.id);
    });
  }
});

describe('split-pane matrix: the keyboard cannot cross either minimum', () => {
  // Hammer the divider past each documented bound. However many steps it takes
  // and whatever the step size, the pane must stop at the documented limit.
  for (const direction of ['horizontal', 'vertical'] as const) {
    for (const [minPrimarySize, minSecondarySize] of [[10, 10], [25, 40], [0, 0]]) {
      it(`${direction}: 200 presses stop at min ${minPrimarySize}+${minSecondarySize}`, async () => {
        el = await mountSplitPane({
          ...DEFAULTS, direction, minPrimarySize, minSecondarySize,
        });
        const problems = new Problems();

        await pressDividerMany(el, decreaseKey(direction), 200);
        problems.equal((el as any).primarySize, minPrimarySize, 'floor after 200 decreases');

        await pressDividerMany(el, increaseKey(direction), 400);
        problems.equal((el as any).primarySize, 100 - minSecondarySize,
          'ceiling after 400 increases');

        expectClean(problems, `${direction}/${minPrimarySize}+${minSecondarySize}`);
      });
    }
  }
});

/**
 * MATRIX-split-pane-2
 *
 * Combo:    `<snice-split-pane snap-size="10" primary-size="50">`, then an
 *           arrow key on the divider.
 * Expected: `snapSize` is documented as "percentage, 0 = no snap" with no
 *           qualifier naming an input device, and the same doc states "Mouse,
 *           touch, and keyboard input supported" — so a keyboard resize under a
 *           10% snap lands on a multiple of 10, i.e. 60 (or 50 if the step is
 *           smaller than half a snap unit). Either way the resulting size is a
 *           multiple of `snapSize`.
 * Actual:   `primarySize` becomes 51. Snapping lives only in the pointer-drag
 *           path (`updateDragPosition`); the keyboard path calls
 *           `setPrimarySize` directly and skips the snap grid entirely, so a
 *           snapped pane is only snapped for two of its three documented input
 *           methods.
 */
describe('split-pane matrix: snapSize', () => {
  for (const direction of ['horizontal', 'vertical'] as const) {
    it.fails(`MATRIX-split-pane-2: ${direction} keyboard resize lands on the snap grid`, async () => {
      el = await mountSplitPane({ ...DEFAULTS, direction, primarySize: 50, snapSize: 10 });
      await pressDivider(el, increaseKey(direction));
      const after = (el as any).primarySize as number;
      expect(after).toBe(snapped(after, 10));
    });
  }

  it('snapSize=0 is documented as "no snap": every step is kept as-is', async () => {
    el = await mountSplitPane({ ...DEFAULTS, primarySize: 50, snapSize: 0 });
    await pressDivider(el, increaseKey('horizontal'));
    const after = (el as any).primarySize as number;
    expect(after).toBeGreaterThan(50);
    expect(after).toBeLessThanOrEqual(100 - DEFAULTS.minSecondarySize);
  });
});
