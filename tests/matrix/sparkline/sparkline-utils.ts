/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-sparkline> feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is read off `docs/ai/components/sparkline.md` and
 * `snice-sparkline.types.ts`, never off the rendered output (`.ai/fuzzing.md`):
 *
 *   data: number[] = []                  the series
 *   type: 'line'|'bar'|'area' = 'line'
 *   color: 'primary'|'success'|'warning'|'danger'|'muted' = 'primary'
 *   customColor?: string                 attr custom-color, OVERRIDES color
 *   width = 100, height = 30
 *   strokeWidth = 2                      attr stroke-width
 *   showDots = false, showArea = false, smooth = false
 *   min?, max?                           "auto-calculated if unset"
 *
 *   CSS parts: container · svg · line · area · dot · bar
 *   Accessibility: "Decorative; … Add `aria-label` to describe the trend."
 *
 * ── What the oracle can and cannot claim ────────────────────────────────────
 *
 * The docs specify WHICH marks exist for a property vector, not the exact
 * coordinate arithmetic (padding, bar gap, spline tension are implementation).
 * So the oracle asserts the two things the documentation actually promises:
 *
 *   1. MARK CENSUS — for every vector, exactly which parts exist and how many:
 *      `bar` gets one rect per point and no line; `line`/`area` get one line
 *      path; `area` (or `showArea`) adds the fill; `showDots` adds one circle
 *      per point; `smooth` makes the line a <path> and its absence a <polyline>.
 *
 *   2. DATA ORDER — the marks must ENCODE the series. A chart whose marks are
 *      all the same size, or whose largest value is not its tallest mark, is
 *      not showing the data whatever its coordinates are. The oracle derives
 *      the expected RANKING of every point from `data`, `min` and `max`, and
 *      compares it to the ranking the rendered marks imply. That is invariant
 *      to padding and gap, and it is the only thing "visualizing trends" can
 *      mean.
 *
 * Exact pixel geometry belongs to the visual tier, where a browser lays it out.
 */
import { Problems, all, one, part, sr, text } from '../matrix-kit';
import { createComponent, wait, SETTLE } from '../matrix-kit';
import '../../../packages/components/src/sparkline/snice-sparkline';

export type SparklineType = 'line' | 'bar' | 'area';
export type SparklineColor = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

export const TYPES: SparklineType[] = ['line', 'bar', 'area'];
export const COLORS: SparklineColor[] = ['primary', 'success', 'warning', 'danger', 'muted'];

export interface SparklineCombo {
  data: number[];
  type: SparklineType;
  color?: SparklineColor;
  customColor?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  smooth?: boolean;
  min?: number;
  max?: number;
}

export interface SparklineElement extends HTMLElement {
  data: number[];
  type: SparklineType;
  color: SparklineColor;
  customColor?: string;
  width: number;
  height: number;
  strokeWidth: number;
  showDots: boolean;
  showArea: boolean;
  smooth: boolean;
  min?: number;
  max?: number;
}

// ── Datasets ────────────────────────────────────────────────────────────────
//
// Each shape is a documented edge of the contract rather than an arbitrary
// series: the empty series the doc's default implies, a single point (nothing
// to interpolate BETWEEN), two points (the degenerate spline), a normal rising
// series, a series that falls, one that is perfectly flat (max === min, so the
// normalisation divides by zero unless it is guarded), and one with negatives.

export const DATASETS: Record<string, number[]> = {
  empty: [],
  single: [42],
  pair: [10, 30],
  rising: [10, 20, 15, 25, 30],
  falling: [30, 25, 15, 20, 10],
  flat: [7, 7, 7, 7],
  negative: [-10, 5, -3, 12, 0],
  long: [3, 9, 4, 12, 6, 15, 8, 18, 11, 21, 14, 24],
};

export const DATASET_NAMES = Object.keys(DATASETS);

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo. `data` has no attribute form (`attribute: false`), so it
 * always crosses the property channel; everything else is mounted as the
 * documented ATTRIBUTE (`stroke-width`, `show-dots`, `custom-color`) so the
 * declared converters are exercised the way the doc's own examples write them.
 */
export async function mountSparkline(combo: SparklineCombo): Promise<SparklineElement> {
  const attrs: Record<string, string | number | boolean> = { type: combo.type };
  if (combo.color !== undefined) attrs.color = combo.color;
  if (combo.customColor !== undefined) attrs['custom-color'] = combo.customColor;
  if (combo.width !== undefined) attrs.width = combo.width;
  if (combo.height !== undefined) attrs.height = combo.height;
  if (combo.strokeWidth !== undefined) attrs['stroke-width'] = combo.strokeWidth;
  if (combo.showDots) attrs['show-dots'] = true;
  if (combo.showArea) attrs['show-area'] = true;
  if (combo.smooth) attrs.smooth = true;
  if (combo.min !== undefined) attrs.min = combo.min;
  if (combo.max !== undefined) attrs.max = combo.max;

  const el = await createComponent<SparklineElement>('snice-sparkline', attrs);
  el.data = combo.data;
  await wait(SETTLE);
  return el;
}

export function sparklineComboId(combo: SparklineCombo): string {
  const flags = [
    combo.showDots && 'dots', combo.showArea && 'area', combo.smooth && 'smooth',
  ].filter(Boolean).join(',');
  const range = combo.min !== undefined || combo.max !== undefined
    ? `/range=${combo.min ?? 'auto'}..${combo.max ?? 'auto'}` : '';
  return `${combo.type}/${combo.customColor ? `custom(${combo.customColor})` : combo.color ?? 'primary'}`
    + `/n=${combo.data.length}/[${flags || 'plain'}]${range}`;
}

// ── Reading the rendered chart back ─────────────────────────────────────────

export const svgEl = (el: HTMLElement) => part(el, 'svg') as unknown as SVGSVGElement | null;
export const barEls = (el: HTMLElement) => all(el, '[part~="bar"]');
export const dotEls = (el: HTMLElement) => all(el, '[part~="dot"]');
export const lineEl = (el: HTMLElement) => one(el, '[part~="line"]');
export const areaEl = (el: HTMLElement) => one(el, '[part~="area"]');

/** Numeric attribute of an SVG mark, or NaN when absent. */
function num(node: Element | null, name: string): number {
  const raw = node?.getAttribute(name);
  return raw === null || raw === undefined ? NaN : parseFloat(raw);
}

/**
 * The y coordinate each rendered mark sits at, in render order.
 *
 * A bar's is the TOP of the rect (a taller bar starts higher); a dot's is its
 * centre; a polyline's are its vertices. All three are "how high did this
 * datum land", which is the only comparison the oracle makes.
 */
export function markTops(el: HTMLElement, type: SparklineType): number[] {
  if (type === 'bar') return barEls(el).map(bar => num(bar, 'y'));
  const dots = dotEls(el);
  if (dots.length) return dots.map(dot => num(dot, 'cy'));
  const line = lineEl(el);
  const points = line?.getAttribute('points');
  if (!points) return [];
  return points.trim().split(/\s+/).map(pair => parseFloat(pair.split(',')[1]));
}

/**
 * The documented ranking of a series: index -> rank, ties shared.
 *
 * `min`/`max` are "auto-calculated if unset", so an explicit range shifts what
 * counts as high and low — a value at or above `max` is the top of the chart
 * whatever the data's own maximum is.
 */
export function expectedRanks(data: number[], min?: number, max?: number): number[] {
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const normalized = data.map(value => (hi === lo ? 0.5 : (value - lo) / (hi - lo)));
  const sorted = [...new Set(normalized)].sort((a, b) => a - b);
  return normalized.map(value => sorted.indexOf(value));
}

/** The ranking the rendered marks imply — higher on screen means a higher rank. */
export function renderedRanks(tops: number[]): number[] {
  const sorted = [...new Set(tops)].sort((a, b) => b - a); // larger y = lower = rank 0
  return tops.map(value => sorted.indexOf(value));
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Judge one mounted sparkline against the documented mark census and data
 * encoding. Every violation is collected so a failing combo reports its whole
 * story rather than one problem per re-run.
 */
export function checkSparkline(el: SparklineElement, combo: SparklineCombo): Problems {
  const problems = new Problems();
  const width = combo.width ?? 100;
  const height = combo.height ?? 30;
  const strokeWidth = combo.strokeWidth ?? 2;
  const points = combo.data.length;

  // ── part="container": the outer container, and the colour class the CSS keys
  // off. "customColor overrides color", so the two are mutually exclusive.
  const container = part(el, 'container');
  problems.check(!!container, 'no part="container"');
  if (container) {
    const classes = new Set((container.getAttribute('class') ?? '').split(/\s+/).filter(Boolean));
    problems.check(classes.has('sparkline'), 'container is missing the sparkline class');
    const wantColorClass = combo.customColor
      ? 'sparkline--custom'
      : `sparkline--${combo.color ?? 'primary'}`;
    problems.check(classes.has(wantColorClass),
      `container classes ${[...classes].join(' ')} lack "${wantColorClass}"`);
    // A custom colour must not ALSO carry a palette class, or two `stroke`
    // rules of equal specificity race and the winner is source order.
    for (const color of COLORS) {
      const paletteClass = `sparkline--${color}`;
      if (combo.customColor && classes.has(paletteClass)) {
        problems.say(`custom-color did not override color: container still has ${paletteClass}`);
      }
    }
    if (combo.customColor) {
      const style = container.getAttribute('style') ?? '';
      problems.check(style.includes('--sparkline-custom-color'),
        'custom-color set no --sparkline-custom-color on the container');
      problems.check(style.includes(combo.customColor),
        `--sparkline-custom-color does not carry "${combo.customColor}" (style: ${style})`);
    }
  }

  // ── part="svg": the canvas, sized by the documented width/height ──────────
  const svg = svgEl(el);
  problems.check(!!svg, 'no part="svg"');
  if (svg) {
    problems.equal(svg.getAttribute('width'), String(width), 'svg width');
    problems.equal(svg.getAttribute('height'), String(height), 'svg height');
    problems.equal(svg.getAttribute('viewBox'), `0 0 ${width} ${height}`, 'svg viewBox');
    // "Decorative; … Add aria-label to describe the trend for screen readers."
    problems.equal(svg.getAttribute('role'), 'img', 'svg role');
    const label = svg.getAttribute('aria-label');
    problems.check(!!label && label.length > 0, 'svg carries no aria-label');
    if (points === 0) {
      problems.equal(label, 'Empty sparkline', 'empty-series aria-label');
    } else if (label) {
      // The label is a trend description, so it must name the type and say
      // which way the series went — that is what a screen reader gets INSTEAD
      // of the chart.
      problems.check(label.includes(combo.type), `aria-label "${label}" does not name the type`);
      const first = combo.data[0];
      const last = combo.data[points - 1];
      const trend = last > first ? 'up' : last < first ? 'down' : 'flat';
      problems.check(label.includes(trend), `aria-label "${label}" does not report trend "${trend}"`);
    }
  }

  // ── The mark census ──────────────────────────────────────────────────────
  const bars = barEls(el);
  const dots = dotEls(el);
  const line = lineEl(el);
  const area = areaEl(el);

  if (points === 0) {
    // An empty series draws nothing at all — there is no zero-point chart.
    problems.equal(bars.length, 0, 'bars for an empty series');
    problems.equal(dots.length, 0, 'dots for an empty series');
    problems.equal(!!line, false, 'a line for an empty series');
    problems.equal(!!area, false, 'an area for an empty series');
    return problems;
  }

  if (combo.type === 'bar') {
    problems.equal(bars.length, points, 'one part="bar" per data point');
    problems.equal(!!line, false, 'a bar chart drew a line');
    problems.equal(!!area, false, 'a bar chart drew an area');
    // `showDots` is documented on the component, not on a type; a bar chart has
    // no vertices to dot, so it renders none.
    problems.equal(dots.length, 0, 'a bar chart drew dots');
    for (const [i, bar] of bars.entries()) {
      problems.check(bar.tagName.toLowerCase() === 'rect', `bar[${i}] is a <${bar.tagName}>`);
      const w = num(bar, 'width');
      const h = num(bar, 'height');
      problems.check(w > 0, `bar[${i}] width is ${w}`);
      problems.check(h >= 0, `bar[${i}] height is ${h}`);
      problems.check(num(bar, 'x') >= 0, `bar[${i}] x is ${num(bar, 'x')}`);
      for (const attribute of ['x', 'y', 'width', 'height']) {
        problems.check(Number.isFinite(num(bar, attribute)),
          `bar[${i}] ${attribute}="${bar.getAttribute(attribute)}" is not a finite number`);
      }
    }
    // Bars must not overlap: they are read side by side.
    for (let i = 1; i < bars.length; i++) {
      const prevRight = num(bars[i - 1], 'x') + num(bars[i - 1], 'width');
      problems.check(num(bars[i], 'x') >= prevRight - 0.001,
        `bar[${i}] starts at ${num(bars[i], 'x')}, inside bar[${i - 1}] (ends ${prevRight})`);
    }
  } else {
    problems.equal(bars.length, 0, 'a line/area chart drew bars');
    problems.check(!!line, 'no part="line"');
    if (line) {
      // `smooth` is documented as a shape switch, and the two shapes are
      // different ELEMENTS: a bezier path cannot be expressed as a polyline.
      const wantTag = combo.smooth ? 'path' : 'polyline';
      problems.equal(line.tagName.toLowerCase(), wantTag,
        `smooth=${!!combo.smooth} line element`);
      problems.equal(line.getAttribute('stroke-width'), String(strokeWidth), 'line stroke-width');
      const geometry = combo.smooth ? line.getAttribute('d') : line.getAttribute('points');
      problems.check(!!geometry && geometry.trim().length > 0,
        `the line carries no ${combo.smooth ? 'd' : 'points'} geometry`);
      // A coordinate that is not a number draws NOTHING, however well-formed
      // the rest of the attribute looks. `NaN` is the shape a 0/0 in the
      // normalisation takes, so it is checked explicitly rather than trusted.
      if (geometry) {
        const bad = geometry.match(/NaN|Infinity|undefined/);
        problems.check(!bad,
          `the line geometry contains "${bad?.[0]}" — it paints nothing (${geometry})`);
      }
    }

    // "area — Area fill path": present for type="area" OR the showArea switch.
    const wantArea = combo.type === 'area' || !!combo.showArea;
    problems.equal(!!area, wantArea, `part="area" present (type=${combo.type}, showArea=${!!combo.showArea})`);
    if (area) {
      problems.equal(area.tagName.toLowerCase(), combo.smooth ? 'path' : 'polygon',
        'area element');
    }

    // "showDots — Data point circle", one per point.
    problems.equal(dots.length, combo.showDots ? points : 0, 'part="dot" count');
    for (const [i, dot] of dots.entries()) {
      problems.check(dot.tagName.toLowerCase() === 'circle', `dot[${i}] is a <${dot.tagName}>`);
      problems.equal(num(dot, 'r'), strokeWidth, `dot[${i}] radius tracks stroke-width`);
      for (const attribute of ['cx', 'cy']) {
        problems.check(Number.isFinite(num(dot, attribute)),
          `dot[${i}] ${attribute}="${dot.getAttribute(attribute)}" is not a finite number`);
      }
    }

    if (area) {
      const geometry = combo.smooth ? area.getAttribute('d') : area.getAttribute('points');
      const bad = (geometry ?? '').match(/NaN|Infinity|undefined/);
      problems.check(!bad,
        `the area geometry contains "${bad?.[0]}" — it paints nothing (${geometry})`);
    }
  }

  // ── The data encoding ────────────────────────────────────────────────────
  //
  // A chart that renders the right number of marks in the wrong order is not
  // showing the series. `single` and `flat` have no ranking to check — every
  // point is the same height by definition — so they only assert that the
  // marks all landed at the same place.
  const tops = markTops(el, combo.type);
  if (tops.length === points && points > 1) {
    const want = expectedRanks(combo.data, combo.min, combo.max);
    const got = renderedRanks(tops);
    problems.equal(got, want, 'the marks do not rank the data the way the series does');
  }

  return problems;
}

export { Problems, wait, SETTLE, text, sr };
