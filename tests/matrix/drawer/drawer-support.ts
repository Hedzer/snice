/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-drawer matrix — the oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/drawer.md` and
 * `snice-drawer.types.ts`. Per `.ai/fuzzing.md`, nothing here is read back from
 * the component: every `expected*` below carries the doc line it encodes, and a
 * combo that diverges becomes an `it.fails` finding rather than a softened
 * assertion.
 *
 * The documented surface:
 *
 *   open        boolean = false
 *   position    left|right|top|bottom = left
 *   size        small|medium|large|xl|xxl|xxxl|full = medium
 *   inline      boolean = false   "Sit in document flow (no overlay/backdrop/focus-trap)"
 *   breakpoint  number  = 0       "above → inline, below → overlay" (window.matchMedia)
 *   noHeader / noFooter / noBackdrop / noBackdropDismiss / noEscapeDismiss /
 *   noFocusTrap / persistent / pushContent / contained   all boolean = false
 *   methods     show() hide() toggle()
 *   events      drawer-open {drawer}, drawer-close {drawer}
 *   slots       (default) body, title, footer
 *   parts       backdrop, base, header, title, close, body, footer
 *   a11y        role=dialog + aria-modal=true on the drawer;
 *               aria-hidden reflects visibility;
 *               Escape closes (unless no-escape-dismiss / persistent);
 *               "persistent: Hide close button, prevent all dismiss".
 *
 * ── Why the whole 4x7 position/size cross is taken ─────────────────────────
 *
 * `position` and `size` have no rendered text and no class of their own; the
 * component reflects them onto the HOST as attributes and the stylesheet does
 * the rest (`:host([position="right"][size="xl"])`). In a layout-free tier the
 * host attribute IS the observable, and it is the thing a CSS selector depends
 * on — a drawer that forgets to reflect `size` renders at the default width in
 * every browser, and nothing but this assertion notices.
 */
import { expect } from 'vitest';
import { mount, unmountAll, wait } from '../matrix-utils';

import '../../../packages/components/src/drawer/snice-drawer';
import '../../../packages/components/src/drawer/snice-drawer-target';

export { expect, mount, unmountAll, wait };

/** The open/close paths run through `requestAnimationFrame` + a microtask. */
export const SETTLE = 40;

/**
 * The component debounces duplicate open/close events inside a 100ms window,
 * so a test that opens and closes faster than that measures the debounce
 * rather than the contract. Every lifecycle step waits past it.
 */
export const DEBOUNCE = 130;

// ── Documented dimensions ───────────────────────────────────────────────────

export const POSITIONS = ['left', 'right', 'top', 'bottom'] as const;
export type Position = typeof POSITIONS[number];

export const SIZES = ['small', 'medium', 'large', 'xl', 'xxl', 'xxxl', 'full'] as const;
export type Size = typeof SIZES[number];

/** Every documented part, in doc order. */
export const PARTS = ['backdrop', 'base', 'header', 'title', 'close', 'body', 'footer'] as const;

/** The documented kebab attribute for each camelCase boolean property. */
export const BOOLEAN_ATTRS: Record<string, string> = {
  inline: 'inline',
  noHeader: 'no-header',
  noFooter: 'no-footer',
  noBackdrop: 'no-backdrop',
  noBackdropDismiss: 'no-backdrop-dismiss',
  noEscapeDismiss: 'no-escape-dismiss',
  noFocusTrap: 'no-focus-trap',
  persistent: 'persistent',
  pushContent: 'push-content',
  contained: 'contained',
};

/** Documented defaults. */
export const DEFAULTS = {
  open: false,
  position: 'left' as Position,
  size: 'medium' as Size,
  inline: false,
  breakpoint: 0,
  noHeader: false,
  noFooter: false,
  noBackdrop: false,
  noBackdropDismiss: false,
  noEscapeDismiss: false,
  noFocusTrap: false,
  persistent: false,
  pushContent: false,
  contained: false,
};

// ── Mounting ────────────────────────────────────────────────────────────────

export interface DrawerCombo {
  id: string;
  position: Position;
  size: Size;
  open: boolean;
  noHeader: boolean;
  noFooter: boolean;
  persistent: boolean;
  inline: boolean;
  contained: boolean;
  noBackdrop: boolean;
  noBackdropDismiss: boolean;
  noEscapeDismiss: boolean;
  noFocusTrap: boolean;
  pushContent: boolean;
  breakpoint: number;
  /** Which documented slots are filled. */
  slots: { title: boolean; body: boolean; footer: boolean };
}

export function combo(overrides: Partial<DrawerCombo> = {}): DrawerCombo {
  const base: DrawerCombo = {
    id: '',
    position: DEFAULTS.position,
    size: DEFAULTS.size,
    open: false,
    noHeader: false,
    noFooter: false,
    persistent: false,
    inline: false,
    contained: false,
    noBackdrop: false,
    noBackdropDismiss: false,
    noEscapeDismiss: false,
    noFocusTrap: false,
    pushContent: false,
    breakpoint: 0,
    slots: { title: true, body: true, footer: true },
    ...overrides,
  };
  const flags = Object.keys(BOOLEAN_ATTRS)
    .filter(key => (base as any)[key])
    .map(key => BOOLEAN_ATTRS[key]);
  base.id = base.id || `${base.position}/${base.size}`
    + `/${base.open ? 'open' : 'closed'}/[${flags.join(',') || 'plain'}]`;
  return base;
}

/**
 * The documented markup, authored the way the doc's example authors it —
 * children in place BEFORE the element connects.
 *
 * That ordering is load-bearing: the drawer reads its `[slot="footer"]` child
 * during `@ready` to decide whether the footer is empty, and happy-dom does not
 * fire `slotchange` for a post-connect `innerHTML` write. A drawer built the
 * other way round would report an empty footer in every combo and the matrix
 * would be measuring the environment.
 */
export async function makeDrawer(c: DrawerCombo): Promise<any> {
  const attrs: Record<string, any> = { position: c.position, size: c.size };
  for (const [property, attribute] of Object.entries(BOOLEAN_ATTRS)) {
    if ((c as any)[property]) attrs[attribute] = true;
  }
  if (c.open) attrs.open = true;
  if (c.breakpoint > 0) attrs.breakpoint = c.breakpoint;

  const html = [
    c.slots.title ? '<span slot="title">Menu</span>' : '',
    c.slots.body ? '<nav><a href="/">Home</a><a href="/about">About</a></nav>' : '',
    c.slots.footer ? '<button slot="footer">Save</button>' : '',
  ].filter(Boolean).join('');

  return mount<any>('snice-drawer', attrs, html);
}

// ── Reading the shadow tree ─────────────────────────────────────────────────

export function sr(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-drawer rendered no shadow root');
  return root;
}

export const part = (el: HTMLElement, name: string): HTMLElement | null =>
  sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);

export const parts = (el: HTMLElement, name: string): HTMLElement[] =>
  [...sr(el).querySelectorAll<HTMLElement>(`[part~="${name}"]`)];

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Which parts a combo is documented to render.
 *
 *   · `no-header` removes the header — and with it the title and the close
 *     button, which live inside it;
 *   · `persistent` is documented as "Hide close button, prevent all dismiss",
 *     so the close button is gone while the header stays;
 *   · `no-footer` removes the footer;
 *   · everything else is always present, `backdrop` included: the doc gives
 *     `no-backdrop` a CSS custom property and a paint, not a DOM removal, and
 *     `::part(backdrop)` must stay addressable.
 */
export function expectedParts(c: DrawerCombo): string[] {
  const present = ['backdrop', 'base', 'body'];
  if (!c.noHeader) {
    present.push('header', 'title');
    if (!c.persistent) present.push('close');
  }
  if (!c.noFooter) present.push('footer');
  return present.sort();
}

/** Dismissal is documented per-path; `persistent` vetoes every one of them. */
export const backdropDismisses = (c: DrawerCombo): boolean =>
  !c.persistent && !c.noBackdropDismiss;
/** "Escape closes drawer (unless no-escape-dismiss/persistent)" — and an
 *  inline drawer is documented as having no escape handler at all. */
export const escapeDismisses = (c: DrawerCombo): boolean =>
  !c.persistent && !c.noEscapeDismiss && !c.inline;
/** The close button only dismisses when it is rendered at all. */
export const closeButtonDismisses = (c: DrawerCombo): boolean =>
  !c.persistent && !c.noHeader;

export interface Problem { list: string[] }

class Problems {
  readonly list: string[] = [];
  check(ok: boolean, message: string): void { if (!ok) this.list.push(message); }
  equal(actual: unknown, expected: unknown, what: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }
}

/** Judge a mounted drawer against its documented shape, all at once. */
export function drawerProblems(el: any, c: DrawerCombo): Problems {
  const problems = new Problems();

  // ── properties round-trip ────────────────────────────────────────────────
  problems.equal(el.position, c.position, 'position');
  problems.equal(el.size, c.size, 'size');
  problems.equal(el.open, c.open, 'open');
  for (const property of Object.keys(BOOLEAN_ATTRS)) {
    problems.equal((el as any)[property], (c as any)[property], property);
  }

  // ── position/size reach the host, where the stylesheet reads them ────────
  problems.equal(el.getAttribute('position'), c.position, 'host [position]');
  problems.equal(el.getAttribute('size'), c.size, 'host [size]');

  // ── the documented parts, and only those ─────────────────────────────────
  const rendered = PARTS.filter(name => parts(el, name).length > 0).slice().sort();
  problems.equal(rendered, expectedParts(c), 'rendered parts');
  for (const name of rendered) {
    problems.equal(parts(el, name).length, 1, `part="${name}" count`);
  }

  // ── a11y: "role=dialog, aria-modal=true on drawer" ───────────────────────
  const base = part(el, 'base');
  if (!problems.check(!!base, 'no part="base"')) return problems;
  problems.equal(base!.getAttribute('role'), 'dialog', 'base role');
  problems.equal(base!.getAttribute('aria-modal'), 'true', 'base aria-modal');

  // ── "aria-hidden reflects visibility" ────────────────────────────────────
  problems.equal(el.getAttribute('aria-hidden'), String(!c.open), 'host aria-hidden');

  // ── the three documented slots ───────────────────────────────────────────
  problems.equal(sr(el).querySelectorAll('slot:not([name])').length, 1, 'default slot count');
  problems.equal(sr(el).querySelectorAll('slot[name="title"]').length, c.noHeader ? 0 : 1,
    'title slot count');
  problems.equal(sr(el).querySelectorAll('slot[name="footer"]').length, c.noFooter ? 0 : 1,
    'footer slot count');

  return problems;
}

export function expectDrawerMatches(el: any, c: DrawerCombo): void {
  expect(drawerProblems(el, c).list, `combo ${c.id}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function recordEvents(el: HTMLElement): { log: string[]; details: any[] } {
  const log: string[] = [];
  const details: any[] = [];
  for (const type of ['drawer-open', 'drawer-close']) {
    el.addEventListener(type, (event: Event) => {
      log.push(type);
      details.push((event as CustomEvent).detail);
    });
  }
  return { log, details };
}

export function clickBackdrop(el: HTMLElement): void {
  sr(el).querySelector('.drawer-backdrop')
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function clickClose(el: HTMLElement): boolean {
  const button = sr(el).querySelector('.drawer-close');
  if (!button) return false;
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  return true;
}

/** Escape is documented as a DOCUMENT-level handler the open drawer installs. */
export function pressEscape(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape', bubbles: true, cancelable: true,
  }));
}

export function teardown(): void {
  unmountAll();
}
