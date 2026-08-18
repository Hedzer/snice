/**
 * MATRIX slice — snice-avatar-group: the two events, and declarative mode.
 *
 * Dimensions (docs/ai/components/avatar-group.md):
 *   clicked index (5) x max (2) = 10 combos for `avatar-click`,
 *   then avatar count (4) x max (3) = 12 combos for declarative mode.
 *
 * The events:
 *   · `avatar-click -> { avatar, index }` — the index is the position in the
 *     AUTHOR'S array, which for a visible avatar is also its position on
 *     screen; a group that renumbered its visible avatars would report an index
 *     the caller cannot look up;
 *   · `overflow-click -> { remaining, avatars }` — the same `N` the button
 *     reads, and the items it stands for, so a consumer can open "3 more"
 *     without recomputing the slice.
 *
 * Declarative mode:
 *   · "(default) - `<snice-avatar>` elements for declarative mode";
 *   · the same "Max visible before +N" arithmetic applies to CHILDREN, so the
 *     ones past `max` are hidden and the `+N` button appears;
 *   · `overflow-click` still reports `remaining`; there are no
 *     `AvatarGroupItem` objects in this mode, so the item list is empty.
 *
 * Every assertion is the DOCUMENTED expectation. One finding is pinned
 * with `it.fails`: MATRIX-avatar-group-2 (a child added after mount is
 * never counted) — full write-up in "avatar-group matrix: findings" below.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, click, unmountAll } from '../matrix-utils';
import {
  mountAvatarGroup, tick, avatarButtons, overflowButton, recordEvents,
  hiddenItems, overflowCount, people, partNames,
} from './avatar-group-support';
import '../../../packages/components/src/avatar-group/snice-avatar-group';
import '../../../packages/components/src/avatar/snice-avatar';

afterEach(() => { unmountAll(); });

const CLICK_COMBOS = product({ index: [0, 1, 2, 3, 4], max: [3, 8] as const });

describe(`avatar-group matrix: avatar-click (${CLICK_COMBOS.length} combos)`, () => {
  for (const combo of CLICK_COMBOS) {
    const id = `click=${combo.index}/max=${combo.max}`;

    it(id, async () => {
      const avatars = people(5);
      const el = await mountAvatarGroup({ avatars, max: combo.max });
      const buttons = avatarButtons(el);
      const seen = recordEvents(el);

      const button = buttons[combo.index];
      if (!button) {
        // The avatar is behind the `+N` indicator; there is nothing to click,
        // which is itself the documented consequence of `max`.
        expect(combo.index).toBeGreaterThanOrEqual(combo.max);
        return;
      }

      click(button);
      await tick(el);

      expect(seen.map(e => e.type), `${id} events`).toEqual(['avatar-click']);
      // The index is the AUTHOR'S index, and the item is the author's object —
      // by identity, so a consumer can compare it to what they passed in.
      expect(seen[0].detail.index, `${id} index`).toBe(combo.index);
      expect(seen[0].detail.avatar, `${id} avatar`).toBe(avatars[combo.index]);
    });
  }
});

describe('avatar-group matrix: overflow-click', () => {
  const OVERFLOW_COMBOS = product({ count: [4, 6, 10], max: [1, 3, 5] as const });

  for (const combo of OVERFLOW_COMBOS) {
    const id = `avatars=${combo.count}/max=${combo.max}`;

    it(id, async () => {
      const avatars = people(combo.count);
      const el = await mountAvatarGroup({ avatars, max: combo.max });
      const seen = recordEvents(el);

      const button = overflowButton(el);
      const remaining = overflowCount(combo.count, combo.max);
      expect(!!button, `${id} indicator presence`).toBe(remaining > 0);
      if (!button) return;

      click(button);
      await tick(el);

      expect(seen.map(e => e.type), `${id} events`).toEqual(['overflow-click']);
      expect(seen[0].detail.remaining, `${id} remaining`).toBe(remaining);
      // "the N more:" list — the items the indicator stands for, in order.
      expect(seen[0].detail.avatars, `${id} avatars`)
        .toEqual(hiddenItems(avatars, combo.max));
    });
  }

  it('the reported remaining is the same number the button reads', async () => {
    const el = await mountAvatarGroup({ avatars: people(9), max: 4 });
    const seen = recordEvents(el);
    const button = overflowButton(el)!;
    expect(button.textContent?.trim()).toBe('+5');
    click(button);
    await tick(el);
    expect(seen[0].detail.remaining).toBe(5);
  });

  it('clicking an avatar does not also fire overflow-click, and vice versa', async () => {
    const el = await mountAvatarGroup({ avatars: people(6), max: 2 });
    const seen = recordEvents(el);

    click(avatarButtons(el)[0]);
    await tick(el);
    expect(seen.map(e => e.type)).toEqual(['avatar-click']);

    click(overflowButton(el));
    await tick(el);
    expect(seen.map(e => e.type)).toEqual(['avatar-click', 'overflow-click']);
  });
});

const CHILDREN = (count: number) => Array.from({ length: count },
  (_, i) => `<snice-avatar name="Person ${i + 1}"></snice-avatar>`).join('');

const SLOT_COMBOS = product({ count: [1, 3, 5, 8], max: [2, 5, 10] as const });

describe(`avatar-group matrix: declarative mode (${SLOT_COMBOS.length} combos)`, () => {
  for (const combo of SLOT_COMBOS) {
    const id = `children=${combo.count}/max=${combo.max}`;

    it(id, async () => {
      const el = await mountAvatarGroup({ max: combo.max }, CHILDREN(combo.count));
      const remaining = overflowCount(combo.count, combo.max);

      // The children ARE the avatars, so the shadow tree renders a slot rather
      // than avatar buttons of its own.
      expect(avatarButtons(el), `${id} rendered its own avatar buttons`).toHaveLength(0);
      expect(el.querySelectorAll('snice-avatar'), `${id} children`).toHaveLength(combo.count);

      // "Max visible before +N" applies to children too: the ones past `max`
      // are hidden rather than removed, so the author's markup is untouched.
      const shown = [...el.querySelectorAll('snice-avatar')]
        .map(child => (child as HTMLElement).style.display !== 'none');
      expect(shown, `${id} visibility`).toEqual(
        Array.from({ length: combo.count }, (_, i) => i < combo.max),
      );

      expect(!!overflowButton(el), `${id} indicator presence`).toBe(remaining > 0);
      if (remaining > 0) {
        expect(overflowButton(el)!.textContent?.trim(), `${id} indicator text`)
          .toBe(`+${remaining}`);
        expect(overflowButton(el)!.getAttribute('aria-label')).toBe(`${remaining} more`);
      }

      // The base is still the documented group.
      expect(partNames(el), `${id} parts`)
        .toEqual(remaining > 0 ? ['base', 'overflow'] : ['base']);
    });
  }

  it('every child is sized and shaped by the group', async () => {
    const el = await mountAvatarGroup({ size: 'large' }, CHILDREN(3));
    for (const child of el.querySelectorAll('snice-avatar')) {
      expect(child.getAttribute('size')).toBe('large');
      expect(child.getAttribute('shape')).toBe('circle');
    }

    el.size = 'small';
    await tick(el);
    for (const child of el.querySelectorAll('snice-avatar')) {
      expect(child.getAttribute('size')).toBe('small');
    }
  });

  it('overflow-click in declarative mode reports the remaining count', async () => {
    const el = await mountAvatarGroup({ max: 2 }, CHILDREN(5));
    const seen = recordEvents(el);
    click(overflowButton(el));
    await tick(el);

    expect(seen.map(e => e.type)).toEqual(['overflow-click']);
    expect(seen[0].detail.remaining).toBe(3);
    // There are no AvatarGroupItem objects in declarative mode — the avatars
    // are elements the author owns.
    expect(seen[0].detail.avatars).toEqual([]);
  });

  // MATRIX-avatar-group-2 (full write-up in "avatar-group matrix: findings"
  // below): the group's child observer hides a late arrival past `max` but
  // schedules no render, so the `+1` the arithmetic calls for never shows.
  it.fails('MATRIX-avatar-group-2: adding a child later re-runs the same arithmetic', async () => {
    const el = await mountAvatarGroup({ max: 2 }, CHILDREN(2));
    expect(overflowButton(el)).toBeNull();

    el.insertAdjacentHTML('beforeend', '<snice-avatar name="Late Arrival"></snice-avatar>');
    await tick(el);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+1');
    expect([...el.querySelectorAll('snice-avatar')].at(-1)!.style.display).toBe('none');
  });

  it('children take precedence over an assigned avatars array', async () => {
    const el = await mountAvatarGroup({ avatars: people(4), max: 5 }, CHILDREN(2));
    expect(avatarButtons(el), 'the avatars array was rendered alongside the children')
      .toHaveLength(0);
    expect(el.querySelectorAll('snice-avatar')).toHaveLength(2);
  });
});

// ── Findings ────────────────────────────────────────────────────────────────

describe('avatar-group matrix: findings', () => {
  /**
   * MATRIX-avatar-group-2 — a child added after mount is never counted.
   *
   * The group observes its child list (snice-avatar-group.ts re-runs
   * `detectMode()` from a MutationObserver) and that pass hides the new child
   * past `max`, but it schedules no render, so the "+1" the documented
   * arithmetic (docs/components/avatar-group.md lines 6 and 23) calls for
   * never appears. Separately observable from MATRIX-avatar-group-1: fixing
   * only the mount-time ordering would still leave a late child uncounted.
   */
  it('MATRIX-avatar-group-2 reproduces: the late child is hidden but never counted', async () => {
    const el = await mountAvatarGroup({ max: 2 }, CHILDREN(2));
    el.insertAdjacentHTML('beforeend', '<snice-avatar name="Late Arrival"></snice-avatar>');
    await tick(el);
    // The observer's pass happened — the child past `max` is hidden…
    expect([...el.querySelectorAll('snice-avatar')].at(-1)!.style.display).toBe('none');
    // …but no render was scheduled, so the "+1" is missing.
    expect(overflowButton(el)).toBeNull();
  });
});
