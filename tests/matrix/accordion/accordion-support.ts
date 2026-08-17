/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-accordion / snice-accordion-item matrix — the oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/accordion.md` and
 * `snice-accordion.types.ts`:
 *
 *   snice-accordion
 *     multiple  boolean = false   "Allow multiple items open"
 *     variant   bordered|elevated = bordered
 *     activeItems Set<string>
 *     methods   openItem(id) closeItem(id) toggleItem(id) openAll() closeAll()
 *               ("openAll() - Open all (multiple mode only)")
 *     events    accordion-open  { itemId, item }   (on container)
 *               accordion-close { itemId, item }   (on container)
 *     slot      (default) — <snice-accordion-item> elements
 *
 *   snice-accordion-item
 *     itemId    string = ''  (attr `item-id`, "auto-generated if not provided")
 *     open      boolean = false
 *     disabled  boolean = false
 *     methods   toggle() expand(animate = true) collapse(animate = true)
 *               focusHeader()
 *     event     accordion-item-toggle { itemId, open }  (on item)
 *     slots     header, (default)
 *     parts     header, title, icon, content, content-inner
 *     a11y      "aria-expanded on headers, button role"
 *
 * ── What this tier can and cannot see ──────────────────────────────────────
 *
 * The item's open/closed state is animated with `max-height`, and the height
 * it animates TO is `scrollHeight` — zero in a tier with no layout. So the
 * DOM matrix owns the STATE machine (which items are open, which events fired,
 * what `aria-expanded` says) and the visual tier owns the geometry (that a
 * closed panel is really clipped to nothing and an open one really reveals its
 * content).
 *
 * The container's ARROW/HOME/END navigation is also visual-tier work, and for
 * an environment reason worth writing down: the accordion listens for
 * `keydown` on the `<div class="accordion">` INSIDE its shadow root, and the
 * items are slotted light-DOM children. happy-dom does not propagate an event
 * from a slotted node through the slot into the shadow tree, so that listener
 * never runs here — nothing about the component is being measured. Enter and
 * Space are different: the item's header button handles those inside the
 * item's OWN shadow root, so they are exercised below.
 */
import { expect } from 'vitest';
import { mount, unmountAll, wait } from '../matrix-utils';
import { exactPart, exactParts } from '../part-exact';

import '../../../packages/components/src/accordion/snice-accordion';
import '../../../packages/components/src/accordion/snice-accordion-item';

export { expect, mount, unmountAll, wait };

/** The item animates through `requestAnimationFrame`; two frames plus slack. */
export const SETTLE = 40;

// ── Documented dimensions ───────────────────────────────────────────────────

export const VARIANTS = ['bordered', 'elevated'] as const;
export type Variant = typeof VARIANTS[number];

/** Every part `snice-accordion-item` documents, in doc order. */
export const ITEM_PARTS = ['header', 'title', 'icon', 'content', 'content-inner'] as const;

export const ACCORDION_DEFAULTS = { multiple: false, variant: 'bordered' as Variant };
export const ITEM_DEFAULTS = { itemId: '', open: false, disabled: false };

// ── Fixtures ────────────────────────────────────────────────────────────────

export interface ItemSpec {
  /** Omitted so the documented "auto-generated if not provided" path runs. */
  id?: string;
  open?: boolean;
  disabled?: boolean;
  /** The `header` slot is documented as the clickable trigger content. */
  header?: string;
  body?: string;
}

export interface AccordionCombo {
  id: string;
  multiple: boolean;
  variant: Variant;
  items: ItemSpec[];
}

export function specs(count: number, overrides: Record<number, ItemSpec> = {}): ItemSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `i${i}`, header: `Section ${i}`, body: `Content ${i}`, ...overrides[i],
  }));
}

export function combo(overrides: Partial<AccordionCombo> = {}): AccordionCombo {
  const base: AccordionCombo = {
    id: '',
    multiple: false,
    variant: 'bordered',
    items: specs(3),
    ...overrides,
  };
  const open = base.items.map((spec, i) => (spec.open ? i : -1)).filter(i => i >= 0);
  const disabled = base.items.map((spec, i) => (spec.disabled ? i : -1)).filter(i => i >= 0);
  base.id = base.id || `${base.variant}/${base.multiple ? 'multiple' : 'single'}`
    + `/${base.items.length} items`
    + `${open.length ? `/open=[${open}]` : ''}${disabled.length ? `/disabled=[${disabled}]` : ''}`;
  return base;
}

function itemHtml(spec: ItemSpec): string {
  const attrs = [
    spec.id === undefined ? '' : `item-id="${spec.id}"`,
    spec.open ? 'open' : '',
    spec.disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ');
  return `<snice-accordion-item ${attrs}>`
    + `<span slot="header">${spec.header ?? 'Header'}</span>`
    + `<div>${spec.body ?? 'Body'}</div>`
    + '</snice-accordion-item>';
}

/**
 * Mount the doc's own markup, children in place BEFORE the container connects.
 *
 * The ordering is the contract: the accordion reads its `<snice-accordion-item>`
 * children during `@ready` to assign auto-ids and seed `activeItems`, and an
 * item written in after connection would be invisible to that pass.
 */
export async function makeAccordion(c: AccordionCombo): Promise<any> {
  const attrs: Record<string, any> = { variant: c.variant };
  if (c.multiple) attrs.multiple = true;
  const el = await mount<any>('snice-accordion', attrs, c.items.map(itemHtml).join(''));
  await wait(SETTLE);
  return el;
}

export const itemsOf = (el: HTMLElement): any[] => [...el.querySelectorAll('snice-accordion-item')];

// ── Reading ─────────────────────────────────────────────────────────────────

export function sr(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error(`${el.tagName.toLowerCase()} rendered no shadow root`);
  return root;
}

/**
 * Part lookups go through the shared EXACT helpers rather than
 * `[part~="…"]`.
 *
 * happy-dom's `~=` also matches hyphen-prefixed neighbours, and this component
 * has exactly that pair: `content` and `content-inner`. Asking the environment
 * for `[part~="content"]` answers with both, so the oracle would be counting
 * elements the component never rendered under that name. `tests/matrix/part-exact.ts`
 * reads the attribute and splits it, which is what a real browser does.
 */
export const part = (el: HTMLElement, name: string): HTMLElement | null =>
  exactPart<HTMLElement>(el, name);

export const parts = (el: HTMLElement, name: string): HTMLElement[] =>
  exactParts<HTMLElement>(el, name);

/** The open/closed vector of every item, in document order. */
export const openVector = (el: HTMLElement): boolean[] => itemsOf(el).map(item => item.open);

/** What each header's `aria-expanded` claims, in document order. */
export const ariaVector = (el: HTMLElement): string[] =>
  itemsOf(el).map(item => part(item, 'header')?.getAttribute('aria-expanded') ?? '∅');

// ── The oracle ──────────────────────────────────────────────────────────────

class Problems {
  readonly list: string[] = [];
  check(ok: boolean, message: string): void { if (!ok) this.list.push(message); }
  equal(actual: unknown, expected: unknown, what: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }
}

/** Judge one item against the documented item contract. */
export function itemProblems(item: any, spec: ItemSpec, index: number): Problems {
  const problems = new Problems();

  problems.equal(item.open, !!spec.open, `item ${index} open`);
  problems.equal(item.disabled, !!spec.disabled, `item ${index} disabled`);

  // "auto-generated if not provided" — an item must ALWAYS have an id, because
  // every container method addresses items by one.
  problems.check(typeof item.itemId === 'string' && item.itemId !== '',
    `item ${index} has no itemId`);
  if (spec.id !== undefined) problems.equal(item.itemId, spec.id, `item ${index} itemId`);

  for (const name of ITEM_PARTS) {
    problems.equal(parts(item, name).length, 1, `item ${index} part="${name}" count`);
  }

  const header = part(item, 'header');
  if (!problems.check(!!header, `item ${index} has no header part`)) return problems;
  // "aria-expanded on headers, button role"
  problems.equal(header!.tagName, 'BUTTON', `item ${index} header element`);
  problems.equal(header!.getAttribute('aria-expanded'), String(!!spec.open),
    `item ${index} aria-expanded`);
  problems.equal(header!.hasAttribute('disabled'), !!spec.disabled,
    `item ${index} header disabled`);

  // The header names the region it controls, and the region points back.
  const content = part(item, 'content')!;
  problems.equal(header!.getAttribute('aria-controls'), content.id,
    `item ${index} aria-controls`);
  problems.equal(content.getAttribute('aria-labelledby'), header!.id,
    `item ${index} aria-labelledby`);
  problems.equal(content.getAttribute('role'), 'region', `item ${index} content role`);

  // Both documented slots exist, and the header slot is inside the trigger.
  problems.equal(sr(item).querySelectorAll('slot[name="header"]').length, 1,
    `item ${index} header slot`);
  problems.equal(sr(item).querySelectorAll('slot:not([name])').length, 1,
    `item ${index} default slot`);
  problems.check(!!header!.querySelector('slot[name="header"]'),
    `item ${index} header slot is not inside the trigger`);
  problems.check(!!part(item, 'content-inner')!.querySelector('slot:not([name])'),
    `item ${index} default slot is not inside content-inner`);

  return problems;
}

/** Judge the container plus every item it holds. */
export function accordionProblems(el: any, c: AccordionCombo): Problems {
  const problems = new Problems();

  problems.equal(el.multiple, c.multiple, 'multiple');
  problems.equal(el.variant, c.variant, 'variant');
  problems.check(el.activeItems instanceof Set, 'activeItems is not a Set');

  // The container's only documented slot is the default one.
  problems.equal(sr(el).querySelectorAll('slot').length, 1, 'container slot count');
  problems.equal(sr(el).querySelector('slot')?.getAttribute('name') ?? null, null,
    'container slot is the default one');

  const items = itemsOf(el);
  problems.equal(items.length, c.items.length, 'item count');

  // Every item's id is unique — the container addresses them by id, so a
  // duplicate would make `openItem` ambiguous.
  const ids = items.map(item => item.itemId);
  problems.equal(new Set(ids).size, ids.length, `itemIds are not unique: ${ids.join(',')}`);

  items.forEach((item, index) => {
    for (const message of itemProblems(item, c.items[index] ?? {}, index).list) {
      problems.list.push(message);
    }
  });

  // `activeItems` is documented state, so it must agree with the items.
  const activeFromItems = items.filter(item => item.open).map(item => item.itemId).sort();
  problems.equal([...el.activeItems].sort(), activeFromItems, 'activeItems vs open items');

  return problems;
}

export function expectAccordionMatches(el: any, c: AccordionCombo): void {
  expect(accordionProblems(el, c).list, `combo ${c.id}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface EventLog { log: string[]; details: any[] }

/** The two CONTAINER events, in dispatch order. */
export function recordContainer(el: HTMLElement): EventLog {
  const log: string[] = [];
  const details: any[] = [];
  for (const type of ['accordion-open', 'accordion-close']) {
    el.addEventListener(type, (event: Event) => {
      log.push(`${type === 'accordion-open' ? 'open' : 'close'}:${(event as CustomEvent).detail.itemId}`);
      details.push((event as CustomEvent).detail);
    });
  }
  return { log, details };
}

/** The ITEM event, which the doc places on the item itself. */
export function recordItem(item: HTMLElement): EventLog {
  const log: string[] = [];
  const details: any[] = [];
  item.addEventListener('accordion-item-toggle', (event: Event) => {
    const detail = (event as CustomEvent).detail;
    log.push(`${detail.itemId}:${detail.open}`);
    details.push(detail);
  });
  return { log, details };
}

export function clickHeader(item: HTMLElement): void {
  part(item, 'header')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }),
  );
}

export function pressHeader(item: HTMLElement, key: string): void {
  part(item, 'header')?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }),
  );
}

export function teardown(): void {
  unmountAll();
}
