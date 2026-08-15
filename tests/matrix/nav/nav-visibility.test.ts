/**
 * <snice-nav> visibility matrix: `show`, `visibleOn`, and the context path.
 *
 * Documented behaviour (docs/ai/components/nav.md + the Placard contract):
 *
 *   · `show: false` keeps a page out of navigation menus entirely.
 *   · `visibleOn` is a guard, or an array of guards, called with the app
 *     context: "Sync conditional visibility".
 *   · "Async visibility — hidden until resolves true; silent on false/reject".
 *     So an async guard's item must not be announced while pending, must appear
 *     once it resolves true, and must vanish — with no error surfacing — on
 *     false or rejection.
 *   · `isTopLevel` (attr `is-top-level`) makes the nav "receive context
 *     updates" instead of being driven by explicit `update()` calls.
 *
 * The cross here is guard-shape x variant: every variant places its items in a
 * different container, and the component's guard resolution flips `hidden` on
 * the container it found for that variant — a variant whose lookup misses
 * leaves a pending item permanently invisible.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { expectClean, removeComponent, wait, SETTLE } from '../matrix-kit';
import {
  VARIANTS, checkNav, linkEls, mountNav,
  type NavCombo, type NavElement,
} from './nav-utils';
import type { Placard } from '../../../packages/core/src/types/placard';

let nav: NavElement | null = null;
afterEach(() => { if (nav) { removeComponent(nav); nav = null; } });

const CONTEXT = { user: { isAdmin: true, name: 'Ada' } };

/** "the host never supplied a context", distinct from "argument omitted". */
const NO_CONTEXT = Symbol('no app context');

/** The titles the nav is currently announcing, in order. */
function announced(el: NavElement): string[] {
  return linkEls(el)
    .filter(link => {
      const item = link.closest('.nav__item, .nav__group');
      return !item?.hasAttribute('hidden') && item?.getAttribute('aria-hidden') !== 'true';
    })
    .map(link => (link.querySelector('.nav__label')?.textContent ?? '').trim());
}

const BASE: Placard[] = [
  { name: 'home', title: 'Home', href: '#/', order: 0 },
  { name: 'reports', title: 'Reports', href: '#/reports', order: 2 },
];

function withGuard(guard: Placard['visibleOn']): Placard[] {
  return [
    BASE[0],
    { name: 'admin', title: 'Admin', href: '#/admin', order: 1, visibleOn: guard },
    BASE[1],
  ];
}

async function mountGuarded(
  variant: NavCombo['variant'],
  placards: Placard[],
  appContext: any = CONTEXT,
): Promise<NavElement> {
  const combo: NavCombo = {
    variant, orientation: 'horizontal', activeStyle: 'fill', dataset: 'empty',
  };
  const ctx = appContext === NO_CONTEXT ? undefined : appContext;
  const el = await mountNav(combo, { appContext: ctx });
  el.update(placards, ctx, '');
  await wait(SETTLE);
  return el;
}

describe('nav matrix: show flag', () => {
  for (const variant of VARIANTS) {
    it(`${variant} drops a placard with show: false`, async () => {
      nav = await mountGuarded(variant, [
        BASE[0],
        { name: 'secret', title: 'Secret', href: '#/secret', order: 1, show: false },
        BASE[1],
      ]);
      expect(announced(nav)).toEqual(['Home', 'Reports']);
    });

    it(`${variant} keeps a placard with show: true`, async () => {
      nav = await mountGuarded(variant, [
        BASE[0],
        { name: 'shown', title: 'Shown', href: '#/shown', order: 1, show: true },
        BASE[1],
      ]);
      expect(announced(nav)).toEqual(['Home', 'Shown', 'Reports']);
    });
  }
});

describe('nav matrix: sync guards', () => {
  const SYNC: Array<[string, Placard['visibleOn'], boolean]> = [
    ['a guard returning true', (() => true) as any, true],
    ['a guard returning false', (() => false) as any, false],
    ['every guard in an array true', [(() => true), (() => true)] as any, true],
    ['one guard in an array false', [(() => true), (() => false)] as any, false],
    ['a context-reading guard that passes', ((ctx: any) => !!ctx.user?.isAdmin) as any, true],
    ['a context-reading guard that fails', ((ctx: any) => ctx.user?.name === 'Nobody') as any, false],
  ];

  for (const variant of VARIANTS) {
    for (const [label, guard, visible] of SYNC) {
      it(`${variant}: ${label} ${visible ? 'shows' : 'hides'} the item`, async () => {
        nav = await mountGuarded(variant, withGuard(guard));
        expect(announced(nav)).toEqual(
          visible ? ['Home', 'Admin', 'Reports'] : ['Home', 'Reports'],
        );
      });
    }
  }

  it('a guard receives the app context and the route params', async () => {
    const seen: Array<[any, any]> = [];
    const placards = withGuard(((ctx: any, params: any) => {
      seen.push([ctx, params]);
      return true;
    }) as any);
    const combo: NavCombo = {
      variant: 'flat', orientation: 'horizontal', activeStyle: 'fill', dataset: 'empty',
    };
    nav = await mountNav(combo, { appContext: CONTEXT, routeParams: { id: '7' } });
    nav.update(placards, CONTEXT, 'admin', { id: '7' });
    await wait(SETTLE);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1][0]).toEqual(CONTEXT);
    expect(seen[seen.length - 1][1]).toEqual({ id: '7' });
  });

  it('a guard is ignored entirely when no app context was supplied', async () => {
    // A guard cannot be evaluated without the context it is given, so the
    // documented default is to show the page rather than to hide it.
    // NO_CONTEXT, not `undefined`: passing `undefined` to `mountGuarded` would
    // select its default parameter and quietly hand the nav a context after all.
    nav = await mountGuarded('flat', withGuard((() => false) as any), NO_CONTEXT);
    expect(announced(nav)).toEqual(['Home', 'Admin', 'Reports']);
  });
});

describe('nav matrix: async guards', () => {
  /** A guard whose promise this test controls. */
  function deferred(): { guard: any; resolve: (ok: boolean) => void; reject: () => void } {
    let resolve!: (ok: boolean) => void;
    let reject!: () => void;
    const promise = new Promise<boolean>((res, rej) => {
      resolve = res;
      reject = () => rej(new Error('guard rejected'));
    });
    // A rejection this test creates must never become an unhandled rejection
    // just because the component has not attached its handler yet.
    promise.catch(() => {});
    return { guard: () => promise, resolve, reject };
  }

  for (const variant of VARIANTS) {
    it(`${variant}: a pending guard's item is not announced`, async () => {
      const { guard } = deferred();
      nav = await mountGuarded(variant, withGuard(guard));
      expect(announced(nav)).toEqual(['Home', 'Reports']);
      // "hidden until resolves true" — hidden, not absent: the node is there,
      // marked so assistive technology skips it.
      const admin = linkEls(nav).find(l => l.textContent?.includes('Admin'));
      expect(admin, 'the pending item rendered no node at all').toBeTruthy();
      const item = admin!.closest('.nav__item, .nav__group');
      expect(item?.hasAttribute('hidden')).toBe(true);
      expect(item?.getAttribute('aria-hidden')).toBe('true');
    });

    it(`${variant}: resolving true reveals the item in place`, async () => {
      const { guard, resolve } = deferred();
      nav = await mountGuarded(variant, withGuard(guard));
      resolve(true);
      await wait(SETTLE);
      expect(announced(nav)).toEqual(['Home', 'Admin', 'Reports']);
    });

    it(`${variant}: resolving false removes the item silently`, async () => {
      const { guard, resolve } = deferred();
      nav = await mountGuarded(variant, withGuard(guard));
      resolve(false);
      await wait(SETTLE);
      expect(announced(nav)).toEqual(['Home', 'Reports']);
      expect(linkEls(nav).some(l => l.textContent?.includes('Admin'))).toBe(false);
    });

    it(`${variant}: a rejected guard removes the item silently`, async () => {
      const errors: any[] = [];
      const onError = (event: any) => errors.push(event);
      window.addEventListener('unhandledrejection', onError);
      try {
        const { guard, reject } = deferred();
        nav = await mountGuarded(variant, withGuard(guard));
        reject();
        await wait(SETTLE);
        expect(announced(nav)).toEqual(['Home', 'Reports']);
        expect(errors, 'a rejected guard surfaced an error').toEqual([]);
      } finally {
        window.removeEventListener('unhandledrejection', onError);
      }
    });
  }

  it('a guard resolving after the nav re-rendered does not resurrect its item', async () => {
    // The component stamps each render with a token precisely so a late guard
    // cannot mutate a tree that no longer exists. A stale resolution that flips
    // `hidden` off would announce a page the current placard set does not have.
    const { guard, resolve } = deferred();
    nav = await mountGuarded('flat', withGuard(guard));
    nav.update(BASE, CONTEXT, '');
    await wait(SETTLE);
    resolve(true);
    await wait(SETTLE);
    expect(announced(nav)).toEqual(['Home', 'Reports']);
  });
});

describe('nav matrix: structure survives guard resolution', () => {
  // The full oracle, not just the announced titles: a revealed item must carry
  // every documented link attribute, in every variant.
  for (const variant of VARIANTS) {
    it(`${variant} renders a fully-formed link once its guard resolves`, async () => {
      let resolve!: (ok: boolean) => void;
      const promise = new Promise<boolean>(res => { resolve = res; });
      const placards: Placard[] = [
        { name: 'home', title: 'Home', href: '#/', order: 0 },
        {
          name: 'billing', title: 'Billing', href: '#/billing', order: 1,
          description: 'Invoices and payments', icon: '💳',
          visibleOn: (() => promise) as any,
        },
      ];
      nav = await mountGuarded(variant, placards);
      resolve(true);
      await wait(SETTLE);

      const billing = linkEls(nav).find(l => l.textContent?.includes('Billing'))!;
      expect(billing.getAttribute('href')).toBe('#/billing');
      expect(billing.getAttribute('aria-label')).toBe('Invoices and payments');
      expect(billing.getAttribute('title')).toBe('Invoices and payments');
      expect(billing.querySelector('[part~="icon"]')?.tagName.toLowerCase()).toBe('span');
    });
  }
});

describe('nav matrix: is-top-level', () => {
  it('is-top-level reflects to the host attribute', async () => {
    const combo: NavCombo = {
      variant: 'flat', orientation: 'horizontal', activeStyle: 'fill', dataset: 'flat',
    };
    nav = await mountNav(combo);
    nav.isTopLevel = true;
    await wait(SETTLE);
    expect(nav.hasAttribute('is-top-level')).toBe(true);
  });

  it('a nav that is not top-level ignores a context broadcast', async () => {
    // "is-top-level — receive context updates": without it, the nav is driven
    // only by explicit `update()` calls, so a context arriving from elsewhere
    // must not replace the placards its host gave it.
    const combo: NavCombo = {
      variant: 'flat', orientation: 'horizontal', activeStyle: 'fill', dataset: 'flat',
    };
    nav = await mountNav(combo);
    (nav as any).handleContext?.({
      navigation: { placards: [{ name: 'x', title: 'Injected', href: '#/x' }], route: 'x', params: {} },
      application: CONTEXT,
    });
    await wait(SETTLE);
    expectClean(checkNav(nav, combo), 'flat/context-ignored');
  });

  it('a top-level nav takes its placards, route and params from the context', async () => {
    const combo: NavCombo = {
      variant: 'flat', orientation: 'horizontal', activeStyle: 'fill', dataset: 'empty',
    };
    nav = await mountNav(combo);
    nav.isTopLevel = true;
    await wait(SETTLE);
    (nav as any).handleContext({
      navigation: {
        placards: [
          { name: 'home', title: 'Home', href: '#/', order: 0 },
          { name: 'reports', title: 'Reports', href: '#/reports', order: 1 },
        ],
        route: 'reports',
        params: {},
      },
      application: CONTEXT,
    });
    await wait(SETTLE);
    expect(announced(nav)).toEqual(['Home', 'Reports']);
    const reports = linkEls(nav).find(l => l.textContent?.includes('Reports'))!;
    expect(reports.getAttribute('aria-current')).toBe('page');
  });
});
