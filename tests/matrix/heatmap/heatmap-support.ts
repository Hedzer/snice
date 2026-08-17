/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-heatmap feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/ai/components/heatmap.md` describes a "GitHub-style calendar heatmap"
 * with seven properties, one event and four parts. What makes it worth a matrix
 * is that its rendered surface is a CALENDAR: every cell stands for one real
 * date, and the doc says what each cell must announce about it.
 *
 *   doc: `data: HeatmapDataPoint[] = []` — `{ date: string, value: number }`
 *   doc: `colorScheme: 'green'|'blue'|'purple'|'orange'|'red' = 'green'`
 *        (attr `color-scheme`)
 *   doc: `showLabels: boolean = true` (attr `show-labels`)
 *   doc: `cellSize: number = 12` / `cellGap: number = 3` — px, attrs
 *        `cell-size` / `cell-gap`
 *   doc: `showTooltip: boolean = true` (attr `show-tooltip`)
 *   doc: `weeks: number = 52` — "Number of weeks to display"
 *   doc: `cell-click → { date: string; value: number }`
 *   doc: parts `base` / `grid-area` / `grid` / `tooltip`
 *   doc, Accessibility: "aria-labels on all cells with date and value",
 *        "Cells are focusable buttons", "Tooltip on hover with date and value"
 *
 * ── What the oracle asserts, and what it deliberately does not ─────────────
 *
 * The calendar is derivable: a GitHub-style heatmap ends TODAY and runs
 * backwards one cell per day, so `expectedDates()` can name every cell of every
 * combo without reading the component. `expectedLabel()` is the doc's
 * "date and value" sentence.
 *
 * The mapping from a value to one of the five painted intensity LEVELS is not
 * documented anywhere, so this module asserts only what the doc supports about
 * it: a cell with no data is at the floor, and a larger value never lands on a
 * lower level than a smaller one. The colour those levels resolve to is a
 * stylesheet question and belongs to the visual tier.
 *
 * `.ai/fuzzing.md`: expectations come from the doc, never from observed output;
 * a divergence is pinned with `it.fails` and a `MATRIX-heatmap-N` id.
 */
import { Problems, expectClean, part, parts, text, wait } from '../matrix-kit';
import { mount, removeComponent } from '../matrix-utils';
import { hasPart } from '../part-exact';
import '../../../packages/components/src/heatmap/snice-heatmap';
import type {
  HeatmapColorScheme, HeatmapDataPoint, SniceHeatmapElement,
} from '../../../packages/components/src/heatmap/snice-heatmap.types';

export { Problems, expectClean, part, parts, removeComponent, text, wait };
export type Heatmap = SniceHeatmapElement & { shadowRoot: ShadowRoot };
export type { HeatmapDataPoint };

/** Settle window: the component renders on a microtask plus a queued task. */
export const SETTLE = 25;

// ── Documented dimensions ───────────────────────────────────────────────────

/** doc: `colorScheme: 'green'|'blue'|'purple'|'orange'|'red' = 'green'` */
export const SCHEMES: HeatmapColorScheme[] = ['green', 'blue', 'purple', 'orange', 'red'];
/** `weeks: number = 52`. Three widths: a fortnight, a month, and two months. */
export const WEEK_COUNTS = [2, 4, 8] as const;
/** `cellSize: number = 12` / `cellGap: number = 3`, both in px. */
export const CELL_SIZES = [8, 12, 20] as const;
export const CELL_GAPS = [0, 3, 6] as const;

export interface HeatmapVector {
  weeks: number;
  colorScheme: HeatmapColorScheme;
  showLabels: boolean;
  showTooltip: boolean;
  cellSize: number;
  cellGap: number;
  data: DataShape;
}

export const DEFAULTS: HeatmapVector = {
  weeks: 4,
  colorScheme: 'green',
  showLabels: true,
  showTooltip: true,
  cellSize: 12,
  cellGap: 3,
  data: 'none',
};

export function vectorId(vector: HeatmapVector): string {
  const flags = [
    vector.showLabels ? 'labels' : 'no-labels',
    vector.showTooltip ? 'tooltip' : 'no-tooltip',
  ].join('+');
  return `weeks=${vector.weeks}/${vector.colorScheme}/${vector.data}/${flags}`;
}

// ── The calendar the doc describes ──────────────────────────────────────────

/** `YYYY-MM-DD`, the format `HeatmapDataPoint.date` uses in the doc's example. */
export function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Midnight today — the last day a GitHub-style calendar heatmap shows. */
export function today(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/** `offset` days before today, as an ISO date string. */
export function daysAgo(offset: number): string {
  const date = today();
  date.setDate(date.getDate() - offset);
  return iso(date);
}

/**
 * The dates a heatmap of `count` cells shows: one cell per day, contiguous,
 * ending today.
 */
export function expectedDates(count: number): string[] {
  return Array.from({ length: count }, (_, i) => daysAgo(count - 1 - i));
}

/**
 * doc, Accessibility: "aria-labels on all cells with date and value".
 *
 * The label a cell carries names both, and pluralises the count the way English
 * does — which is what makes it a sentence rather than a pair of fields.
 */
export function expectedLabel(date: string, value: number): string {
  return `${value} contribution${value !== 1 ? 's' : ''} on ${date}`;
}

// ── Data shapes ─────────────────────────────────────────────────────────────

export type DataShape = 'none' | 'sparse' | 'ramp';

/**
 * Three data shapes: an empty heatmap (the documented default), a couple of
 * scattered points, and a ramp of distinct values that makes the intensity
 * ordering observable.
 */
export function dataFor(shape: DataShape): HeatmapDataPoint[] {
  if (shape === 'none') return [];
  if (shape === 'sparse') {
    return [
      { date: daysAgo(0), value: 5 },
      { date: daysAgo(3), value: 1 },
    ];
  }
  return [
    { date: daysAgo(0), value: 12 },
    { date: daysAgo(1), value: 9 },
    { date: daysAgo(2), value: 6 },
    { date: daysAgo(3), value: 3 },
    { date: daysAgo(4), value: 1 },
  ];
}

/** The value the doc's `data` gives a date, or 0 when it names none. */
export function valueFor(shape: DataShape, date: string): number {
  return dataFor(shape).find(point => point.date === date)?.value ?? 0;
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo. Everything but `data` crosses the ATTRIBUTE channel, which
 * is the form the doc's markup uses (`<snice-heatmap color-scheme="green">`);
 * `data` is documented `attribute: false`, so it can only cross the property
 * channel.
 */
export async function makeHeatmap(vector: Partial<HeatmapVector> = {}): Promise<Heatmap> {
  const full = { ...DEFAULTS, ...vector };
  const attrs: Record<string, any> = {
    weeks: full.weeks,
    'color-scheme': full.colorScheme,
    'cell-size': full.cellSize,
    'cell-gap': full.cellGap,
  };
  const el = await mount<Heatmap>('snice-heatmap', attrs);
  el.showLabels = full.showLabels;
  el.showTooltip = full.showTooltip;
  el.data = dataFor(full.data);
  await wait(SETTLE);
  return el;
}

// ── Reading the rendered tree ───────────────────────────────────────────────

export function cells(el: Heatmap): HTMLElement[] {
  return [...el.shadowRoot.querySelectorAll('.heatmap__cell')] as HTMLElement[];
}

/** The intensity level a cell's `heatmap__cell--level-N` class names. */
export function levelOf(cell: Element): number {
  const match = /heatmap__cell--level-(\d+)/.exec(cell.className);
  return match ? Number(match[1]) : -1;
}

/** The grid's column count, as the inline `repeat(N, …)` template declares it. */
export function gridColumns(el: Heatmap): number {
  const style = el.shadowRoot.querySelector('.heatmap__month-labels')?.getAttribute('style') ?? '';
  const match = /repeat\((\d+)/.exec(style);
  return match ? Number(match[1]) : -1;
}

export function dayLabels(el: Heatmap): string[] {
  return [...el.shadowRoot.querySelectorAll('.heatmap__day-label')]
    .map(node => (node.textContent ?? '').trim());
}

export function monthLabels(el: Heatmap): string[] {
  return [...el.shadowRoot.querySelectorAll('.heatmap__month-label')]
    .map(node => (node.textContent ?? '').trim())
    .filter(Boolean);
}

export function tooltip(el: Heatmap): HTMLElement | null {
  return part(el, 'tooltip');
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * doc: "CSS Parts — `base`: Outer heatmap container div; `grid-area`: Grid area
 * with labels and cells; `grid`: Cell grid container". Those three are
 * unconditional; `tooltip` is the hover surface and is checked where hovering
 * happens.
 */
export function checkShell(problems: Problems, el: Heatmap, vector: HeatmapVector): void {
  const base = part(el, 'base');
  const area = part(el, 'grid-area');
  const grid = part(el, 'grid');
  if (!problems.check(!!base, 'no element exposes part="base"')) return;
  problems.check(!!area, 'no element exposes part="grid-area"');
  problems.check(!!grid, 'no element exposes part="grid"');
  problems.check(hasPart(base, 'base'), 'part="base" is not an exact token');
  if (area) problems.check(base!.contains(area), 'part="grid-area" is not inside part="base"');
  if (grid && area) problems.check(area.contains(grid), 'part="grid" is not inside part="grid-area"');

  // The documented switches must survive the channel the doc's markup uses.
  problems.equal(el.weeks, vector.weeks, 'weeks');
  problems.equal(el.colorScheme, vector.colorScheme, 'colorScheme');
  problems.equal(el.showLabels, vector.showLabels, 'showLabels');
  problems.equal(el.showTooltip, vector.showTooltip, 'showTooltip');
  problems.equal(el.cellSize, vector.cellSize, 'cellSize');
  problems.equal(el.cellGap, vector.cellGap, 'cellGap');

  // `cellSize`/`cellGap` are documented in PX and are answered by two custom
  // properties on the host; that is the only DOM-visible trace they leave.
  problems.equal(el.style.getPropertyValue('--cell-size').trim(), `${vector.cellSize}px`,
    'the --cell-size custom property');
  problems.equal(el.style.getPropertyValue('--cell-gap').trim(), `${vector.cellGap}px`,
    'the --cell-gap custom property');
}

/**
 * The CALENDAR: one focusable button per day, contiguous, ending today, each
 * announcing its own date and value.
 *
 * The doc says `weeks` is the "number of weeks to display", so the grid must
 * cover AT LEAST that many weeks of days. The exact count is pinned separately
 * by MATRIX-heatmap-1.
 */
export function checkCalendar(problems: Problems, el: Heatmap, vector: HeatmapVector): void {
  const nodes = cells(el);
  if (!problems.check(nodes.length > 0, 'the heatmap rendered no cells at all')) return;
  problems.check(nodes.length >= vector.weeks * 7,
    `${nodes.length} cells cover fewer than the ${vector.weeks} weeks the combo asked to display`);

  const dates = expectedDates(nodes.length);
  const grid = part(el, 'grid');

  nodes.forEach((cell, index) => {
    const date = dates[index];
    const value = valueFor(vector.data, date);
    problems.equal(cell.tagName, 'BUTTON', `cell ${index} is not a focusable button`);
    problems.equal(cell.getAttribute('aria-label'), expectedLabel(date, value),
      `cell ${index} aria-label`);
    if (grid) problems.check(grid.contains(cell), `cell ${index} is outside part="grid"`);
  });

  // "GitHub-style" means the calendar ends today; the last cell is today's.
  problems.equal(nodes.at(-1)?.getAttribute('aria-label'),
    expectedLabel(daysAgo(0), valueFor(vector.data, daysAgo(0))),
    'the last cell is not today');

  // The columns the grid declares must hold exactly the cells it rendered.
  problems.equal(gridColumns(el) >= 0 ? gridColumns(el) : -1,
    vector.showLabels ? Math.ceil(nodes.length / 7) : -1,
    'the declared column count does not match the rendered cells');
}

/**
 * The intensity ordering. The level→colour mapping is undocumented, so the only
 * claims made here are the two the doc DOES support: a day with no data is at
 * the floor, and a bigger number is never painted fainter than a smaller one.
 */
export function checkIntensity(problems: Problems, el: Heatmap, vector: HeatmapVector): void {
  const nodes = cells(el);
  const dates = expectedDates(nodes.length);

  const seen = nodes.map((cell, index) => ({
    value: valueFor(vector.data, dates[index]),
    level: levelOf(cell),
  }));

  for (const { value, level } of seen) {
    problems.check(level >= 0, 'a cell carries no intensity level class at all');
    if (value === 0) problems.equal(level, 0, 'a day with no data is not at the floor level');
    else problems.check(level > 0, `a day with ${value} recorded is painted as empty`);
  }

  const ordered = [...seen].sort((a, b) => a.value - b.value);
  for (let i = 1; i < ordered.length; i++) {
    problems.check(ordered[i].level >= ordered[i - 1].level,
      `a day with ${ordered[i].value} is painted fainter than one with ${ordered[i - 1].value}`);
  }
}

/**
 * doc: `showLabels: boolean = true`. The labels are the day-of-week column and
 * the month row; turning the switch off must remove both, and leaving it on
 * must produce a month label for every month the window spans.
 */
export function checkLabels(problems: Problems, el: Heatmap, vector: HeatmapVector): void {
  if (!vector.showLabels) {
    problems.equal(dayLabels(el).length, 0, 'show-labels="false" still rendered the day labels');
    problems.equal(monthLabels(el).length, 0, 'show-labels="false" still rendered the month labels');
    return;
  }

  problems.equal(dayLabels(el).length, 7, 'the day-label column does not have seven rows');

  const months = new Set(expectedDates(cells(el).length)
    .map(date => date.slice(0, 7)));
  problems.check(monthLabels(el).length > 0, 'a labelled heatmap rendered no month label');
  problems.check(monthLabels(el).length <= months.size,
    `${monthLabels(el).length} month labels for a window spanning ${months.size} months`);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface Seen { date: string; value: number }

/** doc: `cell-click → { date: string; value: number }`. */
export function captureClicks(el: Heatmap): Seen[] {
  const seen: Seen[] = [];
  el.addEventListener('cell-click', (event: Event) => seen.push((event as CustomEvent).detail));
  return seen;
}

export function clickCell(el: Heatmap, index: number): void {
  cells(el)[index]?.dispatchEvent(new MouseEvent('click', {
    bubbles: true, composed: true, cancelable: true,
  }));
}

export async function hoverCell(el: Heatmap, index: number): Promise<void> {
  cells(el)[index]?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  await wait(SETTLE);
}

export async function unhoverCell(el: Heatmap, index: number): Promise<void> {
  cells(el)[index]?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  await wait(SETTLE);
}
