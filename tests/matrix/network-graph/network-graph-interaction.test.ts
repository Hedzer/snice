/**
 * snice-network-graph matrix — the INTERACTION slice.
 *
 * The four documented events and the two switches that gate them:
 *
 *   node-click  -> { node }              edge-click -> { edge }
 *   node-drag   -> { node, x, y }        graph-zoom -> { scale, x, y }
 *   zoomEnabled  "Enable zoom"           dragEnabled "Enable node dragging"
 *
 * plus the documented hover affordance ("Hover tooltips with label and degree")
 * and the dimming it drives. Every gate is crossed against every event, because
 * "which switch turns which event off" is exactly the kind of contract that
 * rots quietly.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FIXTURE, combo, mountGraph, graphProblems, readNodes, readEdges, tooltipState,
  transformOf, removeComponent, wait, sr, type GraphCombo,
} from './network-graph-support';

// ── Gesture helpers, in the component's own coordinate space ────────────────
//
// happy-dom reports a zero box for the SVG, so a client coordinate IS a graph
// coordinate: the component's documented screen->graph conversion subtracts the
// canvas origin and divides by the zoom scale, both of which are identity here.

function nodeGroup(el: any, id: string): Element {
  const group = sr(el).querySelector(`.network-graph__node[data-node-id="${id}"]`);
  if (!group) throw new Error(`no rendered node "${id}"`);
  return group;
}

function edgePath(el: any, index: number): Element {
  const path = sr(el).querySelectorAll('.network-graph__edge')[index];
  if (!path) throw new Error(`no rendered edge ${index}`);
  return path;
}

function mouse(target: EventTarget, type: string, x: number, y: number): void {
  target.dispatchEvent(new MouseEvent(type, {
    bubbles: true, composed: true, cancelable: true, clientX: x, clientY: y,
  }));
}

/** Press a node, move the pointer, release — the documented drag gesture. */
function dragNode(el: any, id: string, from: [number, number], to: [number, number]): void {
  mouse(nodeGroup(el, id), 'mousedown', from[0], from[1]);
  mouse(document, 'mousemove', to[0], to[1]);
  mouse(document, 'mouseup', to[0], to[1]);
}

/** Press and release a node without moving — the documented click gesture. */
function clickNode(el: any, id: string, at: [number, number] = [10, 10]): void {
  mouse(nodeGroup(el, id), 'mousedown', at[0], at[1]);
  mouse(document, 'mouseup', at[0], at[1]);
}

function hoverNode(el: any, id: string, at: [number, number] = [40, 50]): void {
  nodeGroup(el, id).dispatchEvent(new MouseEvent('mouseenter', {
    bubbles: false, composed: true, clientX: at[0], clientY: at[1],
  }));
}

function unhoverNode(el: any, id: string): void {
  nodeGroup(el, id).dispatchEvent(new MouseEvent('mouseleave', {
    bubbles: false, composed: true,
  }));
}

function capture(el: any, type: string): any[] {
  const seen: any[] = [];
  el.addEventListener(type, (event: CustomEvent) => seen.push(event.detail));
  return seen;
}

let graph: any;
afterEach(() => { if (graph) { removeComponent(graph); graph = null; } });

// ── node-drag ───────────────────────────────────────────────────────────────

describe('network-graph matrix: dragging a node', () => {
  for (const dragEnabled of [true, false]) {
    for (const layout of ['grid', 'circular', 'force'] as const) {
      it(`drag with dragEnabled=${dragEnabled}, layout=${layout}`, async () => {
        const c = combo(`drag/${dragEnabled}/${layout}`, FIXTURE['pinned'], {
          dragEnabled, layout,
        });
        graph = await mountGraph(c);
        const drags = capture(graph, 'node-drag');
        const before = readNodes(graph).find(n => n.id === 'a')!;

        dragNode(graph, 'a', [100, 100], [220, 260]);
        await wait(40);

        const after = readNodes(graph).find(n => n.id === 'a')!;
        if (dragEnabled) {
          expect(drags, 'a drag with dragEnabled must report node-drag').toHaveLength(1);
          expect(drags[0].node.id).toBe('a');
          expect([drags[0].x, drags[0].y], 'node-drag reports the graph position')
            .toEqual([220, 260]);
          expect([after.x, after.y], 'the node follows the pointer').toEqual([220, 260]);
          // Everything else about the picture must still hold: the edges that
          // touched the node have to follow it.
          const edges = readEdges(graph);
          const touching = edges.filter(edge =>
            (Math.abs(edge.from.x - after.x) < 0.5 && Math.abs(edge.from.y - after.y) < 0.5)
            || (Math.abs(edge.to.x - after.x) < 0.5 && Math.abs(edge.to.y - after.y) < 0.5));
          expect(touching.length, 'the two edges touching node "a" followed it').toBe(2);
        } else {
          expect(drags, 'dragEnabled is off, so no node-drag may fire').toEqual([]);
          expect([after.x, after.y], 'a node moved with dragEnabled off')
            .toEqual([before.x, before.y]);
        }
      });
    }
  }
});

// ── edge-click ──────────────────────────────────────────────────────────────

describe('network-graph matrix: clicking an edge', () => {
  for (const zoomEnabled of [true, false]) {
    for (const dragEnabled of [true, false]) {
      it(`edge-click with zoom:${zoomEnabled}/drag:${dragEnabled}`, async () => {
        const c = combo(`edge/${zoomEnabled}/${dragEnabled}`, FIXTURE['styled'], {
          zoomEnabled, dragEnabled, layout: 'grid',
        });
        graph = await mountGraph(c);
        const clicks = capture(graph, 'edge-click');

        mouse(edgePath(graph, 1), 'click', 50, 50);
        await wait(20);

        expect(clicks, 'clicking an edge must report edge-click').toHaveLength(1);
        expect(clicks[0].edge).toEqual(FIXTURE['styled'].data.edges[1]);
      });
    }
  }

  it('reports the edge that was actually clicked', async () => {
    const c = combo('edge identity', FIXTURE['styled'], { layout: 'grid' });
    graph = await mountGraph(c);
    const clicks = capture(graph, 'edge-click');

    for (const index of [0, 1, 2, 0]) mouse(edgePath(graph, index), 'click', 10, 10);
    await wait(20);

    expect(clicks.map(detail => detail.edge)).toEqual([
      FIXTURE['styled'].data.edges[0],
      FIXTURE['styled'].data.edges[1],
      FIXTURE['styled'].data.edges[2],
      FIXTURE['styled'].data.edges[0],
    ]);
  });
});

// ── graph-zoom and panning ──────────────────────────────────────────────────

describe('network-graph matrix: zoom and pan', () => {
  for (const zoomEnabled of [true, false]) {
    it(`wheel zoom with zoomEnabled=${zoomEnabled}`, async () => {
      const c = combo(`zoom/${zoomEnabled}`, FIXTURE['pinned'], { zoomEnabled, layout: 'grid' });
      graph = await mountGraph(c);
      const zooms = capture(graph, 'graph-zoom');
      const before = transformOf(graph);

      const svg = sr(graph).querySelector('[part="canvas"]')!;
      svg.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, composed: true, cancelable: true, deltaY: -120, clientX: 300, clientY: 200,
      }));
      await wait(30);

      if (zoomEnabled) {
        expect(zooms, 'a wheel with zoomEnabled must report graph-zoom').toHaveLength(1);
        expect(zooms[0].scale, 'scrolling up zooms in').toBeGreaterThan(1);
        expect(transformOf(graph), 'the canvas transform must follow the zoom')
          .not.toBe(before);
        expect(transformOf(graph)).toContain(`scale(${zooms[0].scale})`);
      } else {
        expect(zooms, 'zoomEnabled is off, so no graph-zoom may fire').toEqual([]);
        expect(transformOf(graph), 'the canvas moved with zoomEnabled off').toBe(before);
      }
    });

    it(`background pan with zoomEnabled=${zoomEnabled}`, async () => {
      const c = combo(`pan/${zoomEnabled}`, FIXTURE['pinned'], { zoomEnabled, layout: 'grid' });
      graph = await mountGraph(c);
      const before = transformOf(graph);

      const svg = sr(graph).querySelector('[part="canvas"]')!;
      mouse(svg, 'mousedown', 300, 200);
      mouse(document, 'mousemove', 340, 230);
      mouse(document, 'mouseup', 340, 230);
      await wait(30);

      if (zoomEnabled) {
        expect(transformOf(graph), 'a background drag must pan the canvas')
          .toBe('translate(40, 30) scale(1)');
      } else {
        expect(transformOf(graph), 'the canvas panned with zoomEnabled off').toBe(before);
      }
    });
  }

  it('zooming does not move the nodes in graph space', async () => {
    // The zoom is a canvas transform, not a re-layout: a node's own coordinates
    // must be untouched, or a later drag would land somewhere else entirely.
    const c = combo('zoom keeps coordinates', FIXTURE['pinned'], { layout: 'grid' });
    graph = await mountGraph(c);
    const before = readNodes(graph).map(n => [n.x, n.y]);

    const svg = sr(graph).querySelector('[part="canvas"]')!;
    for (const deltaY of [-120, -120, 120]) {
      svg.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, composed: true, cancelable: true, deltaY, clientX: 100, clientY: 100,
      }));
    }
    await wait(30);

    expect(readNodes(graph).map(n => [n.x, n.y])).toEqual(before);
    expect(graphProblems(graph, c), 'the graph after three wheel events').toEqual([]);
  });
});

// ── Hover: tooltip and dimming ──────────────────────────────────────────────

describe('network-graph matrix: hover tooltip and dimming', () => {
  const HOVERS: Array<{ fixture: string; id: string; degree: number; label: string }> = [
    { fixture: 'star', id: 'hub', degree: 4, label: 'HUB' },
    { fixture: 'star', id: 'p1', degree: 1, label: 'P1' },
    { fixture: 'isolated-node', id: 'a', degree: 0, label: 'Alone' },
    { fixture: 'unlabelled', id: 'beta', degree: 2, label: 'beta' },
    { fixture: 'groups', id: 'a2', degree: 2, label: 'a2' },
    { fixture: 'pinned', id: 'b', degree: 2, label: 'b' },
  ];

  for (const hover of HOVERS) {
    it(`hovering ${hover.fixture}/${hover.id}`, async () => {
      const c = combo(`hover/${hover.fixture}/${hover.id}`, FIXTURE[hover.fixture], {
        layout: 'grid',
      });
      graph = await mountGraph(c);

      expect(tooltipState(graph).visible, 'the tooltip starts hidden').toBe(false);

      hoverNode(graph, hover.id);
      await wait(30);

      const problems: string[] = [];
      const tip = tooltipState(graph);
      if (!tip.visible) problems.push('the tooltip stayed hidden while a node was hovered');
      // Documented: "Hover tooltips with label and degree".
      if (!tip.text.includes(hover.label)) {
        problems.push(`the tooltip reads "${tip.text}" and never names "${hover.label}"`);
      }
      if (!new RegExp(`\\b${hover.degree}\\b`).test(tip.text)) {
        problems.push(`the tooltip reads "${tip.text}" and never names the degree`
          + ` ${hover.degree}`);
      }
      const plural = hover.degree === 1 ? /\b1 connection\b/ : new RegExp(`\\b${hover.degree} connections\\b`);
      if (!plural.test(tip.text)) {
        problems.push(`the tooltip reads "${tip.text}", which mis-pluralises`
          + ` ${hover.degree} connection(s)`);
      }

      // Dimming: the hovered node and its neighbours stay lit, everything else
      // dims — that is the whole point of hovering a relationship graph.
      const data = FIXTURE[hover.fixture].data;
      const neighbours = new Set([hover.id]);
      for (const edge of data.edges) {
        if (edge.source === hover.id) neighbours.add(edge.target);
        if (edge.target === hover.id) neighbours.add(edge.source);
      }
      for (const drawn of readNodes(graph)) {
        const wantDimmed = !neighbours.has(drawn.id);
        if (drawn.dimmed !== wantDimmed) {
          problems.push(`node "${drawn.id}" is ${drawn.dimmed ? '' : 'not '}dimmed while`
            + ` "${hover.id}" is hovered, expected ${wantDimmed ? '' : 'not '}dimmed`);
        }
      }
      for (const [index, edge] of readEdges(graph).entries()) {
        const source = data.edges.filter(e =>
          data.nodes.some(n => n.id === e.source) && data.nodes.some(n => n.id === e.target))[index];
        const touches = source.source === hover.id || source.target === hover.id;
        const highlighted = edge.classes.includes('--highlighted');
        const dimmed = edge.classes.includes('--dimmed');
        if (touches && !highlighted) {
          problems.push(`the edge ${source.source}->${source.target} touches the hovered`
            + ' node but is not highlighted');
        }
        if (!touches && !dimmed) {
          problems.push(`the edge ${source.source}->${source.target} does not touch the`
            + ' hovered node but is not dimmed');
        }
      }

      expect(problems, c.id).toEqual([]);

      // Leaving restores the picture exactly.
      unhoverNode(graph, hover.id);
      await wait(30);
      expect(tooltipState(graph).visible, 'the tooltip outlived the pointer').toBe(false);
      expect(readNodes(graph).filter(n => n.dimmed), 'dimming outlived the pointer')
        .toEqual([]);
      expect(graphProblems(graph, c), 'the graph after hover and leave').toEqual([]);
    });
  }
});

// ── FINDINGS ────────────────────────────────────────────────────────────────

describe('network-graph matrix: findings', () => {
  it(
    'MATRIX-network-graph-1 (fixed): `node-click` fires when drag-enabled is off',
    async () => {
      // docs: `node-click` -> { node: NetworkNode } is an unconditional event,
      // and the docs' own "Static display" example is
      // `<snice-network-graph zoom-enabled="false" drag-enabled="false">`.
      // The press used to be gated on `dragEnabled` itself, so turning
      // dragging off silently removed selection from the graph as well; a
      // press-and-release now reports the node whatever the drag switch says.
      const c = combo('static display', FIXTURE['star'], {
        dragEnabled: false, zoomEnabled: false, layout: 'grid',
      });
      graph = await mountGraph(c);
      const clicks = capture(graph, 'node-click');

      clickNode(graph, 'hub');
      await wait(30);

      expect(clicks.map(detail => detail.node.id)).toEqual(['hub']);
    },
  );

  it('node-click does fire when dragging is enabled', async () => {
    // The other side of the finding above: with the default `dragEnabled`, a
    // press-and-release that does not move reports the node.
    const c = combo('click with drag on', FIXTURE['star'], { layout: 'grid' });
    graph = await mountGraph(c);
    const clicks = capture(graph, 'node-click');

    clickNode(graph, 'hub');
    clickNode(graph, 'p2');
    await wait(30);

    expect(clicks.map(detail => detail.node.id)).toEqual(['hub', 'p2']);
  });

  it('a press that travels is a drag, not a click', async () => {
    const c = combo('drag is not a click', FIXTURE['pinned'], { layout: 'grid' });
    graph = await mountGraph(c);
    const clicks = capture(graph, 'node-click');
    const drags = capture(graph, 'node-drag');

    dragNode(graph, 'a', [100, 100], [200, 200]);
    await wait(30);

    expect(drags).toHaveLength(1);
    expect(clicks, 'a travelled press must not also report a click').toEqual([]);
  });
});
