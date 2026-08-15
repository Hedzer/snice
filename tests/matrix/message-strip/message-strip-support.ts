/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-message-strip matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is read off `docs/ai/components/message-strip.md` and
 * `snice-message-strip.types.ts`:
 *
 *   variant: info|success|warning|danger = 'info'
 *   dismissible: boolean = false          renders the `dismiss` control
 *   icon: string = ''                     custom icon; "none" HIDES the icon
 *   show() / hide()                       hide() slides out
 *   event: dismiss → { variant }
 *   slots: (default) message content, `icon` custom icon element
 *   parts: icon, content, dismiss
 *
 * Two deliberate boundaries:
 *
 *   · the doc gives message-strip NO accessibility section, so this oracle
 *     asserts nothing about `role` or `aria-live`. A matrix may only hold a
 *     component to what it promises; asserting the ARIA surface here would be
 *     deriving expectations from observed output, which `.ai/fuzzing.md`
 *     forbids. (It is asserted for the components whose docs DO promise it.)
 *   · the strip's root element carries no `part`, so it is addressed as "the
 *     parent of `[part=content]`" rather than by class name — the documented
 *     part is the anchor, the class is not.
 */
import { Problems, text } from '../matrix-kit';
import { exactPart } from '../part-exact';
import type { MessageStripVariant } from
  '../../../packages/components/src/message-strip/snice-message-strip.types';

export type { MessageStripVariant };

export const VARIANTS: MessageStripVariant[] = ['info', 'success', 'warning', 'danger'];

/**
 * The documented ways to drive the icon.
 *
 *   default  — `icon` unset: the strip shows its own variant icon
 *   custom   — `icon="🔔"`: the strip shows what was asked for
 *   none     — `icon="none"`: the doc's explicit hide switch
 *   slotted  — a `slot="icon"` child: the doc's `icon` SLOT
 */
export type IconMode = 'default' | 'custom' | 'none' | 'slotted';
export const ICON_MODES: IconMode[] = ['default', 'custom', 'none', 'slotted'];

export const CUSTOM_ICON = 'bell';
export const SLOTTED_ICON_TEXT = '★';
export const MESSAGE = 'Your changes have been saved.';

/** The light DOM for a combo: the message, plus a slotted icon when asked for. */
export function lightDomFor(mode: IconMode): string {
  const icon = mode === 'slotted' ? `<span slot="icon">${SLOTTED_ICON_TEXT}</span>` : '';
  return `${icon}${MESSAGE}`;
}

/** The `icon` property value a mode implies. */
export function iconFor(mode: IconMode): string {
  if (mode === 'custom') return CUSTOM_ICON;
  if (mode === 'none') return 'none';
  return '';
}

/** Documented: `icon="none"` hides the icon; every other mode shows one. */
export const showsIcon = (mode: IconMode): boolean => mode !== 'none';

// ── Readers ─────────────────────────────────────────────────────────────────

export const iconPart = (el: HTMLElement): HTMLElement | null => exactPart(el, 'icon');
export const contentPart = (el: HTMLElement): HTMLElement | null => exactPart(el, 'content');
export const dismissPart = (el: HTMLElement): HTMLElement | null => exactPart(el, 'dismiss');

/** The strip's root box — the parent of the documented `content` part. */
export function rootOf(el: HTMLElement): HTMLElement | null {
  return (contentPart(el)?.parentElement as HTMLElement | null) ?? null;
}

/**
 * The text the default slot actually projects. `textContent` of the shadow tree
 * never includes slotted light DOM, so `assignedNodes()` is the only way to
 * assert "the message reached the content area".
 */
export function projectedMessage(el: HTMLElement): string {
  const slot = contentPart(el)?.querySelector('slot:not([name])') as HTMLSlotElement | null;
  if (!slot) return '∅ no default slot';
  return slot.assignedNodes({ flatten: true })
    // A child carrying `slot="icon"` belongs to the ICON slot and a browser
    // never projects it into the default one. happy-dom assigns it to both, so
    // the filter restores the platform's own rule; without it this reader would
    // report the strip's icon as part of its message, which is a fact about the
    // test environment and not about the component.
    .filter(node => !(node instanceof Element) || !node.hasAttribute('slot'))
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** What the `icon` slot projects, if anything. */
export function projectedIcon(el: HTMLElement): string {
  const slot = iconPart(el)?.querySelector('slot[name="icon"]') as HTMLSlotElement | null;
  if (!slot) return '∅ no icon slot';
  return slot.assignedNodes({ flatten: false })
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Is the strip hidden? The documented state after `hide()` completes.
 *
 * happy-dom applies the component's own stylesheet (`css: true` in
 * vitest.config.ts), so the *rendered* answer is the computed display of the
 * strip root — the same thing a user would see — rather than a class name.
 */
export function isHidden(el: HTMLElement): boolean {
  const root = rootOf(el);
  if (!root) return true;
  return getComputedStyle(root).display === 'none';
}

/** The animation end that completes a documented slide-out. */
export function finishSlideOut(el: HTMLElement): void {
  const root = rootOf(el);
  if (!root) return;
  const event = new Event('animationend', { bubbles: true, composed: true });
  (event as any).animationName = 'stripSlideOut';
  root.dispatchEvent(event);
}

// ── The structural oracle ───────────────────────────────────────────────────

export function checkStructure(
  el: HTMLElement,
  mode: IconMode,
  dismissible: boolean,
  problems: Problems,
): void {
  const content = contentPart(el);
  if (!problems.check(content !== null, 'no [part="content"]')) return;
  problems.equal(projectedMessage(el), MESSAGE, 'projected message');

  const icon = iconPart(el);
  problems.equal(icon !== null, showsIcon(mode), `[part="icon"] present for icon mode "${mode}"`);
  if (icon) {
    // Every icon mode has to put something in the icon area — an empty icon
    // container is a gap in the layout, not an icon.
    const projected = projectedIcon(el);
    const rendered = text(icon);
    problems.check(
      projected.length > 0 || rendered.length > 0 || icon.querySelector('svg') !== null,
      `icon mode "${mode}" rendered an empty [part="icon"]`,
    );
    if (mode === 'slotted') {
      problems.equal(projected, SLOTTED_ICON_TEXT, 'the icon slot projects its child');
    }
  }

  const dismiss = dismissPart(el);
  problems.equal(dismiss !== null, dismissible, '[part="dismiss"] present');
  if (dismiss) {
    // A dismiss control with no accessible name is a mystery button.
    problems.check(
      (dismiss.getAttribute('aria-label') ?? '').length > 0 || text(dismiss).length > 0,
      'the dismiss control has neither a label nor text',
    );
  }

  problems.check(!isHidden(el), 'a freshly mounted strip is already hidden');
}
