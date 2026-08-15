/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-progress-ring matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is read off `docs/ai/components/progress-ring.md` and
 * `snice-progress-ring.types.ts`:
 *
 *   value: number = 0                 0 to max
 *   max: number = 100
 *   size: small|medium|large          presentation only
 *   thickness: number = 4             ring stroke width
 *   color: string = ''                custom ring colour (a CSS value)
 *   showValue: boolean = false        attr `show-value`; % in the centre
 *   label: string = ''                custom centre text
 *   event: progress-complete → { value, max, component }   value reached max
 *   parts: base (role="progressbar"), track, fill, center, value, label
 *   a11y: role="progressbar" with aria-valuenow / aria-valuemin / aria-valuemax;
 *         "Label or percentage used as aria-label"
 *
 * The one derivation worth spelling out: the doc calls this a DETERMINATE
 * indicator with an "animated SVG ring fill". A determinate ring's fill is the
 * fraction of the circle it covers, and an SVG ring covers `dasharray -
 * dashoffset` of its circumference. So the oracle's ring-fill question is
 *
 *     1 - dashoffset / dasharray  ==  value / max
 *
 * which is a statement about the documented meaning of the component, not about
 * the arithmetic its source happens to use. `thickness` shrinks the radius, so
 * the circumference changes with it — which is exactly why the oracle reads the
 * dasharray back rather than hard-coding a number.
 */
import { Problems, text } from '../matrix-kit';
import { exactPart } from '../part-exact';
import type { ProgressRingSize } from
  '../../../packages/components/src/progress-ring/snice-progress-ring.types';

export type { ProgressRingSize };

export const SIZES: ProgressRingSize[] = ['small', 'medium', 'large'];
export const THICKNESSES = [2, 4, 8] as const;
export const LABELS = ['', 'CPU'] as const;

/** Documented in-range values, plus the two boundaries. */
export const VALUES = [0, 25, 50, 99, 100] as const;
export const MAXES = [100, 200, 1] as const;

export interface RingCombo {
  value: number;
  max: number;
  size?: ProgressRingSize;
  thickness?: number;
  showValue?: boolean;
  label?: string;
  color?: string;
}

/**
 * The documented percentage: `value` as a fraction of `max`, clamped to the
 * 0–100 the doc's own range implies. A `max` of zero makes the fraction
 * meaningless, and nothing can be a fraction of nothing, so it is 0.
 */
export function percentOf(value: number, max: number): number {
  if (!(max > 0)) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/** The centre text the doc promises: the label if there is one, else the %. */
export function centreTextOf(combo: RingCombo): string {
  return combo.label ? combo.label : `${Math.round(percentOf(combo.value, combo.max))}%`;
}

/** Documented: the centre exists when there is something to put in it. */
export const showsCentre = (combo: RingCombo): boolean =>
  Boolean(combo.showValue || combo.label);

// ── Readers ─────────────────────────────────────────────────────────────────

export const basePart = (el: HTMLElement): HTMLElement | null => exactPart(el, 'base');
export const trackPart = (el: HTMLElement): SVGElement | null => exactPart<SVGElement>(el, 'track');
export const fillPart = (el: HTMLElement): SVGElement | null => exactPart<SVGElement>(el, 'fill');
export const centrePart = (el: HTMLElement): HTMLElement | null => exactPart(el, 'center');
export const valuePart = (el: HTMLElement): HTMLElement | null => exactPart(el, 'value');
export const labelPart = (el: HTMLElement): HTMLElement | null => exactPart(el, 'label');

/** The fraction of the ring the fill covers, read back off the SVG. */
export function filledFraction(fill: SVGElement): number | null {
  const dasharray = parseFloat(fill.getAttribute('stroke-dasharray') ?? '');
  const dashoffset = parseFloat(fill.getAttribute('stroke-dashoffset') ?? '');
  if (!Number.isFinite(dasharray) || !Number.isFinite(dashoffset) || dasharray <= 0) return null;
  return 1 - dashoffset / dasharray;
}

// ── The oracle ──────────────────────────────────────────────────────────────

/** Everything the docs promise about a mounted ring, in one pass. */
export function checkRing(el: HTMLElement, combo: RingCombo, problems: Problems): void {
  const percent = percentOf(combo.value, combo.max);

  // ── The progressbar contract ─────────────────────────────────────────────
  const base = basePart(el);
  if (!problems.check(base !== null, 'no [part="base"]')) return;
  problems.equal(base!.getAttribute('role'), 'progressbar', 'role');
  problems.equal(base!.getAttribute('aria-valuenow'), String(combo.value), 'aria-valuenow');
  problems.equal(base!.getAttribute('aria-valuemin'), '0', 'aria-valuemin');
  problems.equal(base!.getAttribute('aria-valuemax'), String(combo.max), 'aria-valuemax');
  // "Label or percentage used as aria-label" — a progressbar with no accessible
  // name is unreadable to a screen reader, whatever it draws.
  problems.equal(
    base!.getAttribute('aria-label'),
    combo.label ? combo.label : `${Math.round(percent)}% complete`,
    'aria-label',
  );

  // ── The ring itself ──────────────────────────────────────────────────────
  const track = trackPart(el);
  const fill = fillPart(el);
  problems.check(track !== null, 'no [part="track"] circle');
  if (!problems.check(fill !== null, 'no [part="fill"] circle')) return;

  const thickness = combo.thickness ?? 4;
  problems.equal(fill!.getAttribute('stroke-width'), String(thickness), 'fill stroke-width');
  problems.equal(track?.getAttribute('stroke-width'), String(thickness), 'track stroke-width');
  // Track and fill are the SAME circle drawn twice: a mismatch would paint two
  // rings of different sizes on top of each other.
  problems.equal(fill!.getAttribute('r'), track?.getAttribute('r'), 'fill radius vs track radius');
  problems.equal(fill!.getAttribute('cx'), track?.getAttribute('cx'), 'fill centre x vs track');
  problems.equal(fill!.getAttribute('cy'), track?.getAttribute('cy'), 'fill centre y vs track');

  const fraction = filledFraction(fill!);
  if (!problems.check(fraction !== null, 'the fill circle carries no dash geometry')) return;
  const expected = percent / 100;
  if (Math.abs(fraction! - expected) > 0.005) {
    problems.say(
      `ring fill covers ${(fraction! * 100).toFixed(2)}% of the circle,`
      + ` expected ${percent.toFixed(2)}% (value ${combo.value} of ${combo.max})`,
    );
  }
  // A determinate ring may never over- or under-fill, whatever it is given.
  problems.check(fraction! >= -0.005 && fraction! <= 1.005,
    `ring fill fraction ${fraction} is outside 0..1`);

  // ── The centre ───────────────────────────────────────────────────────────
  const centre = centrePart(el);
  problems.equal(centre !== null, showsCentre(combo), '[part="center"] present');

  const label = labelPart(el);
  problems.equal(label !== null, Boolean(combo.label), '[part="label"] present');
  if (label) problems.equal(text(label), combo.label, 'label text');

  const value = valuePart(el);
  problems.equal(value !== null, Boolean(combo.showValue), '[part="value"] present');
  if (value) problems.equal(text(value), `${Math.round(percent)}%`, 'percentage text');
}

/** The documented colour channel: a custom ring colour reaches the host. */
export function checkColour(el: HTMLElement, colour: string, problems: Problems): void {
  const set = el.style.getPropertyValue('--progress-ring-color');
  if (colour) {
    problems.equal(set, colour, `color="${colour}" custom property`);
  } else {
    problems.check(set === '', `no colour was set but --progress-ring-color is "${set}"`);
  }
}
