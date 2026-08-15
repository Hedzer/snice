/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-nav> feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is read off `docs/ai/components/nav.md` and
 * `snice-nav.types.ts`, never off the rendered output (`.ai/fuzzing.md`):
 *
 *   · Properties — `variant` (flat|hierarchical|grouped), `orientation`
 *     (horizontal|vertical), `activeStyle` (fill|text, attr `active-style`),
 *     `isTopLevel` (attr `is-top-level`).
 *   · CSS parts — `base` (outer content wrapper), `nav` (navigation element),
 *     `link` (individual nav link), `icon` (nav item icon, "img or span").
 *   · Slots — the default slot carries "additional content after navigation".
 *   · `update(placards, appContext?, currentRoute?, routeParams?)` is the only
 *     documented data channel.
 *   · "Placard `href` is used as-is for the link."
 *   · Accessibility — `role="navigation"` on the container, `aria-current="page"`
 *     on the active item, `aria-label` from placard `description`.
 *   · The doc's own examples define what the three variants MEAN: hierarchical
 *     nests a `parent`-referencing placard under the placard it names; grouped
 *     buckets placards by their `group`; `order` sorts within the bucket.
 *   · `show: false` (Placard contract) keeps a page out of navigation, and
 *     `visibleOn` guards it — sync `false` hides it, async is "hidden until
 *     resolves true; silent on false/reject".
 *
 * ── Why reflection is part of the oracle ────────────────────────────────────
 *
 * `active-style="text"` is documented as "color-only highlight" and
 * `orientation` as an axis switch, and BOTH are pure CSS: snice-nav.css keys
 * off `:host([active-style="text"])` and `:host([orientation="vertical"])`.
 * Property assignment reflects to the attribute by default
 * (docs/ai/properties.md: `reflect` defaults to true), so a nav mounted through
 * the property channel that fails to reflect renders a fill highlight while
 * claiming a text one. The oracle therefore asserts the host attribute, which
 * is the only place that contract is observable without a browser.
 */
import { Problems, part, parts, sr as shadow, text as textOf } from '../matrix-kit';
import { createComponent, wait, SETTLE } from '../matrix-kit';
import type { Placard } from '../../../packages/core/src/types/placard';
import '../../../packages/components/src/nav/snice-nav';

export type NavVariant = 'flat' | 'hierarchical' | 'grouped';
export type NavOrientation = 'horizontal' | 'vertical';
export type NavActiveStyle = 'fill' | 'text';

export interface NavCombo {
  variant: NavVariant;
  orientation: NavOrientation;
  activeStyle: NavActiveStyle;
  dataset: DatasetName;
  route?: string;
}

export const VARIANTS: NavVariant[] = ['flat', 'hierarchical', 'grouped'];
export const ORIENTATIONS: NavOrientation[] = ['horizontal', 'vertical'];
export const ACTIVE_STYLES: NavActiveStyle[] = ['fill', 'text'];

// ── Datasets ────────────────────────────────────────────────────────────────
//
// Four placard shapes, each lifted from an example in the doc:
//   · `flat`     — the "Basic Usage" set: home / products, with an icon and
//                  explicit `order`.
//   · `nested`   — the "Hierarchical" example: products + an electronics child.
//   · `grouped`  — the "Grouped" example: Main / Account groups.
//   · `rich`     — every optional link-decorating field the component's
//                  documented accessibility contract touches (description →
//                  aria-label, tooltip → title) plus out-of-order `order`
//                  values, so sorting is exercised rather than assumed.

export type DatasetName = 'flat' | 'nested' | 'grouped' | 'rich' | 'empty';

export const DATASETS: Record<DatasetName, Placard[]> = {
  empty: [],
  flat: [
    { name: 'home', title: 'Home', href: '#/', icon: '🏠', order: 0 },
    { name: 'products', title: 'Products', href: '#/products', order: 1 },
    { name: 'about', title: 'About', href: '#/about', order: 2 },
  ],
  nested: [
    { name: 'products', title: 'Products', href: '#/products', order: 0 },
    {
      name: 'electronics', title: 'Electronics', href: '#/products/electronics',
      parent: 'products', order: 0,
    },
    {
      name: 'books', title: 'Books', href: '#/products/books',
      parent: 'products', order: 1,
    },
    { name: 'support', title: 'Support', href: '#/support', order: 1 },
  ],
  grouped: [
    { name: 'home', title: 'Home', href: '#/', group: 'Main', order: 0 },
    { name: 'search', title: 'Search', href: '#/search', group: 'Main', order: 1 },
    { name: 'profile', title: 'Profile', href: '#/profile', group: 'Account', order: 0 },
    { name: 'loose', title: 'Loose', href: '#/loose', order: 0 },
  ],
  rich: [
    {
      name: 'reports', title: 'Reports', href: '/reports', order: 2,
      description: 'Financial reports', tooltip: 'Open reports', icon: '📊',
    },
    {
      name: 'admin', title: 'Admin', href: 'https://example.test/admin', order: 0,
      description: 'Administration',
    },
    { name: 'hidden', title: 'Hidden', href: '#/hidden', order: 1, show: false },
    { name: 'plain', title: 'Plain', order: 3 },
  ],
};

// ── The documented projection: placards -> the links a nav should render ─────

export interface ExpectedLink {
  name: string;
  title: string;
  href: string;
  ariaLabel: string | null;
  titleAttr: string | null;
  icon: 'img' | 'span' | null;
  active: boolean;
  /** Grouped variant only: the label the enclosing group must carry. */
  group?: string | null;
  /** Hierarchical variant only: true for a `parent`-referencing placard. */
  child?: boolean;
}

/**
 * `isActive` as the docs describe it: `aria-current="page"` marks "the active
 * item", i.e. the placard the current route names. A route that descends into a
 * placard (`products/electronics`) keeps the ancestor active, and the
 * conventional root route (`/` or `''`) selects `home`.
 */
export function isActive(placard: Placard, route: string): boolean {
  const bare = route.startsWith('/') ? route.slice(1) : route;
  return bare === placard.name
    || bare.startsWith(`${placard.name}/`)
    || (placard.name === 'home' && (route === '/' || route === ''));
}

/** Icons are documented as "img or span": a URL-ish value is an img. */
function iconKind(icon: string | undefined): 'img' | 'span' | null {
  if (!icon) return null;
  return /^(https?:|\/|\.\/|data:)/.test(icon) ? 'img' : 'span';
}

function linkFor(placard: Placard, route: string, extra: Partial<ExpectedLink> = {}): ExpectedLink {
  return {
    name: placard.name,
    title: placard.title,
    // "Placard href is used as-is for the link" — and a placard with no href
    // still renders a link, with an empty one.
    href: placard.href ?? '',
    ariaLabel: placard.description ?? null,
    titleAttr: placard.tooltip ?? placard.description ?? null,
    icon: iconKind(placard.icon),
    active: isActive(placard, route),
    ...extra,
  };
}

/**
 * The link sequence the documented behaviour requires, in render order.
 *
 * Shared rules: `show: false` is dropped, top-level placards sort by `order`.
 * Per-variant rules come from the doc's three examples.
 */
export function expectedLinks(
  placards: Placard[],
  variant: NavVariant,
  route: string,
): ExpectedLink[] {
  const visible = placards.filter(p => p.show !== false);
  const top = visible
    .filter(p => !p.parent)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (variant === 'flat') {
    return top.map(p => linkFor(p, route));
  }

  if (variant === 'hierarchical') {
    const out: ExpectedLink[] = [];
    for (const parent of top) {
      out.push(linkFor(parent, route));
      const children = visible
        .filter(p => p.parent === parent.name)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (const child of children) out.push(linkFor(child, route, { child: true }));
    }
    return out;
  }

  // grouped: bucket by `group`, first-seen bucket order, sorted within.
  const buckets = new Map<string, Placard[]>();
  for (const placard of top) {
    const key = placard.group ?? 'default';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(placard);
  }
  const out: ExpectedLink[] = [];
  for (const [group, members] of buckets) {
    const sorted = [...members].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const placard of sorted) {
      // The "default" bucket is the unnamed one — it carries no group label.
      out.push(linkFor(placard, route, { group: group === 'default' ? null : group }));
    }
  }
  return out;
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface NavElement extends HTMLElement {
  variant: NavVariant;
  orientation: NavOrientation;
  activeStyle: NavActiveStyle;
  isTopLevel: boolean;
  update(
    placards: Placard[], appContext?: any, currentRoute?: string,
    routeParams?: Record<string, string>,
  ): void;
}

/**
 * Mount one combo through the PROPERTY channel and feed it through `update()`,
 * the only documented data entry point. The property channel is deliberate:
 * `orientation` and `active-style` paint through `:host([…])` selectors, so a
 * property-mounted nav is what proves the documented reflection reaches the CSS.
 */
export async function mountNav(
  combo: NavCombo,
  options: { appContext?: any; routeParams?: Record<string, string>; html?: string } = {},
): Promise<NavElement> {
  const el = await createComponent<NavElement>('snice-nav', {});
  if (options.html !== undefined) {
    el.innerHTML = options.html;
  }
  el.variant = combo.variant;
  el.orientation = combo.orientation;
  el.activeStyle = combo.activeStyle;
  el.update(DATASETS[combo.dataset], options.appContext, combo.route ?? '', options.routeParams);
  await wait(SETTLE);
  return el;
}

export function navComboId(combo: NavCombo): string {
  return `${combo.variant}/${combo.orientation}/active-style=${combo.activeStyle}`
    + `/data=${combo.dataset}`
    + (combo.route !== undefined ? `/route="${combo.route}"` : '');
}

// ── Reading the rendered nav back ───────────────────────────────────────────

/** Every rendered `part="link"`, in document order. */
export function linkEls(nav: HTMLElement): HTMLAnchorElement[] {
  return parts(nav, 'link') as unknown as HTMLAnchorElement[];
}

/** The label text of a link — the `.nav__label` span the component builds. */
function labelText(link: Element): string {
  const span = link.querySelector('.nav__label');
  return textOf(span ?? link);
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Judge one mounted nav against the documented projection of its placards.
 * Every violation is collected, so a failing combo reports its whole story.
 */
export function checkNav(nav: NavElement, combo: NavCombo): Problems {
  const problems = new Problems();
  const root = shadow(nav);
  const route = combo.route ?? '';
  const expected = expectedLinks(DATASETS[combo.dataset], combo.variant, route);

  // ── The documented style hooks must reach the host ────────────────────────
  //
  // `reflect` defaults to true, but docs/ai/properties.md is explicit that
  // "initial field values (defaults …) are NOT reflected to attributes — only
  // changes made via the property setter are reflected". So the documented
  // expectation is: a NON-default value lands on the host as an attribute (that
  // is the only thing snice-nav.css can key off), and a default value leaves
  // the host bare (the base rules already describe the default).
  const reflected = (name: string, value: string, dflt: string, why: string) => {
    problems.equal(nav.getAttribute(name), value === dflt ? null : value, why);
  };
  reflected('orientation', combo.orientation, 'horizontal',
    'host [orientation] (snice-nav.css keys off :host([orientation="vertical"]))');
  reflected('active-style', combo.activeStyle, 'fill',
    'host [active-style] (snice-nav.css keys off :host([active-style="text"]))');
  reflected('variant', combo.variant, 'flat', 'host [variant]');

  // ── part="base": the outer content wrapper, always present ────────────────
  const base = part(nav, 'base');
  problems.check(!!base, 'no part="base" wrapper');

  // ── The default slot: "additional content after navigation" ───────────────
  const slot = root.querySelector('slot:not([name])');
  problems.check(!!slot, 'no default slot for additional content');
  if (base && slot) {
    const order = base.compareDocumentPosition(slot);
    problems.check(!!(order & Node.DOCUMENT_POSITION_FOLLOWING),
      'the default slot is not AFTER the navigation (docs: "additional content after navigation")');
  }

  // ── part="nav": role="navigation", present whenever there is anything ─────
  const navEl = part(nav, 'nav');
  problems.equal(!!navEl, expected.length > 0,
    `part="nav" present for ${expected.length} visible placards`);
  if (navEl) {
    problems.equal(navEl.getAttribute('role'), 'navigation', 'nav role');
    problems.equal(navEl.tagName.toLowerCase(), 'nav', 'nav element tag');
  }

  // ── part="link": one per documented link, in order ────────────────────────
  const links = linkEls(nav);
  problems.equal(
    links.map(l => labelText(l)),
    expected.map(e => e.title),
    'rendered link titles, in order',
  );
  if (links.length !== expected.length) return problems;

  expected.forEach((want, i) => {
    const link = links[i];
    const where = `link[${i}] "${want.title}"`;

    problems.equal(link.tagName.toLowerCase(), 'a', `${where} tag`);
    // "Placard href is used as-is for the link."
    problems.equal(link.getAttribute('href'), want.href, `${where} href`);
    // "aria-label from placard description"
    problems.equal(link.getAttribute('aria-label'), want.ariaLabel, `${where} aria-label`);
    problems.equal(link.getAttribute('title'), want.titleAttr, `${where} title`);
    // "aria-current="page" on active item"
    problems.equal(link.getAttribute('aria-current'), want.active ? 'page' : null,
      `${where} aria-current`);

    // "icon — Nav item icon (img or span)"
    const icon = link.querySelector('[part~="icon"]');
    problems.equal(icon ? icon.tagName.toLowerCase() : null, want.icon, `${where} part="icon"`);

    // A visible nav item is never left hidden once its guard has settled.
    const item = link.closest('.nav__item, .nav__group');
    if (item) {
      problems.check(!item.hasAttribute('hidden'), `${where} is still [hidden]`);
      problems.check(item.getAttribute('aria-hidden') !== 'true',
        `${where} is still aria-hidden`);
    }
  });

  // ── Exactly one active item, and only when the route names one ────────────
  const activeCount = links.filter(l => l.getAttribute('aria-current') === 'page').length;
  problems.equal(activeCount, expected.filter(e => e.active).length,
    'number of aria-current="page" links');

  // ── Variant-specific structure, from the doc's three examples ─────────────
  if (combo.variant === 'grouped') {
    expected.forEach((want, i) => {
      if (want.group === undefined) return;
      const group = links[i].closest('.nav__group');
      problems.check(!!group, `link[${i}] "${want.title}" is not inside a group`);
      if (!group) return;
      const label = group.querySelector(':scope > .nav__group-label');
      problems.equal(label ? textOf(label) : null, want.group,
        `link[${i}] "${want.title}" group label`);
    });
  }

  if (combo.variant === 'hierarchical') {
    expected.forEach((want, i) => {
      if (!want.child) return;
      const submenu = links[i].closest('.nav__submenu');
      problems.check(!!submenu,
        `child link[${i}] "${want.title}" is not inside its parent's submenu`);
    });
  }

  return problems;
}

export { Problems, wait, SETTLE };
