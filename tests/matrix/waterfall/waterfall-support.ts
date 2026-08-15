/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-waterfall feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts`: ONE function
 * derives the EXPECTED rendered facts from the documented contract
 * (docs/ai/components/waterfall.md + snice-waterfall.types.ts), a second reads
 * the ACTUAL facts out of the rendered SVG, and a combo is judged by comparing
 * the two wholesale so a failure reports every divergence at once.
 *
 * What the docs pin, and therefore what this oracle encodes:
 *
 *   · "Waterfall chart (bridge chart) showing cumulative effect of sequential
 *     positive/negative values" — every bar floats between the running total
 *     before it and the running total after it, and a `total` bar restates the
 *     running total from the baseline. This is the only real MATH the component
 *     has, and `expectedBars()` is its independent re-derivation.
 *   · `type?: 'increase'|'decrease'|'total'` — "auto-detected from value sign if
 *     omitted".
 *   · `showValues` / `showConnectors` — whether value labels and connector lines
 *     are drawn.
 *   · `orientation: 'vertical'|'horizontal'` — a documented dimension, so the
 *     two values must produce two different charts.
 *   · CSS parts `base` and `chart`.
 *   · `bar-click` / `bar-hover` -> `{ item, index }`, where `item` is the
 *     ORIGINAL `WaterfallDataPoint` the caller supplied.
 *   · Accessibility: "Bars carry data-visualization roles, are focusable, and
 *     activate by keyboard"; "Bar types distinguishable by color *and* value
 *     label, not color alone".
 *
 * Deliberately NOT encoded: the exact `1.0K` / `1.0M` abbreviation, the
 * viewBox size, the padding, the bar width fraction. None of those are
 * documented, and .ai/fuzzing.md forbids deriving expectations from observed
 * output. The geometry assertions below are SCALE-FREE for exactly that reason:
 * they check that every plotted edge sits on ONE consistent value->y mapping
 * shared with the zero axis, which is what "plots cumulative values" means,
 * without pinning a scale the docs never promised.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/waterfall/snice-waterfall';
import type {
  WaterfallDataPoint,
  WaterfallBarType,
  SniceWaterfallElement,
} from '../../../packages/components/src/waterfall/snice-waterfall.types';

export { wait, createComponent };
export type { WaterfallDataPoint, WaterfallBarType };

/** A Snice render is a microtask plus a queued task; 30ms clears both. */
export const SETTLE = 30;

// ── Dimensions (docs/ai/components/waterfall.md "Properties") ───────────────

export const ORIENTATIONS = ['vertical', 'horizontal'] as const;
export type Orientation = typeof ORIENTATIONS[number];

/**
 * The data-shape dimension. Each dataset isolates one documented claim:
 *
 *   · `empty`      — the documented default (`data: WaterfallDataPoint[] = []`);
 *   · `doc`        — the dataset printed verbatim in the docs' Basic Usage;
 *   · `auto`       — no `type` anywhere, so every bar is sign-detected;
 *   · `mixed`      — explicit types that CONTRADICT the sign (an `increase`
 *                    carrying a negative value), because the docs make `type`
 *                    authoritative and the sign only a fallback;
 *   · `single`     — one lone `total`, the degenerate chart;
 *   · `descending` — a run that crosses below zero, so the baseline is not the
 *                    bottom of the plot and `start`/`end` swap which edge is on
 *                    top;
 *   · `magnitudes` — thousands and millions together, so the value labels are
 *                    exercised across the whole readable range.
 */
export const DATASETS = {
  empty: [] as WaterfallDataPoint[],

  doc: [
    { label: 'Start', value: 1000, type: 'total' },
    { label: 'Revenue', value: 500 },
    { label: 'Costs', value: -200 },
    { label: 'Tax', value: -100 },
    { label: 'End', value: 1200, type: 'total' },
  ] as WaterfallDataPoint[],

  auto: [
    { label: 'Alpha', value: 40 },
    { label: 'Beta', value: -15 },
    { label: 'Gamma', value: 25 },
    { label: 'Delta', value: -5 },
  ] as WaterfallDataPoint[],

  mixed: [
    { label: 'Base', value: 200, type: 'total' },
    { label: 'Rebate', value: -60, type: 'increase' },
    { label: 'Bonus', value: 45, type: 'decrease' },
    { label: 'Net', value: 185, type: 'total' },
  ] as WaterfallDataPoint[],

  single: [
    { label: 'Only', value: 750, type: 'total' },
  ] as WaterfallDataPoint[],

  descending: [
    { label: 'Open', value: 100, type: 'total' },
    { label: 'Writedown', value: -160 },
    { label: 'Recovery', value: 30 },
    { label: 'Close', value: -30, type: 'total' },
  ] as WaterfallDataPoint[],

  magnitudes: [
    { label: 'Seed', value: 2_400_000, type: 'total' },
    { label: 'Grant', value: 750_000 },
    { label: 'Burn', value: -1_250_000 },
    { label: 'Change', value: -900 },
  ] as WaterfallDataPoint[],
} satisfies Record<string, WaterfallDataPoint[]>;

export type DatasetName = keyof typeof DATASETS;
export const DATASET_NAMES = Object.keys(DATASETS) as DatasetName[];

export interface WaterfallCombo {
  dataset: DatasetName;
  orientation: Orientation;
  showValues: boolean;
  showConnectors: boolean;
  animated: boolean;
}

export const BASE_COMBO: WaterfallCombo = {
  dataset: 'doc',
  orientation: 'vertical',
  showValues: true,
  showConnectors: true,
  animated: false,
};

export const combo = (patch: Partial<WaterfallCombo> = {}): WaterfallCombo =>
  ({ ...BASE_COMBO, ...patch });

export const comboId = (c: WaterfallCombo): string =>
  [
    `data=${c.dataset}`,
    `orientation=${c.orientation}`,
    c.showValues ? 'values' : 'no-values',
    c.showConnectors ? 'connectors' : 'no-connectors',
    c.animated ? 'animated' : 'static',
  ].join('/');

export const dataOf = (c: WaterfallCombo): WaterfallDataPoint[] => DATASETS[c.dataset];

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo.
 *
 * `orientation`, `show-values`, `show-connectors` and `animated` cross the
 * ATTRIBUTE channel (the documented authored form,
 * `<snice-waterfall show-values show-connectors>`), while `data` is assigned
 * through the property channel because it is declared `attribute: false` and an
 * array has no attribute form.
 *
 * `show-values`/`show-connectors` default to TRUE, so switching them off means
 * writing the attribute with a falsy value rather than omitting it — omission
 * is the "on" state for these two, unlike a normal boolean attribute.
 */
export async function makeWaterfall(c: WaterfallCombo): Promise<SniceWaterfallElement> {
  const attrs: Record<string, any> = { orientation: c.orientation };
  if (!c.showValues) attrs['show-values'] = false;
  if (!c.showConnectors) attrs['show-connectors'] = false;
  if (c.animated) attrs['animated'] = true;

  const el = await createComponent<SniceWaterfallElement>('snice-waterfall', attrs);
  el.data = dataOf(c);
  await wait(SETTLE);
  return el;
}

// ── The documented cumulative model ─────────────────────────────────────────

export interface ExpectedBar {
  label: string;
  value: number;
  /** Documented: explicit `type`, else auto-detected from the value's sign. */
  type: WaterfallBarType;
  /** Running total the bar starts from. A `total` restates from the baseline. */
  start: number;
  /** Running total the bar leaves behind. */
  end: number;
}

/**
 * The cumulative model, re-derived from the documentation rather than from the
 * component: "showing cumulative effect of sequential positive/negative
 * values", with `type` "auto-detected from value sign if omitted" and a `total`
 * bar restating the accumulated figure from the baseline.
 */
export function expectedBars(data: WaterfallDataPoint[]): ExpectedBar[] {
  const bars: ExpectedBar[] = [];
  let running = 0;
  for (const item of data) {
    const type: WaterfallBarType = item.type ?? (item.value >= 0 ? 'increase' : 'decrease');
    if (type === 'total') {
      bars.push({ label: item.label, value: item.value, type, start: 0, end: item.value });
      running = item.value;
    } else {
      const start = running;
      running += item.value;
      bars.push({ label: item.label, value: item.value, type, start, end: running });
    }
  }
  return bars;
}

// ── Reading the rendered chart ──────────────────────────────────────────────

export interface RenderedBar {
  /** `waterfall-bar-<type>` — the type the component actually drew. */
  type: string | null;
  /** `data-index`, the hook both documented events are routed through. */
  index: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  /** ARIA role, if any — the docs claim bars carry data-visualization roles. */
  role: string | null;
  /** `tabindex`, if any — the docs claim bars are focusable. */
  tabindex: string | null;
}

export interface WaterfallFacts {
  hasBasePart: boolean;
  hasChartPart: boolean;
  /** Exactly one `<svg>` when there is data, none when there is not. */
  svgCount: number;
  bars: RenderedBar[];
  /** `waterfall-label` texts, in document order. */
  labels: string[];
  /** `waterfall-value` texts, in document order. */
  values: string[];
  /** The class suffix of each value label (`increase`/`decrease`/`total`). */
  valueTypes: string[];
  connectorCount: number;
  /** The shared zero axis, or null when nothing is drawn. */
  axis: { x1: number; y1: number; x2: number; y2: number } | null;
}

const num = (el: Element, name: string): number => Number(el.getAttribute(name) ?? NaN);

/** Every `<rect>` the component drew, whatever type class it carries. */
function barNodes(root: ShadowRoot): Element[] {
  return [...root.querySelectorAll('rect')];
}

function typeOf(node: Element): string | null {
  const cls = node.getAttribute('class') ?? '';
  const hit = /waterfall-bar-([a-z]+)/.exec(cls);
  return hit ? hit[1] : null;
}

export function readFacts(el: SniceWaterfallElement): WaterfallFacts {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-waterfall has no shadow root');

  const bars = barNodes(root).map<RenderedBar>(node => ({
    type: typeOf(node),
    index: node.hasAttribute('data-index') ? Number(node.getAttribute('data-index')) : null,
    x: num(node, 'x'),
    y: num(node, 'y'),
    width: num(node, 'width'),
    height: num(node, 'height'),
    role: node.getAttribute('role'),
    tabindex: node.getAttribute('tabindex'),
  }));

  const valueNodes = [...root.querySelectorAll('text.waterfall-value')];
  const axis = root.querySelector('line.waterfall-axis');

  return {
    hasBasePart: !!root.querySelector('[part~="base"]'),
    hasChartPart: !!root.querySelector('[part~="chart"]'),
    svgCount: root.querySelectorAll('svg').length,
    bars,
    labels: [...root.querySelectorAll('text.waterfall-label')]
      .map(node => (node.textContent ?? '').trim()),
    values: valueNodes.map(node => (node.textContent ?? '').trim()),
    valueTypes: valueNodes.map(node => {
      const hit = /waterfall-value-([a-z]+)/.exec(node.getAttribute('class') ?? '');
      return hit ? hit[1] : '';
    }),
    connectorCount: root.querySelectorAll('line.waterfall-connector').length,
    axis: axis
      ? { x1: num(axis, 'x1'), y1: num(axis, 'y1'), x2: num(axis, 'x2'), y2: num(axis, 'y2') }
      : null,
  };
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * A problem list, mirroring the table oracle's `problems: string[]`: collect
 * every violation a combo commits and assert them all at once, so one run tells
 * the whole story instead of dying on the first mismatch.
 */
export class Problems {
  readonly list: string[] = [];
  say(message: string): void { this.list.push(message); }
  ok(condition: boolean, message: string): boolean {
    if (!condition) this.say(message);
    return condition;
  }
  eq(what: string, actual: unknown, expected: unknown): boolean {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) this.say(`${what}: ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
    return same;
  }
}

export function expectClean(problems: Problems, id: string): void {
  expect(problems.list, `combo ${id}`).toEqual([]);
}

/**
 * The STRUCTURE oracle: parts, bar count, bar types, labels, connectors and
 * value labels, all derived from the documented contract.
 *
 * Held out on purpose (each owned by its own `it.fails` finding elsewhere in
 * this suite, never weakened, only relocated so exactly one test reports it):
 * the accessibility claims and the `orientation` claim.
 */
export function structureProblems(el: SniceWaterfallElement, c: WaterfallCombo): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  const expected = expectedBars(dataOf(c));

  // Documented CSS parts. Both are rendered once, always — the shell does not
  // depend on the data.
  problems.ok(facts.hasBasePart, 'no [part="base"] rendered');
  problems.ok(facts.hasChartPart, 'no [part="chart"] rendered');

  if (expected.length === 0) {
    // The documented default is an empty `data` array; an empty chart draws no
    // bars, no labels, no values and no connectors.
    problems.eq('bars for empty data', facts.bars.length, 0);
    problems.eq('labels for empty data', facts.labels.length, 0);
    problems.eq('values for empty data', facts.values.length, 0);
    problems.eq('connectors for empty data', facts.connectorCount, 0);
    return problems;
  }

  problems.eq('svg elements', facts.svgCount, 1);
  problems.eq('bar count', facts.bars.length, expected.length);

  // ── type: explicit wins, sign decides when omitted ────────────────────────
  problems.eq(
    'bar types',
    facts.bars.map(bar => bar.type),
    expected.map(bar => bar.type),
  );

  // ── Every bar is addressable by its index in `data` ───────────────────────
  problems.eq(
    'bar data-index sequence',
    facts.bars.map(bar => bar.index),
    expected.map((_, i) => i),
  );

  // ── Labels: one per point, in order, showing the authored label ───────────
  problems.eq('bar labels', facts.labels, expected.map(bar => bar.label));

  // ── showValues ────────────────────────────────────────────────────────────
  if (c.showValues) {
    problems.eq('value label count', facts.values.length, expected.length);
    problems.eq('value label types', facts.valueTypes, expected.map(bar => bar.type));
    // "Bar types distinguishable by color *and* value label, not color alone":
    // a non-total bar's label must carry an explicit sign, so a reader who
    // cannot see the fill can still tell a rise from a fall.
    for (const [i, bar] of expected.entries()) {
      const shown = facts.values[i] ?? '';
      if (bar.type === 'total') continue;
      const wantSign = bar.value >= 0 ? '+' : '-';
      problems.ok(
        shown.startsWith(wantSign),
        `value label ${i} ("${shown}") does not carry the "${wantSign}" sign that`
        + ' distinguishes the bar type without colour',
      );
    }
    // A value label that says nothing is not a value label.
    for (const [i, shown] of facts.values.entries()) {
      problems.ok(shown.length > 0, `value label ${i} is empty`);
    }
  } else {
    problems.eq('value labels while showValues=false', facts.values.length, 0);
  }

  // ── showConnectors: the lines that bridge consecutive bars ────────────────
  problems.eq(
    'connector count',
    facts.connectorCount,
    c.showConnectors ? Math.max(0, expected.length - 1) : 0,
  );

  return problems;
}

/**
 * The CUMULATIVE oracle — the component's only real arithmetic.
 *
 * Scale-free by construction. The docs promise that the chart plots the
 * cumulative running total; they promise nothing about the pixel scale, the
 * padding, or the viewBox, and .ai/fuzzing.md forbids inventing those from
 * observed output. So instead of predicting coordinates, this collects the
 * (value, y) pairs the chart itself asserts — the zero axis at value 0, and
 * each bar's two edges at its documented `start`/`end` — and verifies they all
 * sit on ONE straight, downward-in-y mapping. That is exactly the claim
 * "cumulative effect ... plotted against a shared axis", and nothing more.
 */
export function cumulativeProblems(el: SniceWaterfallElement, c: WaterfallCombo): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  const expected = expectedBars(dataOf(c));
  if (expected.length === 0) return problems;

  if (!problems.ok(facts.axis !== null, 'no zero axis drawn')) return problems;
  if (!problems.ok(facts.bars.length === expected.length, 'bar count differs; skipping geometry'))
    return problems;

  // Sample points: value 0 sits on the axis, and each bar's top/bottom edges sit
  // at the larger/smaller of its documented start and end.
  const samples: Array<{ value: number; y: number; what: string }> = [
    { value: 0, y: facts.axis!.y1, what: 'zero axis' },
  ];
  for (const [i, bar] of expected.entries()) {
    const drawn = facts.bars[i];
    if (!Number.isFinite(drawn.y) || !Number.isFinite(drawn.height)) {
      problems.say(`bar ${i} has no numeric geometry (y=${drawn.y}, height=${drawn.height})`);
      continue;
    }
    const hi = Math.max(bar.start, bar.end);
    const lo = Math.min(bar.start, bar.end);
    // The bar's leading edge always sits exactly where the larger of its two
    // running totals plots, so it is always a valid sample.
    samples.push({ value: hi, y: drawn.y, what: `bar ${i} (${bar.label}) leading edge` });
    // A bar whose two totals are equal, or so close that the chart floors it to
    // a minimum drawable thickness, carries no scale information on its trailing
    // edge — that edge is the floor, not the value. Its leading edge above is
    // still checked, so a genuinely misplaced hairline bar is still caught.
    const floored = drawn.height <= 1 + 1e-6;
    if (Math.abs(bar.end - bar.start) < 1e-9 || floored) continue;
    samples.push({ value: lo, y: drawn.y + drawn.height, what: `bar ${i} (${bar.label}) trailing edge` });
  }

  const spread = samples.reduce((a, s) => Math.max(a, s.value), -Infinity)
    - samples.reduce((a, s) => Math.min(a, s.value), Infinity);
  if (spread <= 0) return problems; // a flat chart carries no mapping to check

  const top = samples.reduce((best, s) => (s.value > best.value ? s : best), samples[0]);
  const bottom = samples.reduce((best, s) => (s.value < best.value ? s : best), samples[0]);
  const scale = (bottom.y - top.y) / (top.value - bottom.value); // px per unit, positive

  // Larger values must plot HIGHER on the screen; an inverted or flat axis is a
  // chart that reads its own numbers backwards.
  if (!problems.ok(scale > 0, `value axis is not upward: ${scale} px per unit`)) return problems;

  for (const sample of samples) {
    const want = top.y + (top.value - sample.value) * scale;
    if (Math.abs(want - sample.y) > 0.75) {
      problems.say(
        `${sample.what}: value ${sample.value} plotted at y=${sample.y.toFixed(2)},`
        + ` but the chart's own axis puts it at y=${want.toFixed(2)}`,
      );
    }
  }

  // ── The bridge: each bar begins where the previous one ended ──────────────
  // This is what makes a waterfall a waterfall, and it is checked in VALUE
  // space, where it is a statement about the documented running total rather
  // than about pixels.
  for (let i = 1; i < expected.length; i++) {
    if (expected[i].type === 'total') continue; // a total restates from the baseline
    problems.eq(
      `bar ${i} (${expected[i].label}) starts at the previous running total`,
      expected[i].start,
      expected[i - 1].end,
    );
  }

  return problems;
}

/**
 * The ORIENTATION oracle.
 *
 * `orientation: 'vertical'|'horizontal'` is a documented property with two
 * documented values, and a waterfall's orientation is the axis its VALUES run
 * along. So the zero axis — the one line in the chart that marks value 0 across
 * the whole plot — is drawn ACROSS the value axis: horizontal for a vertical
 * chart (bars grow up and down from it), vertical for a horizontal chart (bars
 * grow left and right from it). The bars advance along the other axis, one per
 * data point.
 *
 * This is the weakest statement that still means the property does its job; it
 * pins no scale, no padding and no bar thickness.
 */
export function orientationProblems(el: SniceWaterfallElement, c: WaterfallCombo): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  const expected = expectedBars(dataOf(c));
  if (expected.length === 0) return problems;

  if (!problems.ok(facts.axis !== null, 'no zero axis drawn')) return problems;
  const axis = facts.axis!;
  const axisIsHorizontal = Math.abs(axis.y1 - axis.y2) < 0.5 && Math.abs(axis.x1 - axis.x2) > 0.5;
  const axisIsVertical = Math.abs(axis.x1 - axis.x2) < 0.5 && Math.abs(axis.y1 - axis.y2) > 0.5;

  if (c.orientation === 'vertical') {
    problems.ok(
      axisIsHorizontal,
      `orientation="vertical": the value-0 axis runs from (${axis.x1},${axis.y1})`
      + ` to (${axis.x2},${axis.y2}), which is not a horizontal baseline`,
    );
  } else {
    problems.ok(
      axisIsVertical,
      `orientation="horizontal": the value-0 axis runs from (${axis.x1},${axis.y1})`
      + ` to (${axis.x2},${axis.y2}), which is not a vertical baseline —`
      + ' the chart is still drawn with values running up the page',
    );
  }

  // The bars advance along the axis the values do NOT run along: down the page
  // for a horizontal chart, across it for a vertical one.
  if (expected.length > 1) {
    const steps = facts.bars.slice(1).map((bar, i) => ({
      dx: bar.x - facts.bars[i].x,
      dy: bar.y - facts.bars[i].y,
    }));
    if (c.orientation === 'horizontal') {
      const advancesDown = steps.every(step => step.dy > 0.5);
      problems.ok(
        advancesDown,
        `orientation="horizontal": successive bars do not advance down the page`
        + ` (steps ${JSON.stringify(steps.map(s => Number(s.dy.toFixed(2))))})`,
      );
    } else {
      const advancesRight = steps.every(step => step.dx > 0.5);
      problems.ok(
        advancesRight,
        `orientation="vertical": successive bars do not advance across the page`
        + ` (steps ${JSON.stringify(steps.map(s => Number(s.dx.toFixed(2))))})`,
      );
    }
  }

  return problems;
}

/**
 * The ACCESSIBILITY oracle, straight out of the docs' Accessibility section:
 * "Bars carry data-visualization roles, are focusable, and activate by
 * keyboard".
 */
export function a11yProblems(el: SniceWaterfallElement, c: WaterfallCombo): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  const expected = expectedBars(dataOf(c));
  if (expected.length === 0) return problems;

  for (const [i, bar] of facts.bars.entries()) {
    problems.ok(
      !!bar.role,
      `bar ${i} carries no role — the docs promise bars carry data-visualization roles`,
    );
    problems.ok(
      bar.tabindex !== null,
      `bar ${i} has no tabindex — the docs promise bars are focusable`,
    );
  }
  return problems;
}

/** Whether a bar's `animated` presentation was applied. */
export function animationClasses(el: SniceWaterfallElement): string[] {
  return [...(el.shadowRoot?.querySelectorAll('rect') ?? [])]
    .map(node => node.getAttribute('class') ?? '');
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record the two documented events in dispatch order. */
export function collectEvents(
  el: HTMLElement,
  types: string[] = ['bar-click', 'bar-hover'],
): Seen[] {
  const seen: Seen[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** The `<rect>` for one data index, or null when the chart drew none. */
export function barAt(el: SniceWaterfallElement, index: number): Element | null {
  return el.shadowRoot?.querySelector(`rect[data-index="${index}"]`) ?? null;
}

export function clickBar(el: SniceWaterfallElement, index: number): boolean {
  const bar = barAt(el, index);
  if (!bar) return false;
  bar.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  return true;
}

export function hoverBar(el: SniceWaterfallElement, index: number): boolean {
  const bar = barAt(el, index);
  if (!bar) return false;
  bar.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true }));
  return true;
}

export function pressBar(el: SniceWaterfallElement, index: number, key: string): boolean {
  const bar = barAt(el, index);
  if (!bar) return false;
  bar.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  return true;
}

/** The chart body, for clicks that land on no bar at all. */
export function clickChartBackground(el: SniceWaterfallElement): void {
  const base = el.shadowRoot?.querySelector('[part~="base"]');
  base?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}
