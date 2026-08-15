/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-chart feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The pattern is `tests/matrix/table/matrix-utils.ts`: one oracle
 * per combo, expectations derived from the DOCUMENTED contract
 * (`docs/ai/components/chart.md` plus `snice-chart.types.ts`), and every
 * violation of a combo reported together instead of one per re-run.
 *
 * ── What this tier can and cannot judge ─────────────────────────────────────
 *
 * snice-chart paints into a `<canvas>`. In happy-dom there is no 2D context and
 * no layout, so the marks themselves are invisible here BY CONSTRUCTION — the
 * component's own `initAndDrawChart` bails out the moment `getContext` fails.
 * Pretending otherwise would produce a matrix that asserts nothing.
 *
 * So the DOM tier owns the part of the contract that is REAL DOM:
 *
 *   · the documented shell — `part="base"`, `part="canvas"`, `part="legend"` —
 *     and the `role="img"` canvas with a summary `aria-label`;
 *   · the legend: one entry per dataset, in dataset order, carrying the
 *     dataset's own `label` and the colour the documented precedence resolves
 *     (`backgroundColor` string > `borderColor` > the accent palette slot);
 *   · `options.legend.position`, including the `none` case that removes the
 *     legend entirely, and `options.legend.clickable`, which is the documented
 *     gate on toggling a dataset by clicking its legend entry;
 *   · `options.animation.enabled`, which is a class on the container;
 *   · every documented METHOD — `refresh`, `update`, `addDataset`,
 *     `removeDataset`, `toggleDataset`, `exportImage`, `getData` — and the
 *     state each leaves behind.
 *
 * The painted marks are the visual tier's job (tests/live/matrix/chart).
 *
 * `.ai/fuzzing.md` is binding: expectations come from the docs, never from
 * observed output, and a divergence is a FINDING — the assertion stays and the
 * test is declared `it.fails` with a `MATRIX-chart-N` id.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/chart/snice-chart';
import type {
  ChartDataset, ChartOptions, ChartType, SniceChartElement,
} from '../../../packages/components/src/chart/snice-chart.types';

export { wait, createComponent };
export type { ChartDataset, ChartOptions, ChartType, SniceChartElement };

/** Settle window: the chart re-renders on property invalidation plus an rAF. */
export const SETTLE = 40;

/** Every documented chart type, in the order the doc's union lists them. */
export const TYPES: ChartType[] = [
  'line', 'bar', 'horizontal-bar', 'area', 'pie', 'donut',
  'scatter', 'bubble', 'radar', 'mixed',
];

/** Every documented legend position, including the one that removes it. */
export const LEGEND_POSITIONS = ['top', 'bottom', 'left', 'right', 'none'] as const;

export interface ChartSpec {
  type?: ChartType;
  datasets?: ChartDataset[];
  labels?: string[];
  options?: ChartOptions;
  width?: number;
  height?: number;
}

/**
 * Mount a chart for one combo.
 *
 * `type`, `width` and `height` cross the ATTRIBUTE channel — the doc's own
 * markup example is `<snice-chart type="line" height="400">`. `datasets`,
 * `labels` and `options` are documented "property only" and are assigned as
 * properties, exactly as the doc's script example does.
 */
export async function makeChart(spec: ChartSpec = {}): Promise<SniceChartElement> {
  const attrs: Record<string, any> = {};
  if (spec.type) attrs.type = spec.type;
  if (spec.width !== undefined) attrs.width = spec.width;
  if (spec.height !== undefined) attrs.height = spec.height;

  const el = await createComponent<SniceChartElement>('snice-chart', attrs);
  if (spec.labels) el.labels = spec.labels;
  if (spec.options) el.options = spec.options;
  if (spec.datasets) el.datasets = spec.datasets;
  await wait(SETTLE);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceChartElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-chart has no shadow root');
  return root;
}

/**
 * Nodes exposing EXACTLY the named CSS part.
 *
 * `[part~="base"]` is not used: happy-dom's attribute-word matcher also returns
 * hyphenated siblings, which would silently turn every part assertion in this
 * directory into a substring test. Splitting the attribute by hand is what a
 * browser's `~=` actually means.
 */
export function partsIn<T extends Element = HTMLElement>(root: ParentNode, name: string): T[] {
  return [...root.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as unknown as T[];
}

export function part<T extends Element = HTMLElement>(el: SniceChartElement, name: string): T | null {
  return partsIn<T>(sr(el), name)[0] ?? null;
}

export function canvasEl(el: SniceChartElement): HTMLCanvasElement | null {
  return sr(el).querySelector('.chart-render-canvas');
}

export function legendEl(el: SniceChartElement): HTMLElement | null {
  return part(el, 'legend');
}

export function legendItems(el: SniceChartElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.legend-item')];
}

export function legendLabels(el: SniceChartElement): string[] {
  return legendItems(el).map(item =>
    (item.querySelector('.legend-label')?.textContent ?? '').replace(/\s+/g, ' ').trim());
}

/**
 * The inline colour each legend swatch was given.
 *
 * Read from the `style` ATTRIBUTE rather than `.style.background`: happy-dom
 * does not expand the `background` shorthand into its longhands, so the
 * property accessor reads empty for every swatch the component painted
 * correctly and the whole colour-precedence contract would silently pass.
 */
export function legendSwatchColors(el: SniceChartElement): string[] {
  return legendItems(el).map(item =>
    (item.querySelector('.legend-color') as HTMLElement | null)?.getAttribute('style') ?? '');
}

export function hiddenLegendFlags(el: SniceChartElement): boolean[] {
  return legendItems(el).map(item => item.classList.contains('hidden'));
}

export function containerEl(el: SniceChartElement): HTMLElement | null {
  return part(el, 'base');
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * The documented colour precedence for a dataset's legend swatch:
 *   1. `backgroundColor`, when it is a single colour (an ARRAY is per-slice
 *      colouring for pie/donut and is not the dataset's own colour);
 *   2. `borderColor`;
 *   3. the theme accent slot for the dataset's index.
 *
 * The third case has no documented literal, so the oracle asserts only that a
 * non-empty colour was resolved — pinning it to an observed hex would make the
 * matrix fail on a theme change for no reason.
 */
export function expectedSwatch(dataset: ChartDataset): string | null {
  if (dataset.backgroundColor && !Array.isArray(dataset.backgroundColor)) {
    return dataset.backgroundColor;
  }
  if (dataset.borderColor) return dataset.borderColor;
  return null;   // palette slot — asserted structurally
}

/**
 * The CORE oracle: assert the whole rendered shell for a combo, collecting
 * every violation so one run tells the whole story.
 *
 * `hidden` is the set of dataset indices the combo has toggled OFF through the
 * documented `toggleDataset` / legend-click routes.
 */
export function expectChartMatches(
  el: SniceChartElement,
  spec: {
    type: ChartType;
    datasets: ChartDataset[];
    options?: ChartOptions;
    hidden?: number[];
  },
): void {
  const problems: string[] = [];
  const position = spec.options?.legend?.position ?? 'top';
  const hidden = new Set(spec.hidden ?? []);

  // ── The documented shell ──────────────────────────────────────────────────
  const base = containerEl(el);
  if (!base) problems.push('no part="base" rendered');
  const canvasHost = part(el, 'canvas');
  if (!canvasHost) problems.push('no part="canvas" rendered');

  const canvas = canvasEl(el);
  if (!canvas) {
    problems.push('no <canvas> rendered');
  } else {
    // Doc "Accessibility" plus the component's own summary: the canvas is the
    // chart, so it must be an image with a description — a bare canvas is
    // invisible to assistive technology.
    if (canvas.getAttribute('role') !== 'img') {
      problems.push(`canvas role "${canvas.getAttribute('role')}", expected img`);
    }
    const label = canvas.getAttribute('aria-label') ?? '';
    if (!label.trim()) problems.push('canvas has an empty aria-label');
    const points = spec.datasets.reduce((n, d) => n + (d.data?.length ?? 0), 0);
    if (!label.includes(`${spec.datasets.length} dataset`)) {
      problems.push(`aria-label "${label}" does not state ${spec.datasets.length} datasets`);
    }
    if (!label.includes(`${points} data point`)) {
      problems.push(`aria-label "${label}" does not state ${points} data points`);
    }
  }

  // ── Doc: `animation.enabled` (default true) ───────────────────────────────
  const animated = spec.options?.animation?.enabled !== false;
  if (base && base.classList.contains('animated') !== animated) {
    problems.push(`animation enabled=${animated} but container `
      + `${base.classList.contains('animated') ? 'has' : 'lacks'} the "animated" class`);
  }

  // ── Doc: `legend.position`, with `none` removing the legend ───────────────
  const legend = legendEl(el);
  if (position === 'none') {
    if (legend) problems.push('legend position "none" still rendered part="legend"');
  } else if (!legend) {
    problems.push(`legend position "${position}" rendered no part="legend"`);
  } else {
    if (!legend.classList.contains(`legend-${position}`)) {
      problems.push(`legend classes "${legend.className}" lack legend-${position}`);
    }

    // One entry per dataset, in dataset order, carrying the dataset's label.
    const labels = legendLabels(el);
    const wanted = spec.datasets.map(dataset => dataset.label);
    if (JSON.stringify(labels) !== JSON.stringify(wanted)) {
      problems.push(`legend labels ${JSON.stringify(labels)} != ${JSON.stringify(wanted)}`);
    }

    // The documented colour precedence.
    const swatches = legendSwatchColors(el);
    spec.datasets.forEach((dataset, i) => {
      const want = expectedSwatch(dataset);
      const got = swatches[i];
      if (got === undefined) return;   // count already reported
      if (want === null) {
        if (!got.trim()) problems.push(`dataset ${i}: legend swatch has no colour at all`);
      } else if (!got.includes(want)) {
        problems.push(`dataset ${i}: legend swatch "${got}" does not use "${want}"`);
      }
    });

    // Doc: a toggled-off dataset is visibly off in the legend.
    const flags = hiddenLegendFlags(el);
    spec.datasets.forEach((dataset, i) => {
      const want = hidden.has(i);
      if (flags[i] !== want) {
        problems.push(`dataset ${i} (${dataset.label}): legend hidden=${flags[i]}, expected ${want}`);
      }
    });
  }

  expect(problems, `chart combo type=${spec.type}/legend=${position}`).toEqual([]);
}

// ── Fixtures ────────────────────────────────────────────────────────────────

/** The doc's own dataset, extended to two series so ordering can be asserted. */
export const CANONICAL: ChartDataset[] = [
  { label: 'Sales', data: [12, 19, 15, 25], borderColor: '#2196f3' },
  { label: 'Costs', data: [8, 11, 9, 14], borderColor: '#e91e63' },
];

export const CANONICAL_LABELS = ['Jan', 'Feb', 'Mar', 'Apr'];

/** N generated series, for the legend-count and index-arithmetic combos. */
export function series(count: number, points = 4): ChartDataset[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Series ${i}`,
    data: Array.from({ length: points }, (_, j) => (i + 1) * (j + 1)),
  }));
}

/**
 * The title of a test pinned to a known divergence from the docs. The assertion
 * is NOT weakened and the component is NOT changed (`.ai/fuzzing.md`); the test
 * is `it.fails`, so it starts failing the day the component is fixed.
 */
export function finding(id: string, description: string): string {
  return `${id}: ${description}`;
}
