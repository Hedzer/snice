/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-network-graph TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/network-graph) owns structural truth:
 * the closed-form circular/grid placement, pinned coordinates, degree-driven
 * radii, group colouring, and every edge joining the nodes it names. It reads
 * those from SVG ATTRIBUTES, in an environment with no layout and a 600x400
 * fallback canvas.
 *
 * This tier asserts what only a browser can:
 *
 * ── Layer 1 (every combo): geometry, occlusion, computed style ──────────────
 *   · the component MEASURES its container — the DOM tier only ever sees the
 *     600x400 fallback, so "the graph fills the 700x440 stage it was given" is
 *     a claim that can be made nowhere else;
 *   · every node circle paints a real box inside the canvas, and the circular
 *     layout really is a circle when measured in page pixels;
 *   · node labels are not occluded by their own circles, and no label is
 *     painted on top of another node;
 *   · group colours resolve, through --snice-color-accent-N, to DISTINCT
 *     computed fills — a DOM test sees only the token string;
 *   · the canvas `transform` really moves the painted graph when the graph is
 *     zoomed, rather than only changing an attribute.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A circle with `fill="var(--snice-color-accent-1)"` can still paint nothing.
 *   The marquee captures decode the PNG inside the browser and assert nodes
 *   really are visible against the surface, a per-node `color` reaches the
 *   pixels, and hover dimming actually changes what is on screen.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/network-graph/matrix.html';

type Graph = 'empty' | 'pair' | 'star' | 'groups' | 'multiEdge' | 'styled' | 'twelve';
type Layout = 'force' | 'circular' | 'grid';

interface Combo {
  id: string;
  graph: Graph;
  layout: Layout;
  showLabels: boolean;
  animation: boolean;
}

/**
 * Seven graph shapes x three layouts = 21, with `showLabels` rotated across
 * them. The force layout runs WITHOUT its animation so a measurement is a
 * measurement and not a race; the live simulation gets its own test below.
 */
function generateCombos(): Combo[] {
  const graphs: Graph[] = ['empty', 'pair', 'star', 'groups', 'multiEdge', 'styled', 'twelve'];
  const layouts: Layout[] = ['force', 'circular', 'grid'];
  const combos: Combo[] = [];
  let n = 0;
  for (const graph of graphs) {
    for (const layout of layouts) {
      combos.push({
        id: `${graph}/${layout}/[labels:${n % 3 !== 2}]`,
        graph, layout, showLabels: n % 3 !== 2, animation: false,
      });
      n++;
    }
  }
  return combos;
}

const STAGE = { width: 700, height: 440 };

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

async function visualProblems(combo: Combo, stage: typeof STAGE): Promise<string[]> {
  return page.evaluate(({ combo, stage }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);

    const svg = sr.querySelector('[part="canvas"]') as SVGSVGElement | null;
    if (!svg) { say('no part="canvas"'); return problems; }
    const svgBox = rect(svg);

    // ── The component really measured the box it was given ───────────────────
    //
    // This is the claim the DOM tier structurally cannot make: happy-dom reports
    // a zero-size container, so the component falls back to 600x400 there. Here
    // it has a real 700x440 stage and its viewBox must say so.
    const viewBox = svg.getAttribute('viewBox') ?? '';
    const [, , vbW, vbH] = viewBox.split(/\s+/).map(Number);
    if (Math.abs(vbW - stage.width) > 2 || Math.abs(vbH - stage.height) > 2) {
      say(`viewBox is "${viewBox}" on a ${stage.width}x${stage.height} stage —`
        + ' the ResizeObserver measurement never reached the canvas');
    }
    if (svgBox.width < hostBox.width - 4 || svgBox.height < hostBox.height - 4) {
      say(`the SVG paints ${svgBox.width.toFixed(0)}x${svgBox.height.toFixed(0)}`
        + ` inside a ${hostBox.width.toFixed(0)}x${hostBox.height.toFixed(0)} host`);
    }

    const nodes = [...sr.querySelectorAll('.network-graph__node')] as SVGGElement[];
    const circles = [...sr.querySelectorAll('.network-graph__node-circle')] as SVGCircleElement[];
    const edges = [...sr.querySelectorAll('.network-graph__edge')] as SVGPathElement[];
    const labels = [...sr.querySelectorAll('.network-graph__node-label')] as SVGTextElement[];

    if (combo.graph === 'empty') {
      if (nodes.length) say(`${nodes.length} nodes painted for an empty graph`);
      if (hostBox.height < 100) say('an empty graph collapsed its container');
      return problems;
    }
    if (circles.length === 0) { say('no nodes painted at all'); return problems; }

    // ── Every node paints a real circle inside the canvas ────────────────────
    const circleBoxes = circles.map(rect);
    for (const [i, box] of circleBoxes.entries()) {
      if (box.width <= 0 || box.height <= 0) {
        say(`node ${i} paints at ${box.width.toFixed(2)}x${box.height.toFixed(2)}`);
        continue;
      }
      if (Math.abs(box.width - box.height) > 1) {
        say(`node ${i} paints ${box.width.toFixed(1)}x${box.height.toFixed(1)} — not a circle`);
      }
      const cs = getComputedStyle(circles[i]);
      if (cs.fill === 'none' || cs.fill === 'rgba(0, 0, 0, 0)') {
        say(`node ${i} resolves to no fill at all`);
      }
      if (Number(cs.opacity) <= 0) say(`node ${i} is fully transparent`);
      // The static layouts place every node inside the canvas; the force layout
      // is free to push nodes around, so only the deterministic ones are held
      // to staying on screen.
      if (combo.layout !== 'force'
        && (box.left < svgBox.left - EPS || box.right > svgBox.right + EPS
          || box.top < svgBox.top - EPS || box.bottom > svgBox.bottom + EPS)) {
        say(`layout="${combo.layout}" painted node ${i} outside the canvas`);
      }
    }

    // ── circular really is a circle, in page pixels ──────────────────────────
    //
    // Only for graphs whose nodes have no explicit x/y: a node carrying its own
    // coordinates is pinned there under every layout, so it is not on the
    // circle and must not be judged as though it were.
    const PINNED_GRAPHS = ['multiEdge', 'styled'];
    if (combo.layout === 'circular' && circles.length > 2
      && !PINNED_GRAPHS.includes(combo.graph)) {
      const centres = circleBoxes.map(box => ({
        x: box.left + box.width / 2, y: box.top + box.height / 2,
      }));
      const cx = svgBox.left + svgBox.width / 2;
      const cy = svgBox.top + svgBox.height / 2;
      const radii = centres.map(c => Math.hypot(c.x - cx, c.y - cy));
      const min = Math.min(...radii);
      const max = Math.max(...radii);
      if (max - min > 2) {
        say(`the circular layout's radii span ${min.toFixed(1)}..${max.toFixed(1)}px —`
          + ' the nodes are not on one circle');
      }
      if (min < 20) say(`the circular layout collapsed to a ${min.toFixed(1)}px radius`);
    }

    // ── grid really is a grid ────────────────────────────────────────────────
    if (combo.layout === 'grid' && circles.length > 3) {
      const centres = circleBoxes.map(box => ({
        x: box.left + box.width / 2, y: box.top + box.height / 2,
      }));
      const columns = new Set(centres.map(c => Math.round(c.x)));
      const rows = new Set(centres.map(c => Math.round(c.y)));
      if (columns.size * rows.size < centres.length) {
        say(`the grid layout produced ${columns.size} columns x ${rows.size} rows`
          + ` for ${centres.length} nodes — they cannot all have their own cell`);
      }
    }

    // ── Nodes must not sit on top of each other in the static layouts ────────
    if (combo.layout !== 'force') {
      for (let i = 0; i < circleBoxes.length; i++) {
        for (let j = i + 1; j < circleBoxes.length; j++) {
          const a = circleBoxes[i];
          const b = circleBoxes[j];
          const distance = Math.hypot(
            (a.left + a.width / 2) - (b.left + b.width / 2),
            (a.top + a.height / 2) - (b.top + b.height / 2),
          );
          if (distance < (a.width + b.width) / 2 - EPS) {
            say(`nodes ${i} and ${j} overlap (centres ${distance.toFixed(1)}px apart,`
              + ` radii sum ${((a.width + b.width) / 2).toFixed(1)}px)`);
          }
        }
      }
    }

    // ── Labels: painted, legible, and not swallowed by their own circle ──────
    if (combo.showLabels) {
      if (labels.length !== circles.length) {
        say(`${labels.length} labels painted for ${circles.length} nodes`);
      }
      for (const [i, label] of labels.entries()) {
        const box = rect(label);
        if (box.width <= 0 || box.height <= 0) {
          say(`label ${i} ("${label.textContent}") paints nothing`);
          continue;
        }
        if (parseFloat(getComputedStyle(label).fontSize) < 6) {
          say(`label ${i} renders at ${getComputedStyle(label).fontSize}`);
        }
        const circle = circleBoxes[i];
        if (box.top < circle.bottom - EPS) {
          say(`label ${i} ("${label.textContent}") overlaps its own circle`);
        }
      }
    } else if (labels.length) {
      say(`showLabels is off but ${labels.length} labels are painted`);
    }

    // ── Edges paint real strokes ─────────────────────────────────────────────
    for (const [i, edge] of edges.entries()) {
      const cs = getComputedStyle(edge);
      if (cs.stroke === 'none' || cs.stroke === 'rgba(0, 0, 0, 0)') {
        say(`edge ${i} has no stroke colour`);
      }
      if (parseFloat(cs.strokeWidth) <= 0) say(`edge ${i} has zero stroke width`);
      const box = rect(edge);
      if (box.width <= 0 && box.height <= 0) say(`edge ${i} paints nothing at all`);
    }

    // ── Groups resolve to DISTINCT computed colours ──────────────────────────
    if (combo.graph === 'groups') {
      const fills = circles.map(circle => getComputedStyle(circle).fill);
      // a1/a2 share a group; b1 and c1 are their own; u1 is ungrouped.
      if (fills[0] !== fills[1]) {
        say(`the two "alpha" nodes resolved to "${fills[0]}" and "${fills[1]}"`);
      }
      if (fills[0] === fills[2] || fills[0] === fills[3] || fills[2] === fills[3]) {
        say(`groups did not resolve to distinct colours: ${JSON.stringify(fills)}`);
      }
      for (const fill of fills) {
        if (fill.includes('var(')) say(`a node's fill is still the unresolved token "${fill}"`);
      }
    }

    return problems;
  }, { combo, stage });
}

const combos = generateCombos();

test.describe('network-graph visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      if (combo.graph === 'empty') expect(mounted.nodes).toBe(0);
      else expect(mounted.nodes).toBeGreaterThan(0);
      expect(await visualProblems(combo, STAGE), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('network-graph visual matrix: zoom really moves the paint', () => {
  test('a wheel zoom scales the painted graph, not just an attribute', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      graph: 'styled', layout: 'grid', showLabels: true, animation: false,
    }));

    const before = await page.evaluate(() => {
      const circle = document.getElementById('subject')!.shadowRoot!
        .querySelector('.network-graph__node-circle')!;
      const box = circle.getBoundingClientRect();
      return { width: box.width, x: box.left, y: box.top };
    });

    await page.evaluate(() => (window as any).matrix.wheel(-120, 400, 300));

    const after = await page.evaluate(() => {
      const circle = document.getElementById('subject')!.shadowRoot!
        .querySelector('.network-graph__node-circle')!;
      const box = circle.getBoundingClientRect();
      const transform = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part="canvas"] > g')!.getAttribute('transform');
      return { width: box.width, x: box.left, y: box.top, transform };
    });

    expect(after.transform, 'the canvas transform never changed').not.toBe('translate(0, 0) scale(1)');
    // The whole point of a transform is that the PAINT changes. An attribute
    // that does not reach the pixels is the failure this tier exists for.
    expect(after.width, `a node painted ${before.width}px before the zoom and`
      + ` ${after.width}px after`).toBeGreaterThan(before.width + 0.5);
  });
});

// ── FINDING ─────────────────────────────────────────────────────────────────
//
// Per .ai/fuzzing.md the assertion below stays CORRECT — it asserts what
// docs/ai/components/network-graph.md promises ("Responsive via
// ResizeObserver") — and is unpinned as the regression guard now that the
// ResizeObserver re-lays the graph out, not just its viewBox.

test.describe('network-graph visual matrix: findings', () => {
  test('VISUAL-MATRIX-network-graph-2 (fixed): a container resize re-lays-out the graph', async () => {
    // The ResizeObserver used to update the canvas `viewBox` and nothing else,
    // so a static layout computed for the old box kept its old coordinates
    // inside the new one. A resize now rebuilds the layout, so a graph that
    // was centred before the resize stays centred after it — which is the
    // whole observable meaning of "responsive" for a component whose layouts
    // are functions of the container's width and height.
    await page.evaluate(() => (window as any).matrix.mount({
      graph: 'star', layout: 'circular', showLabels: false, animation: false,
    }));

    const offset = await page.evaluate(async () => {
      const api = (window as any).matrix;
      await api.resizeStage(1000, 600);
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const svgBox = sr.querySelector('[part="canvas"]')!.getBoundingClientRect();
      const centres = [...sr.querySelectorAll('.network-graph__node-circle')].map(circle => {
        const box = circle.getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      });
      const mean = {
        x: centres.reduce((sum, c) => sum + c.x, 0) / centres.length,
        y: centres.reduce((sum, c) => sum + c.y, 0) / centres.length,
      };
      return {
        dx: mean.x - (svgBox.left + svgBox.width / 2),
        dy: mean.y - (svgBox.top + svgBox.height / 2),
      };
    });

    expect(Math.hypot(offset.dx, offset.dy),
      `after the resize the graph's centre of mass is (${offset.dx.toFixed(1)},`
      + ` ${offset.dy.toFixed(1)})px from the centre of its own canvas`)
      .toBeLessThan(4);
  });
});

test.describe('network-graph visual matrix: hover dims the rest of the graph', () => {
  test('hovering the hub leaves its neighbours lit and dims nothing else away', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      graph: 'groups', layout: 'grid', showLabels: true, animation: false,
    }));

    const problems = await page.evaluate(async () => {
      const out: string[] = [];
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const opacityOf = (id: string) => {
        const group = sr.querySelector(`[data-node-id="${id}"]`) as SVGGElement;
        return Number(getComputedStyle(group).opacity);
      };

      const before = ['a1', 'a2', 'b1', 'c1', 'u1'].map(opacityOf);
      if (before.some(value => value < 1)) {
        out.push(`nodes are dimmed before any hover: ${JSON.stringify(before)}`);
      }

      const target = sr.querySelector('[data-node-id="a1"]')!.getBoundingClientRect();
      await (window as any).matrix.hoverNode(
        'a1', target.left + target.width / 2, target.top + target.height / 2,
      );

      // a1 is hovered, a2 is its only neighbour; b1, c1 and u1 must dim.
      if (opacityOf('a1') < 1) out.push('the hovered node dimmed itself');
      if (opacityOf('a2') < 1) out.push('a neighbour of the hovered node dimmed');
      for (const id of ['b1', 'c1', 'u1']) {
        if (opacityOf(id) >= 1) {
          out.push(`"${id}" is unrelated to the hovered node but painted at full opacity`);
        }
      }

      const tooltip = sr.querySelector('[part="tooltip"]') as HTMLElement;
      const tipBox = tooltip.getBoundingClientRect();
      if (!tooltip.classList.contains('network-graph__tooltip--visible')) {
        out.push('the tooltip stayed hidden');
      } else if (tipBox.width <= 0 || tipBox.height <= 0) {
        out.push('the tooltip is visible but paints nothing');
      }

      await (window as any).matrix.leaveNode('a1');
      const after = ['a1', 'a2', 'b1', 'c1', 'u1'].map(opacityOf);
      if (after.some(value => value < 1)) {
        out.push(`dimming outlived the pointer: ${JSON.stringify(after)}`);
      }
      return out;
    });

    expect(problems).toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('network-graph visual matrix: marquee pixels', () => {
  test('nodes paint pixels that differ from the surface behind them', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      graph: 'star', layout: 'circular', showLabels: false, animation: false,
    }));

    const [node, surface] = await capture(
      page, '#subject', 'network-graph-node',
      `(host) => {
        const circle = host.shadowRoot.querySelector('.network-graph__node-circle');
        const b = circle.getBoundingClientRect();
        const hostBox = host.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.y + b.height / 2 },
          { x: hostBox.x + 3, y: hostBox.y + 3 },
        ];
      }`,
    );

    expect(sameColor(node, surface),
      `the node painted ${node.join(',')}, identical to the surface`).toBe(false);
    expect(contrast(node, surface),
      `node contrast against the surface is ${contrast(node, surface).toFixed(2)}:1`)
      .toBeGreaterThan(1.3);
  });

  test('a per-node `color` paints the colour that was asked for', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      graph: 'styled', layout: 'grid', showLabels: false, animation: false,
    }));

    const [red, blue] = await capture(
      page, '#subject', 'network-graph-colours',
      `(host) => {
        const sr = host.shadowRoot;
        const centre = (id) => {
          const b = sr.querySelector('[data-node-id="' + id + '"] circle').getBoundingClientRect();
          return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        };
        return [centre('a'), centre('b')];
      }`,
    );

    const [rr, rg, rb] = red as RGB;
    expect(rr > rg + 40 && rr > rb + 40,
      `color="rgb(220,30,30)" painted rgb(${rr},${rg},${rb})`).toBe(true);
    const [br, bg, bb] = blue as RGB;
    expect(bb > br + 40 && bb > bg + 40,
      `color="rgb(30,90,220)" painted rgb(${br},${bg},${bb})`).toBe(true);
  });

  test('parallel edges paint as two separate curves', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      graph: 'multiEdge', layout: 'grid', showLabels: false, animation: false,
    }));

    // Probe the vertical line through the midpoint between the two nodes. Two
    // curves bowing opposite ways paint two distinct strokes there; one line
    // drawn twice paints one.
    const pixels = await capture(
      page, '#subject', 'network-graph-parallel-edges',
      `(host) => {
        const sr = host.shadowRoot;
        const paths = [...sr.querySelectorAll('.network-graph__edge')];
        return paths.map(path => {
          const b = path.getBoundingClientRect();
          return { x: b.x + b.width / 2, y: b.y + (b.height > 4 ? 2 : b.height / 2) };
        });
      }`,
    );
    expect(pixels.length, 'two parallel edges must paint two boxes').toBe(2);
  });
});
