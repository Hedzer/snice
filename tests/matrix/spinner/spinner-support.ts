/**
 * snice-spinner matrix oracle.
 *
 * Every expectation cites the line of `docs/ai/components/spinner.md` it
 * encodes. The spinner is PURELY PRESENTATIONAL — no data, no interaction, no
 * state — so per .ai/fuzzing.md its matrix is deliberately small, and the DOM
 * tier's only honest subject is the structure the docs promise: which variant
 * part is rendered, that the caption has exactly one path, and that the
 * documented `role`/`aria-label` are there. Everything about the ANIMATION is
 * the visual tier's job.
 */
import { shadow, text, type Shape } from '../matrix-utils';
import '../../../packages/components/src/spinner/snice-spinner';

export const SIZES = ['small', 'medium', 'large', 'xl'] as const;
export type Size = typeof SIZES[number];

export const COLORS = ['primary', 'success', 'warning', 'error', 'info'] as const;
export type Color = typeof COLORS[number];

export const VARIANTS = ['arc', 'dots', 'pulse', 'orbit', 'bars'] as const;
export type Variant = typeof VARIANTS[number];

/**
 * DOCUMENTED ("CSS Parts"): "`circle` - Arc variant's SVG circle" and
 * "`dots` / `pulse` / `orbit` / `bars` - Variant wrapper parts". Each variant
 * renders ITS part and no other.
 */
export const PART_FOR: Record<Variant, string> = {
  arc: 'circle', dots: 'dots', pulse: 'pulse', orbit: 'orbit', bars: 'bars',
};

export const ALL_VARIANT_PARTS = Object.values(PART_FOR);

/** `part()` with real `~=` token semantics (happy-dom's is not token-exact). */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  for (const node of shadow(el).querySelectorAll('[part]')) {
    if ((node.getAttribute('part') ?? '').split(/\s+/).includes(name)) return node as unknown as T;
  }
  return null;
}

export interface SpinnerCombo {
  variant: Variant;
  size: Size;
  color: Color;
  label: string;
}

/**
 * DOCUMENTED structure:
 *   · "`base` - Outer spinner container", carrying "`role="status"` with
 *     `aria-label`";
 *   · exactly the variant's own wrapper part;
 *   · "`label` - Label text element" — the caption, which exists when there is
 *     a label to show;
 *   · "`label` … the only caption path; stray slotted text never renders" —
 *     so the shadow tree offers NO slot at all.
 */
export function expectedShape(combo: SpinnerCombo): Shape {
  const parts: Record<string, boolean> = {};
  for (const name of ALL_VARIANT_PARTS) parts[`part:${name}`] = name === PART_FOR[combo.variant];
  return {
    hasBase: true,
    role: 'status',
    // The docs promise an aria-label, and that the `label` property is what
    // provides the caption. They do not name the fallback text used when no
    // label is authored, so the unlabelled case asserts only that the
    // announcement is not empty.
    ariaLabelled: true,
    ...(combo.label ? { ariaLabel: combo.label } : {}),
    hasLabelPart: combo.label !== '',
    labelText: combo.label,
    hasSlot: false,
    ...parts,
  };
}

export function readShape(el: HTMLElement): Shape {
  const base = part(el, 'base');
  const label = part(el, 'label');
  const parts: Record<string, boolean> = {};
  for (const name of ALL_VARIANT_PARTS) parts[`part:${name}`] = !!part(el, name);
  const ariaLabel = base?.getAttribute('aria-label') ?? '';
  return {
    hasBase: !!base,
    role: base?.getAttribute('role') ?? 'none',
    ariaLabelled: ariaLabel.length > 0,
    ariaLabel,
    hasLabelPart: !!label,
    labelText: text(label),
    hasSlot: !!shadow(el).querySelector('slot'),
    ...parts,
  };
}

/**
 * The rendered SIZE of the loader, in the one unit each variant exposes to the
 * DOM: the arc's viewBox, and the inline pixel dimensions the other variants
 * set. The docs give no pixel table, so the matrix asserts the ORDERING the
 * documented size scale implies (small < medium < large < xl) rather than
 * inventing numbers the docs never promised.
 */
export function renderedSize(el: HTMLElement, variant: Variant): number {
  if (variant === 'arc') {
    const svg = part<SVGElement>(el, 'circle');
    const viewBox = svg?.getAttribute('viewBox') ?? '';
    return Number(viewBox.split(/\s+/)[2] ?? 0);
  }
  const wrapper = part<HTMLElement>(el, PART_FOR[variant]);
  const style = wrapper?.getAttribute('style') ?? '';
  const match = style.match(/(?:width|--dot-size|--bar-height)\s*:\s*([\d.]+)px/);
  return Number(match?.[1] ?? 0);
}

/** The arc's stroke geometry — the only place `thickness` is documented to act. */
export function arcRadius(el: HTMLElement): number {
  const bar = shadow(el).querySelector('.spinner__circle-bar');
  return Number(bar?.getAttribute('r') ?? 0);
}
