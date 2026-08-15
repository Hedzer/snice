/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-range-slider matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/ai/components/range-slider.md` writes its § Value and form lifecycle
 * as a list of rules, and those rules are the oracle:
 *
 *   · "Live endpoints are independent from authored `value-low`/`value-high`
 *     defaults. They are ordered, clamped, and snapped to a `min`-based step
 *     lattice; invalid steps fall back to `1`."
 *   · "Each pristine endpoint follows its default; interaction, restore, or
 *     assignment dirties it."
 *   · "Form/restoration state is `\"low,high\"`; reset silently restores both
 *     latest defaults as one clamped ordered range."
 *   · "A named range contributes one `\"low,high\"` string to `FormData` and is
 *     listed in `form.elements`."
 *   · "`setCustomValidity(message)` establishes `customError`, styles/names both
 *     thumbs as invalid, and blocks validated submission; pass `''` to clear."
 *   · "Disabled ranges are omitted and barred. Custom errors survive the
 *     temporary barred state and reappear when re-enabled."
 *
 * Plus § Keyboard Navigation ("Arrow keys adjust focused thumb by step",
 * "Home/End move to min/max bounds", "Each thumb independently focusable"),
 * § Accessibility (`role="slider"` per thumb with aria-valuenow/min/max; "Track
 * click moves nearest thumb"; "Associated labels name the thumbs as
 * `<label> minimum` and `<label> maximum`"), and § CSS Parts (`track`, `range`,
 * `thumb-low`, `thumb-high`, `label-min`, `label-max`).
 *
 * ── The lattice, restated ───────────────────────────────────────────────────
 *
 * `normalize()` below is this oracle's OWN implementation of the documented
 * sentence — clamp into [min, max], snap to `min + k*step`, fall back to step 1
 * when the step is not a positive finite number. It deliberately does not
 * import the component's helper: an oracle that calls the code under test
 * asserts nothing.
 *
 * ── A thumb's own bounds ────────────────────────────────────────────────────
 *
 * "Home/End move to min/max bounds" is read through the doc's own ARIA line:
 * each thumb exposes `aria-valuemin`/`aria-valuemax`, and for a two-handle
 * slider those bounds are the thumb's — the low thumb ranges over
 * [min, valueHigh] and the high thumb over [valueLow, max], because the pair is
 * "ordered". End on the low thumb therefore lands on the high value, not on
 * `max`, which would cross it.
 */
import { shadow, text, part } from '../matrix-utils';
import '../../../packages/components/src/range-slider/snice-range-slider';
import type {
  RangeSliderOrientation,
} from '../../../packages/components/src/range-slider/snice-range-slider.types';

export type { RangeSliderOrientation };

// ── Documented value sets and defaults ──────────────────────────────────────

export const ORIENTATIONS: readonly RangeSliderOrientation[] = ['horizontal', 'vertical'];

export const PARTS = ['track', 'range', 'thumb-low', 'thumb-high'] as const;
export const LABEL_PARTS = ['label-min', 'label-max'] as const;

export const EVENTS = ['range-change'] as const;

export interface RangeCombo {
  min: number;
  max: number;
  step: number;
  defaultValueLow: number;
  defaultValueHigh: number;
  disabled: boolean;
  showTooltip: boolean;
  showLabels: boolean;
  orientation: RangeSliderOrientation;
  name: string;
}

/** Every documented property at its documented default. */
export const DEFAULTS: RangeCombo = {
  min: 0,
  max: 100,
  step: 1,
  defaultValueLow: 0,
  defaultValueHigh: 100,
  disabled: false,
  showTooltip: false,
  showLabels: false,
  orientation: 'horizontal',
  name: '',
};

export const range = (overrides: Partial<RangeCombo> = {}): RangeCombo => ({
  ...DEFAULTS,
  ...overrides,
});

export function attrsOf(c: RangeCombo): Record<string, any> {
  const attrs: Record<string, any> = {
    min: c.min,
    max: c.max,
    step: c.step,
    'value-low': c.defaultValueLow,
    'value-high': c.defaultValueHigh,
    orientation: c.orientation,
  };
  if (c.disabled) attrs.disabled = true;
  if (c.showTooltip) attrs['show-tooltip'] = true;
  if (c.showLabels) attrs['show-labels'] = true;
  if (c.name) attrs.name = c.name;
  return attrs;
}

export const comboId = (c: RangeCombo): string =>
  `[${c.min}..${c.max}/${c.step}] defaults=${c.defaultValueLow},${c.defaultValueHigh}`
  + ` ${c.orientation}${c.disabled ? '/disabled' : ''}`
  + `${c.showTooltip ? '/tooltip' : ''}${c.showLabels ? '/labels' : ''}`;

// ── The documented lattice ──────────────────────────────────────────────────

/** "invalid steps fall back to `1`" */
export const effectiveStep = (step: number): number =>
  Number.isFinite(step) && step > 0 ? step : 1;

/** "clamped, and snapped to a `min`-based step lattice" */
export function normalize(value: number, min: number, max: number, step: number): number {
  const lower = Number.isFinite(min) ? min : -Infinity;
  const configuredUpper = Number.isFinite(max) ? max : Infinity;
  const upper = configuredUpper < lower ? lower : configuredUpper;
  const size = effectiveStep(step);
  const base = Number.isFinite(lower) ? lower : 0;
  const clamped = Math.max(lower, Math.min(upper, value));

  let snapped = base + Math.round((clamped - base) / size) * size;
  if (snapped > upper) snapped = base + Math.floor((upper - base) / size) * size;
  if (snapped < lower) snapped = base + Math.ceil((lower - base) / size) * size;
  snapped = Math.max(lower, Math.min(upper, snapped));
  if (!Number.isFinite(snapped)) return clamped;
  return Number(snapped.toPrecision(15));
}

/** "ordered, clamped, and snapped" — the pair, as one operation. */
export function normalizePair(
  low: number, high: number, min: number, max: number, step: number,
): { low: number; high: number } {
  const a = normalize(low, min, max, step);
  const b = normalize(high, min, max, step);
  return { low: Math.min(a, b), high: Math.max(a, b) };
}

/**
 * The documented result of assigning the LOW endpoint and then the HIGH one.
 *
 * `valueLow` and `valueHigh` are two independent documented properties, so two
 * assignments are two operations, not one pair operation. "Ordered" applies to
 * each as it lands: a low endpoint cannot pass the high one that is currently
 * set, and the high one cannot fall below the low one it now sits beside. A
 * caller who writes `low = 90` on a `[0, 100]` range has moved the low endpoint
 * to 90, and a following `high = 10` cannot pull it back down.
 */
export function assignLowThenHigh(
  start: { low: number; high: number },
  low: number,
  high: number,
  min: number, max: number, step: number,
): { low: number; high: number } {
  const settledLow = Math.min(normalize(low, min, max, step), start.high);
  const settledHigh = Math.max(normalize(high, min, max, step), settledLow);
  return { low: settledLow, high: settledHigh };
}

/** The endpoints a freshly-mounted, untouched slider settles on. */
export const expectedInitial = (c: RangeCombo): { low: number; high: number } =>
  normalizePair(c.defaultValueLow, c.defaultValueHigh, c.min, c.max, c.step);

/** "Form/restoration state is `\"low,high\"`" */
export const expectedFormValue = (low: number, high: number): string => `${low},${high}`;

// ── Reading ─────────────────────────────────────────────────────────────────

export interface ThumbReading {
  node: HTMLElement | null;
  role: string | null;
  valueNow: number | null;
  valueMin: number | null;
  valueMax: number | null;
  ariaLabel: string | null;
  ariaInvalid: string | null;
  tabIndex: string | null;
  tooltip: string | null;
}

export interface Reading {
  parts: string[];
  track: HTMLElement | null;
  rangeBar: HTMLElement | null;
  low: ThumbReading;
  high: ThumbReading;
  labelMin: string | null;
  labelMax: string | null;
  vertical: boolean;
  trackDisabled: boolean;
}

const num = (node: Element | null, attr: string): number | null => {
  const raw = node?.getAttribute(attr);
  return raw == null ? null : Number(raw);
};

function readThumb(root: ShadowRoot, selector: string): ThumbReading {
  const node = root.querySelector<HTMLElement>(selector);
  const tooltip = node?.querySelector('.range-slider__tooltip') ?? null;
  return {
    node,
    role: node?.getAttribute('role') ?? null,
    valueNow: num(node, 'aria-valuenow'),
    valueMin: num(node, 'aria-valuemin'),
    valueMax: num(node, 'aria-valuemax'),
    ariaLabel: node?.getAttribute('aria-label') ?? null,
    ariaInvalid: node?.getAttribute('aria-invalid') ?? null,
    tabIndex: node?.getAttribute('tabindex') ?? null,
    tooltip: tooltip ? text(tooltip) : null,
  };
}

export function read(el: HTMLElement): Reading {
  const root = shadow(el);
  const container = root.querySelector('.range-slider');
  const track = root.querySelector<HTMLElement>('.range-slider__track');
  return {
    parts: [...PARTS, ...LABEL_PARTS].filter(name => !!part(el, name)),
    track,
    rangeBar: root.querySelector<HTMLElement>('.range-slider__range'),
    low: readThumb(root, '.range-slider__thumb--low'),
    high: readThumb(root, '.range-slider__thumb--high'),
    labelMin: part(el, 'label-min') ? text(part(el, 'label-min')) : null,
    labelMax: part(el, 'label-max') ? text(part(el, 'label-max')) : null,
    vertical: !!container?.classList.contains('range-slider--vertical'),
    trackDisabled: !!track?.classList.contains('range-slider__track--disabled'),
  };
}

/**
 * Give the track a known geometry. `getBoundingClientRect` is all zeros in a
 * DOM-only environment, so "track click moves nearest thumb" would otherwise be
 * unaskable here. WHERE the track really is belongs to the visual tier; this
 * only supplies a ruler so the nearest-thumb CHOICE can be asserted.
 */
export function stubTrackGeometry(
  el: HTMLElement,
  rect: { left: number; width: number; top: number; height: number },
): void {
  const track = read(el).track;
  if (!track) throw new Error('no track to give geometry to');
  const full = {
    left: rect.left, width: rect.width, top: rect.top, height: rect.height,
    right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top,
    toJSON() { return this; },
  } as DOMRect;
  track.getBoundingClientRect = () => full;
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/**
 * Every documented consequence of `c` at the endpoints `low`/`high`, as a
 * problem list. `low`/`high` default to the endpoints a pristine slider takes.
 */
export function rangeProblems(
  el: HTMLElement,
  c: RangeCombo,
  expected: { low: number; high: number } = expectedInitial(c),
): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read(el);

  // ── Parts ────────────────────────────────────────────────────────────────
  for (const name of PARTS) {
    if (!part(el, name)) say(`no [part="${name}"]`);
  }
  // "showLabels" gates the two label parts.
  for (const name of LABEL_PARTS) {
    const present = !!part(el, name);
    if (present !== c.showLabels) {
      say(`[part="${name}"] ${present ? 'present' : 'absent'} with showLabels=${c.showLabels}`);
    }
  }
  if (c.showLabels) {
    if (r.labelMin !== String(c.min)) say(`label-min "${r.labelMin}" != "${c.min}"`);
    if (r.labelMax !== String(c.max)) say(`label-max "${r.labelMax}" != "${c.max}"`);
  }

  // ── The live endpoints ───────────────────────────────────────────────────
  const gotLow = (el as any).valueLow as number;
  const gotHigh = (el as any).valueHigh as number;
  if (gotLow !== expected.low) say(`valueLow ${gotLow} != documented ${expected.low}`);
  if (gotHigh !== expected.high) say(`valueHigh ${gotHigh} != documented ${expected.high}`);
  if (gotLow > gotHigh) say(`endpoints are not ordered: ${gotLow} > ${gotHigh}`);

  // ── role="slider" on each thumb, with the documented ARIA values ─────────
  for (const [name, thumb, valueNow, boundMin, boundMax] of [
    ['low', r.low, expected.low, c.min, expected.high],
    ['high', r.high, expected.high, expected.low, c.max],
  ] as Array<[string, ThumbReading, number, number, number]>) {
    if (!thumb.node) { say(`no ${name} thumb rendered`); continue; }
    if (thumb.role !== 'slider') say(`${name} thumb role is "${thumb.role}", expected "slider"`);
    if (thumb.valueNow !== valueNow) say(`${name} thumb aria-valuenow ${thumb.valueNow} != ${valueNow}`);
    if (thumb.valueMin !== boundMin) say(`${name} thumb aria-valuemin ${thumb.valueMin} != ${boundMin}`);
    if (thumb.valueMax !== boundMax) say(`${name} thumb aria-valuemax ${thumb.valueMax} != ${boundMax}`);
    if (thumb.valueNow !== null && thumb.valueMin !== null && thumb.valueMax !== null) {
      if (thumb.valueNow < thumb.valueMin || thumb.valueNow > thumb.valueMax) {
        say(`${name} thumb value ${thumb.valueNow} is outside its own [${thumb.valueMin}, ${thumb.valueMax}]`);
      }
    }
  }

  // ── showTooltip ──────────────────────────────────────────────────────────
  if (c.showTooltip) {
    if (r.low.tooltip !== String(expected.low)) say(`low tooltip "${r.low.tooltip}" != "${expected.low}"`);
    if (r.high.tooltip !== String(expected.high)) say(`high tooltip "${r.high.tooltip}" != "${expected.high}"`);
  } else {
    if (r.low.tooltip !== null) say(`showTooltip is false but the low thumb shows "${r.low.tooltip}"`);
    if (r.high.tooltip !== null) say(`showTooltip is false but the high thumb shows "${r.high.tooltip}"`);
  }

  // ── orientation ──────────────────────────────────────────────────────────
  const wantVertical = c.orientation === 'vertical';
  if (r.vertical !== wantVertical) {
    say(`orientation="${c.orientation}" but the vertical layout hook is ${r.vertical ? 'on' : 'off'}`);
  }

  // ── disabled ─────────────────────────────────────────────────────────────
  if (r.trackDisabled !== c.disabled) {
    say(`track disabled hook is ${r.trackDisabled}, expected ${c.disabled}`);
  }

  // ── The documented form value ────────────────────────────────────────────
  const wantValue = expectedFormValue(expected.low, expected.high);
  const gotValue = (el as any).internals?.form !== undefined
    ? formValueOf(el)
    : null;
  if (gotValue !== null && gotValue !== wantValue) {
    say(`form value "${gotValue}" != documented "${wantValue}"`);
  }

  // ── The documented readonly surface ──────────────────────────────────────
  if ((el as any).type !== 'range') say(`type is "${(el as any).type}", expected "range"`);

  return problems;
}

/**
 * The `"low,high"` string the range contributes to its form, read through the
 * form itself — the only channel the doc describes.
 */
export function formValueOf(el: HTMLElement): string | null {
  const form = (el as any).form as HTMLFormElement | null;
  const name = (el as any).name as string;
  if (!form || !name) return null;
  const entry = new FormData(form).get(name);
  return entry === null ? null : String(entry);
}
