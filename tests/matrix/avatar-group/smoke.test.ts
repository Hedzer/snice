/**
 * Smoke slice of the snice-avatar-group matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/avatar-group, 122 tests across the overflow
 * arithmetic, the item shape, the style axes, and the two events) is excluded
 * from the default Vitest include and runs via `npm run test:matrix`. This
 * file lives at `smoke.test.ts` so it stays collected, and it is the standing
 * cost the everyday loop pays for this component.
 *
 * Marquee combos only — one per family of the matrix:
 *   · the overflow arithmetic's boundaries: exactly `max`, one past it, far
 *     past it under the documented default max;
 *   · every documented item shape at once (image, given initials,
 *     name-derived, custom color, anonymous);
 *   · the style axes: the `size` attribute and the `overlap` custom property;
 *   · both events, including the button-text/event-detail agreement;
 *   · declarative mode's working behavior: sizing and `avatars` precedence;
 *   · the two pinned findings.
 *
 * Every assertion routes through the matrix's own oracle, so this file cannot
 * drift into something weaker than the suite it stands in for.
 * BUDGET: well under 1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, click, unmountAll } from '../matrix-utils';
import {
  ITEM_SHAPES, mountAvatarGroup, expectedShape, readShape,
  expectedAxes, readAxes, avatarButtons, overflowButton,
  people, recordEvents, tick, hiddenItems,
} from './avatar-group-support';
import '../../../packages/components/src/avatar-group/snice-avatar-group';
import '../../../packages/components/src/avatar/snice-avatar';

afterEach(() => { unmountAll(); });

const CHILDREN = (count: number) => Array.from({ length: count },
  (_, i) => `<snice-avatar name="Person ${i + 1}"></snice-avatar>`).join('');

describe('avatar-group matrix smoke', () => {
  it('exactly max avatars shows all of them and no indicator', async () => {
    const vector = { avatars: people(3), max: 3 };
    const el = await mountAvatarGroup(vector);
    expectShape(readShape(el), expectedShape(vector), 'shape');
    expect(overflowButton(el)).toBeNull();
  });

  it('one past max shows max avatars and "+1"', async () => {
    const el = await mountAvatarGroup({ avatars: people(4), max: 3 });
    expect(avatarButtons(el)).toHaveLength(3);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+1');
  });

  it('far past max shows the documented default max and "+N"', async () => {
    const vector = { avatars: people(9) }; // default max = 5
    const el = await mountAvatarGroup(vector);
    expectShape(readShape(el), expectedShape(vector), 'shape');
    expect(overflowButton(el)?.textContent?.trim()).toBe('+4');
  });

  it('every documented item shape renders its own content', async () => {
    const vector = { avatars: Object.values(ITEM_SHAPES), max: 5 };
    const el = await mountAvatarGroup(vector);
    expectShape(readShape(el), expectedShape(vector), 'shape');
  });

  it('the style axes land as the attribute and the custom property', async () => {
    const vector = { avatars: people(2), size: 'large' as const, overlap: 16 };
    const el = await mountAvatarGroup(vector);
    expectShape(readAxes(el), expectedAxes(vector), 'axes');
  });

  it('avatar-click reports the author\'s item and index', async () => {
    const avatars = people(4);
    const el = await mountAvatarGroup({ avatars, max: 4 });
    const seen = recordEvents(el);
    click(avatarButtons(el)[2]);
    await tick(el);
    expect(seen[0].detail.index).toBe(2);
    expect(seen[0].detail.avatar).toBe(avatars[2]);
  });

  it('overflow-click reports the same N the button reads and the items behind it', async () => {
    const avatars = people(7);
    const el = await mountAvatarGroup({ avatars, max: 2 });
    const seen = recordEvents(el);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+5');
    click(overflowButton(el));
    await tick(el);
    expect(seen[0].detail.remaining).toBe(5);
    expect(seen[0].detail.avatars).toEqual(hiddenItems(avatars, 2));
  });

  it('declarative children are sized and shaped by the group', async () => {
    const el = await mountAvatarGroup({ size: 'small' }, CHILDREN(2));
    for (const child of el.querySelectorAll('snice-avatar')) {
      expect(child.getAttribute('size')).toBe('small');
      expect(child.getAttribute('shape')).toBe('circle');
    }
  });

  it('declarative children take precedence over an assigned avatars array', async () => {
    const el = await mountAvatarGroup({ avatars: people(4), max: 5 }, CHILDREN(2));
    expect(avatarButtons(el)).toHaveLength(0);
    expect(el.querySelectorAll('snice-avatar')).toHaveLength(2);
  });

  // MATRIX-avatar-group-1: declarative mode paints no <slot> and no +N at
  // mount — full write-up in avatar-group-events-and-slot.test.ts.
  it.fails('MATRIX-avatar-group-1: a declarative group past max shows its "+N"', async () => {
    const el = await mountAvatarGroup({ max: 2 }, CHILDREN(5));
    expect(overflowButton(el)?.textContent?.trim()).toBe('+3');
  });

  // MATRIX-avatar-group-2: a child added after mount is hidden but the
  // indicator arithmetic never re-runs.
  it.fails('MATRIX-avatar-group-2: a child added later is counted', async () => {
    const el = await mountAvatarGroup({ max: 2 }, CHILDREN(2));
    el.insertAdjacentHTML('beforeend', '<snice-avatar name="Late"></snice-avatar>');
    await tick(el);
    expect(overflowButton(el)?.textContent?.trim()).toBe('+1');
  });

  it('the two findings reproduce exactly as recorded', async () => {
    const atMount = await mountAvatarGroup({ max: 2 }, CHILDREN(5));
    expect(atMount.shadowRoot!.querySelector('slot')).toBeNull();
    expect(overflowButton(atMount)).toBeNull();

    const late = await mountAvatarGroup({ max: 2 }, CHILDREN(2));
    late.insertAdjacentHTML('beforeend', '<snice-avatar name="Late"></snice-avatar>');
    await tick(late);
    expect([...late.querySelectorAll('snice-avatar')].at(-1)!.style.display).toBe('none');
    expect(overflowButton(late)).toBeNull();
  });
});
