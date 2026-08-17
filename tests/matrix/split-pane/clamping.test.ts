/**
 * snice-split-pane matrix — `setPrimarySize`, `reset`, and the documented
 * minimums.
 *
 * The cross: `minPrimarySize` (3) x `minSecondarySize` (3) x requested size (6)
 * = 54 combos, each asserting the size the docs say the pane ends up at and the
 * `pane-resize` payload the docs say it emits.
 *
 * The oracle is `clampedSize()` in split-pane-support.ts — written from the two
 * documented minimums, not from the component's arithmetic:
 *
 *   · `minPrimarySize` is the primary pane's floor;
 *   · `minSecondarySize` is the secondary pane's floor, and the two panes are
 *     documented as percentages of one container, so it is the primary pane's
 *     ceiling at `100 - minSecondarySize`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkGetters, checkResizeEvent, clampedSize,
  mountSplitPane, wait, SETTLE, type ResizeDetail, type Vector,
} from './split-pane-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = cross({
  minPrimarySize: [0, 10, 30],
  minSecondarySize: [0, 10, 30],
  requested: [-25, 0, 5, 50, 95, 130],
});

describe('split-pane matrix: setPrimarySize honours both documented minimums', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      const vector: Vector = {
        ...DEFAULTS,
        minPrimarySize: combo.minPrimarySize,
        minSecondarySize: combo.minSecondarySize,
      };
      el = await mountSplitPane(vector);
      const events = captureEvents<ResizeDetail>(el, 'pane-resize');
      const problems = new Problems();

      const want = clampedSize(combo.requested, combo.minPrimarySize, combo.minSecondarySize);
      (el as any).setPrimarySize(combo.requested);
      await wait(SETTLE);

      problems.equal((el as any).primarySize, want, `setPrimarySize(${combo.requested})`);
      checkGetters(problems, el, { ...vector, primarySize: want });
      checkResizeEvent(problems, events, el, want, `setPrimarySize(${combo.requested})`);

      // The size the divider announces follows the size it produced.
      const divider = el.shadowRoot!.querySelector('[part~="divider"]')!;
      problems.equal(divider.getAttribute('aria-valuenow'), String(Math.round(want)),
        'divider aria-valuenow after setPrimarySize');

      expectClean(problems, combo.id);
    });
  }
});

describe('split-pane matrix: reset()', () => {
  // Documented: "`reset()` - Reset to 50/50". Asserted at the minimums that
  // leave 50/50 reachable; the pair that does not is the finding below.
  for (const [minPrimarySize, minSecondarySize] of [[0, 0], [10, 10], [30, 30], [50, 50]]) {
    it(`reset() from a moved divider: min ${minPrimarySize}+${minSecondarySize}`, async () => {
      el = await mountSplitPane({
        ...DEFAULTS, primarySize: 35, minPrimarySize, minSecondarySize,
      });
      const events = captureEvents<ResizeDetail>(el, 'pane-resize');
      const problems = new Problems();

      (el as any).reset();
      await wait(SETTLE);

      problems.equal((el as any).primarySize, 50, 'reset() primary size');
      checkResizeEvent(problems, events, el, 50, 'reset()');
      expectClean(problems, `reset/${minPrimarySize}+${minSecondarySize}`);
    });
  }

  /**
   * MATRIX-split-pane-1
   *
   * Combo:    min-primary-size="60", then `reset()`.
   * Expected: the two documented minimums bound the pane at all times, so a
   *           reset can only land on a size the minimums admit — 60, the
   *           primary pane's documented floor.
   * Actual:   `primarySize` becomes 50, below the floor the same component
   *           enforces in `setPrimarySize()`. `reset()` writes the property
   *           directly instead of going through the documented clamp, so the
   *           one documented way to "reset" a pane is also the one way to put
   *           it in a state the component otherwise refuses to produce.
   */
  it.fails('MATRIX-split-pane-1: reset() cannot land below minPrimarySize', async () => {
    el = await mountSplitPane({ ...DEFAULTS, primarySize: 80, minPrimarySize: 60 });
    (el as any).reset();
    await wait(SETTLE);
    expect((el as any).primarySize).toBe(60);
  });
});

describe('split-pane matrix: the panes always add up', () => {
  // Whatever the minimums and whatever was asked for, the documented pair of
  // getters describes one container split in two.
  for (const combo of combos.filter((_, index) => index % 3 === 0)) {
    it(`complement: ${combo.id}`, async () => {
      el = await mountSplitPane({
        ...DEFAULTS,
        minPrimarySize: combo.minPrimarySize,
        minSecondarySize: combo.minSecondarySize,
      });
      (el as any).setPrimarySize(combo.requested);
      await wait(SETTLE);
      const pane = el as any;
      expect(pane.getPrimarySize() + pane.getSecondarySize()).toBe(100);
    });
  }
});
