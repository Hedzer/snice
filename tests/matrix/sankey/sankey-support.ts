/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-sankey feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted in this directory comes from `docs/ai/components/sankey.md`
 * plus `snice-sankey.types.ts`:
 *
 *   · PROPERTIES — `data: SankeyData` ("JS only"), `nodeWidth` (attr
 *     `node-width`), `nodePadding` (attr `node-padding`), `alignment` (four
 *     documented values), `showLabels` (default TRUE), `showValues` (default
 *     TRUE), `animation` (default FALSE).
 *   · TYPES — `SankeyNode { id, label?, color? }` and
 *     `SankeyLink { source, target, value, color? }`. `label` and `color` are
 *     OPTIONAL, and the doc's Types section (docs/ai/components/sankey.md
 *     lines 25-26) anchors the fallbacks: "label defaults to the node id",
 *     "link color defaults to its source node's color".
 *   · EVENTS — `sankey-node-click { node }`, `sankey-link-click { link }`,
 *     `sankey-hover { type, item } | null`.
 *   · CSS PARTS — `base`, `chart`, `tooltip`.
 *   · TOOLTIP — the doc's Tooltip section (docs/ai/components/sankey.md
 *     lines 45-49) anchors the exact copy: a node shows
 *     `<label> Value: <value>` (label defaulting to the id), a link shows
 *     `<source> → <target> Value: <value>` (endpoint labels, falling back to
 *     ids). That is where 'Sink Value: 100' and 'A → Sink Value: 30' come
 *     from.
 *   · LAYOUT — the doc's Layout section (docs/ai/components/sankey.md
 *     lines 40-43) anchors the conservation semantics: "A ribbon's stroke
 *     width is proportional to its value" and "a node is at least as tall as
 *     the total flow leaving it" — the promise MATRIX-sankey-2 pins a
 *     violation of.
 *   · A11Y — "SVG role='img' with aria-label", "Hover highlighting dims
 *     non-connected elements".
 *
 * The oracle encodes the structural rule the whole diagram follows: ONE
 * RECTANGLE PER NODE and ONE PATH PER LINK, every mark inside the viewBox, with
 * labels and values written only when their switch is on. The exact flow
 * geometry (which the component relaxes over 32 iterations) is asserted as
 * relationships — a link starts at its source's right edge and ends at its
 * target's left edge, a node is at least as tall as its own flow (Layout,
 * above) — rather than as coordinates the docs never promise.
 *
 * happy-dom performs no layout, so the component keeps its own 600x400 default
 * viewport. That is stable and sufficient here; real geometry belongs to the
 * visual tier at `tests/live/matrix/sankey/`.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/sankey/snice-sankey';
import type {
  SankeyAlignment, SankeyData, SankeyLink, SankeyNode, SniceSankeyElement,
} from '../../../packages/components/src/sankey/snice-sankey.types';

export { wait };
export type { SankeyAlignment, SankeyData, SankeyLink, SankeyNode, SniceSankeyElement };

/** Render settle window: the chart is rebuilt on a microtask plus a task. */
export const SETTLE = 30;

/** Every documented `alignment`. */
export const ALIGNMENTS: SankeyAlignment[] = ['left', 'right', 'center', 'justify'];

/** The three documented CSS parts. */
export const DOC_PARTS = ['base', 'chart', 'tooltip'] as const;

/** The component's own default viewport when nothing has measured it. */
export const VIEW = { width: 600, height: 400 };

// ── Fixtures ────────────────────────────────────────────────────────────────

/** The doc's own example, verbatim. */
export const DOC_DATA: SankeyData = {
  nodes: [
    { id: 'a', label: 'Source', color: '#2196f3' },
    { id: 'b', label: 'Target', color: '#4caf50' },
  ],
  links: [{ source: 'a', target: 'b', value: 100 }],
};

export const DATASETS: Record<string, SankeyData> = {
  /** The doc's example. */
  doc: DOC_DATA,
  /** The documented empty default. */
  empty: { nodes: [], links: [] },
  /** Nodes but no links: nothing flows, so nothing can be laid out. */
  nodesOnly: { nodes: [{ id: 'a' }, { id: 'b' }], links: [] },
  /** Three columns in a row — the simplest multi-depth diagram. */
  chain: {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    links: [
      { source: 'a', target: 'b', value: 60 },
      { source: 'b', target: 'c', value: 60 },
    ],
  },
  /** A split and a merge: the shape a Sankey exists to draw. */
  diamond: {
    nodes: [{ id: 'in' }, { id: 'x' }, { id: 'y' }, { id: 'out' }],
    links: [
      { source: 'in', target: 'x', value: 60 },
      { source: 'in', target: 'y', value: 40 },
      { source: 'x', target: 'out', value: 60 },
      { source: 'y', target: 'out', value: 40 },
    ],
  },
  /** Two sources feeding one sink, with explicit link colours. */
  merge: {
    nodes: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'sink', label: 'Sink' },
    ],
    links: [
      { source: 'a', target: 'sink', value: 30, color: '#e74c3c' },
      { source: 'b', target: 'sink', value: 70, color: '#1565c0' },
    ],
  },
  /** No labels anywhere: every node must fall back to its id. */
  unlabelled: {
    nodes: [{ id: 'alpha' }, { id: 'beta' }],
    links: [{ source: 'alpha', target: 'beta', value: 5 }],
  },
  /** A zero-value flow — documented `value: number`, no exception for 0. */
  zero: {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    links: [
      { source: 'a', target: 'b', value: 50 },
      { source: 'a', target: 'c', value: 0 },
    ],
  },
  /** A link naming a node that does not exist. */
  danglingLink: {
    nodes: [{ id: 'a' }, { id: 'b' }],
    links: [
      { source: 'a', target: 'b', value: 10 },
      { source: 'a', target: 'ghost', value: 10 },
    ],
  },
  /** A cycle: the depth walk has to terminate. */
  cycle: {
    nodes: [{ id: 'a' }, { id: 'b' }],
    links: [
      { source: 'a', target: 'b', value: 10 },
      { source: 'b', target: 'a', value: 4 },
    ],
  },
  /** Wildly different magnitudes, where a thin flow can vanish. */
  steep: {
    nodes: [{ id: 'a' }, { id: 'big' }, { id: 'small' }],
    links: [
      { source: 'a', target: 'big', value: 100000 },
      { source: 'a', target: 'small', value: 1 },
    ],
  },
  /** Labels a renderer must escape rather than interpret. */
  markup: {
    nodes: [
      { id: 'x', label: '<script>alert(1)</script>' },
      { id: 'y', label: 'A & B "quoted"' },
    ],
    links: [{ source: 'x', target: 'y', value: 7 }],
  },
};

// ── Mounting ────────────────────────────────────────────────────────────────

export interface SankeyCombo {
  dataset?: keyof typeof DATASETS;
  nodeWidth?: number;
  nodePadding?: number;
  alignment?: SankeyAlignment;
  showLabels?: boolean;
  showValues?: boolean;
  animation?: boolean;
}

export function comboId(combo: SankeyCombo): string {
  return `${combo.dataset ?? 'doc'}`
    + `/align=${combo.alignment ?? 'justify'}`
    + `/labels=${combo.showLabels === false ? 'off' : 'on'}`
    + `/values=${combo.showValues === false ? 'off' : 'on'}`
    + `/w=${combo.nodeWidth ?? 20}`
    + `/pad=${combo.nodePadding ?? 10}`
    + `${combo.animation ? '/animation' : ''}`;
}

/**
 * Mount one combo. `data` has no attribute form ("JS only"), so it crosses the
 * property channel; `node-width`, `node-padding`, `alignment` and `animation`
 * cross the attribute channel the doc's markup uses, and `showLabels` /
 * `showValues` default to TRUE, so switching them off crosses the property one.
 */
export async function mountSankey(combo: SankeyCombo = {}): Promise<SniceSankeyElement> {
  const el = document.createElement('snice-sankey') as SniceSankeyElement;
  if (combo.nodeWidth !== undefined) el.setAttribute('node-width', String(combo.nodeWidth));
  if (combo.nodePadding !== undefined) el.setAttribute('node-padding', String(combo.nodePadding));
  if (combo.alignment) el.setAttribute('alignment', combo.alignment);
  if (combo.animation) el.setAttribute('animation', '');
  document.body.appendChild(el);
  await (el as any).ready;
  if (combo.showLabels === false) el.showLabels = false;
  if (combo.showValues === false) el.showValues = false;
  el.data = DATASETS[combo.dataset ?? 'doc'];
  await wait(SETTLE);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceSankeyElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-sankey rendered no shadow root');
  return root;
}

export function partEl(el: SniceSankeyElement, name: string): HTMLElement | null {
  return exactPart<HTMLElement>(el as HTMLElement, name);
}

export function svg(el: SniceSankeyElement): SVGSVGElement | null {
  return sr(el).querySelector('svg.sankey__svg');
}

export function nodeGroups(el: SniceSankeyElement): SVGGElement[] {
  return [...sr(el).querySelectorAll<SVGGElement>('g.sankey__node')];
}

export function linkGroups(el: SniceSankeyElement): SVGGElement[] {
  return [...sr(el).querySelectorAll<SVGGElement>('g.sankey__link')];
}

export function nodeRects(el: SniceSankeyElement): SVGRectElement[] {
  return [...sr(el).querySelectorAll<SVGRectElement>('g.sankey__node rect')];
}

export function linkPaths(el: SniceSankeyElement): SVGPathElement[] {
  return [...sr(el).querySelectorAll<SVGPathElement>('g.sankey__link path')];
}

export function labels(el: SniceSankeyElement): Element[] {
  return [...sr(el).querySelectorAll('text.sankey__label')];
}

export function values(el: SniceSankeyElement): Element[] {
  return [...sr(el).querySelectorAll('text.sankey__value')];
}

export function tooltip(el: SniceSankeyElement): HTMLElement | null {
  return partEl(el, 'tooltip');
}

export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The geometry of every node rectangle, in the component's viewport units. */
export function nodeBoxes(el: SniceSankeyElement): Array<{
  id: string; x: number; y: number; w: number; h: number; fill: string;
}> {
  return nodeGroups(el).map(group => {
    const rect = group.querySelector('rect')!;
    return {
      id: group.getAttribute('data-node-id') ?? '',
      x: Number(rect.getAttribute('x')),
      y: Number(rect.getAttribute('y')),
      w: Number(rect.getAttribute('width')),
      h: Number(rect.getAttribute('height')),
      fill: rect.getAttribute('fill') ?? '',
    };
  });
}

/** The first and last point of a link path, plus its stroke. */
export function linkEnds(el: SniceSankeyElement): Array<{
  x0: number; y0: number; x1: number; y1: number; stroke: string; width: number;
}> {
  return linkPaths(el).map(path => {
    const d = path.getAttribute('d') ?? '';
    const start = /^M([-\d.]+),([-\d.]+)/.exec(d);
    const end = /([-\d.]+),([-\d.]+)$/.exec(d);
    return {
      x0: Number(start?.[1]), y0: Number(start?.[2]),
      x1: Number(end?.[1]), y1: Number(end?.[2]),
      stroke: path.getAttribute('stroke') ?? '',
      width: Number(path.getAttribute('stroke-width')),
    };
  });
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Move the pointer over a mark — the documented hover affordance. */
export function moveOver(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('mousemove', {
    bubbles: true, composed: true, clientX: 10, clientY: 10,
  }));
}

export function leave(el: SniceSankeyElement): void {
  partEl(el, 'base')?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
}

// ── Oracles ─────────────────────────────────────────────────────────────────

export class Problems {
  readonly list: string[] = [];

  check(ok: boolean, message: string): boolean {
    if (!ok) this.list.push(message);
    return ok;
  }

  equal(actual: unknown, expected: unknown, what: string): boolean {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    return same;
  }
}

export function expectClean(problems: Problems, id: string): void {
  expect(problems.list, `combo ${id}`).toEqual([]);
}

/** The links a dataset can actually draw: both endpoints have to exist. */
export function drawableLinks(data: SankeyData): SankeyLink[] {
  const ids = new Set(data.nodes.map(node => node.id));
  return data.links.filter(link => ids.has(link.source) && ids.has(link.target));
}

/** Is this dataset drawable at all? Nodes AND links are both required. */
export function isDrawable(data: SankeyData): boolean {
  return data.nodes.length > 0 && data.links.length > 0;
}

/**
 * The whole-diagram oracle: one rectangle per node, one path per link, every
 * mark inside the viewBox, labels and values only when switched on.
 */
export function expectDiagramMatches(el: SniceSankeyElement, combo: SankeyCombo): void {
  const problems = new Problems();
  const data = DATASETS[combo.dataset ?? 'doc'];
  const drawable = isDrawable(data);
  const links = drawableLinks(data);

  // ── Parts ───────────────────────────────────────────────────────────────
  for (const name of DOC_PARTS) {
    problems.check(!!partEl(el, name), `missing part="${name}"`);
  }

  if (!drawable) {
    // "data: SankeyData = { nodes: [], links: [] }" is the documented default,
    // and a diagram with nothing to flow draws nothing rather than throwing.
    problems.equal(nodeGroups(el).length, 0, 'nodes drawn for an undrawable dataset');
    problems.equal(linkGroups(el).length, 0, 'links drawn for an undrawable dataset');
    expectClean(problems, comboId(combo));
    return;
  }

  // ── One mark per datum ──────────────────────────────────────────────────
  problems.equal(nodeGroups(el).length, data.nodes.length, 'node count');
  problems.equal(linkGroups(el).length, links.length, 'link count');

  // ── The chart names itself ──────────────────────────────────────────────
  const chart = svg(el);
  problems.check(!!chart, 'no <svg> chart');
  problems.equal(chart?.getAttribute('role'), 'img', 'svg role');
  problems.check(!!chart?.getAttribute('aria-label'), 'svg has no aria-label');

  // ── Every node is a real rectangle inside the viewport ──────────────────
  const boxes = nodeBoxes(el);
  const ids = data.nodes.map(node => node.id);
  problems.equal([...boxes.map(box => box.id)].sort(), [...ids].sort(), 'node ids');

  for (const box of boxes) {
    if (![box.x, box.y, box.w, box.h].every(Number.isFinite)) {
      problems.list.push(`node ${box.id} has a non-finite box ${JSON.stringify(box)}`);
      continue;
    }
    if (box.w <= 0 || box.h <= 0) problems.list.push(`node ${box.id} is ${box.w}x${box.h}`);
    if (box.x < -0.01 || box.y < -0.01) problems.list.push(`node ${box.id} starts outside the viewport`);
    if (box.x + box.w > VIEW.width + 0.01) problems.list.push(`node ${box.id} escapes the right edge`);
    if (box.y + box.h > VIEW.height + 0.01) problems.list.push(`node ${box.id} escapes the bottom edge`);
    if (!box.fill) problems.list.push(`node ${box.id} has no fill`);
    // `nodeWidth` is documented as the width of a node.
    problems.equal(box.w, combo.nodeWidth ?? 20, `node ${box.id} width`);
  }

  // ── An explicit node colour wins ────────────────────────────────────────
  for (const node of data.nodes) {
    const box = boxes.find(candidate => candidate.id === node.id);
    if (node.color && box && box.fill !== node.color) {
      problems.list.push(`node ${node.id} painted ${box.fill}, not its own ${node.color}`);
    }
  }

  // ── Every link joins the two nodes it names ─────────────────────────────
  const ends = linkEnds(el);
  ends.forEach((end, index) => {
    const link = links[index];
    if (!link) return;
    const source = boxes.find(box => box.id === link.source);
    const target = boxes.find(box => box.id === link.target);
    if (!source || !target) {
      problems.list.push(`link ${index} names a node that was not drawn`);
      return;
    }
    if (![end.x0, end.y0, end.x1, end.y1].every(Number.isFinite)) {
      problems.list.push(`link ${index} has a non-finite path ${JSON.stringify(end)}`);
      return;
    }
    // A flow leaves its source's right edge and arrives at its target's left.
    problems.equal(Math.round(end.x0), Math.round(source.x + source.w), `link ${index} start x`);
    problems.equal(Math.round(end.x1), Math.round(target.x), `link ${index} end x`);
    if (end.width <= 0) problems.list.push(`link ${index} has stroke-width ${end.width}`);
    if (!end.stroke) problems.list.push(`link ${index} has no stroke`);
  });

  // ── An explicit link colour wins, and the default follows the source ────
  links.forEach((link, index) => {
    const end = ends[index];
    if (!end) return;
    if (link.color && end.stroke !== link.color) {
      problems.list.push(`link ${index} stroked ${end.stroke}, not its own ${link.color}`);
    }
    if (!link.color) {
      const source = boxes.find(box => box.id === link.source);
      if (source && end.stroke !== source.fill) {
        problems.list.push(`link ${index} stroked ${end.stroke}, not its source's ${source.fill}`);
      }
    }
  });

  // ── Labels and values ───────────────────────────────────────────────────
  const showLabels = combo.showLabels !== false;
  const showValues = combo.showValues !== false;
  problems.equal(labels(el).length, showLabels ? data.nodes.length : 0, 'label count');
  if (!showValues) problems.equal(values(el).length, 0, 'values drawn with show-values off');
  problems.check(values(el).length <= data.nodes.length, 'more values than nodes');

  if (showLabels) {
    // "label?: string" is optional: a node without one is named by its id.
    const shown = labels(el).map(text).sort();
    const expected = data.nodes.map(node => node.label || node.id).sort();
    problems.equal(shown, expected, 'label text');
  }

  expectClean(problems, comboId(combo));
}

/** Record the named events in dispatch order. */
export const ALL_EVENTS = ['sankey-node-click', 'sankey-link-click', 'sankey-hover'];

export function captureEvents(
  el: SniceSankeyElement,
  types: string[] = ALL_EVENTS,
): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    (el as HTMLElement).addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function keysOf(detail: any): string[] {
  return Object.keys(detail ?? {}).sort();
}
