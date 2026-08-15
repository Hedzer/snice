/**
 * Smoke slice of the snice-banner matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full 32-combo cross and the lifecycle suite run via
 * `npm run test:matrix`. This file lives at `smoke.test.ts` so it stays
 * collected.
 *
 * The subset: the default banner, one non-info variant, the icon slot override,
 * the action and close buttons, the open/close event pair, and the marquee
 * finding the matrix pinned. Every structural assertion routes through the
 * matrix's own oracle. Budget: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, makeBanner, bannerProblems, partsNamed, wait, type BannerCombo,
} from './banner-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combo = (over: Partial<BannerCombo> = {}): BannerCombo => ({
  id: 'smoke',
  variant: DEFAULTS.variant,
  position: DEFAULTS.position,
  dismissible: DEFAULTS.dismissible,
  actionText: '',
  iconMode: 'default',
  message: 'This is an info message',
  label: '',
  open: false,
  ...over,
} as BannerCombo);

const click = (node: Element | undefined) => node?.dispatchEvent(
  new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));

describe('banner matrix smoke', () => {
  it('the default banner is info, closed and dismissible', async () => {
    const c = combo();
    el = await makeBanner(c);
    // `allow: ['role']` covers MATRIX-banner-1 only; it is asserted in full by
    // the dedicated failing test at the bottom of this file.
    expect(bannerProblems(el, c, { allow: ['role'] })).toEqual([]);
  });

  it('each variant labels its own region and paints its own class', async () => {
    const c = combo({ variant: 'error', open: true, position: 'bottom' });
    el = await makeBanner(c);
    expect(bannerProblems(el, c, { allow: ['role'] })).toEqual([]);
  });

  it('an icon slot overrides the default variant icon', async () => {
    const c = combo({ variant: 'success', iconMode: 'slot', open: true });
    el = await makeBanner(c);
    expect(bannerProblems(el, c, { allow: ['role'] })).toEqual([]);
  });

  it('action-text adds the action button; dismissible=false removes the close button', async () => {
    const c = combo({ actionText: 'Update Now', dismissible: false, open: true });
    el = await makeBanner(c);
    expect(bannerProblems(el, c, { allow: ['role'] })).toEqual([]);
  });

  it('show()/hide() reflect `open` and fire the documented events', async () => {
    el = await makeBanner(combo());
    const seen: string[] = [];
    for (const type of ['banner-open', 'banner-close']) {
      el.addEventListener(type, () => seen.push(type));
    }
    el.show();
    await wait(20);
    expect(el.hasAttribute('open')).toBe(true);
    click(partsNamed(el, 'close')[0]);
    await wait(20);
    expect(el.hasAttribute('open')).toBe(false);
    expect(seen).toEqual(['banner-open', 'banner-close']);
  });

  // MATRIX-banner-1: the container is role="region", documented as role="alert".
  it.fails('MATRIX-banner-1: the banner container is role="alert"', async () => {
    const c = combo({ open: true });
    el = await makeBanner(c);
    expect(bannerProblems(el, c)).toEqual([]);
  });
});
