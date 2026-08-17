/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-menu matrix — the oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation in this module is transcribed from
 * `docs/ai/components/menu.md` and `snice-menu.types.ts` /
 * `snice-menu-item.types.ts`. Nothing here is read back from the component —
 * that is the whole point of the tier (`.ai/fuzzing.md`): a matrix whose
 * expectations came from the output it is judging proves only that the output
 * is stable, never that it is right.
 *
 * The documented surface this file encodes:
 *
 *   snice-menu
 *     open        boolean = false
 *     placement   bottom-start|bottom-end|top-start|top-end
 *                 |right-start|right-end|left-start|left-end  = bottom-start
 *     trigger     click|hover|manual = click
 *     closeOnSelect boolean = true          (attribute `close-on-select`)
 *     distance    number = 4
 *     methods     openMenu() closeMenu() toggleMenu()
 *     events      menu-open {menu}, menu-close {menu},
 *                 menu-item-select {item, value} (bubbles from menu-item)
 *     slots       trigger (required), image-left, image-right, (default)
 *     parts       trigger, image-left, image-right, panel, content
 *
 *   snice-menu-item
 *     value string = '', disabled boolean = false, selected boolean = false
 *     slots  icon, (default), shortcut
 *     parts  item, icon, label, shortcut
 *
 *   snice-menu-divider
 *     parts  divider
 *
 * Two contracts are asserted here that the doc states only in prose, and both
 * are taken from the doc rather than the source:
 *   · "Container with trigger and panel" + `aria-haspopup`/`aria-expanded` is
 *     the ARIA disclosure contract a menu trigger owes a screen reader, so the
 *     oracle pins `role="button"`, `aria-haspopup="menu"` and an
 *     `aria-expanded` that TRACKS `open`;
 *   · `distance: number = 4` has no rendered text, so the only observable it
 *     can have is the custom property the panel offset is expressed in —
 *     `--menu-distance`, in px, on the host.
 */
import { expect } from 'vitest';
import {
  Problems, all, expectClean, mount, one, part, parts, sr, text, wait,
} from '../matrix-kit';

import '../../../packages/components/src/menu/snice-menu';
import '../../../packages/components/src/menu/snice-menu-item';
import '../../../packages/components/src/menu/snice-menu-divider';

export { Problems, all, expectClean, one, part, parts, sr, text, wait };

/**
 * Class names of a node, as a sorted array.
 *
 * `classList` is not iterable in happy-dom, and `class` is the only observable
 * `placement` and the item's flag set have in a layout-free tier — so reading
 * it through the attribute is not a workaround, it is the reading itself.
 */
export function classesOf(node: Element | null | undefined): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort();
}

/**
 * What the UNNAMED slot projects.
 *
 * The documented contract is "named slots take their own content, the default
 * slot receives the rest", and that is exactly what this reads. The explicit
 * `[slot]` filter is here because happy-dom's unnamed `<slot>` over-assigns:
 * it hands the default slot EVERY light-DOM child, including the ones carrying
 * `slot="trigger"` / `slot="icon"`. Filtering restores the browser's own
 * assignment rule rather than excusing anything — the named side is asserted
 * separately and unfiltered, so a child that really landed in the wrong named
 * slot still fails there, and the real-browser tier
 * (`tests/live/matrix/menu/`) re-checks the assignment with no filter at all.
 */
export function defaultProjection(host: HTMLElement): string[] {
  const slot = one<HTMLSlotElement>(host, 'slot:not([name])');
  // `Array.from` rather than the array `assignedElements()` handed back:
  // happy-dom builds it with ITS window's `Array`, and Vitest's `toEqual`
  // compares constructors, so a structurally identical list would otherwise
  // fail with "compared values have no visual difference".
  return Array.from(slot?.assignedElements?.() ?? [])
    .filter(node => !node.hasAttribute('slot'))
    .map(node => node.tagName.toLowerCase());
}

/** Text the UNNAMED slot projects, under the same assignment rule as above. */
export function defaultSlotText(host: HTMLElement): string {
  const slot = one<HTMLSlotElement>(host, 'slot:not([name])');
  return (slot?.assignedNodes?.({ flatten: true }) ?? [])
    .filter(node => !(node instanceof Element) || !node.hasAttribute('slot'))
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Documented dimensions ───────────────────────────────────────────────────

/** `placement` — the eight documented values, in doc order. */
export const PLACEMENTS = [
  'bottom-start', 'bottom-end', 'top-start', 'top-end',
  'right-start', 'right-end', 'left-start', 'left-end',
] as const;
export type Placement = typeof PLACEMENTS[number];

/** `trigger` — the three documented behaviours. */
export const TRIGGERS = ['click', 'hover', 'manual'] as const;
export type Trigger = typeof TRIGGERS[number];

/** Documented defaults, asserted as such by the defaults slice. */
export const DEFAULTS = {
  open: false,
  placement: 'bottom-start' as Placement,
  trigger: 'click' as Trigger,
  closeOnSelect: true,
  distance: 4,
};

/** The parts `snice-menu` documents. */
export const MENU_PARTS = ['trigger', 'image-left', 'image-right', 'panel', 'content'] as const;
/** The parts `snice-menu-item` documents. */
export const ITEM_PARTS = ['item', 'icon', 'label', 'shortcut'] as const;

/** The named slots `snice-menu` documents, plus the unnamed default. */
export const MENU_SLOTS = ['trigger', 'image-left', 'image-right'] as const;
/** The named slots `snice-menu-item` documents, plus the unnamed default. */
export const ITEM_SLOTS = ['icon', 'shortcut'] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

export interface ItemSpec {
  value: string;
  label: string;
  disabled?: boolean;
  selected?: boolean;
  icon?: string;
  shortcut?: string;
}

/** The doc's own example menu, verbatim in shape: two items, a divider, one more. */
export const SAMPLE_ITEMS: ItemSpec[] = [
  { value: 'new', label: 'New' },
  { value: 'save', label: 'Save', icon: '💾', shortcut: '⌘S' },
  { value: 'exit', label: 'Exit' },
];

function itemHtml(spec: ItemSpec): string {
  const attrs = [
    `value="${spec.value}"`,
    spec.disabled ? 'disabled' : '',
    spec.selected ? 'selected' : '',
  ].filter(Boolean).join(' ');
  const icon = spec.icon ? `<span slot="icon">${spec.icon}</span>` : '';
  const shortcut = spec.shortcut ? `<span slot="shortcut">${spec.shortcut}</span>` : '';
  return `<snice-menu-item ${attrs}>${icon}${spec.label}${shortcut}</snice-menu-item>`;
}

export interface MenuCombo {
  id: string;
  placement: Placement;
  trigger: Trigger;
  open: boolean;
  closeOnSelect: boolean;
  distance: number;
  /** Which of the two documented image slots are filled. */
  images: 'none' | 'left' | 'right' | 'both';
  items: ItemSpec[];
  /** A `<snice-menu-divider>` between item 1 and item 2, as the doc's example has. */
  divider: boolean;
}

export function combo(overrides: Partial<MenuCombo> = {}): MenuCombo {
  const base: MenuCombo = {
    id: '',
    placement: DEFAULTS.placement,
    trigger: DEFAULTS.trigger,
    open: DEFAULTS.open,
    closeOnSelect: DEFAULTS.closeOnSelect,
    distance: DEFAULTS.distance,
    images: 'none',
    items: SAMPLE_ITEMS,
    divider: false,
    ...overrides,
  };
  base.id = base.id || `${base.placement}/${base.trigger}`
    + `/${base.open ? 'open' : 'closed'}/images=${base.images}`
    + `${base.closeOnSelect ? '' : '/keep-open'}${base.divider ? '/divider' : ''}`;
  return base;
}

/**
 * Mount one combo the way the doc's example authors it: the trigger button and
 * every item are light-DOM children present BEFORE connection, and the feature
 * vector crosses the ATTRIBUTE channel — `close-on-select` is documented as a
 * kebab attribute, so an attribute mount is the only one that proves the
 * documented markup works.
 */
export async function makeMenu(c: MenuCombo): Promise<any> {
  const items = c.items.map(itemHtml);
  if (c.divider && items.length > 1) items.splice(1, 0, '<snice-menu-divider></snice-menu-divider>');
  const html = [
    '<button slot="trigger">File</button>',
    c.images === 'left' || c.images === 'both' ? '<img slot="image-left" alt="l">' : '',
    c.images === 'right' || c.images === 'both' ? '<img slot="image-right" alt="r">' : '',
    ...items,
  ].filter(Boolean).join('');

  const attrs: Record<string, string | number | boolean> = {
    placement: c.placement,
    trigger: c.trigger,
    distance: c.distance,
  };
  if (c.open) attrs.open = true;
  // `close-on-select` defaults to true, so only the false case is expressible
  // as markup at all — and it is expressed by ABSENCE plus a property write,
  // which is what `mount` does with an explicit `false`.
  const props: Record<string, unknown> = c.closeOnSelect ? {} : { closeOnSelect: false };

  return mount<any>('snice-menu', attrs, props, { html });
}

// ── The oracle ──────────────────────────────────────────────────────────────

/** `aria-expanded` tracks `open`; the doc's "Container with trigger and panel". */
export function expectedTriggerAria(open: boolean): Record<string, string> {
  return { role: 'button', 'aria-haspopup': 'menu', 'aria-expanded': open ? 'true' : 'false' };
}

/** The panel carries its documented placement, and `--open` only while open. */
export function expectedPanelClasses(placement: Placement, open: boolean): string[] {
  const classes = ['menu__panel', `menu__panel--${placement}`];
  if (open) classes.push('menu__panel--open');
  return classes;
}

/**
 * Judge one mounted menu against its documented shape, collecting EVERY
 * violation so a failing combo reports its whole story in one run.
 */
export function menuProblems(el: any, c: MenuCombo): Problems {
  const problems = new Problems();

  // ── properties round-trip through the documented channels ────────────────
  problems.equal(el.placement, c.placement, 'placement');
  problems.equal(el.trigger, c.trigger, 'trigger');
  problems.equal(el.open, c.open, 'open');
  problems.equal(el.closeOnSelect, c.closeOnSelect, 'closeOnSelect');
  problems.equal(el.distance, c.distance, 'distance');

  // ── every documented part exists, exactly once ───────────────────────────
  for (const name of MENU_PARTS) {
    problems.equal(parts(el, name).length, 1, `part="${name}" count`);
  }

  // ── the trigger's disclosure contract ────────────────────────────────────
  const trigger = part(el, 'trigger');
  if (!problems.check(!!trigger, 'no part="trigger"')) return problems;
  for (const [attribute, want] of Object.entries(expectedTriggerAria(c.open))) {
    problems.equal(trigger!.getAttribute(attribute), want, `trigger ${attribute}`);
  }
  problems.equal(trigger!.getAttribute('tabindex'), '0', 'trigger tabindex');

  // ── the panel: role, popover, placement class, open class ────────────────
  const panel = part(el, 'panel');
  if (!problems.check(!!panel, 'no part="panel"')) return problems;
  problems.equal(panel!.getAttribute('role'), 'menu', 'panel role');
  problems.equal(panel!.getAttribute('popover'), 'manual', 'panel popover');
  const want = expectedPanelClasses(c.placement, c.open);
  problems.equal(classesOf(panel), [...want].sort(), 'panel classes');

  // ── every documented slot exists ─────────────────────────────────────────
  for (const name of MENU_SLOTS) {
    problems.equal(all(el, `slot[name="${name}"]`).length, 1, `slot[name=${name}] count`);
  }
  problems.equal(all(el, 'slot:not([name])').length, 1, 'default slot count');

  // ── the trigger slot really projects the authored trigger ────────────────
  const triggerSlot = one<HTMLSlotElement>(el, 'slot[name="trigger"]');
  const assigned = triggerSlot?.assignedElements?.() ?? [];
  problems.equal(assigned.length, 1, 'trigger slot assigned count');
  problems.equal(assigned[0]?.tagName, 'BUTTON', 'trigger slot assigned tag');

  // ── the default slot projects exactly the authored items and dividers ────
  const projected = defaultProjection(el);
  const expectedProjection = c.items.map(() => 'snice-menu-item');
  if (c.divider && expectedProjection.length > 1) {
    expectedProjection.splice(1, 0, 'snice-menu-divider');
  }
  problems.equal(projected, expectedProjection, 'default slot projection');

  // ── `distance` is only observable as the custom property it feeds ────────
  problems.equal(el.style.getPropertyValue('--menu-distance').trim(), `${c.distance}px`,
    '--menu-distance');

  return problems;
}

/** The single assertion every structural matrix test routes through. */
export function expectMenuMatches(el: any, c: MenuCombo): void {
  expectClean(menuProblems(el, c), c.id);
}

// ── menu-item oracle ────────────────────────────────────────────────────────

export function itemProblems(item: any, spec: ItemSpec): Problems {
  const problems = new Problems();

  problems.equal(item.value, spec.value, 'item value');
  problems.equal(item.disabled, !!spec.disabled, 'item disabled');
  problems.equal(item.selected, !!spec.selected, 'item selected');

  for (const name of ITEM_PARTS) {
    problems.equal(parts(item, name).length, 1, `item part="${name}" count`);
  }

  const box = part(item, 'item');
  if (!problems.check(!!box, 'no item part')) return problems;
  problems.equal(box!.getAttribute('role'), 'menuitem', 'item role');
  // `disabled: boolean` is an a11y state before it is a style, so the doc's
  // property has exactly one observable: aria-disabled.
  problems.equal(box!.getAttribute('aria-disabled'), spec.disabled ? 'true' : 'false',
    'item aria-disabled');

  const wantClasses = ['menu-item'];
  if (spec.selected) wantClasses.push('menu-item--selected');
  if (spec.disabled) wantClasses.push('menu-item--disabled');
  problems.equal(classesOf(box), wantClasses.sort(), 'item classes');

  for (const name of ITEM_SLOTS) {
    problems.equal(all(item, `slot[name="${name}"]`).length, 1, `item slot[name=${name}] count`);
  }
  problems.equal(all(item, 'slot:not([name])').length, 1, 'item default slot count');

  // Slotted content really lands in its documented slot.
  const slotText = (selector: string) => {
    const slot = one<HTMLSlotElement>(item, selector);
    return (slot?.assignedNodes?.({ flatten: true }) ?? [])
      .map(node => node.textContent ?? '').join('').replace(/\s+/g, ' ').trim();
  };
  problems.equal(defaultSlotText(item), spec.label, 'item label projection');
  problems.equal(slotText('slot[name="icon"]'), spec.icon ?? '', 'item icon projection');
  problems.equal(slotText('slot[name="shortcut"]'), spec.shortcut ?? '', 'item shortcut projection');

  return problems;
}

export function expectItemMatches(item: any, spec: ItemSpec): void {
  expectClean(itemProblems(item, spec), `item ${spec.value}`);
}

// ── Interaction ─────────────────────────────────────────────────────────────

/** The three documented menu events, recorded in dispatch order. */
export function recordEvents(el: HTMLElement): { log: string[]; details: any[] } {
  const log: string[] = [];
  const details: any[] = [];
  for (const type of ['menu-open', 'menu-close', 'menu-item-select']) {
    el.addEventListener(type, (event: Event) => {
      log.push(type);
      details.push((event as CustomEvent).detail);
    });
  }
  return { log, details };
}

export function fire(node: Element | null | undefined, type: string): void {
  node?.dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, cancelable: true }));
}

export function pressKey(node: Element | null | undefined, key: string): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

/** The shadow trigger a user's pointer would actually hit. */
export const triggerOf = (el: HTMLElement): HTMLElement | null =>
  one<HTMLElement>(el, '.menu__trigger');

export const itemsOf = (el: HTMLElement): any[] =>
  [...el.querySelectorAll('snice-menu-item')];

export function teardown(): void {
  document.body.innerHTML = '';
}

export { expect };
