/**
 * snice-avatar matrix — TRANSITIONS.
 *
 * The generated cross builds each combo once. This file crosses the documented
 * property changes an avatar actually undergoes at runtime (a src arriving, an
 * image failing, a name changing, a colour override being cleared) and asserts
 * the element that comes out the other side is indistinguishable from one built
 * that way in the first place. Same oracle, `fresh: false` — a settled element
 * may carry an attribute for a value that happens to equal the default, but the
 * attribute must still be HONEST.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, makeAvatar, avatarProblems, expectedInitials, wait,
  type AvatarCombo,
} from './avatar-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combo = (over: Partial<AvatarCombo> = {}): AvatarCombo =>
  ({ id: 'transition', ...DEFAULTS, ...over } as AvatarCombo);

const SRC = '/fixtures/user.jpg';

/** The name-derived auto-colour class on part="base", per the docs. */
function classOf(el: any): string | undefined {
  const base = el.shadowRoot.querySelector('[part~="base"]') as Element;
  return (base.getAttribute('class') ?? '').split(/\s+/).find(c => c.startsWith('avatar--'));
}

async function fail(el: any): Promise<void> {
  el.shadowRoot?.querySelector('img')?.dispatchEvent(new Event('error'));
  await wait(20);
}

describe('avatar matrix: transitions', () => {
  it('a src arriving after mount swaps the fallback for the image', async () => {
    el = await makeAvatar({ name: 'John Doe' });
    expect(avatarProblems(el, combo({ name: 'John Doe' }))).toEqual([]);
    el.src = SRC;
    await wait(20);
    expect(avatarProblems(el, combo({ name: 'John Doe', src: SRC }), { fresh: false }))
      .toEqual([]);
  });

  it('a src cleared after mount restores the initials fallback', async () => {
    el = await makeAvatar({ name: 'John Doe', src: SRC });
    el.src = '';
    await wait(20);
    expect(avatarProblems(el, combo({ name: 'John Doe' }), { fresh: false })).toEqual([]);
  });

  it('a broken image falls back to the initials', async () => {
    el = await makeAvatar({ name: 'Ada Lovelace', src: SRC });
    await fail(el);
    expect(avatarProblems(el, combo({ name: 'Ada Lovelace', src: SRC, broken: true }),
      { fresh: false })).toEqual([]);
  });

  it('a broken image with no name falls back to the person icon', async () => {
    el = await makeAvatar({ src: SRC });
    await fail(el);
    expect(avatarProblems(el, combo({ src: SRC, broken: true }), { fresh: false })).toEqual([]);
  });

  it('a NEW src after a failure is given a fresh chance to load', async () => {
    el = await makeAvatar({ name: 'Ada Lovelace', src: SRC });
    await fail(el);
    el.src = '/fixtures/other.jpg';
    await wait(20);
    // happy-dom never fetches: stand in for the working URL's load event the
    // same way `fail` stands in for the old one's error event. The component's
    // handleImageLoad clears the error state, so the replacement image shows.
    el.shadowRoot?.querySelector('img')?.dispatchEvent(new Event('load'));
    await wait(20);
    expect(avatarProblems(el,
      combo({ name: 'Ada Lovelace', src: '/fixtures/other.jpg' }), { fresh: false })).toEqual([]);
  });

  it('a name change re-derives the initials and the auto colour', async () => {
    el = await makeAvatar({ name: 'John Doe' });
    const first = classOf(el);
    el.name = 'Zoe Quinn';
    await wait(20);
    expect(avatarProblems(el, combo({ name: 'Zoe Quinn' }), { fresh: false })).toEqual([]);
    const second = classOf(el);
    // "--avatar-bg — Background color (auto-generated from name)": a different
    // name is allowed to hash to the same bucket, but the INITIALS must change.
    expect(el.shadowRoot.querySelector('[part~="fallback"]').textContent.trim())
      .toBe(expectedInitials('Zoe Quinn'));
    expect(typeof first === 'string' && typeof second === 'string').toBe(true);
  });

  it('the auto colour is deterministic for a given name', async () => {
    // Documented as "auto-generated from name" — a colour that changed between
    // renders would flicker on every unrelated property change.
    el = await makeAvatar({ name: 'Grace Hopper' });
    const before = el.shadowRoot.querySelector('[part~="base"]').className;
    el.size = 'large';
    await wait(20);
    const after = el.shadowRoot.querySelector('[part~="base"]').className;
    const colourOf = (cls: string) =>
      cls.split(/\s+/).find(c => c.startsWith('avatar--'));
    expect(colourOf(after)).toBe(colourOf(before));
  });

  it('clearing fallback-background releases --avatar-bg and restores the auto colour', async () => {
    el = await makeAvatar({ name: 'John Doe', fallbackBackground: 'rgb(59, 130, 246)' });
    el.fallbackBackground = '';
    await wait(20);
    expect(avatarProblems(el, combo({ name: 'John Doe' }), { fresh: false })).toEqual([]);
  });

  it('size and shape changes keep reflecting through the whole documented range', async () => {
    el = await makeAvatar({ name: 'John Doe' });
    for (const size of ['xs', 'xxl', 'small', 'large'] as const) {
      for (const shape of ['square', 'rounded', 'circle'] as const) {
        el.size = size;
        el.shape = shape;
        await wait(20);
        expect(avatarProblems(el, combo({ name: 'John Doe', size, shape }), { fresh: false }),
          `${size}/${shape}`).toEqual([]);
      }
    }
  });
});
