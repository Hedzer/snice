/**
 * snice-badge matrix oracle.
 *
 * Every expectation cites the line of `docs/ai/components/badge.md` it encodes.
 * The badge has no interaction surface at all: its entire contract is
 * "given this property vector, is there an indicator, and what does it say".
 * That makes the oracle unusually literal — one function turns a combo into the
 * documented indicator, and one reads the rendered indicator back.
 */
import { part, shadow, text, type Shape } from '../matrix-utils';
import '../../../packages/components/src/badge/snice-badge';

export const VARIANTS = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const POSITIONS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;

/**
 * How the badge is given something to show. These are the five documented
 * content shapes plus the empty one — the axis the visibility rule is written
 * against ("hidden when there is no dot, non-empty `content`, positive `count`,
 * or `showZero`").
 */
export const SOURCES = ['empty', 'content', 'count', 'count-over-max', 'count-zero', 'dot'] as const;
export type Source = typeof SOURCES[number];

export const CONTENT_TEXT = 'New';

/** The property vector a source authors. `max` is an axis of its own. */
export function sourceProps(source: Source, max: number): Record<string, any> {
  switch (source) {
    case 'content': return { content: CONTENT_TEXT };
    case 'count': return { count: 3 };
    case 'count-over-max': return { count: max + 51 };
    case 'count-zero': return { count: 0 };
    case 'dot': return { dot: true };
    default: return {};
  }
}

export interface BadgeCombo {
  source: Source;
  showZero: boolean;
  max: number;
}

/**
 * DOCUMENTED (badge.md, the paragraph under "Properties"):
 *
 *   "The indicator is hidden when there is no dot, non-empty `content`,
 *    positive `count`, or `showZero`."
 *
 * Read as written, that is a disjunction: the indicator SHOWS when any of the
 * four holds. The same sentence gives the precedence the display text follows —
 * dot, then content, then count.
 */
export function expectedVisible(combo: BadgeCombo): boolean {
  const props = sourceProps(combo.source, combo.max);
  return Boolean(props.dot)
    || (props.content ?? '') !== ''
    || (props.count ?? 0) > 0
    || combo.showZero;
}

/**
 * DOCUMENTED (badge.md "Properties" + "Basic Usage"): a dot has no text;
 * `content` is text as authored; a count renders as its number, and
 * `count=150 max=99` renders `99+`; `showZero` "render[s] 0 instead of hiding".
 */
export function expectedText(combo: BadgeCombo): string {
  const props = sourceProps(combo.source, combo.max);
  if (props.dot) return '';
  if ((props.content ?? '') !== '') return String(props.content);
  const count = props.count ?? 0;
  if (count > 0) return count > combo.max ? `${combo.max}+` : String(count);
  if (combo.showZero && count === 0) return '0';
  return '';
}

/**
 * DOCUMENTED (badge.md "CSS Parts" + "Accessibility"):
 *   · `base` is the outer wrapper and always exists — the slotted content it
 *     overlays "remains available" whether or not there is an indicator;
 *   · `badge` is the indicator element, and exists only when the badge shows;
 *   · the indicator carries `role="status"` and a descriptive `aria-label`.
 */
export function expectedShape(combo: BadgeCombo): Shape {
  const visible = expectedVisible(combo);
  return {
    hasBase: true,
    hasDefaultSlot: true,
    hasBadge: visible,
    badgeText: expectedText(combo),
    role: visible ? 'status' : 'none',
    ariaLabelPresent: visible,
  };
}

export function readShape(badge: HTMLElement): Shape {
  const base = part(badge, 'base');
  const indicator = part(badge, 'badge');
  return {
    hasBase: !!base,
    hasDefaultSlot: !!shadow(badge).querySelector('slot:not([name])'),
    hasBadge: !!indicator,
    badgeText: text(indicator),
    role: indicator?.getAttribute('role') ?? 'none',
    ariaLabelPresent: (indicator?.getAttribute('aria-label') ?? '').length > 0,
  };
}

/** The indicator's accessible name, for the label-fallback slice. */
export function ariaLabel(badge: HTMLElement): string {
  return part(badge, 'badge')?.getAttribute('aria-label') ?? '';
}

/**
 * The style hooks. The badge's stylesheet keys off HOST ATTRIBUTES
 * (`:host([variant="primary"]) .badge`, `:host([size="small"])`,
 * `:host([position="top-left"])`, `:host([inline])`), so on the DOM tier the
 * documented appearance reduces to: does the authored value reach the host as
 * the attribute the stylesheet selects on, and does `pulse`/`dot` reach the
 * indicator as its class? Reflection is the framework contract from
 * docs/ai/properties.md ("Reflect property setter changes to corresponding
 * attributes unless `reflect: false`"), which is what makes property-authored
 * badges paint at all.
 */
/** The documented defaults (badge.md "Properties"). */
export const DEFAULTS = { variant: 'default', size: 'medium', position: 'top-right' } as const;

/**
 * DOCUMENTED (docs/ai/properties.md "Initial field values … are NOT reflected
 * to attributes. Only changes made via the property setter are reflected"):
 * assigning the value a property ALREADY holds is not a setter change, so a
 * badge left at a documented default carries no attribute for it. The badge's
 * stylesheet is written for exactly that — `:host(:not([position])) .badge`
 * carries the top-right rule, `:host(:not([variant]))` the default colour — so
 * "no attribute" is the correct, painted answer rather than a missing one.
 */
export function expectedHooks(vector: {
  variant?: string; size?: string; position?: string;
  inline?: boolean; dot?: boolean; pulse?: boolean;
}): Shape {
  const reflected = (key: keyof typeof DEFAULTS) => {
    const value = vector[key];
    return value === undefined || value === DEFAULTS[key] ? 'none' : value;
  };
  return {
    variantAttr: reflected('variant'),
    sizeAttr: reflected('size'),
    positionAttr: reflected('position'),
    inlineAttr: Boolean(vector.inline),
    dotClass: Boolean(vector.dot),
    pulseClass: Boolean(vector.pulse),
  };
}

export function readHooks(badge: HTMLElement): Shape {
  const indicator = part(badge, 'badge');
  const classes = (indicator?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  return {
    variantAttr: badge.getAttribute('variant') ?? 'none',
    sizeAttr: badge.getAttribute('size') ?? 'none',
    positionAttr: badge.getAttribute('position') ?? 'none',
    inlineAttr: badge.hasAttribute('inline'),
    dotClass: classes.includes('badge--dot'),
    pulseClass: classes.includes('badge--pulse'),
  };
}
