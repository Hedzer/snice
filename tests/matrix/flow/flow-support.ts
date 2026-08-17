/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-flow feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is transcribed from `docs/ai/components/flow.md` and
 * `packages/components/src/flow/snice-flow.types.ts`.
 *
 * The documented surface:
 *
 *   Summary      "Node-based flow/diagram editor with draggable nodes,
 *                input/output ports, bezier curve edges, zoom/pan canvas,
 *                snap-to-grid, and minimap."
 *   Properties   nodes: FlowNode[] = []     (attribute: false)
 *                edges: FlowEdge[] = []     (attribute: false)
 *                snapToGrid = true          (snap-to-grid)
 *                gridSize = 20              (grid-size)
 *                zoomEnabled = true         (zoom-enabled)
 *                panEnabled = true          (pan-enabled)
 *                minimap = true
 *                editable = true
 *   Types        FlowNode  { id, x, y, type?, data?, label?, width?, height?,
 *                            inputs?, outputs?, color?, selected? }
 *                          "// defaults: 160, 80" for width/height
 *                FlowPort  { id, label?, type? }
 *                FlowEdge  { id, source, target, sourcePort?, targetPort?,
 *                            label?, color?, animated? }
 *   Methods      addNode, removeNode ("Remove node and connected edges"),
 *                addEdge, removeEdge, fitView ("Auto-zoom to fit all nodes")
 *   Events       node-drag       { node, x, y }
 *                node-select     { node: FlowNode | null }
 *                edge-connect    { edge }
 *                edge-disconnect { edge }
 *                canvas-click    { x, y }
 *   Parts        base, canvas ("SVG edge/connection layer"), nodes, minimap
 *
 * Findings raised against this component:
 *
 *   MATRIX-flow-1  switches.test.ts — `editable = false` still lets a node be
 *                  dragged, mutating `node.x`/`node.y` and emitting `node-drag`.
 *   MATRIX-flow-2  switches.test.ts — assigning `minimap = false` after mount
 *                  does not hide the minimap panel.
 *   MATRIX-flow-3  methods.test.ts — `removeNode` deletes the connected edges
 *                  without emitting `edge-disconnect`, though `removeEdge`
 *                  emits it for exactly the same deletion.
 *
 * Two further findings belong to the VISUAL tier
 * (tests/live/matrix/flow/flow-visual.spec.ts) because neither is observable
 * without layout or paint, and this file deliberately does not restate them:
 *
 *   MATRIX-flow-4  a node declaring `outputs` and no `inputs` paints its output
 *                  ports on its LEFT edge.
 *   MATRIX-flow-5  `FlowEdge.color` is written as an SVG `stroke` presentation
 *                  attribute that the shadow stylesheet's own `.flow__edge`
 *                  rule overrides, so the authored colour never paints. NOTE
 *                  that `edgeProblems` below asserts the ATTRIBUTE, which is
 *                  correct and passes — the divergence is in the cascade, and
 *                  a DOM-tier assertion on it would be asserting a fact the
 *                  environment does not model.
 */
import { expect } from 'vitest';
import {
  mount, sr, all, wait, removeComponent, Problems, expectClean,
} from '../matrix-kit';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/flow/snice-flow';
import type {
  FlowNode, FlowEdge, FlowPort,
} from '../../../packages/components/src/flow/snice-flow.types';

export { wait, removeComponent, expectClean, Problems, expect };
export type { FlowNode, FlowEdge, FlowPort };

/**
 * The flow rebuilds its node and edge layers imperatively from a `@watch`, and
 * the rebuild measures port geometry between two DOM writes.
 * `tests/components/flow.test.ts` waits 200ms for that; a matrix pays that cost
 * on every one of a few hundred combos, so this tier uses 80ms — still several
 * times the settle the rebuild actually needs, and verified against the full
 * product before being lowered.
 */
export const REBUILD = 80;

/** The documented node size defaults: "// defaults: 160, 80". */
export const DEFAULT_NODE_WIDTH = 160;
export const DEFAULT_NODE_HEIGHT = 80;

// ── Documented dimensions ───────────────────────────────────────────────────

export const GRID_SIZES = [5, 20, 50] as const;

/** Graph shapes, named by the documented feature each one exercises. */
export const GRAPHS = {
  empty: (): { nodes: FlowNode[]; edges: FlowEdge[] } => ({ nodes: [], edges: [] }),

  /** One node, only the required fields — the minimum FlowNode the doc defines. */
  single: () => ({
    nodes: [{ id: 'a', x: 40, y: 40 }] as FlowNode[],
    edges: [] as FlowEdge[],
  }),

  /** The doc's own Basic Usage graph, verbatim. */
  doc: () => ({
    nodes: [
      { id: 'a', x: 50, y: 50, label: 'Start', outputs: [{ id: 'out', label: 'Out' }] },
      {
        id: 'b', x: 300, y: 50, label: 'Process',
        inputs: [{ id: 'in', label: 'In' }],
        outputs: [{ id: 'out', label: 'Out' }],
      },
    ] as FlowNode[],
    edges: [
      { id: 'e1', source: 'a', target: 'b', sourcePort: 'out', targetPort: 'in' },
    ] as FlowEdge[],
  }),

  /** A three-stage chain with a `type` on every node. */
  chain: () => ({
    nodes: [
      { id: 'n1', x: 40, y: 40, label: 'Trigger', type: 'trigger', outputs: [{ id: 'o', label: 'Out' }] },
      {
        id: 'n2', x: 260, y: 40, label: 'Transform', type: 'transform',
        inputs: [{ id: 'i', label: 'In' }], outputs: [{ id: 'o', label: 'Out' }],
      },
      { id: 'n3', x: 480, y: 40, label: 'Sink', type: 'sink', inputs: [{ id: 'i', label: 'In' }] },
    ] as FlowNode[],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', sourcePort: 'o', targetPort: 'i' },
      { id: 'e2', source: 'n2', target: 'n3', sourcePort: 'o', targetPort: 'i' },
    ] as FlowEdge[],
  }),

  /** Multiple ports per side, so port ORDER and count matter. */
  'multi-port': () => ({
    nodes: [
      {
        id: 'src', x: 40, y: 40, label: 'Source',
        outputs: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }, { id: 'o3', label: 'C' }],
      },
      {
        id: 'dst', x: 340, y: 40, label: 'Sink',
        inputs: [{ id: 'i1', label: 'X' }, { id: 'i2', label: 'Y' }],
      },
    ] as FlowNode[],
    edges: [
      { id: 'e1', source: 'src', target: 'dst', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e2', source: 'src', target: 'dst', sourcePort: 'o3', targetPort: 'i2' },
    ] as FlowEdge[],
  }),

  /** Every optional FlowEdge field at once. */
  'styled-edges': () => ({
    nodes: [
      { id: 'p', x: 40, y: 40, label: 'P', outputs: [{ id: 'o' }] },
      { id: 'q', x: 340, y: 40, label: 'Q', inputs: [{ id: 'i' }] },
      { id: 'r', x: 340, y: 200, label: 'R', inputs: [{ id: 'i' }] },
    ] as FlowNode[],
    edges: [
      { id: 'e1', source: 'p', target: 'q', sourcePort: 'o', targetPort: 'i', label: 'yes', color: 'rgb(16 185 129)' },
      { id: 'e2', source: 'p', target: 'r', sourcePort: 'o', targetPort: 'i', label: 'no', animated: true },
    ] as FlowEdge[],
  }),

  /** Explicit `width`/`height` and `color`, against the documented defaults. */
  sized: () => ({
    nodes: [
      { id: 'default', x: 40, y: 40, label: 'Default size' },
      { id: 'wide', x: 40, y: 200, label: 'Wide', width: 320, height: 120 },
      { id: 'tinted', x: 400, y: 40, label: 'Tinted', color: 'rgb(168 85 247)' },
    ] as FlowNode[],
    edges: [] as FlowEdge[],
  }),

  /** Edges whose ports are omitted — the documented optional `sourcePort`. */
  'implicit-ports': () => ({
    nodes: [
      { id: 'x', x: 40, y: 40, label: 'X', outputs: [{ id: 'only-out' }] },
      { id: 'y', x: 340, y: 40, label: 'Y', inputs: [{ id: 'only-in' }] },
    ] as FlowNode[],
    edges: [{ id: 'e1', source: 'x', target: 'y' }] as FlowEdge[],
  }),

  /** Nodes with no ports at all, and therefore no edges. */
  'no-ports': () => ({
    nodes: [
      { id: 'lonely1', x: 40, y: 40, label: 'Lonely 1' },
      { id: 'lonely2', x: 300, y: 40, label: 'Lonely 2' },
    ] as FlowNode[],
    edges: [] as FlowEdge[],
  }),

  /** A larger graph, to keep the layers honest at scale. */
  large: () => {
    const nodes: FlowNode[] = Array.from({ length: 9 }, (_, i) => ({
      id: `L${i}`,
      x: (i % 3) * 260,
      y: Math.floor(i / 3) * 160,
      label: `Node ${i}`,
      inputs: i === 0 ? undefined : [{ id: 'i' }],
      outputs: i === 8 ? undefined : [{ id: 'o' }],
    }));
    const edges: FlowEdge[] = Array.from({ length: 8 }, (_, i) => ({
      id: `E${i}`, source: `L${i}`, target: `L${i + 1}`, sourcePort: 'o', targetPort: 'i',
    }));
    return { nodes, edges };
  },

  /** Negative and fractional coordinates — a canvas has no origin corner. */
  'off-origin': () => ({
    nodes: [
      { id: 'neg', x: -240, y: -120, label: 'Negative', outputs: [{ id: 'o' }] },
      { id: 'frac', x: 17.5, y: 33.25, label: 'Fractional', inputs: [{ id: 'i' }] },
    ] as FlowNode[],
    edges: [{ id: 'e1', source: 'neg', target: 'frac', sourcePort: 'o', targetPort: 'i' }] as FlowEdge[],
  }),
} satisfies Record<string, () => { nodes: FlowNode[]; edges: FlowEdge[] }>;

export type GraphName = keyof typeof GRAPHS;
export const GRAPH_NAMES = Object.keys(GRAPHS) as GraphName[];

// ── Combos ──────────────────────────────────────────────────────────────────

export interface FlowCombo {
  graph: GraphName;
  snapToGrid: boolean;
  gridSize: number;
  zoomEnabled: boolean;
  panEnabled: boolean;
  minimap: boolean;
  editable: boolean;
}

export function combo(overrides: Partial<FlowCombo> = {}): FlowCombo {
  return {
    graph: 'doc',
    snapToGrid: true,
    gridSize: 20,
    zoomEnabled: true,
    panEnabled: true,
    minimap: true,
    editable: true,
    ...overrides,
  };
}

export function comboId(c: FlowCombo): string {
  const flags = [
    c.snapToGrid ? 'snap' : 'no-snap',
    c.zoomEnabled ? 'zoom' : 'no-zoom',
    c.panEnabled ? 'pan' : 'no-pan',
    c.minimap ? 'minimap' : 'no-minimap',
    c.editable ? 'editable' : 'read-only',
  ].join('+');
  return `graph=${c.graph}/grid=${c.gridSize}/${flags}`;
}

export function graphOf(c: FlowCombo): { nodes: FlowNode[]; edges: FlowEdge[] } {
  return GRAPHS[c.graph]();
}

/**
 * Mount one combo. The five switches and `grid-size` cross the ATTRIBUTE
 * channel (the doc writes them as attributes on `<snice-flow>`); `nodes` and
 * `edges` are documented `attribute: false` and cross the property one.
 */
export async function makeFlow(
  c: FlowCombo,
  graph = graphOf(c),
): Promise<HTMLElement> {
  const el = await mount<HTMLElement>('snice-flow', {
    'snap-to-grid': c.snapToGrid,
    'grid-size': c.gridSize,
    'zoom-enabled': c.zoomEnabled,
    'pan-enabled': c.panEnabled,
    'minimap': c.minimap,
    'editable': c.editable,
  }, {});
  (el as any).nodes = graph.nodes;
  (el as any).edges = graph.edges;
  await wait(REBUILD);
  return el;
}

// ── Reading the render ──────────────────────────────────────────────────────

export const DOCUMENTED_PARTS = ['base', 'canvas', 'nodes', 'minimap'] as const;

const SEL = {
  node: '.flow__node',
  nodeHeader: '.flow__node-header',
  nodeType: '.flow__node-type',
  port: '.flow__port',
  portDot: '.flow__port-dot',
  edge: '.flow__edge',
  edgeLabel: '.flow__edge-label',
  grid: '.flow__grid',
  minimap: '.flow__minimap',
  minimapNode: '.flow__minimap-node',
  minimapEdge: '.flow__minimap-edge',
};

export interface FlowFacts {
  presentParts: string[];
  /** One entry per rendered node, in render order. */
  nodes: Array<{
    id: string;
    headerText: string;
    typeText: string | null;
    style: string;
    inputs: string[];
    outputs: string[];
    selected: boolean;
  }>;
  /** One entry per rendered edge path. */
  edges: Array<{ id: string; d: string; classes: string[]; stroke: string | null }>;
  edgeLabels: string[];
  gridHidden: boolean;
  minimapHidden: boolean;
  minimapNodes: number;
  minimapEdges: number;
}

function styleHides(node: HTMLElement | null): boolean {
  if (!node) return true;
  const inline = node.getAttribute('style') ?? '';
  return /display\s*:\s*none/.test(inline) || node.style.display === 'none';
}

export function readFacts(el: HTMLElement): FlowFacts {
  const root = sr(el);
  const portsOf = (node: Element, type: 'input' | 'output') =>
    [...node.querySelectorAll(`${SEL.port}[data-port-type="${type}"]`)]
      .map(port => port.getAttribute('data-port-id') ?? '');

  return {
    presentParts: DOCUMENTED_PARTS.filter(name => exactPart(el, name) !== null),
    nodes: all<HTMLElement>(el, SEL.node).map(node => ({
      id: node.getAttribute('data-node-id') ?? '',
      headerText: (node.querySelector(SEL.nodeHeader)?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      typeText: node.querySelector(SEL.nodeType)?.textContent?.trim() ?? null,
      style: node.getAttribute('style') ?? '',
      inputs: portsOf(node, 'input'),
      outputs: portsOf(node, 'output'),
      selected: node.classList.contains('flow__node--selected'),
    })),
    edges: [...root.querySelectorAll(SEL.edge)].map(path => ({
      id: path.getAttribute('data-edge-id') ?? '',
      d: path.getAttribute('d') ?? '',
      classes: (path.getAttribute('class') ?? '').split(/\s+/).filter(Boolean),
      stroke: path.getAttribute('stroke'),
    })),
    edgeLabels: [...root.querySelectorAll(SEL.edgeLabel)].map(node => (node.textContent ?? '').trim()),
    gridHidden: styleHides(root.querySelector(SEL.grid) as HTMLElement | null),
    minimapHidden: styleHides(root.querySelector(SEL.minimap) as HTMLElement | null),
    minimapNodes: root.querySelectorAll(SEL.minimapNode).length,
    minimapEdges: root.querySelectorAll(SEL.minimapEdge).length,
  };
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** Parts, one node per FlowNode, one edge path per FlowEdge, ports per node. */
export function structureProblems(
  el: HTMLElement, c: FlowCombo, graph: { nodes: FlowNode[]; edges: FlowEdge[] },
): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  for (const name of DOCUMENTED_PARTS) {
    problems.check(facts.presentParts.includes(name), `documented part "${name}" is missing`);
  }

  // "base — Outer flow container" holds the other three.
  const base = exactPart(el, 'base');
  for (const name of ['canvas', 'nodes', 'minimap'] as const) {
    const node = exactPart(el, name);
    if (base && node) problems.check(base.contains(node), `\`${name}\` is not inside \`base\``);
  }

  // "nodes — Node elements container": one element per FlowNode, in order.
  problems.equal(facts.nodes.map(node => node.id), graph.nodes.map(node => node.id), 'node ids in order');

  // "canvas — SVG edge/connection layer": one path per FlowEdge, in order.
  problems.equal(facts.edges.map(edge => edge.id), graph.edges.map(edge => edge.id), 'edge ids in order');

  for (const [index, node] of graph.nodes.entries()) {
    const rendered = facts.nodes[index];
    if (!rendered) continue;

    // "label?: string" — the node's visible name. The doc gives no other
    // fallback, and a node the reader cannot name is unusable, so its `id`
    // stands in when no label is authored.
    const expectedName = node.label || node.id;
    problems.check(
      rendered.headerText.includes(expectedName),
      `node "${node.id}" header "${rendered.headerText}" does not show "${expectedName}"`,
    );

    // "type?: string"
    problems.equal(rendered.typeText, node.type ?? null, `node "${node.id}" type badge`);

    // "inputs?: FlowPort[]; outputs?: FlowPort[]" — every authored port, in
    // the authored order, on the correct side.
    problems.equal(rendered.inputs, (node.inputs ?? []).map(port => port.id), `node "${node.id}" input ports`);
    problems.equal(rendered.outputs, (node.outputs ?? []).map(port => port.id), `node "${node.id}" output ports`);
  }

  // "label?: string" on an edge.
  problems.equal(
    facts.edgeLabels,
    graph.edges.filter(edge => edge.label).map(edge => edge.label!),
    'edge labels',
  );

  return problems;
}

/** Edge presentation: `color`, `animated`, and the documented bezier shape. */
export function edgeProblems(
  el: HTMLElement, graph: { nodes: FlowNode[]; edges: FlowEdge[] },
): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  if (facts.edges.length !== graph.edges.length) {
    problems.say(`${facts.edges.length} edge paths for ${graph.edges.length} edges`);
    return problems;
  }

  for (const [index, edge] of graph.edges.entries()) {
    const rendered = facts.edges[index];

    // "bezier curve edges" — an SVG cubic, not a straight line.
    problems.check(
      /^M [-\d.]+ [-\d.]+ C /.test(rendered.d),
      `edge "${edge.id}" path "${rendered.d}" is not a cubic bezier`,
    );

    // "color?: string"
    if (edge.color) {
      problems.equal(rendered.stroke, edge.color, `edge "${edge.id}" stroke`);
    }

    // "animated?: boolean"
    problems.equal(
      rendered.classes.includes('flow__edge--animated'), !!edge.animated,
      `edge "${edge.id}" animated state`,
    );
  }

  return problems;
}

/** The minimap mirrors the graph: one rect per node, one line per edge. */
export function minimapProblems(
  el: HTMLElement, c: FlowCombo, graph: { nodes: FlowNode[]; edges: FlowEdge[] },
): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  problems.equal(facts.minimapHidden, !c.minimap, `minimap=${c.minimap} visibility`);
  if (!c.minimap) return problems;

  problems.equal(facts.minimapNodes, graph.nodes.length, 'minimap node rects');
  problems.equal(facts.minimapEdges, graph.edges.length, 'minimap edge lines');
  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface SeenEvent { type: string; detail: any }

export function collectEvents(el: HTMLElement, types: string[] = [
  'node-drag', 'node-select', 'edge-connect', 'edge-disconnect', 'canvas-click',
]): SeenEvent[] {
  const seen: SeenEvent[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function nodeElement(el: HTMLElement, id: string): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(`${SEL.node}[data-node-id="${id}"]`);
}

export function svgElement(el: HTMLElement): SVGSVGElement | null {
  return sr(el).querySelector('.flow__svg');
}

export function portElement(
  el: HTMLElement, nodeId: string, portId: string, kind: 'input' | 'output',
): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(
    `${SEL.port}[data-node-id="${nodeId}"][data-port-id="${portId}"][data-port-type="${kind}"]`,
  );
}

function mouse(type: string, x: number, y: number): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true, composed: true, cancelable: true, button: 0, clientX: x, clientY: y,
  });
}

/** Drag a node by its header, the documented "draggable nodes" gesture. */
export async function dragNode(
  el: HTMLElement, id: string, from: { x: number; y: number }, to: { x: number; y: number },
): Promise<boolean> {
  const node = nodeElement(el, id);
  if (!node) return false;
  node.dispatchEvent(mouse('mousedown', from.x, from.y));
  document.dispatchEvent(mouse('mousemove', to.x, to.y));
  await wait(REBUILD);
  document.dispatchEvent(mouse('mouseup', to.x, to.y));
  await wait(REBUILD);
  return true;
}

/** Press on the canvas background and drag — the documented pan gesture. */
export async function dragCanvas(
  el: HTMLElement, dx: number, dy: number,
): Promise<boolean> {
  const svg = svgElement(el);
  if (!svg) return false;
  svg.dispatchEvent(mouse('mousedown', 100, 100));
  document.dispatchEvent(mouse('mousemove', 100 + dx, 100 + dy));
  await wait(REBUILD);
  document.dispatchEvent(mouse('mouseup', 100 + dx, 100 + dy));
  await wait(REBUILD);
  return true;
}

/** A wheel gesture over the canvas — the documented "zoom/pan canvas". */
export async function wheelCanvas(el: HTMLElement, deltaY: number): Promise<boolean> {
  const svg = svgElement(el);
  if (!svg) return false;
  svg.dispatchEvent(new WheelEvent('wheel', {
    deltaY, bubbles: true, composed: true, cancelable: true, clientX: 100, clientY: 100,
  }));
  await wait(REBUILD);
  return true;
}

export async function clickCanvas(el: HTMLElement, x = 120, y = 140): Promise<boolean> {
  const svg = svgElement(el);
  if (!svg) return false;
  svg.dispatchEvent(mouse('click', x, y));
  await wait(REBUILD);
  return true;
}

/** The documented snap: "snapToGrid … gridSize". */
export function snapTo(value: number, gridSize: number, snapToGrid: boolean): number {
  return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
}

/** The canvas transform the node layer applies, read back off a node's style. */
export function nodeTransformOf(el: HTMLElement, id: string): { left: number; top: number } | null {
  const node = nodeElement(el, id);
  if (!node) return null;
  const style = node.getAttribute('style') ?? '';
  const left = /left:\s*([-\d.]+)px/.exec(style);
  const top = /top:\s*([-\d.]+)px/.exec(style);
  if (!left || !top) return null;
  return { left: Number(left[1]), top: Number(top[1]) };
}
