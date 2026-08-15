/**
 * snice-action-bar matrix — structure and slotting.
 *
 * Crosses `position` (all 8) x `size` x `variant` x `open`, and separately the
 * content shapes the roving tabindex is documented to walk. The oracle
 * (`checkBar`) asserts the documented toolbar: part `base` carrying
 * `role="toolbar"` and the `label` as its accessible name, the property vector
 * the element reports back, the default slot projecting the authored actions,
 * and exactly one roving tab stop among the focusable children.
 *
 * 64 + 10 combos. (`position`, `size` and `variant` are otherwise CSS-only
 * dimensions — their paint is the visual tier's job, in
 * tests/live/matrix/action-bar.)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  CONTENT, POSITIONS, SIZES, VARIANTS,
  checkBar, combo, comboName, expectNoProblems, expectedFocusables, makeActionBar,
  rovingStops, tabindexOf,
} from './action-bar-support';

describe('action-bar matrix — structure', () => {
  afterEach(() => unmountAll());

  for (const position of POSITIONS) {
    for (const size of SIZES) {
      for (const variant of VARIANTS) {
        for (const open of [false, true]) {
          const c = combo({ position, size, variant, open });
          it(comboName(c), async () => {
            const el = await makeActionBar(c);
            expectNoProblems(checkBar(el, c), comboName(c));
          });
        }
      }
    }
  }
});

describe('action-bar matrix — action content', () => {
  afterEach(() => unmountAll());

  for (const content of Object.keys(CONTENT) as Array<keyof typeof CONTENT>) {
    for (const open of [false, true]) {
      const c = combo({ content, open });
      it(comboName(c), async () => {
        const el = await makeActionBar(c);
        expectNoProblems(checkBar(el, c), comboName(c));
      });
    }
  }

  it('a disabled child is not a roving stop', async () => {
    const el = await makeActionBar(combo({ content: 'withDisabled' }));
    expect(tabindexOf(el, 'b'), 'disabled child was given a roving tabindex').toBeNull();
    expect(rovingStops(el)).toEqual(['a']);
  });

  it('non-focusable content is left out of the roving order', async () => {
    const el = await makeActionBar(combo({ content: 'mixed' }));
    expect(tabindexOf(el, 'c'), 'a plain <span> was given a roving tabindex').toBeNull();
    expect(expectedFocusables('mixed')).toEqual(['a', 'b', 'd']);
  });
});

describe('action-bar matrix — label', () => {
  afterEach(() => unmountAll());

  for (const label of [undefined, 'Row actions', 'Actions']) {
    it(`label=${label ?? '(default)'}`, async () => {
      const c = combo({ label });
      const el = await makeActionBar(c);
      expectNoProblems(checkBar(el, c), comboName(c));
    });
  }

  it('a label change re-announces the toolbar', async () => {
    const el = await makeActionBar(combo());
    (el as any).label = 'Card actions';
    await new Promise(resolve => setTimeout(resolve, 20));
    expectNoProblems(checkBar(el, combo({ label: 'Card actions' })), 'relabelled');
  });
});
