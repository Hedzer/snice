/**
 * Smoke slice of the snice-avatar matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full 36-combo avatar cross runs via
 * `npm run test:matrix`. This file lives at `smoke.test.ts` so it stays
 * collected, and it is the standing cost the everyday loop pays for this
 * component.
 *
 * The subset: one combo per feature family — the image path, the initials
 * fallback, the icon fallback, the broken-image recovery, the size/shape
 * reflection contract, the colour override — plus the marquee broken-image
 * recovery regression the matrix guards. Every assertion routes through the matrix's own oracle, so
 * this file cannot drift into something weaker than the suite it stands in for.
 * Budget: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, makeAvatar, avatarProblems, wait, type AvatarCombo,
} from './avatar-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combo = (over: Partial<AvatarCombo> = {}): AvatarCombo =>
  ({ id: 'smoke', ...DEFAULTS, ...over } as AvatarCombo);

const SRC = '/fixtures/user.jpg';

describe('avatar matrix smoke', () => {
  it('an avatar with no name or src shows the default person icon', async () => {
    const c = combo();
    el = await makeAvatar(c);
    expect(avatarProblems(el, c)).toEqual([]);
  });

  it('a named avatar shows its documented initials and an auto colour', async () => {
    const c = combo({ name: 'John Doe' });
    el = await makeAvatar(c);
    expect(avatarProblems(el, c)).toEqual([]);
  });

  it('a src renders the img with alt falling back to the name', async () => {
    const c = combo({ src: SRC, name: 'Ada Lovelace', loading: 'eager' });
    el = await makeAvatar(c);
    expect(avatarProblems(el, c)).toEqual([]);
  });

  it('a broken image falls back to the initials', async () => {
    const c = combo({ src: SRC, name: 'Ada Lovelace', broken: true });
    el = await makeAvatar(c);
    expect(avatarProblems(el, c)).toEqual([]);
  });

  it('size and shape reflect to the attributes the stylesheet keys off', async () => {
    const c = combo({ size: 'xxl', shape: 'square', name: 'Grace Hopper' });
    el = await makeAvatar(c);
    expect(avatarProblems(el, c)).toEqual([]);
  });

  it('fallback-background overrides the auto colour and pins both custom properties', async () => {
    const c = combo({
      name: 'Custom', fallbackBackground: 'rgb(59, 130, 246)', fallbackColor: 'rgb(17, 24, 39)',
    });
    el = await makeAvatar(c);
    expect(avatarProblems(el, c)).toEqual([]);
  });

  it('a new src after a failure is shown', async () => {
    el = await makeAvatar({ name: 'Ada Lovelace', src: SRC, broken: true });
    el.src = '/fixtures/other.jpg';
    await wait(20);
    // happy-dom never fetches: the working URL's load event is dispatched by
    // hand, the counterpart of the error event makeAvatar fired for the 404.
    el.shadowRoot?.querySelector('img')?.dispatchEvent(new Event('load'));
    await wait(20);
    expect(avatarProblems(el, combo({ name: 'Ada Lovelace', src: '/fixtures/other.jpg' }),
      { fresh: false })).toEqual([]);
  });
});
