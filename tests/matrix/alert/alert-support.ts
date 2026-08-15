/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-alert feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts`: ONE function
 * derives the expected rendered facts from the documented contract
 * (docs/ai/components/alert.md + snice-alert.types.ts) and ONE reads the actual
 * facts out of the shadow tree. Every matrix test compares the two objects
 * wholesale, so a failing combo reports every divergence at once instead of one
 * per re-run.
 *
 * `.ai/fuzzing.md` is binding here:
 *   · expectations come from the DOCS, never from observed output;
 *   · a divergence is a FINDING — the assertion stays, the test becomes
 *     `it.fails` under a `MATRIX-alert-N` id. Nothing in this module offers a
 *     way to weaken an assertion.
 *
 * Sizing: the alert is a small presentational component with one interaction
 * (dismiss) and one timer (duration). Its matrix is ~70 combos, not the table's
 * thousand.
 */
import { expect } from 'vitest';
import { wait, removeComponent } from '../../components/test-utils';
import '../../../packages/components/src/alert/snice-alert';

export { wait, removeComponent };

// ── Dimensions (docs/ai/components/alert.md "Properties") ───────────────────

export const VARIANTS = ['info', 'success', 'warning', 'error'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const APPEARANCES = ['filled', 'accent'] as const;

export type AlertVariant = typeof VARIANTS[number];
export type AlertSize = typeof SIZES[number];
export type AlertAppearance = typeof APPEARANCES[number];

/**
 * How the alert gets its icon. Documented:
 *   · `icon: string = ''` — "URL, emoji, or 'none'. Use icon slot for icon fonts."
 *   · slot `icon` — "Custom icon content (overrides `icon` property and default
 *     icons)"
 * so the axis is: the built-in default, an explicit opt-out, the two `icon`
 * property shapes the docs name (URL and emoji), the slot, and the slot
 * competing against the property — which is the precedence edge the docs pin.
 */
export const ICON_SOURCES = ['default', 'none', 'emoji', 'url', 'slot', 'slot+prop'] as const;
export type IconSource = typeof ICON_SOURCES[number];

export interface AlertCombo {
  variant: AlertVariant;
  size: AlertSize;
  appearance: AlertAppearance;
  iconSource: IconSource;
  titled: boolean;
  dismissible: boolean;
}

export const BASE: AlertCombo = {
  variant: 'info',
  size: 'medium',
  appearance: 'filled',
  iconSource: 'default',
  titled: false,
  dismissible: false,
};

export const combo = (patch: Partial<AlertCombo> = {}): AlertCombo => ({ ...BASE, ...patch });

export const comboId = (c: AlertCombo): string =>
  [
    c.variant, c.size, c.appearance, `icon:${c.iconSource}`,
    c.titled ? 'titled' : '',
    c.dismissible ? 'dismissible' : '',
  ].filter(Boolean).join('/');

// ── Fixtures ────────────────────────────────────────────────────────────────

export const MESSAGE = 'Your changes were saved.';
export const TITLE = 'Heads up';
export const EMOJI_ICON = '🚀';
export const URL_ICON = '/icons/info.svg';
export const SLOT_ICON = 'SLOTICON';

/**
 * Mount one combo as authored HTML would deliver it: attributes and light-DOM
 * children in place BEFORE connection, because the alert reads its `icon` slot
 * during the first render. Appending afterwards would measure a render the
 * documented markup never produces.
 */
export async function makeAlert(c: AlertCombo): Promise<any> {
  const el = document.createElement('snice-alert') as any;
  el.setAttribute('variant', c.variant);
  el.setAttribute('size', c.size);
  el.setAttribute('appearance', c.appearance);
  if (c.titled) el.setAttribute('title', TITLE);
  if (c.dismissible) el.setAttribute('dismissible', '');

  if (c.iconSource === 'none') el.setAttribute('icon', 'none');
  if (c.iconSource === 'emoji' || c.iconSource === 'slot+prop') el.setAttribute('icon', EMOJI_ICON);
  if (c.iconSource === 'url') el.setAttribute('icon', URL_ICON);

  el.appendChild(document.createTextNode(MESSAGE));
  if (c.iconSource === 'slot' || c.iconSource === 'slot+prop') {
    const span = document.createElement('span');
    span.setAttribute('slot', 'icon');
    span.textContent = SLOT_ICON;
    el.appendChild(span);
  }

  document.body.appendChild(el);
  await el.ready;
  await wait(30);
  return el;
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface AlertFacts {
  /** CSS part `base` — "base — Root container". */
  hasBase: boolean;
  /** State classes the stylesheet keys on: `alert--<variant>`, `alert--<size>`. */
  baseClasses: string[];
  /** `appearance` is styled from the HOST attribute (`:host([appearance=…])`). */
  hostAppearance: string | null;
  /** `variant` and `size` likewise reach CSS through the host attribute. */
  hostVariant: string | null;
  hostSize: string | null;
  /** CSS part `icon` — present exactly when an icon is shown. */
  hasIconPart: boolean;
  /** What the reader actually sees as the icon: slotted node, or the fallback. */
  iconText: string;
  /** An `icon` property that is a URL renders an image. */
  iconImgSrc: string | null;
  /** Title block, rendered only when `title` is non-empty. */
  titleText: string | null;
  /** Default-slot message. */
  message: string;
  /** The dismiss affordance — present exactly when `dismissible`. */
  hasDismiss: boolean;
  /** "Dismiss button is keyboard accessible" — it must carry an accessible name. */
  dismissIsNamed: boolean;
  /** 'role="alert" with aria-live="polite"'. */
  role: string | null;
  ariaLive: string | null;
  /**
   * A `title` ATTRIBUTE on the host would paint a native browser tooltip over
   * the whole alert; `title` is documented as a property. The host must not
   * keep the attribute.
   */
  hostTitleAttr: string | null;
}

/** Whether the combo shows an icon at all — docs: `icon="none"` turns it off. */
export function showsIcon(c: AlertCombo): boolean {
  return c.iconSource !== 'none';
}

/**
 * EXPECTED facts, derived from docs/ai/components/alert.md only.
 *
 *  · variant/size/appearance — documented properties; the stylesheet selects on
 *    `:host([variant])`, `:host([size])`, `:host([appearance="accent"])`, so a
 *    documented value must be readable from the host.
 *  · icon — `'none'` suppresses; a URL becomes an image; an emoji becomes text;
 *    the slot "overrides `icon` property and default icons".
 *  · title — "title: string" renders above the message.
 *  · dismissible — renders the dismiss button, which is keyboard accessible.
 *  · a11y — `role="alert"` with `aria-live="polite"`.
 */
export function expectedFacts(c: AlertCombo): AlertFacts {
  const slotted = c.iconSource === 'slot' || c.iconSource === 'slot+prop';
  const iconText = !showsIcon(c) ? ''
    : slotted ? SLOT_ICON
    : c.iconSource === 'emoji' ? EMOJI_ICON
    : c.iconSource === 'url' ? ''
    : '';

  return {
    hasBase: true,
    baseClasses: ['alert', `alert--${c.variant}`, `alert--${c.size}`],
    hostAppearance: c.appearance,
    hostVariant: c.variant,
    hostSize: c.size,
    hasIconPart: showsIcon(c),
    iconText,
    // The slot wins over the property, so `slot+prop` shows NO image even
    // though its `icon` is set — that is the documented precedence.
    iconImgSrc: c.iconSource === 'url' ? URL_ICON : null,
    titleText: c.titled ? TITLE : null,
    message: MESSAGE,
    hasDismiss: c.dismissible,
    dismissIsNamed: c.dismissible,
    role: 'alert',
    ariaLive: 'polite',
    hostTitleAttr: null,
  };
}

/** ACTUAL facts, read from the rendered shadow tree. */
export function readFacts(el: any): AlertFacts {
  const sr = el.shadowRoot as ShadowRoot;
  const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
  const iconPart = sr.querySelector('.alert-icon') as HTMLElement | null;
  const region = sr.querySelector('.alert-region') as HTMLElement | null;
  const title = sr.querySelector('.alert-title') as HTMLElement | null;
  const dismiss = sr.querySelector('.alert-dismiss') as HTMLElement | null;
  const img = iconPart?.querySelector('img') as HTMLImageElement | null;

  return {
    hasBase: !!base,
    baseClasses: (base?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort(),
    hostAppearance: el.getAttribute('appearance'),
    hostVariant: el.getAttribute('variant'),
    hostSize: el.getAttribute('size'),
    hasIconPart: !!iconPart,
    iconText: readIconText(el),
    iconImgSrc: img ? img.getAttribute('src') : null,
    titleText: title ? collapse(title.textContent) : null,
    message: readMessage(el),
    hasDismiss: !!dismiss,
    dismissIsNamed: !!(dismiss?.getAttribute('aria-label') ?? '').trim(),
    role: region ? region.getAttribute('role') : null,
    ariaLive: region ? region.getAttribute('aria-live') : null,
    hostTitleAttr: el.getAttribute('title'),
  };
}

const collapse = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/**
 * The icon a reader actually sees.
 *
 * A `<slot name="icon">` with assigned nodes shows THOSE nodes; its fallback
 * children stay in the tree but are never painted. `textContent` cannot tell
 * the two apart, so assigned nodes are consulted first — that is the only way
 * to assert the documented "the icon slot overrides the icon property".
 */
export function readIconText(el: any): string {
  const slot = el.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement | null;
  if (!slot) return '';
  const assigned = slot.assignedNodes?.({ flatten: false }) ?? [];
  if (assigned.length) {
    return collapse(assigned.map(n => n.textContent ?? '').join(''));
  }
  // Fallback content — the `icon` property or the built-in default SVG. An
  // <img> contributes no text, which is what the URL case expects.
  return collapse(slot.textContent);
}

/** The default-slot message the alert projects. */
export function readMessage(el: any): string {
  const slot = el.shadowRoot?.querySelector('.alert-description slot') as HTMLSlotElement | null;
  const assigned = slot?.assignedNodes?.({ flatten: false }) ?? [];
  return collapse(assigned
    .filter((n: Node) => !(n as Element).getAttribute?.('slot'))
    .map((n: Node) => n.textContent ?? '')
    .join(''));
}

/** The base classes the oracle expects, in the same normalised form. */
function normaliseExpected(facts: AlertFacts): AlertFacts {
  return { ...facts, baseClasses: [...facts.baseClasses].sort() };
}

/**
 * Compare a whole combo against the oracle, reporting EVERY divergence.
 * `skip` exists only so a slice can hold out a key it asserts separately under
 * a finding id — never to weaken an assertion.
 */
export function expectAlertMatches(
  el: any,
  c: AlertCombo,
  skip: ReadonlyArray<keyof AlertFacts> = [],
): void {
  const actual = readFacts(el);
  const expected = normaliseExpected(expectedFacts(c));
  const problems = (Object.keys(expected) as Array<keyof AlertFacts>)
    .filter(key => !skip.includes(key))
    .filter(key => JSON.stringify(actual[key]) !== JSON.stringify(expected[key]))
    .map(key => `${key}: ${JSON.stringify(actual[key])} != ${JSON.stringify(expected[key])}`);
  expect(problems, `combo ${comboId(c)}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record the documented events in dispatch order. */
export function collectEvents(
  el: HTMLElement,
  types = ['alert-dismiss', 'alert-shown', 'alert-hidden'],
): Seen[] {
  const seen: Seen[] = [];
  for (const type of types) {
    el.addEventListener(type, (e: Event) => seen.push({ type, detail: (e as CustomEvent).detail }));
  }
  return seen;
}

/** Click the dismiss affordance; false when the combo has none. */
export function clickDismiss(el: any): boolean {
  const button = el.shadowRoot.querySelector('.alert-dismiss') as HTMLElement | null;
  if (!button) return false;
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return true;
}

/**
 * Finish the hide animation.
 *
 * `alert-hidden` is documented as firing "after animation", and the component
 * waits for the `slideOut` animationend. happy-dom runs no animations, so the
 * matrix delivers the same event a browser would — this is a substitute for the
 * ENGINE, not for the component's logic.
 */
export function finishHideAnimation(el: any): void {
  const base = el.shadowRoot.querySelector('[part~="base"]') as HTMLElement;
  base.dispatchEvent(new (globalThis as any).AnimationEvent('animationend', {
    animationName: 'slideOut', bubbles: true, composed: true,
  }));
}

/** Is the alert in its hiding/hidden visual state? */
export function baseClassList(el: any): string[] {
  const base = el.shadowRoot.querySelector('[part~="base"]') as HTMLElement | null;
  return (base?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

/** Pointer enters/leaves the host — the documented countdown pause. */
export function hover(el: HTMLElement, type: 'mouseenter' | 'mouseleave'): void {
  el.dispatchEvent(new MouseEvent(type, { bubbles: false, composed: true }));
}

/** A finding title, per .ai/fuzzing.md. */
export const finding = (id: string, description: string): string => `${id}: ${description}`;
