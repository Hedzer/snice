/**
 * <snice-nav> routing matrix: which item is announced as the current page.
 *
 * The documented contract is one line — "`aria-current="page"` on active item"
 * — but "active" is a function of the route string the host passes to
 * `update(placards, appContext?, currentRoute?, routeParams?)`, and the doc's
 * own examples pass `'home'` for a placard named `home` whose href is `#/`.
 * The oracle in `nav-utils.ts` encodes exactly that: a route names a placard,
 * a descendant route (`products/electronics`) keeps its ancestor current, and
 * the root route selects `home`.
 *
 * The cross is route x variant x dataset (7 x 3 x 2 = 42), because the three
 * variants place the active link in three different structures — a flat item,
 * a hierarchical group's parent link or submenu item, a grouped bucket — and a
 * variant that forgets `aria-current` in one of them is not visible from the
 * others.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { expectClean, removeComponent, wait, SETTLE } from '../matrix-kit';
import {
  DATASETS, VARIANTS, checkNav, isActive, linkEls, mountNav, navComboId,
  type DatasetName, type NavCombo, type NavElement,
} from './nav-utils';

let nav: NavElement | null = null;
afterEach(() => { if (nav) { removeComponent(nav); nav = null; } });

/**
 * The routes an application actually produces: nothing yet, the root in both
 * spellings, a top-level page, a nested page, a leading-slash page, and a route
 * that matches no placard at all.
 */
const ROUTES = ['', '/', 'home', 'products', 'products/electronics', '/products', 'nowhere'];
const ROUTED_DATASETS: DatasetName[] = ['flat', 'nested'];

describe('nav matrix: route vectors', () => {
  for (const variant of VARIANTS) {
    for (const dataset of ROUTED_DATASETS) {
      for (const route of ROUTES) {
        const combo: NavCombo = {
          variant, orientation: 'horizontal', activeStyle: 'fill', dataset, route,
        };
        it(`renders ${navComboId(combo)}`, async () => {
          nav = await mountNav(combo);
          expectClean(checkNav(nav, combo), navComboId(combo));
        });
      }
    }
  }
});

describe('nav matrix: route transitions', () => {
  // `update()` is documented as THE way to change the nav, and the component
  // exists to be re-called on every route change. Each step is judged by the
  // same oracle, so a diffing renderer that leaves a stale `aria-current`
  // behind fails here rather than in production.
  for (const variant of VARIANTS) {
    it(`${variant} moves aria-current across successive update() calls`, async () => {
      const combo: NavCombo = {
        variant, orientation: 'vertical', activeStyle: 'text', dataset: 'nested', route: '',
      };
      nav = await mountNav(combo);
      for (const route of ['products', 'products/electronics', 'support', 'nowhere', '']) {
        nav.update(DATASETS.nested, undefined, route);
        await wait(SETTLE);
        expectClean(checkNav(nav, { ...combo, route }), `${variant}/transition -> "${route}"`);
      }
    });
  }

  it('re-updating with the same route reuses the existing link nodes', async () => {
    // The component's own contract for the diff path: "avoid flash on route
    // changes". A rebuild that replaces every node on an identical update is
    // the flash the diff exists to prevent.
    const combo: NavCombo = {
      variant: 'flat', orientation: 'horizontal', activeStyle: 'fill',
      dataset: 'flat', route: 'products',
    };
    nav = await mountNav(combo);
    const before = linkEls(nav);
    nav.update(DATASETS.flat, undefined, 'products');
    await wait(SETTLE);
    const after = linkEls(nav);
    expect(after.length).toBe(before.length);
    after.forEach((link, i) => {
      expect(link, `link[${i}] was replaced by an identical update()`).toBe(before[i]);
    });
  });

  it('update() without a route argument keeps the route it already had', async () => {
    // `currentRoute?` is optional in the documented signature, so omitting it
    // is "no change", not "clear it".
    const combo: NavCombo = {
      variant: 'flat', orientation: 'horizontal', activeStyle: 'fill',
      dataset: 'flat', route: 'products',
    };
    nav = await mountNav(combo);
    nav.update(DATASETS.flat);
    await wait(SETTLE);
    expectClean(checkNav(nav, combo), 'flat/route-omitted');
  });
});

describe('nav matrix: the active predicate itself', () => {
  // The oracle's `isActive` is the doc's rule written down. Pinning it against
  // the placard sets keeps the oracle honest: if this table is ever "fixed" to
  // match a component change, the change shows up here first.
  const CASES: Array<[string, string, boolean]> = [
    ['home', 'home', true],
    ['home', '/', true],
    ['home', '', true],
    ['products', 'products', true],
    ['products', 'products/electronics', true],
    ['products', '/products', true],
    ['products', 'product', false],
    ['products', 'nowhere', false],
    ['electronics', 'products/electronics', false],
    ['home', 'homepage', false],
  ];
  for (const [name, route, want] of CASES) {
    it(`"${name}" is ${want ? '' : 'not '}active on route "${route}"`, () => {
      expect(isActive({ name, title: name }, route)).toBe(want);
    });
  }
});
