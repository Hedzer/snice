/**
 * snice-breadcrumbs matrix oracle.
 *
 * Every expectation cites the line of `docs/ai/components/breadcrumbs.md` it
 * encodes. The component has TWO authoring APIs for the same trail — the
 * imperative `items` array and the declarative `<snice-crumb>` children — and
 * the docs describe one rendered result for both. So the oracle takes a plain
 * list of items and returns the trail the docs promise, and the SOURCE is an
 * axis of the matrix rather than a second oracle.
 */
import { expect } from 'vitest';
import { mount, settle, shadow, wait, type Shape } from '../matrix-utils';
import '../../../packages/components/src/breadcrumbs/snice-breadcrumbs';
import '../../../packages/components/src/breadcrumbs/snice-crumb';

export const SEPARATORS = ['/', '>', '»', '•', '|'] as const;
export type Separator = typeof SEPARATORS[number];

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

/** The two documented authoring APIs. */
export const SOURCES = ['items', 'crumbs'] as const;
export type Source = typeof SOURCES[number];

export interface Item {
  label: string;
  href?: string;
  icon?: string;
  active?: boolean;
}

/** A trail of `count` crumbs, with hrefs applied per the requested pattern. */
export function trail(count: number, hrefs: 'all' | 'none' | 'mixed' = 'all'): Item[] {
  return Array.from({ length: count }, (_, i) => {
    const label = `Level ${i}`;
    const wants = hrefs === 'all' || (hrefs === 'mixed' && i % 2 === 0);
    return wants ? { label, href: `/level-${i}` } : { label };
  });
}

export interface MountOptions {
  source?: Source;
  separator?: Separator;
  size?: Size;
  maxItems?: number;
}

/**
 * Mount a trail through one of the two documented APIs.
 *
 * The declarative path authors `<snice-crumb>` children BEFORE the container
 * connects, which is how a page is written; the container reads them through
 * its slot.
 */
export async function mountTrail(items: Item[], options: MountOptions = {}): Promise<any> {
  const { source = 'items', separator, size, maxItems } = options;
  const attrs: Record<string, any> = {};
  if (separator) attrs.separator = separator;
  if (size) attrs.size = size;
  if (maxItems !== undefined) attrs['max-items'] = maxItems;

  if (source === 'crumbs') {
    const html = items.map(item => {
      const parts = [`label="${item.label}"`];
      if (item.href) parts.push(`href="${item.href}"`);
      if (item.icon) parts.push(`icon="${item.icon}"`);
      if (item.active) parts.push('active');
      return `<snice-crumb ${parts.join(' ')}></snice-crumb>`;
    }).join('');
    const el = await mount<any>('snice-breadcrumbs', attrs, html);
    await deliverSlotChange(el);
    return el;
  }

  const el = await mount<any>('snice-breadcrumbs', attrs, '', { items });
  await settle(el, 10);
  return el;
}

/**
 * Deliver the `slotchange` a real browser fires when slotted children are
 * assigned.
 *
 * happy-dom does not dispatch `slotchange` (the same limitation
 * tests/components/carousel.test.ts works around), and the declarative
 * `<snice-crumb>` API is entirely built on it. Firing the event on the
 * component's own slot is the environment substitution — every line of the
 * component's handler still runs, against real `assignedElements()`. The NATIVE
 * dispatch is exercised where it is real, in tests/live/matrix/breadcrumbs.
 */
export async function deliverSlotChange(el: any): Promise<void> {
  const slot = shadow(el).querySelector('slot');
  slot?.dispatchEvent(new Event('slotchange', { bubbles: false }));
  await settle(el, 20);
}

/** Every rendered crumb the user can actually see, in document order. */
function visibleCrumbs(el: HTMLElement): HTMLElement[] {
  return [...shadow(el).querySelectorAll('li.breadcrumb-item')]
    .filter(li => !li.classList.contains('breadcrumb-item--hidden'))
    .filter(li => !li.querySelector('.breadcrumb-ellipsis')) as HTMLElement[];
}

/**
 * The rendered trail, in the terms the docs describe it:
 *   · the label of every visible crumb, in order;
 *   · which of them are links (`part="link"`) vs plain text;
 *   · which one claims `aria-current="page"`;
 *   · the separator characters between them;
 *   · whether the ellipsis button is present.
 */
export function readTrail(el: HTMLElement): Shape {
  const crumbs = visibleCrumbs(el);
  const nav = shadow(el).querySelector('[part~="base"]');
  const list = shadow(el).querySelector('[part~="list"]');
  return {
    baseTag: nav?.tagName.toLowerCase() ?? 'none',
    ariaLabel: nav?.getAttribute('aria-label') ?? 'none',
    listTag: list?.tagName.toLowerCase() ?? 'none',
    labels: crumbs.map(li => (li.querySelector('a, span.breadcrumb-text')?.textContent ?? '')
      .replace(/\s+/g, ' ').trim()),
    linked: crumbs.map(li => !!li.querySelector('a[part~="link"]')),
    hrefs: crumbs.map(li => li.querySelector('a[part~="link"]')?.getAttribute('href') ?? ''),
    current: crumbs.map(li => !!li.querySelector('[aria-current="page"]')),
    separators: [...shadow(el).querySelectorAll('[part~="separator"]')]
      .map(node => (node.textContent ?? '').trim()),
    hasEllipsis: !!shadow(el).querySelector('[part~="ellipsis"]'),
  };
}

/**
 * DOCUMENTED expectation for an UNCOLLAPSED trail:
 *   · "`base` - The `<nav>` container" with `aria-label="Breadcrumb"`;
 *   · "`list` - The `<ol>` breadcrumb list";
 *   · "`link` - Individual breadcrumb `<a>` links" — an item renders as a link
 *     when it has an `href` and is not the current page;
 *   · "`aria-current="page"` on active/last item";
 *   · "`separator` - Separator characters between items" — hence one fewer
 *     separator than items, each showing the authored `separator` character.
 */
export function expectedTrail(items: Item[], separator: Separator = '/'): Shape {
  const lastIndex = items.length - 1;
  const isCurrent = items.map((item, i) => Boolean(item.active) || i === lastIndex);
  return {
    baseTag: 'nav',
    ariaLabel: 'Breadcrumb',
    listTag: 'ol',
    labels: items.map(item => item.label),
    linked: items.map((item, i) => Boolean(item.href) && !isCurrent[i]),
    hrefs: items.map((item, i) => (item.href && !isCurrent[i] ? item.href : '')),
    current: isCurrent,
    separators: items.slice(0, -1).map(() => separator),
    hasEllipsis: false,
  };
}

/**
 * DOCUMENTED collapse rule. The docs give `maxItems` as the cap ("0 = show
 * all") and an `ellipsis` part as the affordance that stands in for what was
 * dropped, with `collapsed` "reset[ting] on items/separator/maxItems change".
 * The assertable content of that is: while collapsed and over the cap, the
 * trail shows no more than `maxItems` crumbs, still begins at the root and ends
 * at the current page, and offers the ellipsis; expanding shows everything.
 */
export function expectCollapsed(el: HTMLElement, items: Item[], maxItems: number, label: string): void {
  const actual = readTrail(el) as any;
  const problems: string[] = [];

  if (!actual.hasEllipsis) problems.push('no ellipsis button while collapsed');
  if (actual.labels.length > maxItems) {
    problems.push(`${actual.labels.length} crumbs shown for max-items=${maxItems}`);
  }
  if (actual.labels[0] !== items[0].label) {
    problems.push(`trail starts at "${actual.labels[0]}", expected the root "${items[0].label}"`);
  }
  const last = items[items.length - 1].label;
  if (actual.labels[actual.labels.length - 1] !== last) {
    problems.push(`trail ends at "${actual.labels[actual.labels.length - 1]}", expected "${last}"`);
  }
  if (!actual.current[actual.current.length - 1]) {
    problems.push('the last visible crumb does not claim aria-current="page"');
  }
  expect(problems, label).toEqual([]);
}

/** Click a rendered link (or the ellipsis) the way a pointer does. */
export function clickCrumb(el: HTMLElement, index: number): void {
  const link = shadow(el).querySelectorAll('a[part~="link"]')[index] as HTMLElement | undefined;
  link?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function clickEllipsis(el: HTMLElement): void {
  const button = shadow(el).querySelector('[part~="ellipsis"]') as HTMLElement | null;
  button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

/** Record `breadcrumb-click` details in dispatch order. */
export function recordClicks(el: HTMLElement): any[] {
  const details: any[] = [];
  el.addEventListener('breadcrumb-click', (event: any) => details.push(event.detail));
  return details;
}

/**
 * DOCUMENTED event payload:
 * `breadcrumb-click -> { item, index, href, label }`.
 */
export function expectedClickDetail(items: Item[], index: number): Shape {
  return { index, href: items[index].href ?? '', label: items[index].label };
}

export function readClickDetail(detail: any): Shape {
  return { index: detail?.index, href: detail?.href, label: detail?.label };
}

export { wait, settle };
