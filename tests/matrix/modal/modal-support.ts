/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-modal matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is read off `docs/ai/components/modal.md` and
 * `snice-modal.types.ts`:
 *
 *   open: boolean = false
 *   size: small|medium|large|fullscreen = 'medium'
 *   noBackdropDismiss / noEscapeDismiss / noFocusTrap
 *   noCloseButton / noHeader / noFooter
 *   label: string = ''                  the accessible label
 *   show() / close()
 *   events: modal-open → { modal }, modal-close → { modal }
 *   slots: (default) body, header, footer
 *   parts: backdrop, panel, header, close, body, footer
 *   a11y:  role="dialog" + aria-modal="true" + aria-label
 *          focus trapped by default; first focusable focused on open;
 *          previous focus restored on close
 *          body scroll locked while open
 *          close button labelled "Close modal"
 *   keys:  Escape closes (unless no-escape-dismiss)
 *          Tab / Shift+Tab cycle focus within the modal
 *
 * One deliberate boundary: `size` is documented as four sizes, and a size is
 * paint. The DOM tier holds it to "the documented regions are untouched"; how
 * wide each panel actually is, and whether the backdrop really covers the page
 * behind it, belong to the visual tier (tests/live/matrix/modal/).
 */
import { Problems, text } from '../matrix-kit';
import { exactPart } from '../part-exact';
import type { ModalSize } from '../../../packages/components/src/modal/snice-modal.types';

export type { ModalSize };

export const SIZES: ModalSize[] = ['small', 'medium', 'large', 'fullscreen'];

/** The six documented `no-*` switches. */
export const SWITCHES = [
  'noBackdropDismiss', 'noEscapeDismiss', 'noFocusTrap',
  'noCloseButton', 'noHeader', 'noFooter',
] as const;
export type Switch = typeof SWITCHES[number];

/** The documented attribute spelling of each switch. */
export const ATTR: Record<Switch, string> = {
  noBackdropDismiss: 'no-backdrop-dismiss',
  noEscapeDismiss: 'no-escape-dismiss',
  noFocusTrap: 'no-focus-trap',
  noCloseButton: 'no-close-button',
  noHeader: 'no-header',
  noFooter: 'no-footer',
};

export const LABEL = 'Confirm action';
export const HEADER_TEXT = 'Confirm';
export const BODY_TEXT = 'Are you sure?';
export const FOOTER_CANCEL = 'Cancel';
export const FOOTER_CONFIRM = 'Confirm';

export interface ModalSpec {
  open: boolean;
  size: ModalSize;
  label: string;
  header: boolean;
  footer: boolean;
  noBackdropDismiss: boolean;
  noEscapeDismiss: boolean;
  noFocusTrap: boolean;
  noCloseButton: boolean;
  noHeader: boolean;
  noFooter: boolean;
}

export function spec(overrides: Partial<ModalSpec> = {}): ModalSpec {
  return {
    open: false,
    size: 'medium',
    label: LABEL,
    header: true,
    footer: true,
    noBackdropDismiss: false,
    noEscapeDismiss: false,
    noFocusTrap: false,
    noCloseButton: false,
    noHeader: false,
    noFooter: false,
    ...overrides,
  };
}

/** The light DOM one combo authors — the doc's own example, minus what it omits. */
export function lightDomFor(s: ModalSpec): string {
  return [
    s.header ? `<div slot="header"><h2>${HEADER_TEXT}</h2></div>` : '',
    `<p>${BODY_TEXT}</p>`,
    s.footer
      ? `<div slot="footer"><button id="cancel">${FOOTER_CANCEL}</button>`
        + `<button id="confirm">${FOOTER_CONFIRM}</button></div>`
      : '',
  ].join('');
}

/**
 * Mount a combo the way authored markup delivers it: every documented
 * attribute and slotted child in place BEFORE connection, so the modal's
 * `@ready` pass sees the element a page would give it. (The header/footer
 * "is anything slotted here" pass runs on `@ready` and on `slotchange`, and
 * happy-dom emits no `slotchange` for a post-connect write.)
 */
export async function makeModal(s: ModalSpec): Promise<HTMLElement> {
  const el = document.createElement('snice-modal');
  el.setAttribute('size', s.size);
  if (s.label) el.setAttribute('label', s.label);
  for (const name of SWITCHES) if (s[name]) el.setAttribute(ATTR[name], '');
  if (s.open) el.setAttribute('open', '');
  el.innerHTML = lightDomFor(s);
  document.body.appendChild(el);
  await (el as any).ready;
  await new Promise(resolve => setTimeout(resolve, 30));
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export const backdropPart = (el: HTMLElement) => exactPart(el, 'backdrop');
export const panelPart = (el: HTMLElement) => exactPart(el, 'panel');
export const headerPart = (el: HTMLElement) => exactPart(el, 'header');
export const closePart = (el: HTMLElement) => exactPart(el, 'close');
export const bodyPart = (el: HTMLElement) => exactPart(el, 'body');
export const footerPart = (el: HTMLElement) => exactPart(el, 'footer');

/** The dialog box itself — the documented `role="dialog"` element. */
export function dialogOf(el: HTMLElement): HTMLElement | null {
  return (el.shadowRoot?.querySelector('[role="dialog"]') as HTMLElement | null) ?? null;
}

/** What a named slot actually projects. */
export function projected(el: HTMLElement, name?: string): string {
  const root = el.shadowRoot;
  if (!root) return '∅ no shadow root';
  const slot = root.querySelector(name ? `slot[name="${name}"]` : 'slot:not([name])') as HTMLSlotElement | null;
  if (!slot) return `∅ no ${name ?? 'default'} slot`;
  return slot.assignedNodes({ flatten: false })
    .filter(node => !(node instanceof Element) || (node.getAttribute('slot') ?? '') === (name ?? ''))
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Documented: "Body scroll locked while open."
 *
 * Read from the inline STYLE ATTRIBUTE rather than from `body.style.overflow`.
 * happy-dom drops the style attribute entirely when a property is set to `''`
 * (which is exactly what the modal's own release does), and a later
 * `style.overflow = 'hidden'` then writes `style="overflow: hidden;"` while the
 * CSSOM accessor keeps answering `''`. The attribute is what the component
 * actually wrote, so the attribute is what this reads; both spellings are
 * accepted so the helper stays correct in a real browser too.
 */
export const bodyScrollLocked = (): boolean =>
  document.body.style.overflow === 'hidden'
  || /overflow:\s*hidden/.test(document.body.getAttribute('style') ?? '');

/** Put the page back the way a fresh document has it, between combos. */
export const releaseBodyScroll = (): void => document.body.removeAttribute('style');

/** Press a key on the dialog — the element whose keydown handler the doc describes. */
export function pressKey(el: HTMLElement, key: string, options: KeyboardEventInit = {}): void {
  dialogOf(el)?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true, ...options,
  }));
}

// ── The structural oracle ───────────────────────────────────────────────────

export function checkModal(el: HTMLElement, s: ModalSpec, problems: Problems): void {
  // ── The regions the doc lists as parts ───────────────────────────────────
  problems.check(backdropPart(el) !== null, 'no [part="backdrop"]');
  const panel = panelPart(el);
  if (!problems.check(panel !== null, 'no [part="panel"]')) return;

  problems.check(bodyPart(el) !== null, 'no [part="body"]');
  problems.equal(projected(el), BODY_TEXT, 'the default slot projects the body');

  // Documented: `no-header` / `no-footer` remove those sections outright.
  problems.equal(headerPart(el) !== null, !s.noHeader, '[part="header"] present');
  problems.equal(footerPart(el) !== null, !s.noFooter, '[part="footer"] present');
  if (!s.noHeader && s.header) {
    problems.equal(projected(el, 'header'), HEADER_TEXT, 'the header slot projects');
  }
  if (!s.noFooter && s.footer) {
    problems.equal(
      projected(el, 'footer'), `${FOOTER_CANCEL}${FOOTER_CONFIRM}`,
      'the footer slot projects',
    );
  }

  // Documented: the close button lives in the header, and `no-close-button`
  // takes it away. A modal with no header has nowhere to put one.
  const close = closePart(el);
  problems.equal(close !== null, !s.noCloseButton && !s.noHeader, '[part="close"] present');
  if (close) {
    // Documented verbatim: 'Close button labelled "Close modal"'.
    problems.equal(close.getAttribute('aria-label'), 'Close modal', 'the close button label');
  }

  // ── The documented ARIA surface ──────────────────────────────────────────
  const dialog = dialogOf(el);
  if (!problems.check(dialog !== null, 'no role="dialog" element')) return;
  problems.equal(dialog!.getAttribute('aria-modal'), 'true', 'aria-modal');
  // "Always provide a non-empty aria-label" — a dialog with no name is a
  // dialog a screen reader announces as nothing at all.
  problems.check(
    (dialog!.getAttribute('aria-label') ?? '').length > 0,
    'the dialog has no accessible name',
  );
  if (s.label) problems.equal(dialog!.getAttribute('aria-label'), s.label, 'aria-label');
  problems.equal(dialog!.getAttribute('aria-hidden'), String(!s.open), 'aria-hidden');

  problems.equal((el as any).open, s.open, 'open property');
  problems.equal((el as any).size, s.size, 'size property');
}

/** Every focusable node inside the modal, light DOM and shadow alike. */
export function focusables(el: HTMLElement): HTMLElement[] {
  const SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const panel = panelPart(el);
  return [
    ...(panel ? [...panel.querySelectorAll<HTMLElement>(SELECTOR)] : []),
    ...[...el.querySelectorAll<HTMLElement>(SELECTOR)],
  ].filter(node => !(node as any).disabled);
}

export { text };
