/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-flow TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/flow, `npm run test:matrix`) owns the graph
 * bookkeeping: which nodes and ports render, which edge paths exist, what each
 * documented event carries, and which switch gates which gesture. It cannot own
 * what a node editor IS — a picture in which an edge starts at one port dot and
 * ends at another. In happy-dom every box measures 0, so the component's own
 * port measurement falls back to an estimate and every edge endpoint is a
 * number nobody can check.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the documented `base`/`canvas`/`nodes`/`minimap` parts have real boxes,
 *     and `canvas` and `nodes` are LAYERS stacked over the same area;
 *   · a node authored at (x, y) with an authored `width` paints at that size,
 *     and the documented "defaults: 160, 80" really are the fallbacks;
 *   · ports sit on the correct edge: an input dot on the node's left side, an
 *     output dot on its right;
 *   · EDGE ENDPOINTS — each rendered bezier starts within a few pixels of its
 *     source output dot and ends within a few pixels of its target input dot.
 *     This is the claim the whole component exists to satisfy and it cannot be
 *     stated without layout;
 *   · nodes paint above the edge canvas (elementFromPoint inside a node lands
 *     on that node) and the minimap paints above both;
 *   · every node stays inside the editor's own box, so nothing is clipped away.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   `FlowNode.color` and `FlowEdge.color` resolve to colours that may still
 *   paint nothing, and a "selected" node whose ring is two luminance points
 *   from its border is not selected as far as a reader is concerned. The
 *   marquee captures decode the PNG inside the browser under test and assert
 *   that a node header colour really paints, that an edge colour really
 *   reaches the stroke, and that a selected node really looks different.
 *
 * ── FINDING ────────────────────────────────────────────────────────────────
 *
 * MATRIX-flow-4  an output-only node draws its outputs on its LEFT edge.
 *   combo:    graph=doc (node "a", the doc's own "Start"), graph=multi-port
 *             (node "src"), graph=large (node "L0") — every node that declares
 *             `outputs` and no `inputs`, at any zoom
 *   expected: an output port's dot sits on the right half of its node and an
 *             input port's dot on the left half. That is what makes a
 *             left-to-right diagram readable, it is what the stylesheet is
 *             written to produce (`.flow__node-body { justify-content:
 *             space-between }`, `.flow__node-outputs { align-items: flex-end }`,
 *             `.flow__port--output { flex-direction: row-reverse }`), and it is
 *             what nodes with BOTH sides actually do — measured at 0.10 of the
 *             node width for inputs and 0.77-0.90 for outputs.
 *   actual:   an output-only node puts its output dots at 0.10 — the left edge.
 *             `space-between` positions a SINGLE flex child at the start, so
 *             with no input column to push against, the output column lands
 *             where the input column would have. The consequence is not
 *             cosmetic: the component anchors each edge to the measured dot, so
 *             every edge leaving such a node starts underneath the node body
 *             and runs backwards under it before emerging — and the node layer
 *             paints above the edge canvas, so that leading segment is hidden.
 *             The doc's own Basic Usage graph contains exactly this node.
 *   Pinned with `test.fail()` below. Nodes with both an input and an output
 *   side are asserted unpinned in the same block, which is what localises the
 *   defect to the single-column case.
 *
 * MATRIX-flow-5  `FlowEdge.color` never reaches the painted stroke.
 *   combo:    graph=styled-edges, edge "e1" authored `color: 'rgb(16 185 129)'`
 *   expected: that edge paints green, and visibly differently from the
 *             uncoloured edge beside it. `color?: string` is a documented
 *             FlowEdge field and the only way to distinguish one connection
 *             from another.
 *   actual:   the edge paints `rgb(209, 209, 209)` — the same border grey as
 *             every uncoloured edge. The component writes the colour as an SVG
 *             `stroke="…"` PRESENTATION ATTRIBUTE, and the shadow stylesheet
 *             carries `.flow__edge { stroke: var(--snice-color-border, …) }`.
 *             CSS declarations beat presentation attributes in the cascade, so
 *             the rule wins on every edge and the authored colour is inert.
 *             The DOM tier cannot see this: the attribute really is set, and
 *             asserting the attribute passes. Only a computed style or a real
 *             pixel shows the paint.
 *   Pinned with `test.fail()` below, alongside an unpinned test that records
 *   what the stroke actually resolves to.
 *
 * The other three findings this component has (MATRIX-flow-1..3) are
 * behavioural and are pinned in the DOM tier.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/flow/matrix.html';

type Graph = 'single' | 'doc' | 'chain' | 'multi-port' | 'styled-edges'
  | 'sized' | 'large' | 'off-origin';

interface Combo {
  id: string;
  graph: Graph;
  snapToGrid: boolean;
  minimap: boolean;
}

const GRAPHS: Graph[] = [
  'single', 'doc', 'chain', 'multi-port', 'styled-edges', 'sized', 'large', 'off-origin',
];

/**
 * The cross: graph (8) x snapToGrid (2) = 16 combos, with `minimap` rotated
 * across them so neither setting is ever constant for a whole run. The empty
 * graph paints no nodes and is checked once, on its own — measuring "edges meet
 * their ports" across zero edges is how a geometry suite goes quietly vacuous.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const graph of GRAPHS) {
    for (const snapToGrid of [true, false]) {
      combos.push({
        id: `${graph}/${snapToGrid ? 'snap' : 'no-snap'}/${n % 2 === 0 ? 'minimap' : 'no-minimap'}`,
        graph, snapToGrid, minimap: n % 2 === 0,
      });
      n++;
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate(async (combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    await (window as any).matrix.mount(combo);
    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── The documented parts ────────────────────────────────────────────────
    const partOf = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;
    const base = partOf('base');
    const canvas = partOf('canvas');
    const nodesLayer = partOf('nodes');
    const minimap = partOf('minimap');
    for (const [name, node] of Object.entries({ base, canvas, nodes: nodesLayer, minimap })) {
      if (!node) say(`no [part="${name}"] rendered`);
    }
    if (!base || !canvas || !nodesLayer || !minimap) return problems;

    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`base renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    // "canvas — SVG edge/connection layer" and "nodes — Node elements
    // container" are stacked LAYERS over the same area, not siblings in a row.
    for (const [name, node] of [['canvas', canvas], ['nodes', nodesLayer]] as const) {
      const box = rect(node);
      if (Math.abs(box.width - baseBox.width) > 2 || Math.abs(box.height - baseBox.height) > 2) {
        say(`${name} layer is ${box.width.toFixed(0)}x${box.height.toFixed(0)} `
          + `over a ${baseBox.width.toFixed(0)}x${baseBox.height.toFixed(0)} editor`);
      }
    }

    // ── Nodes: size, placement, and the documented defaults ─────────────────
    const graph = (window as any).matrix.graph as {
      nodes: Array<{ id: string; x: number; y: number; width?: number; height?: number }>;
      edges: Array<{ id: string; source: string; target: string; sourcePort?: string; targetPort?: string }>;
    };
    const nodeEls = new Map<string, HTMLElement>();
    for (const el of [...sr.querySelectorAll('.flow__node')] as HTMLElement[]) {
      nodeEls.set(el.getAttribute('data-node-id')!, el);
    }
    if (nodeEls.size !== graph.nodes.length) {
      say(`${nodeEls.size} nodes painted for ${graph.nodes.length} FlowNodes`);
      return problems;
    }

    for (const node of graph.nodes) {
      const el = nodeEls.get(node.id)!;
      const box = rect(el);
      if (box.width <= 0 || box.height <= 0) {
        say(`node "${node.id}" renders at ${box.width}x${box.height}`);
        continue;
      }
      // "width?: number ... // defaults: 160, 80"
      const expectedWidth = node.width ?? 160;
      if (Math.abs(box.width - expectedWidth) > 2) {
        say(`node "${node.id}" is ${box.width.toFixed(0)}px wide, authored ${expectedWidth}`);
      }
      // Relative placement: a node further right in canvas space paints
      // further right on screen. (Absolute pixels depend on pan/zoom, which
      // the doc does not fix.)
      for (const other of graph.nodes) {
        if (other.id === node.id) continue;
        const otherBox = rect(nodeEls.get(other.id)!);
        if (node.x - other.x > 20 && box.left <= otherBox.left) {
          say(`node "${node.id}" (x ${node.x}) does not paint right of "${other.id}" (x ${other.x})`);
        }
        if (node.y - other.y > 20 && box.top <= otherBox.top) {
          say(`node "${node.id}" (y ${node.y}) does not paint below "${other.id}" (y ${other.y})`);
        }
      }
    }

    // ── Every port dot is painted at all ────────────────────────────────────
    // WHICH SIDE each dot lands on is MATRIX-flow-4 and is asserted in its own
    // pinned block below, not sixteen times through this product.
    for (const portEl of [...sr.querySelectorAll('.flow__port')] as HTMLElement[]) {
      const nodeId = portEl.getAttribute('data-node-id')!;
      const portId = portEl.getAttribute('data-port-id')!;
      const dot = portEl.querySelector('.flow__port-dot') as HTMLElement | null;
      if (!dot) { say(`port ${nodeId}.${portId} has no dot`); continue; }

      const dotBox = rect(dot);
      if (dotBox.width <= 0 || dotBox.height <= 0) {
        say(`port dot ${nodeId}.${portId} renders at ${dotBox.width}x${dotBox.height}`);
        continue;
      }
      const nodeBox = rect(nodeEls.get(nodeId)!);
      if (dotBox.left < nodeBox.left - 2 || dotBox.right > nodeBox.right + 2) {
        say(`port dot ${nodeId}.${portId} is outside its own node box`);
      }
    }

    // ── Edge endpoints really meet their ports ──────────────────────────────
    const dotCentre = (nodeId: string, portId: string, kind: 'input' | 'output') => {
      const sel = `.flow__port[data-node-id="${nodeId}"][data-port-id="${portId}"]`
        + `[data-port-type="${kind}"] .flow__port-dot`;
      const dot = sr.querySelector(sel) as HTMLElement | null;
      if (!dot) return null;
      const box = rect(dot);
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    };

    const svg = sr.querySelector('.flow__svg') as SVGSVGElement;
    const svgBox = rect(svg);
    for (const edge of graph.edges) {
      const path = sr.querySelector(`.flow__edge[data-edge-id="${edge.id}"]`) as SVGPathElement | null;
      if (!path) { say(`edge "${edge.id}" painted no path`); continue; }
      const length = path.getTotalLength();
      if (!(length > 0)) { say(`edge "${edge.id}" has zero length`); continue; }

      // The path is inside a translated+scaled <g>, so its own points are in
      // canvas units; getScreenCTM maps them to the viewport the dots live in.
      const ctm = path.getScreenCTM();
      if (!ctm) { say(`edge "${edge.id}" has no screen CTM`); continue; }
      const toScreen = (p: DOMPoint) => p.matrixTransform(ctm);
      const start = toScreen(path.getPointAtLength(0));
      const end = toScreen(path.getPointAtLength(length));

      const sourcePort = edge.sourcePort
        ?? (graph.nodes.find(n => n.id === edge.source) as any)?.outputs?.[0]?.id;
      const targetPort = edge.targetPort
        ?? (graph.nodes.find(n => n.id === edge.target) as any)?.inputs?.[0]?.id;
      const from = sourcePort ? dotCentre(edge.source, sourcePort, 'output') : null;
      const to = targetPort ? dotCentre(edge.target, targetPort, 'input') : null;

      // The component anchors a few pixels outside each dot so the arrow tip
      // clears the dot's ring; 16px is generous for that and still catches an
      // endpoint attached to the wrong port or to nothing at all.
      if (from) {
        const gap = Math.hypot(start.x - from.x, start.y - from.y);
        if (gap > 16) {
          say(`edge "${edge.id}" starts ${gap.toFixed(0)}px from output ${edge.source}.${sourcePort}`);
        }
      }
      if (to) {
        const gap = Math.hypot(end.x - to.x, end.y - to.y);
        if (gap > 16) {
          say(`edge "${edge.id}" ends ${gap.toFixed(0)}px from input ${edge.target}.${targetPort}`);
        }
      }
      if (start.x < svgBox.left - 400 || start.x > svgBox.right + 400) {
        say(`edge "${edge.id}" starts far outside the canvas`);
      }
    }

    // ── Stacking ────────────────────────────────────────────────────────────
    for (const node of graph.nodes) {
      const box = rect(nodeEls.get(node.id)!);
      const x = box.left + box.width / 2;
      const y = box.top + 6;
      if (x < baseBox.left || x > baseBox.right || y < baseBox.top || y > baseBox.bottom) continue;
      const hit = sr.elementFromPoint(x, y);
      if (hit && hit.closest && !hit.closest('.flow__node') && !hit.closest('.flow__minimap')) {
        say(`node "${node.id}" is covered at its header by `
          + `"${(hit as HTMLElement).className || hit.nodeName}"`);
      }
    }

    const minimapBox = rect(minimap);
    if (combo.minimap) {
      if (minimapBox.width <= 0 || minimapBox.height <= 0) {
        say(`minimap renders at ${minimapBox.width}x${minimapBox.height}`);
      } else {
        if (minimapBox.right > baseBox.right + 1 || minimapBox.bottom > baseBox.bottom + 1) {
          say('the minimap escapes the editor box');
        }
        const hit = sr.elementFromPoint(
          minimapBox.left + minimapBox.width / 2, minimapBox.top + minimapBox.height / 2,
        );
        if (hit && hit.closest && !hit.closest('.flow__minimap')) {
          say(`the minimap is covered by "${(hit as HTMLElement).className || hit.nodeName}"`);
        }
      }
    }

    return problems;
  }, combo);
}

for (const combo of generateCombos()) {
  test(`layer1 ${combo.id}`, async () => {
    expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
  });
}

test('layer1 empty: the editor shell still paints with no graph', async () => {
  const problems = await page.evaluate(async () => {
    const out: string[] = [];
    await (window as any).matrix.mount({ graph: 'empty' });
    const host = document.getElementById('subject') as HTMLElement;
    const sr = host.shadowRoot!;
    for (const name of ['base', 'canvas', 'nodes', 'minimap']) {
      const node = sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;
      if (!node) { out.push(`no [part="${name}"]`); continue; }
      if (node.getBoundingClientRect().width <= 0) out.push(`${name} has no width with an empty graph`);
    }
    if (sr.querySelectorAll('.flow__node').length !== 0) out.push('nodes painted for an empty graph');
    if (sr.querySelectorAll('.flow__edge').length !== 0) out.push('edges painted for an empty graph');
    return out;
  });
  expect(problems).toEqual([]);
});

test('layer1 zoom: a wheel gesture really re-scales the painted nodes', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ graph: 'doc' });
    const el = (window as any).matrix.el;
    const measure = () => el.shadowRoot.querySelector('.flow__node').getBoundingClientRect();
    const before = measure();
    await (window as any).matrix.wheel(-120);
    const zoomedIn = measure();
    await (window as any).matrix.wheel(120);
    const back = measure();
    return {
      before: before.width, zoomedIn: zoomedIn.width, back: back.width,
    };
  });
  // "zoom/pan canvas": zooming in paints the node bigger, and zooming back out
  // returns it to roughly where it started.
  expect(result.zoomedIn).toBeGreaterThan(result.before);
  expect(Math.abs(result.back - result.before)).toBeLessThan(2);
});

test('layer1 zoomEnabled=false leaves the scale alone', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ graph: 'doc', zoomEnabled: false });
    const el = (window as any).matrix.el;
    const before = el.shadowRoot.querySelector('.flow__node').getBoundingClientRect().width;
    await (window as any).matrix.wheel(-120);
    const after = el.shadowRoot.querySelector('.flow__node').getBoundingClientRect().width;
    return { before, after };
  });
  expect(result.after).toBe(result.before);
});

test('layer1 fitView brings every node inside the editor', async () => {
  const problems = await page.evaluate(async () => {
    const out: string[] = [];
    await (window as any).matrix.mount({ graph: 'large' });
    await (window as any).matrix.fitView();

    const host = document.getElementById('subject') as HTMLElement;
    const sr = host.shadowRoot!;
    const base = sr.querySelector('[part~="base"]')!.getBoundingClientRect();
    for (const node of [...sr.querySelectorAll('.flow__node')] as HTMLElement[]) {
      const box = node.getBoundingClientRect();
      const id = node.getAttribute('data-node-id');
      // "Auto-zoom to fit ALL nodes" — every one of them, inside the box.
      if (box.left < base.left - 1 || box.right > base.right + 1
        || box.top < base.top - 1 || box.bottom > base.bottom + 1) {
        out.push(`node "${id}" [${box.left.toFixed(0)}, ${box.right.toFixed(0)}] x `
          + `[${box.top.toFixed(0)}, ${box.bottom.toFixed(0)}] is outside the editor `
          + `[${base.left.toFixed(0)}, ${base.right.toFixed(0)}] x `
          + `[${base.top.toFixed(0)}, ${base.bottom.toFixed(0)}]`);
      }
    }
    return out;
  });
  expect(problems).toEqual([]);
});

test('layer1 fitView on an off-origin graph brings the negative node into view', async () => {
  const problems = await page.evaluate(async () => {
    const out: string[] = [];
    await (window as any).matrix.mount({ graph: 'off-origin' });
    await (window as any).matrix.fitView();

    const host = document.getElementById('subject') as HTMLElement;
    const sr = host.shadowRoot!;
    const base = sr.querySelector('[part~="base"]')!.getBoundingClientRect();
    const negative = sr.querySelector('.flow__node[data-node-id="neg"]')!.getBoundingClientRect();
    if (negative.left < base.left - 1 || negative.top < base.top - 1) {
      out.push(`the node at (-240, -120) still paints outside the editor at `
        + `${negative.left.toFixed(0)}, ${negative.top.toFixed(0)}`);
    }
    return out;
  });
  expect(problems).toEqual([]);
});

// ── MATRIX-flow-4: which side each port dot lands on ───────────────────────

/**
 * Measure every port dot as a fraction of its node's width. 0 is the node's
 * left edge, 1 its right; an input belongs below 0.5 and an output above it.
 */
async function portSides(graph: Graph): Promise<Array<{
  id: string; kind: string; fraction: number; onlySide: boolean;
}>> {
  return page.evaluate(async (graph) => {
    await (window as any).matrix.mount({ graph, minimap: false });
    const sr = (window as any).matrix.el.shadowRoot as ShadowRoot;
    const nodes = (window as any).matrix.graph.nodes as Array<{
      id: string; inputs?: unknown[]; outputs?: unknown[];
    }>;
    return [...sr.querySelectorAll('.flow__port')].map((port) => {
      const nodeId = port.getAttribute('data-node-id')!;
      const portId = port.getAttribute('data-port-id')!;
      const kind = port.getAttribute('data-port-type')!;
      const nodeBox = sr.querySelector(`.flow__node[data-node-id="${nodeId}"]`)!
        .getBoundingClientRect();
      const dot = port.querySelector('.flow__port-dot')!.getBoundingClientRect();
      const node = nodes.find(n => n.id === nodeId)!;
      const hasInputs = (node.inputs ?? []).length > 0;
      const hasOutputs = (node.outputs ?? []).length > 0;
      return {
        id: `${nodeId}.${portId}`,
        kind,
        fraction: (dot.left + dot.width / 2 - nodeBox.left) / nodeBox.width,
        onlySide: !(hasInputs && hasOutputs),
      };
    });
  }, graph);
}

// Graphs that contain at least one node with BOTH an input and an output side.
for (const graph of ['doc', 'chain', 'large'] as Graph[]) {
  test(`layer1 ${graph}: ports on nodes with both sides sit on the correct edge`, async () => {
    const ports = (await portSides(graph)).filter(port => !port.onlySide);
    expect(ports.length, `graph ${graph} has no two-sided node to measure`).toBeGreaterThan(0);
    for (const port of ports) {
      if (port.kind === 'output') {
        expect(port.fraction, `output ${port.id} at ${port.fraction.toFixed(2)} of its node`)
          .toBeGreaterThan(0.5);
      } else {
        expect(port.fraction, `input ${port.id} at ${port.fraction.toFixed(2)} of its node`)
          .toBeLessThan(0.5);
      }
    }
  });

}

// Graphs that contain at least one node declaring `outputs` and no `inputs`.
for (const graph of ['doc', 'chain', 'multi-port', 'large', 'styled-edges'] as Graph[]) {
  test(`MATRIX-flow-4 ${graph}: an output-only node keeps its outputs on the right`, async () => {
    test.fail();
    const ports = (await portSides(graph)).filter(port => port.onlySide && port.kind === 'output');
    expect(ports.length, `graph ${graph} has no output-only node`).toBeGreaterThan(0);
    for (const port of ports) {
      expect(port.fraction, `output ${port.id} at ${port.fraction.toFixed(2)} of its node`)
        .toBeGreaterThan(0.5);
    }
  });
}

// ── LAYER 2: real screenshots ──────────────────────────────────────────────

test('marquee: a node colour override really paints its header', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ graph: 'sized' }));
  const probe = `(host) => {
    const sr = host.shadowRoot;
    const tinted = sr.querySelector('.flow__node[data-node-id="tinted"] .flow__node-header');
    const plain = sr.querySelector('.flow__node[data-node-id="default"] .flow__node-header');
    const t = tinted.getBoundingClientRect();
    const p = plain.getBoundingClientRect();
    return [
      { x: t.right - 6, y: t.top + t.height / 2 },
      { x: p.right - 6, y: p.top + p.height / 2 },
    ];
  }`;
  const [tinted, plain] = await capture(page, '#subject', 'flow-node-color', probe);

  // `color?: string` on a FlowNode paints its header; an uncoloured node uses
  // the stylesheet's own surface, and the two must be visibly different.
  expect(sameColor(tinted, plain), `tinted ${tinted} and plain ${plain} paint alike`).toBe(false);
  // The authored colour is rgb(168 85 247) — a purple, so red and blue over green.
  expect(tinted[0]).toBeGreaterThan(tinted[1]);
  expect(tinted[2]).toBeGreaterThan(tinted[1]);
});

test('MATRIX-flow-5 marquee: an edge colour override really reaches the stroke', async () => {
  test.fail();
  await page.evaluate(() => (window as any).matrix.mount({ graph: 'styled-edges', minimap: false }));
  // A 2px stroke is a THIN target: a single probe at the geometric midpoint
  // can land on the antialiased shoulder and read the background. So each edge
  // is sampled over a small vertical span through the curve, and the assertion
  // is about the most saturated pixel found — the stroke's own colour, rather
  // than whatever the sampling happened to clip.
  const probe = `(host) => {
    const sr = host.shadowRoot;
    const points = [];
    for (const id of ['e1', 'e2']) {
      const path = sr.querySelector('.flow__edge[data-edge-id="' + id + '"]');
      const point = path.getPointAtLength(path.getTotalLength() / 2);
      const p = point.matrixTransform(path.getScreenCTM());
      for (const dy of [-2, -1, 0, 1, 2]) points.push({ x: p.x, y: p.y + dy });
    }
    return points;
  }`;
  const pixels = await capture(page, '#subject', 'flow-edge-color', probe);
  expect(pixels).toHaveLength(10);

  // The pixel furthest from grey is the stroke; the rest are its shoulders.
  const spread = ([r, g, b]: RGB) => Math.max(r, g, b) - Math.min(r, g, b);
  const pick = (from: RGB[]) => from.reduce((best, p) => (spread(p) > spread(best) ? p : best));
  const green = pick(pixels.slice(0, 5));
  const plain = pick(pixels.slice(5));

  // e1 carries `color: 'rgb(16 185 129)'`; e2 carries none.
  expect(green[1], `edge pixel rgb(${green}) is not green`).toBeGreaterThan(green[0]);
  expect(green[1], `edge pixel rgb(${green}) is not green`).toBeGreaterThan(green[2]);
  expect(sameColor(green, plain), 'the coloured and uncoloured edges paint alike').toBe(false);
});

test('MATRIX-flow-5: the stylesheet overrides the authored stroke attribute', async () => {
  // The mechanism, stated positively. This is what IS true today; the pinned
  // test above is what the doc says should be. Both are kept so a fix flips
  // exactly one of them.
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ graph: 'styled-edges', minimap: false });
    const sr = (window as any).matrix.el.shadowRoot as ShadowRoot;
    const read = (id: string) => {
      const path = sr.querySelector(`.flow__edge[data-edge-id="${id}"]`) as SVGPathElement;
      return { attribute: path.getAttribute('stroke'), computed: getComputedStyle(path).stroke };
    };
    return { coloured: read('e1'), plain: read('e2') };
  });

  // The attribute the DOM tier asserts really is written…
  expect(result.coloured.attribute).toBe('rgb(16 185 129)');
  expect(result.plain.attribute).toBeNull();
  // …and the cascade discards it: both edges compute to the same stroke.
  expect(result.coloured.computed).toBe(result.plain.computed);
});

test('marquee: a selected node really looks selected', async () => {
  await page.evaluate(async () => {
    await (window as any).matrix.mount({ graph: 'chain', minimap: false });
    await (window as any).matrix.selectNode('n2');
  });
  // A selected node is marked by a 1px border colour change plus a 2px ring
  // painted OUTSIDE the box, so the evidence spans a few pixels either side of
  // the edge. Sampling that whole band and taking the bluest pixel is what
  // makes the assertion about the mark rather than about sub-pixel rounding.
  const probe = `(host) => {
    const sr = host.shadowRoot;
    const points = [];
    for (const id of ['n2', 'n3']) {
      const box = sr.querySelector('.flow__node[data-node-id="' + id + '"]').getBoundingClientRect();
      for (const dx of [-3, -2, -1, 0, 1]) {
        points.push({ x: box.left + dx, y: box.top + box.height / 2 });
      }
    }
    return points;
  }`;
  const pixels = await capture(page, '#subject', 'flow-node-selected', probe);
  expect(pixels).toHaveLength(10);

  const bluest = (from: RGB[]) => from.reduce((best, p) => (p[2] - p[0] > best[2] - best[0] ? p : best));
  const selected = bluest(pixels.slice(0, 5));
  const unselected = bluest(pixels.slice(5));

  expect(
    sameColor(selected, unselected),
    `selected ${selected} and unselected ${unselected} edges paint alike`,
  ).toBe(false);
  // The selection mark is `--snice-color-primary` / the focus ring: a blue, so
  // the selected edge really has more blue than red where the unselected one
  // does not.
  expect(selected[2] - selected[0], `selected edge rgb(${selected}) is not blue`).toBeGreaterThan(20);
  expect(unselected[2] - unselected[0]).toBeLessThan(selected[2] - selected[0]);
  // …and the difference is one a reader can see, not a rounding artefact.
  expect(contrast(selected, unselected)).toBeGreaterThan(1.15);
});
