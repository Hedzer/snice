/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-tooltip feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts`: ONE function
 * derives the expected rendered facts from the documented contract
 * (docs/ai/components/tooltip.md + snice-tooltip.types.ts) and ONE reads the
 * actual facts back. Every matrix test compares the two objects wholesale, so a
 * failing combo reports every divergence at once.
 *
 * `.ai/fuzzing.md` is binding: expectations come from the DOCS, never from
 * observed output, and a divergence is a FINDING (`it.fails` under a
 * `MATRIX-tooltip-N` id) rather than a weakened assertion.
 *
 * ── The portal ──────────────────────────────────────────────────────────────
 *
 * The visible popup is NOT the shadow subtree. `show()` builds a `div.snice-
 * tooltip` and appends it to `document.body`, so every "is the tooltip showing"
 * question is asked of that portal, and every teardown assertion has to check
 * that the portal left with its host. The oracle reads both places, because the
 * docs describe both (CSS Parts on one side, behaviour on the other).
 *
 * ── Sizing ──────────────────────────────────────────────────────────────────
 *
 * The tooltip has 12 documented positions, 4 triggers, two delay channels and
 * an arrow switch. Positioning MATH is not judgeable here — happy-dom lays
 * nothing out, so every rect is 0 — so this tier owns structure, trigger
 * routing, and lifecycle, and tests/live/matrix/tooltip owns placement and
 * flipping. ~70 combos.
 */
import { expect } from 'vitest';
import { wait, removeComponent } from '../../components/test-utils';
import '../../../packages/components/src/tooltip/snice-tooltip';

export { wait, removeComponent };

// ── Dimensions (docs/ai/components/tooltip.md "Properties") ─────────────────

export const POSITIONS = [
  'top', 'top-start', 'top-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
  'right', 'right-start', 'right-end',
] as const;

export const TRIGGERS = ['hover', 'click', 'focus', 'manual'] as const;

export type TooltipPosition = typeof POSITIONS[number];
export type TooltipTrigger = typeof TRIGGERS[number];

export interface TooltipCombo {
  position: TooltipPosition;
  trigger: TooltipTrigger;
  arrow: boolean;
  content: string;
  delay: number;
  hideDelay: number;
  maxWidth: number;
  zIndex: number;
  strictPositioning: boolean;
}

export const CONTENT = 'Saves your changes';
export const TRIGGER_TEXT = 'Save';

export const BASE: TooltipCombo = {
  position: 'top',
  trigger: 'hover',
  arrow: true,
  content: CONTENT,
  delay: 0,
  hideDelay: 0,
  maxWidth: 250,
  zIndex: 10000,
  strictPositioning: false,
};

export const combo = (patch: Partial<TooltipCombo> = {}): TooltipCombo => ({ ...BASE, ...patch });

export const comboId = (c: TooltipCombo): string =>
  [
    c.position, c.trigger,
    c.arrow ? 'arrow' : 'no-arrow',
    c.content ? '' : 'empty-content',
    c.delay ? `delay:${c.delay}` : '',
    c.hideDelay ? `hide:${c.hideDelay}` : '',
    c.strictPositioning ? 'strict' : '',
    c.maxWidth !== BASE.maxWidth ? `max:${c.maxWidth}` : '',
    c.zIndex !== BASE.zIndex ? `z:${c.zIndex}` : '',
  ].filter(Boolean).join('/');

/**
 * Mount one combo as the docs author it: the trigger element is light-DOM
 * content of the host, in place BEFORE connection, because the tooltip's
 * `@ready` pass reads its own state to decide whether to open immediately.
 */
export async function makeTooltip(
  c: TooltipCombo,
  options: { open?: boolean; triggerHtml?: string } = {},
): Promise<any> {
  const el = document.createElement('snice-tooltip') as any;
  el.setAttribute('position', c.position);
  el.setAttribute('trigger', c.trigger);
  if (c.content) el.setAttribute('content', c.content);
  if (!c.arrow) el.setAttribute('arrow', 'false');
  if (c.delay) el.setAttribute('delay', String(c.delay));
  if (c.hideDelay) el.setAttribute('hide-delay', String(c.hideDelay));
  if (c.maxWidth !== BASE.maxWidth) el.setAttribute('max-width', String(c.maxWidth));
  if (c.zIndex !== BASE.zIndex) el.setAttribute('z-index', String(c.zIndex));
  if (c.strictPositioning) el.setAttribute('strict-positioning', '');
  if (options.open) el.setAttribute('open', '');

  el.innerHTML = options.triggerHtml ?? `<button type="button">${TRIGGER_TEXT}</button>`;
  document.body.appendChild(el);
  await el.ready;
  await wait(30);
  // `arrow` defaults to true and its attribute converter reads "false" as a
  // string; assign through the property so the combo really carries `false`.
  if (!c.arrow) { el.arrow = false; await wait(20); }
  return el;
}

/** Remove a tooltip AND anything it portalled into the body. */
export function teardown(el: any): void {
  if (el) removeComponent(el);
  for (const portal of [...document.body.querySelectorAll('.snice-tooltip')]) portal.remove();
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface TooltipFacts {
  /** CSS part `trigger` — "Wrapper around the slot/trigger content". */
  hasTriggerPart: boolean;
  /** The trigger content the author slotted. */
  triggerText: string;
  /** CSS part `tooltip` — "The tooltip popup div". */
  hasTooltipPart: boolean;
  /** CSS part `content` — "Text content inside tooltip". */
  contentText: string;
  /** CSS part `arrow` — "Arrow element". */
  hasArrowPart: boolean;
  /** The popup announces itself as a tooltip. */
  role: string | null;
  /** The class the stylesheet keys the placement off. */
  positionClass: string | null;
  /** Documented `maxWidth`/`zIndex` land on the popup as custom properties. */
  maxWidthVar: string;
  zIndexVar: string;
}

/**
 * EXPECTED facts, derived from docs/ai/components/tooltip.md only.
 *
 *  · CSS Parts — `trigger`, `tooltip`, `content`, `arrow`.
 *  · `content: string` — the text inside the tooltip.
 *  · `position` — one of twelve, and the popup must carry it so CSS can place
 *    the arrow and the entrance transform.
 *  · `arrow: boolean = true` — "Arrow element", present when asked for.
 *  · `maxWidth: number = 250` / `zIndex: number = 10000`.
 */
export function expectedFacts(c: TooltipCombo): TooltipFacts {
  return {
    hasTriggerPart: true,
    triggerText: TRIGGER_TEXT,
    hasTooltipPart: true,
    contentText: c.content,
    hasArrowPart: true,
    role: 'tooltip',
    positionClass: `tooltip--${c.position}`,
    maxWidthVar: `${c.maxWidth}px`,
    zIndexVar: String(c.zIndex),
  };
}

/** ACTUAL facts, read from the rendered shadow tree. */
export function readFacts(el: any): TooltipFacts {
  const sr = el.shadowRoot as ShadowRoot;
  const trigger = sr.querySelector('[part~="trigger"]') as HTMLElement | null;
  const tooltip = sr.querySelector('[part~="tooltip"]') as HTMLElement | null;
  const content = sr.querySelector('[part~="content"]') as HTMLElement | null;
  const arrow = sr.querySelector('[part~="arrow"]') as HTMLElement | null;
  const classes = (tooltip?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

  return {
    hasTriggerPart: !!trigger,
    triggerText: slottedText(el),
    hasTooltipPart: !!tooltip,
    contentText: collapse(content?.textContent),
    hasArrowPart: !!arrow,
    role: tooltip?.getAttribute('role') ?? null,
    positionClass: classes.find(cls => cls.startsWith('tooltip--')) ?? null,
    maxWidthVar: tooltip?.style.getPropertyValue('--tooltip-max-width') ?? '',
    zIndexVar: tooltip?.style.getPropertyValue('--tooltip-z-index') ?? '',
  };
}

const collapse = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** The trigger content a reader sees — the default slot's assigned nodes. */
export function slottedText(el: any): string {
  const slot = el.shadowRoot?.querySelector('[part~="trigger"] slot') as HTMLSlotElement | null;
  const assigned = slot?.assignedNodes?.({ flatten: true }) ?? [];
  return collapse(assigned.map((n: Node) => n.textContent ?? '').join(''));
}

/** Compare a whole combo against the oracle, reporting EVERY divergence. */
export function expectTooltipMatches(
  el: any,
  c: TooltipCombo,
  skip: ReadonlyArray<keyof TooltipFacts> = [],
): void {
  const actual = readFacts(el);
  const expected = expectedFacts(c);
  const problems = (Object.keys(expected) as Array<keyof TooltipFacts>)
    .filter(key => !skip.includes(key))
    .filter(key => JSON.stringify(actual[key]) !== JSON.stringify(expected[key]))
    .map(key => `${key}: ${JSON.stringify(actual[key])} != ${JSON.stringify(expected[key])}`);
  expect(problems, `combo ${comboId(c)}`).toEqual([]);
}

// ── The portal: what the customer actually sees ─────────────────────────────

export interface PortalFacts {
  exists: boolean;
  visible: boolean;
  displayed: boolean;
  text: string;
  role: string | null;
  positionClass: string | null;
  hasArrow: boolean;
  arrowShown: boolean;
  zIndex: string;
  maxWidth: string;
}

/** The single portal the component owns, or `null` before it has opened. */
export function portalOf(): HTMLElement | null {
  return document.body.querySelector('.snice-tooltip');
}

export function readPortal(): PortalFacts {
  const portal = portalOf();
  if (!portal) {
    return {
      exists: false, visible: false, displayed: false, text: '', role: null,
      positionClass: null, hasArrow: false, arrowShown: false, zIndex: '', maxWidth: '',
    };
  }
  const arrow = portal.querySelector('.snice-tooltip__arrow') as HTMLElement | null;
  const classes = (portal.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  return {
    exists: true,
    visible: portal.classList.contains('snice-tooltip--visible'),
    displayed: portal.style.display !== 'none',
    text: collapse(portal.querySelector('.snice-tooltip__content')?.textContent),
    role: portal.getAttribute('role'),
    positionClass: classes.find(cls => cls.startsWith('snice-tooltip--')
      && cls !== 'snice-tooltip--visible') ?? null,
    hasArrow: !!arrow,
    arrowShown: !!arrow && arrow.style.display !== 'none',
    zIndex: portal.style.zIndex,
    maxWidth: portal.style.maxWidth,
  };
}

/** "Is the tooltip showing?" — the one question the docs' examples ask. */
export const isShowing = (): boolean => readPortal().visible;

// ── Interaction ─────────────────────────────────────────────────────────────

export function hover(el: HTMLElement, type: 'mouseenter' | 'mouseleave'): void {
  el.dispatchEvent(new MouseEvent(type, { bubbles: false, composed: true }));
}

export function focusEvent(el: HTMLElement, type: 'focusin' | 'focusout'): void {
  el.dispatchEvent(new FocusEvent(type, { bubbles: true, composed: true }));
}

export function clickHost(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** A click somewhere else entirely — the documented dismiss for `click`. */
export function clickOutside(): void {
  const other = document.createElement('div');
  document.body.appendChild(other);
  other.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  other.remove();
}

export function pressEscape(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape', bubbles: true, composed: true,
  }));
}

/** A finding title, per .ai/fuzzing.md. */
export const finding = (id: string, description: string): string => `${id}: ${description}`;
