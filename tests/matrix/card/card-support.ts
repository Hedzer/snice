/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-card matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is read off `docs/ai/components/card.md` and
 * `snice-card.types.ts`:
 *
 *   variant: elevated|bordered|flat = 'elevated'
 *   size: small|medium|large        = 'medium'
 *   clickable: boolean = false      → the card becomes an interactive control
 *   selected:  boolean = false      → the toggle state a click reports
 *   disabled:  boolean = false
 *   attribute-only accent="primary|success|warning|danger|brand"
 *   event: card-click → { selected }
 *   slots: (default) body, image, header, footer
 *   parts: base, header, body, footer
 *   a11y:  "Clickable cards are keyboard accessible"
 *          "ARIA roles and states for interactive cards"
 *          "Clear focus indicators"
 *
 * Two deliberate boundaries:
 *
 *   · `variant`, `size` and `accent` are PAINT — a shadow, a border, a rule
 *     along the top edge. The DOM tier may only hold them to "the documented
 *     regions are untouched"; the colours and the ±3° cursor tilt belong to
 *     the visual tier (tests/live/matrix/card/);
 *   · the doc's a11y section promises roles and states "for INTERACTIVE
 *     cards". A plain card is a container, so this oracle asserts that a
 *     plain card is NOT dressed as a control — that is the documented reading,
 *     and the one an assistive technology acts on.
 */
import { Problems, text } from '../matrix-kit';
import { exactPart } from '../part-exact';
import type { CardSize, CardVariant } from '../../../packages/components/src/card/snice-card.types';

export type { CardSize, CardVariant };

export const VARIANTS: CardVariant[] = ['elevated', 'bordered', 'flat'];
export const SIZES: CardSize[] = ['small', 'medium', 'large'];
export const ACCENTS = ['primary', 'success', 'warning', 'danger', 'brand'] as const;
export type Accent = typeof ACCENTS[number];

/** Which documented slots a combo fills. */
export const SLOT_SETS = ['body', 'header', 'footer', 'all'] as const;
export type SlotSet = typeof SLOT_SETS[number];

export const BODY_TEXT = 'A short description of the thing on this card.';
export const HEADER_TEXT = 'Card title';
export const FOOTER_TEXT = 'Act now';
export const IMAGE_ALT = 'preview';

export interface CardSpec {
  variant: CardVariant;
  size: CardSize;
  clickable: boolean;
  selected: boolean;
  disabled: boolean;
  slots: SlotSet;
  image: boolean;
}

export function spec(overrides: Partial<CardSpec> = {}): CardSpec {
  return {
    variant: 'elevated',
    size: 'medium',
    clickable: false,
    selected: false,
    disabled: false,
    slots: 'body',
    image: false,
    ...overrides,
  };
}

export const hasHeader = (s: CardSpec): boolean => s.slots === 'header' || s.slots === 'all';
export const hasFooter = (s: CardSpec): boolean => s.slots === 'footer' || s.slots === 'all';

/** The light DOM one combo authors. */
export function lightDomFor(s: CardSpec): string {
  return [
    s.image ? `<img slot="image" src="/img/p.png" alt="${IMAGE_ALT}">` : '',
    hasHeader(s) ? `<div slot="header">${HEADER_TEXT}</div>` : '',
    `<p>${BODY_TEXT}</p>`,
    hasFooter(s) ? `<div slot="footer"><button>${FOOTER_TEXT}</button></div>` : '',
  ].join('');
}

/**
 * Mount a combo the way authored markup delivers it: attributes AND slotted
 * children in place BEFORE connection.
 *
 * The order matters. The card reads its header/footer slots on `@ready` and
 * then on `slotchange`, and happy-dom does not emit `slotchange` for an
 * innerHTML write that happens after the element connects — so a post-connect
 * write would report every card as having no header, which is a fact about the
 * environment rather than about the component. A real page delivers the
 * children with the element, and so does this.
 */
export async function makeCard(
  s: CardSpec,
  extra: Record<string, string> = {},
): Promise<HTMLElement> {
  const el = document.createElement('snice-card');
  el.setAttribute('variant', s.variant);
  el.setAttribute('size', s.size);
  if (s.clickable) el.setAttribute('clickable', '');
  if (s.selected) el.setAttribute('selected', '');
  if (s.disabled) el.setAttribute('disabled', '');
  for (const [name, value] of Object.entries(extra)) el.setAttribute(name, value);
  el.innerHTML = lightDomFor(s);
  document.body.appendChild(el);
  await (el as any).ready;
  // The slot pass runs on a queued microtask after `@ready`; one settle window
  // covers it and the render it schedules.
  await new Promise(resolve => setTimeout(resolve, 30));
  return el;
}

// ── Documented derivations ──────────────────────────────────────────────────

/** Documented: a clickable card is a control; a plain one is a container. */
export const expectedRole = (s: CardSpec): string => (s.clickable ? 'button' : 'article');

/** Documented: "Clickable cards are keyboard accessible" — and only those. */
export const expectedTabIndex = (s: CardSpec): string =>
  (s.clickable && !s.disabled ? '0' : '-1');

// ── Readers ─────────────────────────────────────────────────────────────────

export const basePart = (el: HTMLElement) => exactPart(el, 'base');
export const headerPart = (el: HTMLElement) => exactPart(el, 'header');
export const bodyPart = (el: HTMLElement) => exactPart(el, 'body');
export const footerPart = (el: HTMLElement) => exactPart(el, 'footer');

/** What a named slot actually projects. */
export function projected(el: HTMLElement, name?: string): string {
  const root = el.shadowRoot;
  if (!root) return '∅ no shadow root';
  const selector = name ? `slot[name="${name}"]` : 'slot:not([name])';
  const slot = root.querySelector(selector) as HTMLSlotElement | null;
  if (!slot) return `∅ no ${name ?? 'default'} slot`;
  return slot.assignedNodes({ flatten: false })
    // happy-dom assigns a `slot="x"` child to the default slot as well; the
    // filter restores the platform's own rule so a header never reads as body.
    .filter(node => !(node instanceof Element) || (node.getAttribute('slot') ?? '') === (name ?? ''))
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Is a shadow region actually on screen, rather than merely present? */
export function shown(node: Element | null | undefined): boolean {
  if (!node) return false;
  if ((node as HTMLElement).hasAttribute('hidden')) return false;
  return getComputedStyle(node as HTMLElement).display !== 'none';
}

// ── The structural oracle ───────────────────────────────────────────────────

export function checkCard(el: HTMLElement, s: CardSpec, problems: Problems): void {
  const base = basePart(el);
  if (!problems.check(base !== null, 'no [part="base"]')) return;

  // ── The documented regions ───────────────────────────────────────────────
  const body = bodyPart(el);
  if (problems.check(body !== null, 'no [part="body"]')) {
    problems.equal(projected(el), BODY_TEXT, 'the default slot projects the body');
  }

  // A header region that shows when nothing was slotted into it is an empty
  // band of padding at the top of every card that has no title.
  problems.equal(shown(headerPart(el)), hasHeader(s), '[part="header"] shown');
  if (hasHeader(s)) problems.equal(projected(el, 'header'), HEADER_TEXT, 'the header slot projects');

  problems.equal(shown(footerPart(el)), hasFooter(s), '[part="footer"] shown');
  if (hasFooter(s)) problems.equal(projected(el, 'footer'), FOOTER_TEXT, 'the footer slot projects');

  if (s.image) {
    problems.equal(projected(el, 'image'), '', 'the image slot projects its child');
    const slot = el.shadowRoot?.querySelector('slot[name="image"]') as HTMLSlotElement | null;
    problems.check(slot !== null, 'no image slot for a card with an image');
  }

  // ── The documented ARIA surface ──────────────────────────────────────────
  problems.equal(base!.getAttribute('role'), expectedRole(s), 'role');
  problems.equal(base!.getAttribute('tabindex'), expectedTabIndex(s), 'tabindex');
  problems.equal(base!.getAttribute('aria-disabled'), String(s.disabled), 'aria-disabled');

  if (s.clickable) {
    // A toggle button announces its state.
    problems.equal(base!.getAttribute('aria-pressed'), String(s.selected), 'aria-pressed');
  }
}
