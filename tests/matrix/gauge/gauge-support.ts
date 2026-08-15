/**
 * snice-gauge feature matrix — shared harness and oracle.
 *
 * The oracle below is derived from docs/ai/components/gauge.md and
 * packages/components/src/gauge/snice-gauge.types.ts, NOT from observed output:
 *
 *   · `value` is displayed against the `min`..`max` range, so the arc fill is
 *     the fraction (clamp(value) - min) / (max - min);
 *   · the element exposes `role="meter"` with aria-valuenow/min/max, and an
 *     aria-label taken from `label` or the documented fallback
 *     `Gauge: {value}`;
 *   · `showValue` governs the presence of the `value` part, `label` the
 *     presence of the `label` part;
 *   · `thickness` is the stroke width of both arcs;
 *   · `variant` and `size` are pure presentation, reflected onto the host as
 *     attributes (that is what the stylesheet's `:host([size=…])` /
 *     `:host([variant=…])` rules select on).
 *
 * Every assertion routes through `gaugeProblems`, which reports EVERY
 * violation of a combo at once rather than dying on the first.
 */
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/gauge/snice-gauge';
import type { GaugeVariant, GaugeSize } from '../../../packages/components/src/gauge/snice-gauge.types';

export { wait };

/** The gauge's SVG geometry is fixed by the component: radius 45 in a 120x70 box. */
export const ARC_RADIUS = 45;
export const ARC_LENGTH = Math.PI * ARC_RADIUS;

export interface GaugeCombo {
  id: string;
  value: number;
  min: number;
  max: number;
  label: string;
  variant: GaugeVariant;
  size: GaugeSize;
  showValue: boolean;
  thickness: number;
}

export const DEFAULTS: Omit<GaugeCombo, 'id'> = {
  value: 0,
  min: 0,
  max: 100,
  label: '',
  variant: 'default',
  size: 'medium',
  showValue: true,
  thickness: 8,
};

export function combo(id: string, overrides: Partial<GaugeCombo>): GaugeCombo {
  return { ...DEFAULTS, id, ...overrides };
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/**
 * Documented fill fraction. A range that is not positive cannot place a value
 * inside it, so it reads as empty; anything outside the range clamps to the
 * nearest end rather than overflowing the arc.
 */
export function expectedPercentage(c: Pick<GaugeCombo, 'value' | 'min' | 'max'>): number {
  const range = c.max - c.min;
  if (range <= 0) return 0;
  const clamped = Math.max(c.min, Math.min(c.max, c.value));
  return (clamped - c.min) / range;
}

/** The dash offset that paints exactly `expectedPercentage` of the arc. */
export function expectedFillOffset(c: Pick<GaugeCombo, 'value' | 'min' | 'max'>): number {
  return ARC_LENGTH * (1 - expectedPercentage(c));
}

/** The `value` part shows the value as a whole number. */
export function expectedValueText(c: Pick<GaugeCombo, 'value'>): string {
  return String(Math.round(c.value));
}

/** Documented accessible name: the label, or the `Gauge: {value}` fallback. */
export function expectedAriaLabel(c: Pick<GaugeCombo, 'label' | 'value'>): string {
  return c.label !== '' ? c.label : `Gauge: ${expectedValueText(c)}`;
}

// ── Harness ─────────────────────────────────────────────────────────────────

export async function mountGauge(c: GaugeCombo): Promise<any> {
  const el = await createComponent<any>('snice-gauge', {});
  el.min = c.min;
  el.max = c.max;
  el.value = c.value;
  el.label = c.label;
  el.variant = c.variant;
  el.size = c.size;
  el.showValue = c.showValue;
  el.thickness = c.thickness;
  await wait(20);
  return el;
}

const num = (el: Element | null, attr: string): number | null => {
  const raw = el?.getAttribute(attr);
  return raw === null || raw === undefined ? null : Number(raw);
};

/** Sub-pixel tolerance for the float arithmetic the arc geometry is built on. */
const EPS = 1e-6;

/**
 * The core assertion: every documented consequence of `c`, checked against the
 * rendered shadow tree. Returns human-readable problems; assert `toEqual([])`.
 */
export function gaugeProblems(el: any, c: GaugeCombo): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) { say('gauge has no shadow root'); return problems; }

  const base = sr.querySelector('[part="base"]') as HTMLElement | null;
  if (!base) { say('no [part="base"] container'); return problems; }

  // ── role + ARIA ───────────────────────────────────────────────────────────
  if (base.getAttribute('role') !== 'meter') {
    say(`role is "${base.getAttribute('role')}", expected "meter"`);
  }
  const ariaPairs: Array<[string, number]> = [
    ['aria-valuenow', c.value],
    ['aria-valuemin', c.min],
    ['aria-valuemax', c.max],
  ];
  for (const [attr, want] of ariaPairs) {
    const got = num(base, attr);
    if (got !== want) say(`${attr} is "${base.getAttribute(attr)}", expected "${want}"`);
  }
  const wantLabel = expectedAriaLabel(c);
  if (base.getAttribute('aria-label') !== wantLabel) {
    say(`aria-label is "${base.getAttribute('aria-label')}", expected "${wantLabel}"`);
  }

  // ── Arc geometry ──────────────────────────────────────────────────────────
  const track = sr.querySelector('.gauge__track');
  const fill = sr.querySelector('.gauge__fill');
  if (!track) say('no track arc rendered');
  if (!fill) say('no fill arc rendered');

  if (track && fill) {
    const trackPath = track.getAttribute('d');
    const fillPath = fill.getAttribute('d');
    if (!trackPath) say('track arc has no path');
    if (trackPath !== fillPath) {
      say(`fill arc path "${fillPath}" differs from track path "${trackPath}"`);
    }
    for (const [name, node] of [['track', track], ['fill', fill]] as const) {
      const width = num(node, 'stroke-width');
      if (width !== c.thickness) {
        say(`${name} stroke-width is "${node.getAttribute('stroke-width')}", expected "${c.thickness}"`);
      }
    }
    const dashArray = num(fill, 'stroke-dasharray');
    if (dashArray === null || Math.abs(dashArray - ARC_LENGTH) > EPS) {
      say(`fill stroke-dasharray is "${fill.getAttribute('stroke-dasharray')}", expected "${ARC_LENGTH}"`);
    }
    const offset = num(fill, 'stroke-dashoffset');
    const wantOffset = expectedFillOffset(c);
    if (offset === null || Math.abs(offset - wantOffset) > EPS) {
      say(`fill stroke-dashoffset is "${fill.getAttribute('stroke-dashoffset')}"`
        + ` (${(expectedPercentage(c) * 100).toFixed(2)}% expected → ${wantOffset})`);
    }
  }

  // ── value part ────────────────────────────────────────────────────────────
  const valuePart = sr.querySelector('[part="value"]');
  if (c.showValue) {
    if (!valuePart) {
      say('showValue is true but no [part="value"] is rendered');
    } else if (valuePart.textContent?.trim() !== expectedValueText(c)) {
      say(`value text "${valuePart.textContent?.trim()}", expected "${expectedValueText(c)}"`);
    }
  } else if (valuePart) {
    say(`showValue is false but [part="value"] renders "${valuePart.textContent?.trim()}"`);
  }

  // ── label part ────────────────────────────────────────────────────────────
  const labelPart = sr.querySelector('[part="label"]');
  if (c.label !== '') {
    if (!labelPart) {
      say(`label "${c.label}" is set but no [part="label"] is rendered`);
    } else if (labelPart.textContent?.trim() !== c.label) {
      say(`label text "${labelPart.textContent?.trim()}", expected "${c.label}"`);
    }
  } else if (labelPart) {
    say('empty label still renders a [part="label"] element');
  }

  // ── Presentation hooks the stylesheet selects on ──────────────────────────
  //
  // The stylesheet pairs every `:host([size="medium"])` rule with a
  // `:host(:not([size]))` twin, and likewise for `variant="default"`. So the
  // contract is "the rule that applies is the one for this value", which the
  // DEFAULT value satisfies either by reflecting its name or by leaving the
  // attribute off entirely. Any other value must be on the host by name, or no
  // rule selects it at all.
  const hostAttr = (name: string, want: string, isDefault: boolean, why: string) => {
    const got = el.getAttribute(name);
    if (got === want) return;
    if (isDefault && got === null) return;
    say(`host ${name} attribute is "${got}", expected "${want}"`
      + `${isDefault ? ' (or absent, which the :not() twin covers)' : ''} — ${why}`);
  };
  hostAttr('size', c.size, c.size === 'medium', ':host([size=…]) sizing rules cannot apply');
  hostAttr('variant', c.variant, c.variant === 'default',
    ':host([variant=…]) colour rules cannot apply');

  const svg = sr.querySelector('.gauge__svg');
  if (!svg) {
    say('no gauge svg rendered');
  } else {
    // happy-dom parses the shadow template as HTML, which lowercases attribute
    // names; a real browser keeps `viewBox`. getAttribute is case-sensitive, so
    // read it the way the parser stored it rather than asserting the casing —
    // the VALUE is what this tier can own, and the visual tier sees the real one.
    const viewBox = svg.getAttribute('viewBox') ?? svg.getAttribute('viewbox');
    if (viewBox !== '0 0 120 70') {
      say(`svg viewBox is "${viewBox}", expected "0 0 120 70"`);
    }
  }

  return problems;
}
