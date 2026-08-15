/**
 * snice-progress matrix oracle.
 *
 * Every expectation cites the line of `docs/ai/components/progress.md` it
 * encodes. The progress bar has one computation — `getPercentage()`, documented
 * as returning "(0-100)" — and two renderings of it, so the oracle is that
 * computation plus the part/ARIA contract for each variant.
 */
import { shadow, text, type Shape } from '../matrix-utils';
import '../../../packages/components/src/progress/snice-progress';

export const VARIANTS = ['linear', 'circular'] as const;
export type Variant = typeof VARIANTS[number];

export const SIZES = ['small', 'medium', 'large', 'xl', 'xxl', 'xxxl'] as const;
export type Size = typeof SIZES[number];

export const SEMANTIC_COLORS = ['primary', 'success', 'warning', 'error', 'info'] as const;

/** `part()` with real `~=` token semantics — `circle`, `circle-bg`, `circle-bar`. */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  for (const node of shadow(el).querySelectorAll('[part]')) {
    if ((node.getAttribute('part') ?? '').split(/\s+/).includes(name)) return node as unknown as T;
  }
  return null;
}

export interface ValueCase {
  id: string;
  value: number;
  max: number;
  /** The documented percentage: `getPercentage()` returns 0-100. */
  percentage: number;
}

/**
 * DOCUMENTED ("Methods"): "`getPercentage()` - Get calculated percentage
 * (0-100)". The range in that signature is the contract: a value past `max` is
 * 100, a negative value is 0, and a degenerate `max` cannot produce a number
 * outside the range either.
 */
export const VALUE_CASES: ValueCase[] = [
  { id: 'empty', value: 0, max: 100, percentage: 0 },
  { id: 'half', value: 50, max: 100, percentage: 50 },
  { id: 'full', value: 100, max: 100, percentage: 100 },
  { id: 'over', value: 150, max: 100, percentage: 100 },
  { id: 'under', value: -10, max: 100, percentage: 0 },
  { id: 'fractional', value: 3, max: 7, percentage: (3 / 7) * 100 },
  { id: 'scaled', value: 5, max: 20, percentage: 25 },
  { id: 'zero-max', value: 5, max: 0, percentage: 0 },
];

export interface ProgressCombo {
  variant: Variant;
  useCase: ValueCase;
  indeterminate: boolean;
  showLabel?: boolean;
  label?: string;
}

/** The percentage the component must report, given the combo. */
export function expectedPercentage(combo: ProgressCombo): number {
  // DOCUMENTED: an indeterminate bar has no determinate progress to report.
  return combo.indeterminate ? 0 : combo.useCase.percentage;
}

/**
 * DOCUMENTED label text: `label` is the "Custom label text"; with `show-label`
 * and no custom text the bar shows its own percentage (the only other number it
 * has). The same text is the accessible name ("Label text used as `aria-label`").
 */
export function expectedLabelText(combo: ProgressCombo): string {
  return combo.label || `${Math.round(expectedPercentage(combo))}%`;
}

/**
 * DOCUMENTED structure:
 *   · "CSS Parts — Linear: `base`, `bar`, `label`; Circular: `base`, `circle`,
 *     `circle-bg`, `circle-bar`, `label`";
 *   · "Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`,
 *     `aria-valuemax`";
 *   · "Label text used as `aria-label`";
 *   · `show-label` is what makes the label part visible.
 */
export function expectedShape(combo: ProgressCombo): Shape {
  const circular = combo.variant === 'circular';
  return {
    hasBase: true,
    role: 'progressbar',
    valueNow: String(combo.useCase.value),
    valueMin: '0',
    valueMax: String(combo.useCase.max),
    ariaLabel: expectedLabelText(combo),
    hasBar: !circular,
    hasCircle: circular,
    hasCircleBg: circular,
    hasCircleBar: circular,
  };
}

export function readShape(el: HTMLElement): Shape {
  const base = part(el, 'base');
  return {
    hasBase: !!base,
    role: base?.getAttribute('role') ?? 'none',
    valueNow: base?.getAttribute('aria-valuenow') ?? 'none',
    valueMin: base?.getAttribute('aria-valuemin') ?? 'none',
    valueMax: base?.getAttribute('aria-valuemax') ?? 'none',
    ariaLabel: base?.getAttribute('aria-label') ?? 'none',
    hasBar: !!part(el, 'bar'),
    hasCircle: !!part(el, 'circle'),
    hasCircleBg: !!part(el, 'circle-bg'),
    hasCircleBar: !!part(el, 'circle-bar'),
  };
}

/**
 * The FILL, in the unit each variant paints it in: the linear bar's width
 * percentage, and the circular bar's stroke-dashoffset expressed as the
 * fraction of the ring that is filled. Both are converted back to a percentage
 * so one oracle covers both variants.
 */
export function readFillPercentage(el: HTMLElement, variant: Variant): number | null {
  if (variant === 'linear') {
    const bar = part<HTMLElement>(el, 'bar');
    const match = (bar?.getAttribute('style') ?? '').match(/width:\s*([\d.]+)%/);
    return match ? Number(match[1]) : null;
  }
  const bar = part<SVGCircleElement>(el, 'circle-bar');
  const dashArray = Number(bar?.getAttribute('stroke-dasharray') ?? 0);
  const dashOffset = Number(bar?.getAttribute('stroke-dashoffset') ?? 0);
  if (!dashArray) return null;
  return ((dashArray - dashOffset) / dashArray) * 100;
}

/** The label element, whichever variant rendered it. */
export function labelText(el: HTMLElement): string | null {
  const label = part(el, 'label');
  return label ? text(label) : null;
}

/** The circular geometry: the ring's box, for the size and thickness slices. */
export function ringBox(el: HTMLElement): number {
  const svg = part<SVGElement>(el, 'circle');
  return Number((svg?.getAttribute('viewBox') ?? '').split(/\s+/)[2] ?? 0);
}

export function ringRadius(el: HTMLElement): number {
  return Number(part<SVGCircleElement>(el, 'circle-bar')?.getAttribute('r') ?? 0);
}

/**
 * DOCUMENTED event ("Events"): `progress-change -> { value, max, percentage,
 * indeterminate }`.
 */
export function recordChanges(el: HTMLElement): any[] {
  const details: any[] = [];
  el.addEventListener('progress-change', (event: any) => details.push(event.detail));
  return details;
}

export function expectedChangeDetail(combo: ProgressCombo): Shape {
  return {
    value: combo.useCase.value,
    max: combo.useCase.max,
    percentage: expectedPercentage(combo),
    indeterminate: combo.indeterminate,
  };
}

export function readChangeDetail(detail: any): Shape {
  return {
    value: detail?.value,
    max: detail?.max,
    percentage: detail?.percentage,
    indeterminate: detail?.indeterminate,
  };
}
