/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-candlestick feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is derived from docs/ai/components/candlestick.md and
 * snice-candlestick.types.ts, never from observed output:
 *
 *   Properties  data (CandleData[] — {date, open, high, low, close, volume?}),
 *               showVolume, showGrid, showCrosshair, bullishColor, bearishColor,
 *               timeFormat auto|date|time|datetime|month|year,
 *               yAxisFormat number|currency|percent, zoomEnabled, animation
 *   Methods     resetZoom() "Reset zoom to show all data",
 *               zoomTo(startIndex, endIndex) "Zoom to index range"
 *   Events      candle-click  -> { candle, index }
 *               candle-hover  -> { candle, index }
 *               crosshair-move -> { price, date, x, y }
 *   Parts       base, canvas (SVG), tooltip
 *   CSS vars    --snice-candlestick-bullish / --snice-candlestick-bearish
 *   A11y        SVG role="img" with an aria-label
 *
 * ── The oracle: the chart must agree with its own axis ──────────────────────
 *
 * A candlestick chart makes exactly one geometric promise: every price in the
 * data is plotted against the y axis the chart is showing, and every candle
 * occupies the x slot of its index. So the oracle does not hard-code pixel
 * constants (those are layout, not contract). It READS THE Y AXIS the component
 * rendered, fits the affine price->y map those labels describe, and then checks
 * that every wick, body, and volume bar obeys it. A chart whose candles do not
 * line up with its own axis is lying to the reader, and that is the defect this
 * tier exists to catch.
 *
 * ── Why this module supplies DOMPoint ───────────────────────────────────────
 *
 * happy-dom performs no layout and ships no `DOMPoint`, so the component's
 * pointer path (`new DOMPoint(...).matrixTransform(svg.getScreenCTM().inverse())`)
 * throws before it can reach the documented crosshair. `withPointerSpace`
 * supplies the missing primitive and an IDENTITY screen matrix — the one input
 * the environment cannot provide — exactly as the cropper matrix supplies a
 * measured rectangle. It fakes no component behaviour: the component still
 * decides what to draw from the coordinates it is handed.
 */
import { createComponent, removeComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/candlestick/snice-candlestick';
import type {
  CandleData, TimeFormat, YAxisFormat,
} from '../../../packages/components/src/candlestick/snice-candlestick.types';

export { createComponent, removeComponent, wait };
export type { CandleData, TimeFormat, YAxisFormat };

/** The component builds its SVG imperatively; give it a generous settle. */
export const SETTLE = 60;

export const TIME_FORMATS: readonly TimeFormat[] =
  ['auto', 'date', 'time', 'datetime', 'month', 'year'] as const;
export const Y_AXIS_FORMATS: readonly YAxisFormat[] = ['number', 'currency', 'percent'] as const;

// ── Datasets ────────────────────────────────────────────────────────────────
//
// Dates are LOCAL `Date` objects (the documented `date` type is
// `string | number | Date`), so every expectation in this file is independent
// of the machine's time zone. The ISO-string parsing path is pinned separately,
// under its own fixed zone, in candlestick-events.test.ts.

function day(index: number): Date {
  return new Date(2024, 0, 1 + index, 12, 30, 0);
}

export interface Dataset {
  id: string;
  data: CandleData[];
  /** What this shape exists to pin. */
  why: string;
}

/** A deterministic OHLC walk: alternating bullish/bearish, no randomness. */
function walk(count: number, withVolume = true): CandleData[] {
  const out: CandleData[] = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    const up = i % 2 === 0;
    const open = price;
    const close = up ? price + 4 + (i % 3) : price - 3 - (i % 3);
    const high = Math.max(open, close) + 2 + (i % 2);
    const low = Math.min(open, close) - 2 - (i % 4);
    out.push({
      date: day(i), open, high, low, close,
      ...(withVolume ? { volume: 100_000 + i * 7_000 } : {}),
    });
    price = close;
  }
  return out;
}

export const DATASETS: Dataset[] = [
  { id: 'empty', data: [], why: 'no data at all — nothing may be plotted' },
  {
    id: 'single',
    data: [{ date: day(0), open: 100, high: 110, low: 95, close: 105, volume: 500_000 }],
    why: 'one candle — the degenerate x axis',
  },
  { id: 'five-mixed', data: walk(5), why: 'the doc example shape: both directions' },
  {
    id: 'all-bullish',
    data: [0, 1, 2, 3].map(i => ({
      date: day(i), open: 100 + i, high: 108 + i, low: 99 + i, close: 105 + i, volume: 10_000 * (i + 1),
    })),
    why: 'close >= open everywhere — every candle takes the bullish colour',
  },
  {
    id: 'all-bearish',
    data: [0, 1, 2, 3].map(i => ({
      date: day(i), open: 110 - i, high: 112 - i, low: 100 - i, close: 102 - i, volume: 10_000 * (4 - i),
    })),
    why: 'close < open everywhere — every candle takes the bearish colour',
  },
  {
    id: 'doji',
    data: [0, 1, 2].map(i => ({
      date: day(i), open: 100, high: 100, low: 100, close: 100, volume: 1_000,
    })),
    why: 'open == close == high == low — a zero-height body must still be drawn',
  },
  { id: 'no-volume', data: walk(4, false), why: 'volume is optional in CandleData' },
  {
    id: 'zero-volume',
    data: walk(4).map(c => ({ ...c, volume: 0 })),
    why: 'every volume zero — the bar scale must not divide by zero',
  },
  {
    id: 'negative-prices',
    data: [0, 1, 2].map(i => ({
      date: day(i), open: -10 + i, high: -5 + i, low: -20 + i, close: -8 + i, volume: 5_000,
    })),
    why: 'prices below zero are still prices',
  },
  { id: 'sixty', data: walk(60), why: 'a wide window: label thinning and narrow candles' },
];

export const DATASET = Object.fromEntries(DATASETS.map(d => [d.id, d])) as Record<string, Dataset>;

// ── Combo ───────────────────────────────────────────────────────────────────

export interface CandleCombo {
  id: string;
  dataset: Dataset;
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  bullishColor: string;
  bearishColor: string;
  timeFormat: TimeFormat;
  yAxisFormat: YAxisFormat;
  zoomEnabled: boolean;
  animation: boolean;
}

export const DEFAULTS: Omit<CandleCombo, 'id' | 'dataset'> = {
  showVolume: false,
  showGrid: true,
  showCrosshair: true,
  bullishColor: '',
  bearishColor: '',
  timeFormat: 'auto',
  yAxisFormat: 'number',
  zoomEnabled: true,
  animation: true,
};

export function combo(
  id: string, dataset: Dataset, overrides: Partial<CandleCombo> = {},
): CandleCombo {
  return { ...DEFAULTS, dataset, id, ...overrides };
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Apply a combo's documented property vector to a mounted chart.
 *
 * `data` has `attribute: false`, so it crosses the property channel; every
 * documented boolean/enum crosses the property channel too, which is what a page
 * written against the docs' TypeScript example does. `data` goes LAST because
 * the docs' own example configures the chart and then hands it the series.
 */
export function applyCombo(el: any, c: CandleCombo): void {
  el.showVolume = c.showVolume;
  el.showGrid = c.showGrid;
  el.showCrosshair = c.showCrosshair;
  el.bullishColor = c.bullishColor;
  el.bearishColor = c.bearishColor;
  el.timeFormat = c.timeFormat;
  el.yAxisFormat = c.yAxisFormat;
  el.zoomEnabled = c.zoomEnabled;
  el.animation = c.animation;
  el.data = c.dataset.data;
}

/**
 * Mount one combo the way a page does: create the element, let it finish its
 * first pass, then configure it. The macrotask between `ready` and the property
 * vector is what separates "a page script configuring a live chart" from
 * "assignments racing the element's own first render"; the latter is a
 * documented divergence of its own and is pinned in candlestick-events.test.ts,
 * not smuggled into every combo here.
 */
export async function mountChart(c: CandleCombo): Promise<any> {
  const el = await createComponent<any>('snice-candlestick');
  await wait(0);
  applyCombo(el, c);
  await wait(SETTLE);
  return el;
}

/** Mount and configure in the SAME task the element became ready in. */
export async function mountChartImmediately(c: CandleCombo): Promise<any> {
  const el = await createComponent<any>('snice-candlestick');
  applyCombo(el, c);
  await wait(SETTLE);
  return el;
}

export function sr(el: any): ShadowRoot {
  const root = el.shadowRoot as ShadowRoot | null;
  if (!root) throw new Error('snice-candlestick rendered no shadow root');
  return root;
}

const num = (node: Element | null, attr: string): number =>
  Number(node?.getAttribute(attr) ?? NaN);

// ── Reading the rendered chart ──────────────────────────────────────────────

export interface AxisTick { price: number; y: number; text: string }

/** Strip the documented number formatting back to a comparable number. */
export function parsePrice(text: string, format: YAxisFormat): number {
  const bare = text.replace(/,/g, '').replace(/%$/, '').replace(/[^\d.eE+-]/g, '');
  return Number(bare);
}

export function readAxis(el: any, format: YAxisFormat): AxisTick[] {
  return [...sr(el).querySelectorAll('.candlestick__axis-label--y')].map(node => ({
    text: (node.textContent ?? '').trim(),
    price: parsePrice((node.textContent ?? '').trim(), format),
    y: num(node, 'y'),
  }));
}

export interface RenderedCandle {
  index: number;
  x: number;
  bodyLeft: number;
  bodyWidth: number;
  bodyTop: number;
  bodyHeight: number;
  bodyFill: string;
  wickX: number;
  wickTop: number;
  wickBottom: number;
  wickStroke: string;
  bodyClass: string;
  wickClass: string;
  bodyStyle: string;
}

export function readCandles(el: any): RenderedCandle[] {
  const root = sr(el);
  const bodies = [...root.querySelectorAll('.candlestick__body')];
  const wicks = [...root.querySelectorAll('.candlestick__wick')];
  return bodies.map((body, i) => {
    const wick = wicks[i] ?? null;
    return {
      index: Number(body.getAttribute('data-candle-index')),
      x: num(body, 'x') + num(body, 'width') / 2,
      bodyLeft: num(body, 'x'),
      bodyWidth: num(body, 'width'),
      bodyTop: num(body, 'y'),
      bodyHeight: num(body, 'height'),
      bodyFill: body.getAttribute('fill') ?? '',
      wickX: num(wick, 'x1'),
      wickTop: num(wick, 'y1'),
      wickBottom: num(wick, 'y2'),
      wickStroke: wick?.getAttribute('stroke') ?? '',
      bodyClass: body.getAttribute('class') ?? '',
      wickClass: wick?.getAttribute('class') ?? '',
      bodyStyle: body.getAttribute('style') ?? '',
    };
  });
}

export interface RenderedVolume { x: number; width: number; top: number; height: number; fill: string }

export function readVolumes(el: any): RenderedVolume[] {
  return [...sr(el).querySelectorAll('.candlestick__volume')].map(bar => ({
    x: num(bar, 'x') + num(bar, 'width') / 2,
    width: num(bar, 'width'),
    top: num(bar, 'y'),
    height: num(bar, 'height'),
    fill: bar.getAttribute('fill') ?? '',
  }));
}

export const gridYs = (el: any): number[] =>
  [...sr(el).querySelectorAll('.candlestick__grid-line')].map(line => num(line, 'y1'));

export const xLabels = (el: any): Array<{ x: number; text: string }> =>
  [...sr(el).querySelectorAll('.candlestick__axis-label--x')].map(node => ({
    x: num(node, 'x'),
    text: (node.textContent ?? '').trim(),
  }));

// ── Documented formatting ───────────────────────────────────────────────────

/**
 * The shape each documented `yAxisFormat` produces.
 *
 *   number   — a plain number
 *   currency — a fixed two-decimal amount (thousands grouped)
 *   percent  — the value with a trailing percent sign
 */
export function axisTextIsWellFormed(text: string, format: YAxisFormat): boolean {
  switch (format) {
    case 'currency': return /^-?[\d,]+\.\d{2}$/.test(text);
    case 'percent': return /^-?[\d.]+%$/.test(text);
    default: return /^-?[\d,]+(\.\d+)?$/.test(text);
  }
}

/**
 * The shape each documented `timeFormat` produces for a `Date`.
 *
 *   year     — the four-digit calendar year
 *   month    — a month name and a two-digit year
 *   time     — hours and minutes, no calendar date
 *   date     — a month name and a day number
 *   datetime — a calendar date AND a time
 *   auto     — the component picks; for daily data that is a calendar date
 */
export function dateTextIsWellFormed(text: string, format: TimeFormat, date: Date): boolean {
  const year4 = String(date.getFullYear());
  const year2 = year4.slice(-2);
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const dayNo = String(date.getDate());
  const hasTime = /\d{1,2}[:.]\d{2}/.test(text);
  switch (format) {
    case 'year': return text === year4;
    case 'month': return text.includes(month) && text.includes(year2) && !text.includes(dayNo + ',');
    case 'time': return hasTime && !text.includes(month);
    case 'datetime': return text.includes(month) && text.includes(dayNo) && hasTime;
    case 'date':
    case 'auto':
    default: return text.includes(month) && text.includes(dayNo) && !hasTime;
  }
}

// ── Pointer space ───────────────────────────────────────────────────────────

/**
 * Run `body` with the two primitives happy-dom lacks: `DOMPoint`, and an SVG
 * screen matrix. The matrix is the IDENTITY, which is what an untransformed SVG
 * at the viewport origin really has — so a `clientX/clientY` handed to the
 * component arrives as the same point in user space, and the crosshair the
 * component draws can be checked against the coordinates it was given.
 */
export async function withPointerSpace<T>(body: () => Promise<T>): Promise<T> {
  const globals = globalThis as any;
  const hadPoint = 'DOMPoint' in globals;
  const previousPoint = globals.DOMPoint;

  class TestPoint {
    constructor(public x = 0, public y = 0) {}
    matrixTransform(matrix: { a: number; d: number; e: number; f: number }) {
      return new TestPoint(this.x * matrix.a + matrix.e, this.y * matrix.d + matrix.f);
    }
  }
  globals.DOMPoint = TestPoint;

  const svgProto = globals.SVGSVGElement?.prototype ?? globals.SVGElement?.prototype;
  const previousCTM = svgProto ? Object.getOwnPropertyDescriptor(svgProto, 'getScreenCTM') : undefined;
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse() { return identity; } };
  if (svgProto) {
    Object.defineProperty(svgProto, 'getScreenCTM', {
      configurable: true, writable: true, value: () => identity,
    });
  }

  try {
    return await body();
  } finally {
    if (hadPoint) globals.DOMPoint = previousPoint; else delete globals.DOMPoint;
    if (svgProto) {
      if (previousCTM) Object.defineProperty(svgProto, 'getScreenCTM', previousCTM);
      else delete (svgProto as any).getScreenCTM;
    }
  }
}

/** A pointer move over the chart surface, in the component's own user space. */
export function pointerMove(el: any, x: number, y: number): void {
  const base = sr(el).querySelector('[part="base"]')!;
  base.dispatchEvent(new MouseEvent('mousemove', {
    bubbles: true, composed: true, clientX: x, clientY: y,
  }));
}

export function pointerLeave(el: any): void {
  const base = sr(el).querySelector('[part="base"]')!;
  base.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, composed: true }));
}

// ── The oracle ──────────────────────────────────────────────────────────────

const EPS = 0.01;
const close = (a: number, b: number, eps = EPS) => Math.abs(a - b) <= eps;

/**
 * Every documented consequence of a combo, checked against the rendered SVG.
 * Returns the complete violation list so one failing combo tells its whole
 * story; assert `toEqual([])`.
 *
 * `visible` is the slice of `data` the chart is currently showing (the whole
 * dataset unless a test has called the documented `zoomTo`).
 */
export function chartProblems(
  el: any, c: CandleCombo, visible: CandleData[] = c.dataset.data,
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const root = sr(el);

  // ── Structure the docs promise unconditionally ────────────────────────────
  for (const name of ['base', 'canvas', 'tooltip']) {
    if (!root.querySelector(`[part="${name}"]`)) say(`no part="${name}" element`);
  }
  const svg = root.querySelector('[part="canvas"]');
  if (!svg) { say('no SVG canvas at all'); return problems; }
  if (svg.getAttribute('role') !== 'img') {
    say(`SVG role is "${svg.getAttribute('role')}", documented as "img"`);
  }
  const ariaLabel = svg.getAttribute('aria-label') ?? '';
  if (!ariaLabel) say('SVG carries no aria-label');
  else if (!ariaLabel.includes(String(c.dataset.data.length))) {
    say(`aria-label "${ariaLabel}" does not name the ${c.dataset.data.length} data points`);
  }

  const candles = readCandles(el);
  const volumes = readVolumes(el);
  const grid = gridYs(el);
  const axis = readAxis(el, c.yAxisFormat);
  const xs = xLabels(el);

  // ── Empty data plots nothing ──────────────────────────────────────────────
  if (visible.length === 0) {
    if (candles.length) say(`${candles.length} candles rendered for empty data`);
    if (volumes.length) say(`${volumes.length} volume bars rendered for empty data`);
    if (grid.length) say(`${grid.length} grid lines rendered for empty data`);
    if (axis.length) say(`${axis.length} y-axis labels rendered for empty data`);
    if (xs.length) say(`${xs.length} x-axis labels rendered for empty data`);
    return problems;
  }

  // ── One candle per visible data point, in index order ─────────────────────
  if (candles.length !== visible.length) {
    say(`${candles.length} candles rendered for ${visible.length} visible data points`);
    return problems;
  }
  candles.forEach((candle, i) => {
    if (candle.index !== i) say(`candle ${i} carries data-candle-index ${candle.index}`);
  });

  // ── The y axis, and the map every price must obey ─────────────────────────
  if (axis.length < 2) {
    say(`${axis.length} y-axis labels — a price axis needs at least two ticks`);
    return problems;
  }
  for (const tick of axis) {
    if (!axisTextIsWellFormed(tick.text, c.yAxisFormat)) {
      say(`y-axis label "${tick.text}" is not a well-formed ${c.yAxisFormat} value`);
    }
    if (!Number.isFinite(tick.price)) say(`y-axis label "${tick.text}" is not a number`);
    if (!Number.isFinite(tick.y)) say(`y-axis label "${tick.text}" has no y position`);
  }
  const first = axis[0];
  const last = axis[axis.length - 1];
  if (close(first.price, last.price)) {
    say(`the y axis spans no price range (every tick reads ${first.text})`);
    return problems;
  }
  const slope = (last.y - first.y) / (last.price - first.price);
  if (slope >= 0) {
    say(`the y axis runs the wrong way: a higher price maps to a larger y (slope ${slope})`);
  }
  const priceToY = (price: number) => first.y + (price - first.price) * slope;

  // Ticks must be evenly spaced — the axis is linear, and the grid draws it.
  //
  // The axis labels are ROUNDED for display, so the tolerance below is the
  // rounding step of the format, not a fudge factor: a `percent` axis prints two
  // decimals, so consecutive ticks may each be off by up to 0.005 in price,
  // which is |slope| * 0.01 in y once both ends move.
  const tickTolerance = Math.max(0.05, Math.abs(slope) * 0.02);
  for (const tick of axis) {
    if (!close(tick.y, priceToY(tick.price), tickTolerance)) {
      say(`y-axis tick "${tick.text}" sits at y=${tick.y.toFixed(2)},`
        + ` but its own axis puts that price at ${priceToY(tick.price).toFixed(2)}`);
    }
  }

  // ── Candles obey the axis they are drawn against ──────────────────────────
  //
  // The label text is rounded, so the fitted map carries that rounding into
  // every comparison; the tolerance is derived from it rather than chosen.
  const geomTolerance = Math.max(0.5, Math.abs(slope) * 0.02);
  visible.forEach((data, i) => {
    const rendered = candles[i];
    const wantHigh = priceToY(data.high);
    const wantLow = priceToY(data.low);
    const wantOpen = priceToY(data.open);
    const wantClose = priceToY(data.close);

    if (!close(rendered.wickTop, wantHigh, geomTolerance)) {
      say(`candle ${i}: wick top y=${rendered.wickTop.toFixed(2)},`
        + ` but high ${data.high} is at ${wantHigh.toFixed(2)} on the axis`);
    }
    if (!close(rendered.wickBottom, wantLow, geomTolerance)) {
      say(`candle ${i}: wick bottom y=${rendered.wickBottom.toFixed(2)},`
        + ` but low ${data.low} is at ${wantLow.toFixed(2)} on the axis`);
    }
    const wantTop = Math.min(wantOpen, wantClose);
    if (!close(rendered.bodyTop, wantTop, geomTolerance)) {
      say(`candle ${i}: body top y=${rendered.bodyTop.toFixed(2)},`
        + ` but min(open ${data.open}, close ${data.close}) is at ${wantTop.toFixed(2)}`);
    }
    // A body spans open..close. A doji (open == close) has no extent, and the
    // docs promise a candle is drawn for every data point, so the body is
    // allowed to be one unit tall where the maths says zero — but no more.
    const wantHeight = Math.abs(wantClose - wantOpen);
    const heightSlack = Math.max(1, wantHeight * 0.02) + geomTolerance;
    if (rendered.bodyHeight < wantHeight - geomTolerance
      || rendered.bodyHeight > wantHeight + heightSlack) {
      say(`candle ${i}: body height ${rendered.bodyHeight.toFixed(2)},`
        + ` but open..close spans ${wantHeight.toFixed(2)}`);
    }
    if (rendered.bodyHeight <= 0) say(`candle ${i}: body has no height at all`);
    if (rendered.bodyWidth <= 0) say(`candle ${i}: body has no width at all`);

    // The wick runs through the middle of its own body.
    if (!close(rendered.wickX, rendered.x, 0.5)) {
      say(`candle ${i}: wick at x=${rendered.wickX} is not centred on its body`
        + ` (centre ${rendered.x})`);
    }

    // ── Direction colours ────────────────────────────────────────────────
    const bullish = data.close >= data.open;
    const want = bullish ? c.bullishColor : c.bearishColor;
    if (want) {
      if (rendered.bodyFill !== want) {
        say(`candle ${i} is ${bullish ? 'bullish' : 'bearish'} but painted`
          + ` "${rendered.bodyFill}" instead of the configured "${want}"`);
      }
    } else if (!rendered.bodyFill.startsWith('var(')) {
      say(`candle ${i} has no colour override, so it must take the`
        + ` --snice-candlestick-${bullish ? 'bullish' : 'bearish'} custom property;`
        + ` it painted "${rendered.bodyFill}"`);
    }
    if (rendered.wickStroke !== rendered.bodyFill) {
      say(`candle ${i}: wick "${rendered.wickStroke}" and body "${rendered.bodyFill}"`
        + ' are different colours');
    }
  });

  // Bullish and bearish must be distinguishable whenever both appear.
  const bullIndex = visible.findIndex(d => d.close >= d.open);
  const bearIndex = visible.findIndex(d => d.close < d.open);
  if (bullIndex >= 0 && bearIndex >= 0
    && candles[bullIndex].bodyFill === candles[bearIndex].bodyFill) {
    say(`bullish and bearish candles are both painted "${candles[bullIndex].bodyFill}"`);
  }

  // ── x slots: one per index, evenly spaced, left to right ──────────────────
  const centres = candles.map(candle => candle.x);
  for (let i = 1; i < centres.length; i++) {
    if (centres[i] <= centres[i - 1]) {
      say(`candle ${i} sits at x=${centres[i]}, not to the right of candle ${i - 1}`
        + ` (x=${centres[i - 1]})`);
    }
  }
  if (centres.length > 2) {
    const step = centres[1] - centres[0];
    for (let i = 2; i < centres.length; i++) {
      if (!close(centres[i] - centres[i - 1], step, 0.5)) {
        say(`x slots are uneven: step ${i} is ${(centres[i] - centres[i - 1]).toFixed(2)},`
          + ` first step was ${step.toFixed(2)}`);
      }
    }
  }

  // ── showGrid ──────────────────────────────────────────────────────────────
  if (c.showGrid) {
    if (grid.length === 0) say('showGrid is true but no grid lines are drawn');
    for (const y of grid) {
      if (!axis.some(tick => close(tick.y, y, 0.5))) {
        say(`grid line at y=${y.toFixed(2)} does not sit on any y-axis tick`);
      }
    }
  } else if (grid.length) {
    say(`showGrid is false but ${grid.length} grid lines are drawn`);
  }

  // ── showVolume ────────────────────────────────────────────────────────────
  if (c.showVolume) {
    if (volumes.length !== visible.length) {
      say(`showVolume is true but ${volumes.length} bars were drawn for`
        + ` ${visible.length} candles`);
    } else {
      const maxVolume = Math.max(...visible.map(d => d.volume ?? 0));
      const tallest = Math.max(...volumes.map(v => v.height));
      volumes.forEach((bar, i) => {
        if (!close(bar.x, candles[i].x, 0.5)) {
          say(`volume bar ${i} at x=${bar.x} is not aligned with its candle`
            + ` (x=${candles[i].x})`);
        }
        if (bar.height < 0) say(`volume bar ${i} has negative height ${bar.height}`);
        if (maxVolume > 0 && tallest > 0) {
          const wantRatio = (visible[i].volume ?? 0) / maxVolume;
          const gotRatio = bar.height / tallest;
          if (!close(gotRatio, wantRatio, 0.01)) {
            say(`volume bar ${i} is ${(gotRatio * 100).toFixed(1)}% of the tallest bar,`
              + ` but its volume is ${(wantRatio * 100).toFixed(1)}% of the largest`);
          }
        }
        if (bar.fill !== candles[i].bodyFill) {
          say(`volume bar ${i} is "${bar.fill}" but its candle is "${candles[i].bodyFill}"`);
        }
      });
    }
  } else if (volumes.length) {
    say(`showVolume is false but ${volumes.length} volume bars are drawn`);
  }

  // ── x-axis labels: the documented time format ─────────────────────────────
  if (xs.length === 0) say('no x-axis labels at all');
  for (const label of xs) {
    // Which candle does this label belong to? The nearest x slot.
    let nearest = 0;
    for (let i = 1; i < centres.length; i++) {
      if (Math.abs(centres[i] - label.x) < Math.abs(centres[nearest] - label.x)) nearest = i;
    }
    if (!close(centres[nearest], label.x, 0.5)) {
      say(`x-axis label "${label.text}" at x=${label.x} sits on no candle slot`);
      continue;
    }
    const when = visible[nearest].date;
    const date = when instanceof Date ? when : new Date(when as any);
    if (!dateTextIsWellFormed(label.text, c.timeFormat, date)) {
      say(`x-axis label for candle ${nearest} reads "${label.text}",`
        + ` which is not a timeFormat="${c.timeFormat}" rendering of ${date.toISOString()}`);
    }
  }

  // ── animation ─────────────────────────────────────────────────────────────
  //
  // The documented switch: `animation` true means candles animate in. The
  // component's entry animation is a class plus a per-candle delay.
  const animated = candles.filter(candle => candle.bodyClass.includes('--animated')).length;
  if (c.animation && animated !== candles.length) {
    say(`animation is true but only ${animated}/${candles.length} candles animate in`);
  }
  if (!c.animation && animated !== 0) {
    say(`animation is false but ${animated} candles carry the entry animation`);
  }

  return problems;
}

/** The tooltip element, and whether the component considers it visible. */
export function tooltipState(el: any): { visible: boolean; rows: Array<[string, string]> } {
  const tooltip = sr(el).querySelector('[part="tooltip"]') as HTMLElement | null;
  if (!tooltip) return { visible: false, rows: [] };
  const rows = [...tooltip.querySelectorAll('.candlestick__tooltip-row')].map(row => [
    (row.querySelector('.candlestick__tooltip-label')?.textContent ?? '').trim(),
    (row.querySelector('.candlestick__tooltip-value')?.textContent ?? '').trim(),
  ] as [string, string]);
  return { visible: tooltip.classList.contains('candlestick__tooltip--visible'), rows };
}

export function crosshairLines(el: any): { horizontal: number; vertical: number } {
  const group = sr(el).querySelector('.candlestick__crosshair-group');
  return {
    horizontal: group?.querySelectorAll('.candlestick__crosshair-h').length ?? 0,
    vertical: group?.querySelectorAll('.candlestick__crosshair-v').length ?? 0,
  };
}
