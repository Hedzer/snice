/**
 * snice-button matrix oracle.
 *
 * Every expectation below cites the line of `docs/ai/components/button.md` it
 * encodes. The button has no data pipeline, so the oracle's subject is the
 * documented shadow contract — the CSS parts, the native button it wraps, the
 * ARIA it exposes, and the activation rules that decide whether `button-click`
 * is allowed to fire at all.
 */
import { comboId, one, part, shadow, type Shape } from '../matrix-utils';
import '../../../packages/components/src/button/snice-button';

export const VARIANTS = ['default', 'primary', 'success', 'warning', 'danger', 'text'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const TYPES = ['button', 'submit', 'reset'] as const;
export const PLACEMENTS = ['start', 'end'] as const;
export const JUSTIFY = ['start', 'center', 'end'] as const;

/**
 * The style switches. `outline`, `pill` and `circle` are independent booleans
 * in the docs, but crossing all 2^3 of them against 6 variants x 3 sizes is 144
 * combos of pure CSS-class arithmetic — the table's mistake, not its lesson.
 * They are crossed as a four-way ENUM instead: each switch gets its own cell
 * against the full variant/size product, and their pairwise interactions are
 * covered once each in `STYLE_PAIRS`.
 */
export const STYLES = ['plain', 'outline', 'pill', 'circle'] as const;
export type Style = typeof STYLES[number];
export const STYLE_PAIRS: Array<[Style, Style]> = [
  ['outline', 'pill'],
  ['outline', 'circle'],
  ['pill', 'circle'],
];

/** How the icon reaches the button: not at all, the property, or the slot. */
export const ICON_MODES = ['none', 'property', 'slot'] as const;
export type IconMode = typeof ICON_MODES[number];

export interface ButtonCombo {
  variant: typeof VARIANTS[number];
  size: typeof SIZES[number];
  style: Style;
}

export const idOf = comboId;

export function styleFlags(style: Style | Style[]): Record<string, boolean> {
  const list = Array.isArray(style) ? style : [style];
  return {
    outline: list.includes('outline'),
    pill: list.includes('pill'),
    circle: list.includes('circle'),
  };
}

/** Light DOM for an icon-slot combo — the documented Material/FA shape. */
export const ICON_SLOT_HTML = '<span slot="icon" class="material-symbols-outlined">save</span>';

/**
 * DOCUMENTED (button.md "CSS Parts", "Properties", "Accessibility"):
 *
 *  · `base` is the button element, carries the authored `type`, is natively
 *    disabled exactly when the button is effectively disabled, and reports
 *    `aria-busy` for `loading`.
 *  · `spinner` and `label` always exist — they are unconditional parts.
 *  · `icon` exists exactly when an icon was supplied by the `icon` PROPERTY or
 *    the `icon` SLOT, and sits before or after the label per `iconPlacement`.
 */
export function expectedButtonShape(opts: {
  type?: typeof TYPES[number];
  effectiveDisabled?: boolean;
  loading?: boolean;
  iconMode?: IconMode;
  iconPlacement?: typeof PLACEMENTS[number];
}): Shape {
  const iconMode = opts.iconMode ?? 'none';
  const placement = opts.iconPlacement ?? 'start';
  return {
    baseTag: 'button',
    baseType: opts.type ?? 'button',
    baseDisabled: Boolean(opts.effectiveDisabled),
    ariaBusy: String(Boolean(opts.loading)),
    hasSpinner: true,
    hasLabel: true,
    iconSide: iconMode === 'none' ? 'none' : placement,
  };
}

/** The same shape, read back out of the rendered shadow tree. */
export function readButtonShape(button: HTMLElement): Shape {
  const base = part<HTMLButtonElement>(button, 'base');
  const label = part(button, 'label');
  const icon = part(button, 'icon');

  let iconSide: string = 'none';
  if (icon && label) {
    const position = icon.compareDocumentPosition(label);
    iconSide = position & Node.DOCUMENT_POSITION_FOLLOWING ? 'start' : 'end';
  } else if (icon) {
    iconSide = 'orphan';
  }

  return {
    baseTag: base?.tagName.toLowerCase() ?? 'none',
    baseType: base?.getAttribute('type') ?? 'none',
    baseDisabled: Boolean(base?.disabled),
    ariaBusy: base?.getAttribute('aria-busy') ?? 'missing',
    hasSpinner: !!part(button, 'spinner'),
    hasLabel: !!label,
    iconSide,
  };
}

/**
 * DOCUMENTED (button.md "Basic Usage"): a variant/size pair is a rendering
 * concern the DOM tier can only see through the class hook the stylesheet keys
 * off. The paint itself is the visual tier's job; here we assert only that the
 * variant and size the author declared reach the base element as distinct,
 * mutually exclusive hooks — i.e. a `size="large"` button never also claims to
 * be medium.
 */
export function readVariantHooks(button: HTMLElement): Shape {
  const base = part(button, 'base');
  const classes = (base?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  return {
    variantHooks: classes.filter(c => VARIANTS.some(v => c === `button--${v}`)).sort(),
    sizeHooks: classes.filter(c => SIZES.some(s => c === `button--${s}`)).sort(),
    styleHooks: classes.filter(c => ['button--outline', 'button--pill', 'button--circle'].includes(c)).sort(),
  };
}

/** The native <button> inside the shadow root — the activation target. */
export function nativeButton(button: HTMLElement): HTMLButtonElement | null {
  return one<HTMLButtonElement>(button, 'button');
}

/** Rendered label text (the default slot's fallback path is empty by design). */
export function labelText(button: HTMLElement): string {
  return (shadow(button).querySelector('[part~="label"]')?.textContent ?? '').trim();
}

// ── Activation ──────────────────────────────────────────────────────────────

/**
 * The documented activation MODES (button.md "URL Policy", "Target and
 * Download Semantics", "Basic Usage" > Form). Each one is a different answer to
 * "what does a click do", and the docs give them an explicit precedence:
 * a non-empty SAFE href beats `type="submit"`/`type="reset"`, and a non-empty
 * `download` beats `target`.
 */
export const MODES = [
  'plain', 'submit', 'reset', 'href', 'href-unsafe', 'href-target',
  'href-download', 'href-over-submit',
] as const;
export type Mode = typeof MODES[number];

/**
 * The documented GATES on activation. `disabled` and `fieldset` are the two
 * halves of effective disabledness ("Disabled Fieldset Contract"); `loading` is
 * the separate non-disabled block from the `button-click` contract ("only after
 * an enabled, non-loading activation").
 */
export const GATES = ['enabled', 'disabled', 'loading', 'fieldset'] as const;
export type Gate = typeof GATES[number];

/**
 * The activation ENTRY POINTS the docs name: a real pointer click on the
 * control, and the public `click()` method ("blocks pointer, keyboard,
 * internal synthetic, and public `click()` activation").
 */
export const ENTRIES = ['pointer', 'public'] as const;
export type Entry = typeof ENTRIES[number];

/** A hash target is the only navigation happy-dom can perform without leaving. */
export const HASH_TARGET = '#snice-button-matrix';
export const SAFE_PATH = '/matrix/report';
export const UNSAFE_HREF = 'javascript:globalThis.__sniceMatrixInjected++';
export const DOWNLOAD_NAME = 'matrix-report.pdf';

/** What a click did, in the terms the documentation describes activation in. */
export interface Activation {
  buttonClick: number;
  opened: string[];
  downloaded: string[];
  submitted: number;
  reset: number;
  hash: string;
}

/**
 * DOCUMENTED oracle. Given the mode and the gate, what must a click produce?
 *
 *  · Effective disabledness (`disabled` OR fieldset) and `loading` block EVERY
 *    channel: "A blocked activation performs no form action, navigation,
 *    popup, download, or `button-click` dispatch."
 *  · A rejected `href` is likewise a full stop: "A rejected `href` stops
 *    activation: no location/history change, popup, download, form
 *    submit/reset, native click propagation, or `button-click` event."
 *  · Otherwise exactly one channel fires, and `button-click` follows it.
 */
export function expectedActivation(mode: Mode, gate: Gate, hash = HASH_TARGET): Activation {
  const blocked = gate !== 'enabled' || mode === 'href-unsafe';
  const none: Activation = {
    buttonClick: 0, opened: [], downloaded: [], submitted: 0, reset: 0, hash: '',
  };
  if (blocked) return none;

  switch (mode) {
    case 'plain':
      return { ...none, buttonClick: 1 };
    case 'submit':
      return { ...none, buttonClick: 1, submitted: 1 };
    case 'reset':
      return { ...none, buttonClick: 1, reset: 1 };
    case 'href':
      // No target: navigate the current page. The hash IS the observable.
      return { ...none, buttonClick: 1, hash };
    case 'href-target':
      return { ...none, buttonClick: 1, opened: [`${SAFE_PATH}|_blank|noopener`] };
    case 'href-download':
      // "Non-empty `download` takes precedence over `target`: … do not call
      // `window.open`."
      return { ...none, buttonClick: 1, downloaded: [`${SAFE_PATH}|${DOWNLOAD_NAME}`] };
    case 'href-over-submit':
      // "A non-empty safe `href` … takes precedence over type='submit'."
      return { ...none, buttonClick: 1, hash };
    default:
      return none;
  }
}

/**
 * The authored property vector for a mode — the page an author would write.
 *
 * `hash` is per-combo rather than constant: a same-document navigation to the
 * hash the document is ALREADY on is not a navigation, so a shared target would
 * make every combo after the first indistinguishable from a blocked one.
 */
export function modeAttrs(mode: Mode, hash = HASH_TARGET): Record<string, any> {
  switch (mode) {
    case 'plain': return { type: 'button' };
    case 'submit': return { type: 'submit' };
    case 'reset': return { type: 'reset' };
    case 'href': return { href: hash };
    case 'href-unsafe': return { href: UNSAFE_HREF };
    case 'href-target': return { href: SAFE_PATH, target: '_blank' };
    case 'href-download': return { href: SAFE_PATH, download: DOWNLOAD_NAME, target: '_blank' };
    case 'href-over-submit': return { type: 'submit', href: hash };
    default: return {};
  }
}

/** The authored property vector for a gate (fieldset is applied post-mount). */
export function gateAttrs(gate: Gate): Record<string, any> {
  if (gate === 'disabled') return { disabled: true };
  if (gate === 'loading') return { loading: true };
  return {};
}
