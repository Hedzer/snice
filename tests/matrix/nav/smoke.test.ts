/**
 * Smoke slice of the snice-nav matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/nav, 156 combos) is excluded from
 * the default Vitest include and runs via `npm run test:matrix`. This file
 * lives at `smoke.test.ts` so it stays collected, and it is the standing
 * cost the everyday loop pays for this component.
 *
 * Marquee combos only — one per structure the matrix is built around:
 *   · flat, the default shape everything else is a variation of;
 *   · hierarchical and grouped, because each builds a DIFFERENT container
 *     around the same link and a change to one is routinely forgotten in the
 *     others;
 *   · the reflection of `orientation` / `active-style`, the two documented
 *     dimensions that exist ONLY as `:host([…])` CSS and would otherwise be
 *     invisible to a DOM test;
 *   · a route change through `update()`, the component's whole reason to exist;
 *   · an async guard resolving, the one asynchronous contract it has.
 *
 * Every assertion routes through the matrix's own oracle, so this file cannot
 * drift into something weaker than the suite it stands in for.
 * BUDGET: well under 1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait, SETTLE } from '../matrix-kit';
import { expectClean } from '../matrix-kit';
import {
  DATASETS, checkNav, linkEls, mountNav, navComboId,
  type NavCombo, type NavElement,
} from './nav-utils';

let nav: NavElement | null = null;
afterEach(() => { if (nav) { removeComponent(nav); nav = null; } });

const combo = (over: Partial<NavCombo> = {}): NavCombo => ({
  variant: 'flat', orientation: 'horizontal', activeStyle: 'fill', dataset: 'flat', ...over,
});

describe('nav matrix smoke', () => {
  it('a flat nav renders one link per placard, in order, with the active one current', async () => {
    const c = combo({ route: 'products' });
    nav = await mountNav(c);
    expectClean(checkNav(nav, c), navComboId(c));
  });

  it('a hierarchical nav nests children under the placard they name', async () => {
    const c = combo({ variant: 'hierarchical', dataset: 'nested', route: 'products/electronics' });
    nav = await mountNav(c);
    expectClean(checkNav(nav, c), navComboId(c));
  });

  it('a grouped nav labels every non-default bucket', async () => {
    const c = combo({ variant: 'grouped', dataset: 'grouped' });
    nav = await mountNav(c);
    expectClean(checkNav(nav, c), navComboId(c));
  });

  it('orientation and active-style reach the host, where the CSS keys off them', async () => {
    const c = combo({ orientation: 'vertical', activeStyle: 'text', dataset: 'rich' });
    nav = await mountNav(c);
    expectClean(checkNav(nav, c), navComboId(c));
    expect(nav.getAttribute('orientation')).toBe('vertical');
    expect(nav.getAttribute('active-style')).toBe('text');
  });

  it('a route change moves aria-current without replacing the link nodes', async () => {
    const c = combo({ route: 'home' });
    nav = await mountNav(c);
    const before = linkEls(nav);
    nav.update(DATASETS.flat, undefined, 'products');
    await wait(SETTLE);
    expectClean(checkNav(nav, { ...c, route: 'products' }), 'smoke/route-change');
    expect(linkEls(nav)).toEqual(before);
  });

  it('an async guard hides its item until it resolves true', async () => {
    let resolve!: (ok: boolean) => void;
    const promise = new Promise<boolean>(res => { resolve = res; });
    const c = combo({ dataset: 'empty' });
    nav = await mountNav(c, { appContext: { user: {} } });
    nav.update([
      { name: 'home', title: 'Home', href: '#/', order: 0 },
      { name: 'billing', title: 'Billing', href: '#/billing', order: 1, visibleOn: (() => promise) as any },
    ], { user: {} }, '');
    await wait(SETTLE);

    const billing = () => linkEls(nav!).find(l => l.textContent?.includes('Billing'))!
      .closest('.nav__item, .nav__group')!;
    expect(billing().hasAttribute('hidden'), 'a pending guard left its item visible').toBe(true);

    resolve(true);
    await wait(SETTLE);
    expect(billing().hasAttribute('hidden'), 'a resolved guard left its item hidden').toBe(false);
  });
});
