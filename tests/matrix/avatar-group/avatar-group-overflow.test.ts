/**
 * MATRIX slice — snice-avatar-group: "Max visible before +N".
 *
 * Dimensions (docs/ai/components/avatar-group.md):
 *   avatar count (7) x max (5) = 35 combos
 *
 * This is the component's only arithmetic, and every interesting case is a
 * boundary: fewer avatars than `max` (no indicator at all), exactly `max`
 * (still none — `max` is how many are VISIBLE, not how many fit before one is
 * hidden), one more than `max` (a `+1`), and far more (a `+N`). `max = 1` and
 * `max = 0` are in the cross because the arithmetic must not special-case the
 * ends.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, unmountAll } from '../matrix-utils';
import {
  DOCUMENTED_PARTS, mountAvatarGroup, expectedShape, readShape,
  avatarButtons, overflowButton, overflowCount, visibleItems, people, partNames,
} from './avatar-group-support';
import '../../../packages/components/src/avatar-group/snice-avatar-group';

const COUNTS = [0, 1, 2, 3, 5, 6, 10] as const;
const MAXES = [0, 1, 3, 5, 8] as const;

const COMBOS = product({ count: COUNTS, max: MAXES });

afterEach(() => { unmountAll(); });

describe(`avatar-group matrix: the overflow arithmetic (${COMBOS.length} combos)`, () => {
  for (const combo of COMBOS) {
    const id = `avatars=${combo.count}/max=${combo.max}`;

    it(id, async () => {
      const avatars = people(combo.count);
      const vector = { avatars, max: combo.max };
      const el = await mountAvatarGroup(vector);

      expectShape(readShape(el), expectedShape(vector), `shape ${id}`);

      const visible = visibleItems(avatars, combo.max);
      const remaining = overflowCount(combo.count, combo.max);
      expect(avatarButtons(el).length, `${id} visible avatars`).toBe(visible.length);

      if (remaining > 0) {
        expect(overflowButton(el), `${id} has no +N indicator`).not.toBeNull();
        expect(overflowButton(el)!.textContent?.trim(), `${id} indicator text`)
          .toBe(`+${remaining}`);
        expect(overflowButton(el)!.getAttribute('aria-label')).toBe(`${remaining} more`);
      } else {
        expect(overflowButton(el), `${id} painted a +N indicator for nothing`).toBeNull();
      }

      // Every part rendered is one the docs list.
      for (const name of partNames(el)) {
        expect(DOCUMENTED_PARTS, `${id}: undocumented part "${name}"`).toContain(name);
      }
    });
  }
});

/**
 * The boundary, stated plainly: `max` is the number of avatars a reader SEES,
 * so a group of exactly `max` shows all of them and no indicator.
 */
describe('avatar-group matrix: the boundary of "max visible"', () => {
  it('exactly max avatars shows all of them and no indicator', async () => {
    const el = await mountAvatarGroup({ avatars: people(3), max: 3 });
    expect(avatarButtons(el)).toHaveLength(3);
    expect(overflowButton(el)).toBeNull();
  });

  it('one more than max shows max avatars and "+1"', async () => {
    const el = await mountAvatarGroup({ avatars: people(4), max: 3 });
    expect(avatarButtons(el)).toHaveLength(3);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+1');
  });

  it('the documented default max is 5', async () => {
    const el = await mountAvatarGroup({ avatars: people(6) });
    expect(el.max).toBe(5);
    expect(avatarButtons(el)).toHaveLength(5);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+1');
  });

  it('an empty group renders its base and nothing else', async () => {
    const el = await mountAvatarGroup({ avatars: [] });
    expect(avatarButtons(el)).toHaveLength(0);
    expect(overflowButton(el)).toBeNull();
    expect(partNames(el)).toEqual(['base']);
  });

  it('raising max reveals hidden avatars; lowering it hides them again', async () => {
    const el = await mountAvatarGroup({ avatars: people(6), max: 2 });
    expect(avatarButtons(el)).toHaveLength(2);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+4');

    el.max = 6;
    await el.rendered;
    expect(avatarButtons(el)).toHaveLength(6);
    expect(overflowButton(el)).toBeNull();

    el.max = 1;
    await el.rendered;
    expect(avatarButtons(el)).toHaveLength(1);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+5');
  });

  it('replacing the avatar list re-renders the whole group', async () => {
    const el = await mountAvatarGroup({ avatars: people(2), max: 3 });
    expect(avatarButtons(el)).toHaveLength(2);

    el.avatars = people(7);
    await el.rendered;
    expect(avatarButtons(el)).toHaveLength(3);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+4');

    el.avatars = [];
    await el.rendered;
    expect(avatarButtons(el)).toHaveLength(0);
    expect(overflowButton(el)).toBeNull();
  });
});
