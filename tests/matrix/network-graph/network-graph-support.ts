/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-network-graph feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Derived from docs/ai/components/network-graph.md and
 * snice-network-graph.types.ts, never from observed output:
 *
 *   Properties  data { nodes, edges }, layout force|circular|grid,
 *               chargeStrength (-300), linkDistance (80), zoomEnabled,
 *               dragEnabled, showLabels, animation
 *   Types       NetworkNode { id, label?, group?, size?, color?, x?, y? }
 *               NetworkEdge { source, target, label?, weight?, color? }
 *   Events      node-click  -> { node }
 *               edge-click  -> { edge }
 *               node-drag   -> { node, x, y }
 *               graph-zoom  -> { scale, x, y }
 *   Parts       base, canvas (the SVG), tooltip
 *   A11y        role="img" with aria-label on the container;
 *               "Hover tooltips with label and degree"
 *
 * ── The oracle: the picture must match the relationships ────────────────────
 *
 * A relationship graph makes one promise above all others: every edge you can
 * see really joins the two nodes it names. So the oracle reads the RENDERED
 * node circles, and then requires every rendered edge path to begin at its
 * source node's centre and end at its target's. That holds under every layout,
 * including the force layout whose positions are deliberately not predictable,
 * which is why it — and not a table of coordinates — is the core assertion.
 *
 * On top of that sit the parts of the contract that ARE closed-form:
 *
 *   · `circular` places node i at angle 2*pi*i/n on a circle centred in the
 *     canvas; `grid` fills a ceil(sqrt(n))-column grid of evenly spaced cells;
 *   · a node with explicit `x`/`y` is placed exactly there and PINNED — the
 *     simulation may not move it;
 *   · a node's radius grows with its degree unless `size` overrides it;
 *   · `color` overrides the group colour; nodes sharing a `group` share a
 *     colour, and different groups get different colours;
 *   · `showLabels` governs node AND edge label text;
 *   · an edge naming a node that does not exist cannot be drawn.
 */
import { createComponent, removeComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/network-graph/snice-network-graph';
import type {
  NetworkNode, NetworkEdge, NetworkGraphData, LayoutType,
} from '../../../packages/components/src/network-graph/snice-network-graph.types';

export { createComponent, removeComponent, wait };
export type { NetworkNode, NetworkEdge, NetworkGraphData, LayoutType };

export const LAYOUTS: readonly LayoutType[] = ['force', 'circular', 'grid'] as const;

/**
 * The canvas the component measures itself into. happy-dom reports a zero box,
 * and the component's own documented fallback for an unmeasurable container is
 * 600x400 — the same numbers its `viewBox` carries. Every closed-form position
 * below is expressed against these.
 */
export const CANVAS = { width: 600, height: 400 };

export const SETTLE = 60;

// ── Graph fixtures ──────────────────────────────────────────────────────────

export interface Fixture { id: string; data: NetworkGraphData; why: string }

const node = (id: string, extra: Partial<NetworkNode> = {}): NetworkNode => ({ id, ...extra });

export const FIXTURES: Fixture[] = [
  { id: 'empty', data: { nodes: [], edges: [] }, why: 'nothing to draw' },
  {
    id: 'isolated-node',
    data: { nodes: [node('a', { label: 'Alone' })], edges: [] },
    why: 'a node with no edges — degree zero',
  },
  {
    id: 'pair',
    data: {
      nodes: [node('a', { label: 'Node A' }), node('b', { label: 'Node B' })],
      edges: [{ source: 'a', target: 'b', label: 'connects' }],
    },
    why: "the docs' own example",
  },
  {
    id: 'star',
    data: {
      nodes: ['hub', 'p1', 'p2', 'p3', 'p4'].map(id => node(id, { label: id.toUpperCase() })),
      edges: ['p1', 'p2', 'p3', 'p4'].map(target => ({ source: 'hub', target })),
    },
    why: 'one high-degree node and four leaves — the radius rule',
  },
  {
    id: 'groups',
    data: {
      nodes: [
        node('a1', { group: 'alpha' }), node('a2', { group: 'alpha' }),
        node('b1', { group: 'beta' }), node('c1', { group: 'gamma' }),
        node('u1'),
      ],
      edges: [
        { source: 'a1', target: 'a2' }, { source: 'a2', target: 'b1' },
        { source: 'b1', target: 'c1' },
      ],
    },
    why: 'three groups plus an ungrouped node — the colour rule',
  },
  {
    id: 'pinned',
    data: {
      nodes: [
        node('a', { x: 100, y: 100 }), node('b', { x: 400, y: 120 }),
        node('c', { x: 250, y: 320 }),
      ],
      edges: [
        { source: 'a', target: 'b' }, { source: 'b', target: 'c' },
        { source: 'c', target: 'a' },
      ],
    },
    why: 'explicit x/y — the positions the caller asked for, under every layout',
  },
  {
    id: 'multi-edge',
    data: {
      nodes: [node('a', { x: 100, y: 200 }), node('b', { x: 400, y: 200 })],
      edges: [
        { source: 'a', target: 'b', label: 'first' },
        { source: 'a', target: 'b', label: 'second' },
      ],
    },
    why: 'two edges between the same pair must be separately visible',
  },
  {
    id: 'dangling-edge',
    data: {
      nodes: [node('a'), node('b')],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'ghost' },
        { source: 'nobody', target: 'b' },
      ],
    },
    why: 'an edge naming a node that does not exist cannot be drawn',
  },
  {
    id: 'styled',
    data: {
      nodes: [
        node('a', { color: 'rgb(10, 20, 30)', size: 30, label: 'Big' }),
        node('b', { color: 'rgb(200, 100, 50)', label: 'Coloured' }),
        node('c', { size: 8 }),
      ],
      edges: [
        { source: 'a', target: 'b', color: 'rgb(0, 0, 255)', weight: 4 },
        { source: 'b', target: 'c', weight: 1 },
        { source: 'a', target: 'c' },
      ],
    },
    why: 'per-node colour/size and per-edge colour/weight overrides',
  },
  {
    id: 'unlabelled',
    data: {
      nodes: [node('alpha'), node('beta'), node('gamma')],
      edges: [{ source: 'alpha', target: 'beta' }, { source: 'beta', target: 'gamma' }],
    },
    why: 'no labels anywhere — the id is the documented fallback label',
  },
  {
    id: 'twelve',
    data: {
      nodes: Array.from({ length: 12 }, (_, i) => node(`n${i}`, { label: `N${i}` })),
      edges: Array.from({ length: 11 }, (_, i) => ({ source: `n${i}`, target: `n${i + 1}` })),
    },
    why: 'enough nodes for the grid to need more than one row',
  },
];

export const FIXTURE = Object.fromEntries(FIXTURES.map(f => [f.id, f])) as Record<string, Fixture>;

// ── Combo ───────────────────────────────────────────────────────────────────

export interface GraphCombo {
  id: string;
  fixture: Fixture;
  layout: LayoutType;
  showLabels: boolean;
  zoomEnabled: boolean;
  dragEnabled: boolean;
  animation: boolean;
  chargeStrength: number;
  linkDistance: number;
}

export const DEFAULTS: Omit<GraphCombo, 'id' | 'fixture'> = {
  layout: 'force',
  showLabels: true,
  zoomEnabled: true,
  dragEnabled: true,
  // The force simulation is a live animation with randomised seeds; the matrix
  // reads a settled tree, so combos that are not ABOUT the animation turn it off
  // and get the component's own single static build instead.
  animation: false,
  chargeStrength: -300,
  linkDistance: 80,
};

export function combo(
  id: string, fixture: Fixture, overrides: Partial<GraphCombo> = {},
): GraphCombo {
  return { ...DEFAULTS, fixture, id, ...overrides };
}

export async function mountGraph(c: GraphCombo): Promise<any> {
  const el = await createComponent<any>('snice-network-graph');
  await wait(0);
  el.layout = c.layout;
  el.showLabels = c.showLabels;
  el.zoomEnabled = c.zoomEnabled;
  el.dragEnabled = c.dragEnabled;
  el.animation = c.animation;
  el.chargeStrength = c.chargeStrength;
  el.linkDistance = c.linkDistance;
  el.data = c.fixture.data;
  await wait(SETTLE);
  return el;
}

export function sr(el: any): ShadowRoot {
  const root = el.shadowRoot as ShadowRoot | null;
  if (!root) throw new Error('snice-network-graph rendered no shadow root');
  return root;
}

// ── Reading the rendered graph ──────────────────────────────────────────────

export interface RenderedNode {
  id: string;
  x: number;
  y: number;
  r: number;
  fill: string;
  label: string | null;
  labelY: number;
  dimmed: boolean;
  classes: string;
}

export function readNodes(el: any): RenderedNode[] {
  return [...sr(el).querySelectorAll('.network-graph__node')].map(group => {
    const circle = group.querySelector('.network-graph__node-circle');
    const text = group.querySelector('.network-graph__node-label');
    return {
      id: group.getAttribute('data-node-id') ?? '',
      x: Number(circle?.getAttribute('cx') ?? NaN),
      y: Number(circle?.getAttribute('cy') ?? NaN),
      r: Number(circle?.getAttribute('r') ?? NaN),
      fill: circle?.getAttribute('fill') ?? '',
      label: text ? (text.textContent ?? '') : null,
      labelY: Number(text?.getAttribute('y') ?? NaN),
      dimmed: (group.getAttribute('class') ?? '').includes('--dimmed'),
      classes: group.getAttribute('class') ?? '',
    };
  });
}

export interface RenderedEdge {
  index: number;
  d: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  curved: boolean;
  stroke: string | null;
  width: number;
  classes: string;
}

/** Parse the documented straight (`M .. L ..`) or curved (`M .. Q .. ..`) path. */
function parsePath(d: string): { from: { x: number; y: number }; to: { x: number; y: number }; curved: boolean } | null {
  const numbers = d.match(/-?\d+(\.\d+)?(e[+-]?\d+)?/gi)?.map(Number) ?? [];
  if (d.includes('Q') && numbers.length >= 6) {
    return {
      from: { x: numbers[0], y: numbers[1] },
      to: { x: numbers[4], y: numbers[5] },
      curved: true,
    };
  }
  if (numbers.length >= 4) {
    return {
      from: { x: numbers[0], y: numbers[1] },
      to: { x: numbers[2], y: numbers[3] },
      curved: false,
    };
  }
  return null;
}

export function readEdges(el: any): RenderedEdge[] {
  return [...sr(el).querySelectorAll('.network-graph__edge')].map(path => {
    const d = path.getAttribute('d') ?? '';
    const parsed = parsePath(d);
    return {
      index: Number(path.getAttribute('data-edge-idx')),
      d,
      from: parsed?.from ?? { x: NaN, y: NaN },
      to: parsed?.to ?? { x: NaN, y: NaN },
      curved: parsed?.curved ?? false,
      stroke: path.getAttribute('stroke'),
      width: Number(path.getAttribute('stroke-width') ?? NaN),
      classes: path.getAttribute('class') ?? '',
    };
  });
}

export const edgeLabels = (el: any): Array<{ text: string; x: number; y: number }> =>
  [...sr(el).querySelectorAll('.network-graph__edge-label')].map(text => ({
    text: (text.textContent ?? '').trim(),
    x: Number(text.getAttribute('x')),
    y: Number(text.getAttribute('y')),
  }));

export function tooltipState(el: any): { visible: boolean; text: string } {
  const tooltip = sr(el).querySelector('[part="tooltip"]') as HTMLElement | null;
  return {
    visible: !!tooltip?.classList.contains('network-graph__tooltip--visible'),
    text: (tooltip?.textContent ?? '').trim(),
  };
}

export const transformOf = (el: any): string =>
  sr(el).querySelector('[part="canvas"] > g')?.getAttribute('transform') ?? '';

// ── Documented placement ────────────────────────────────────────────────────

/**
 * The closed-form position a layout gives node `i`, or `null` when the layout
 * makes no promise about it (the force layout's unpinned seeds are random by
 * design). A node carrying explicit x/y is placed there under EVERY layout.
 */
export function expectedPosition(
  layout: LayoutType, index: number, total: number, source: NetworkNode,
): { x: number; y: number } | null {
  if (source.x !== undefined && source.y !== undefined) return { x: source.x, y: source.y };
  const { width, height } = CANVAS;
  if (layout === 'circular') {
    const angle = (2 * Math.PI * index) / total;
    const radius = Math.min(width, height) * 0.35;
    return {
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
    };
  }
  if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(total));
    const cellW = width / (cols + 1);
    const cellH = height / (Math.ceil(total / cols) + 1);
    return {
      x: (index % cols + 1) * cellW,
      y: (Math.floor(index / cols) + 1) * cellH,
    };
  }
  return null;
}

/** Documented radius: `size` wins, otherwise the radius grows with degree. */
export function expectedRadius(source: NetworkNode, degree: number): number {
  if (source.size) return source.size;
  return Math.max(6, Math.min(20, 4 + degree * 2));
}

/** The degree of a node: how many drawable edges touch it. */
export function degreesOf(data: NetworkGraphData): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const edge of data.edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  return degrees;
}

/** The edges that CAN be drawn: both endpoints exist in `nodes`. */
export function drawableEdges(data: NetworkGraphData): NetworkEdge[] {
  const ids = new Set(data.nodes.map(n => n.id));
  return data.edges.filter(edge => ids.has(edge.source) && ids.has(edge.target));
}

// ── The oracle ──────────────────────────────────────────────────────────────

const EPS = 0.01;
const near = (a: number, b: number, eps = EPS) => Math.abs(a - b) <= eps;

export function graphProblems(el: any, c: GraphCombo): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const root = sr(el);
  const data = c.fixture.data;

  // ── Structure and a11y the docs promise unconditionally ───────────────────
  for (const name of ['base', 'canvas', 'tooltip']) {
    if (!root.querySelector(`[part="${name}"]`)) say(`no part="${name}" element`);
  }
  const base = root.querySelector('[part="base"]');
  if (base) {
    if (base.getAttribute('role') !== 'img') {
      say(`container role is "${base.getAttribute('role')}", documented as "img"`);
    }
    if (!(base.getAttribute('aria-label') ?? '').trim()) {
      say('the container carries no aria-label');
    }
  }
  const svg = root.querySelector('[part="canvas"]');
  const viewBox = svg?.getAttribute('viewBox') ?? svg?.getAttribute('viewbox');
  if (viewBox !== `0 0 ${CANVAS.width} ${CANVAS.height}`) {
    say(`viewBox is "${viewBox}", expected "0 0 ${CANVAS.width} ${CANVAS.height}"`);
  }

  const rendered = readNodes(el);
  const edges = readEdges(el);
  const labels = edgeLabels(el);

  // ── One circle per node, in data order ────────────────────────────────────
  if (rendered.length !== data.nodes.length) {
    say(`${rendered.length} nodes drawn for ${data.nodes.length} in the data`);
    return problems;
  }
  const byId = new Map(rendered.map(n => [n.id, n]));
  for (const source of data.nodes) {
    if (!byId.has(source.id)) say(`node "${source.id}" was not drawn at all`);
  }
  data.nodes.forEach((source, i) => {
    if (rendered[i]?.id !== source.id) {
      say(`node slot ${i} is "${rendered[i]?.id}", expected "${source.id}"`);
    }
  });
  if (problems.length) return problems;

  const degrees = degreesOf(data);

  // ── Placement ─────────────────────────────────────────────────────────────
  data.nodes.forEach((source, i) => {
    const drawn = rendered[i];
    const want = expectedPosition(c.layout, i, data.nodes.length, source);
    if (want) {
      if (!near(drawn.x, want.x, 0.5) || !near(drawn.y, want.y, 0.5)) {
        say(`layout="${c.layout}" put node "${source.id}" at`
          + ` (${drawn.x.toFixed(2)}, ${drawn.y.toFixed(2)}),`
          + ` expected (${want.x.toFixed(2)}, ${want.y.toFixed(2)})`);
      }
    } else if (!Number.isFinite(drawn.x) || !Number.isFinite(drawn.y)) {
      say(`node "${source.id}" has a non-finite position (${drawn.x}, ${drawn.y})`);
    }

    // ── Radius ──────────────────────────────────────────────────────────────
    const wantRadius = expectedRadius(source, degrees.get(source.id) ?? 0);
    if (!near(drawn.r, wantRadius, EPS)) {
      say(`node "${source.id}" has radius ${drawn.r}, expected ${wantRadius}`
        + ` (size=${source.size ?? 'unset'}, degree=${degrees.get(source.id) ?? 0})`);
    }

    // ── Colour ──────────────────────────────────────────────────────────────
    if (source.color) {
      if (drawn.fill !== source.color) {
        say(`node "${source.id}" asked for colour "${source.color}" and got "${drawn.fill}"`);
      }
    } else if (!drawn.fill) {
      say(`node "${source.id}" has no fill at all`);
    }

    // ── Label ───────────────────────────────────────────────────────────────
    const wantLabel = source.label || source.id;
    if (c.showLabels) {
      if (drawn.label === null) {
        say(`showLabels is on but node "${source.id}" has no label text`);
      } else if (drawn.label.trim() !== wantLabel) {
        say(`node "${source.id}" is labelled "${drawn.label.trim()}", expected "${wantLabel}"`);
      } else if (!near(drawn.labelY, drawn.y + drawn.r + 14, 0.5)) {
        say(`node "${source.id}" label sits at y=${drawn.labelY}, not below its circle`);
      }
    } else if (drawn.label !== null) {
      say(`showLabels is off but node "${source.id}" still shows "${drawn.label}"`);
    }
  });

  // ── Group colouring ───────────────────────────────────────────────────────
  const groups = new Map<string, string[]>();
  data.nodes.forEach((source, i) => {
    if (!source.group || source.color) return;
    const list = groups.get(source.group) ?? [];
    list.push(rendered[i].fill);
    groups.set(source.group, list);
  });
  for (const [group, fills] of groups) {
    if (new Set(fills).size !== 1) {
      say(`group "${group}" is painted ${JSON.stringify([...new Set(fills)])}`
        + ' — nodes in one group must share a colour');
    }
  }
  const groupColours = [...groups].map(([group, fills]) => [group, fills[0]] as const);
  for (let i = 0; i < groupColours.length; i++) {
    for (let j = i + 1; j < groupColours.length; j++) {
      if (groupColours[i][1] === groupColours[j][1]) {
        say(`groups "${groupColours[i][0]}" and "${groupColours[j][0]}" are both`
          + ` painted "${groupColours[i][1]}"`);
      }
    }
  }

  // ── Edges ─────────────────────────────────────────────────────────────────
  const drawable = drawableEdges(data);
  if (edges.length !== drawable.length) {
    say(`${edges.length} edges drawn, but ${drawable.length} of the ${data.edges.length}`
      + ' in the data have both endpoints');
    return problems;
  }

  drawable.forEach((source, i) => {
    const drawn = edges[i];
    if (drawn.index !== i) say(`edge ${i} carries data-edge-idx ${drawn.index}`);

    const from = byId.get(source.source)!;
    const to = byId.get(source.target)!;
    if (!near(drawn.from.x, from.x, 0.5) || !near(drawn.from.y, from.y, 0.5)) {
      say(`edge ${source.source}->${source.target} starts at`
        + ` (${drawn.from.x}, ${drawn.from.y}), but node "${source.source}" is at`
        + ` (${from.x}, ${from.y})`);
    }
    if (!near(drawn.to.x, to.x, 0.5) || !near(drawn.to.y, to.y, 0.5)) {
      say(`edge ${source.source}->${source.target} ends at`
        + ` (${drawn.to.x}, ${drawn.to.y}), but node "${source.target}" is at`
        + ` (${to.x}, ${to.y})`);
    }

    // Documented weight -> stroke width, with 1 as the floor for an edge that
    // names no weight at all.
    const wantWidth = Math.max(1, source.weight ?? 1);
    if (!near(drawn.width, wantWidth, EPS)) {
      say(`edge ${source.source}->${source.target} has stroke-width ${drawn.width},`
        + ` expected ${wantWidth} for weight ${source.weight ?? 'unset'}`);
    }
    if (source.color) {
      if (drawn.stroke !== source.color) {
        say(`edge ${source.source}->${source.target} asked for "${source.color}"`
          + ` and got "${drawn.stroke}"`);
      }
    } else if (drawn.stroke) {
      say(`edge ${source.source}->${source.target} names no colour but carries`
        + ` stroke="${drawn.stroke}"`);
    }
  });

  // Parallel edges must be separately visible: two straight lines between the
  // same pair would be one line on screen.
  const pairCount = new Map<string, number>();
  for (const edge of drawable) {
    const key = [edge.source, edge.target].sort().join('~');
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }
  drawable.forEach((source, i) => {
    const key = [source.source, source.target].sort().join('~');
    const multi = (pairCount.get(key) ?? 0) > 1;
    if (multi && !edges[i].curved) {
      say(`one of ${pairCount.get(key)} parallel ${key} edges is drawn straight,`
        + ' so it is hidden underneath its twin');
    }
    if (!multi && edges[i].curved) {
      say(`the only ${key} edge is drawn as a curve`);
    }
  });
  const multiPaths = drawable
    .map((source, i) => ({ key: [source.source, source.target].sort().join('~'), d: edges[i].d }))
    .filter(entry => (pairCount.get(entry.key) ?? 0) > 1);
  if (new Set(multiPaths.map(entry => entry.d)).size !== multiPaths.length) {
    say('parallel edges share an identical path — they overlap exactly');
  }

  // ── Edge labels ───────────────────────────────────────────────────────────
  const wantLabels = c.showLabels ? drawable.filter(edge => edge.label) : [];
  if (labels.length !== wantLabels.length) {
    say(`${labels.length} edge labels drawn, expected ${wantLabels.length}`
      + ` (showLabels=${c.showLabels})`);
  } else {
    wantLabels.forEach((source, i) => {
      if (labels[i].text !== source.label) {
        say(`edge label ${i} reads "${labels[i].text}", expected "${source.label}"`);
      }
      const from = byId.get(source.source)!;
      const to = byId.get(source.target)!;
      if (!near(labels[i].x, (from.x + to.x) / 2, 0.5)
        || !near(labels[i].y, (from.y + to.y) / 2, 0.5)) {
        say(`edge label "${source.label}" sits at (${labels[i].x}, ${labels[i].y}),`
          + ' not between the nodes it names');
      }
    });
  }

  return problems;
}
