/**
 * Matrix slice FLOW / METHODS + EVENTS — the five documented methods and the
 * five documented events.
 *
 * Dimensions:
 *   · addNode (5) / addEdge (4)                = 9 combos
 *   · removeNode (7) / removeEdge (5)          = 12 combos
 *   · fitView (5)                              = 5 combos
 *   · node-select / canvas-click (8)           = 8 combos
 *   · node-drag detail (6)                     = 6 combos
 *   · edge-disconnect on removeNode (3)        = 3 combos  [MATRIX-flow-3]
 *   Total 43.
 *
 * Documented contract (docs/ai/components/flow.md):
 *   · `addNode(node)` "Add a node" / `addEdge(edge)` "Add an edge";
 *   · `removeNode(id)` "Remove node and connected edges" — BOTH halves;
 *   · `removeEdge(id)` "Remove an edge";
 *   · `fitView()` "Auto-zoom to fit all nodes";
 *   · `node-select → { node: FlowNode | null }` — the null case is spelled out
 *     in the type, and a canvas click is what produces it;
 *   · `canvas-click → { x, y }` in canvas coordinates;
 *   · `node-drag → { node, x, y }`;
 *   · `edge-disconnect → { edge: FlowEdge }`.
 *
 * ── FINDING ────────────────────────────────────────────────────────────────
 *
 * MATRIX-flow-3 (fixed)  `removeNode` used to disconnect edges silently.
 *   The doc says `removeNode(id)` "Remove node and connected edges", and
 *   `edge-disconnect → { edge: FlowEdge }` carries no qualifier, so removal
 *   via `removeNode` now announces every edge it removes, exactly as
 *   `removeEdge` always did. Unpinned below as the regression guard.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, graphOf, makeFlow, readFacts, structureProblems,
  collectEvents, dragNode, clickCanvas, nodeTransformOf,
  expectClean, removeComponent, wait, REBUILD,
} from './flow-support';
import type { FlowNode, FlowEdge, GraphName } from './flow-support';

describe('flow matrix: methods and events', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('addNode', () => {
    const GRAPHS: GraphName[] = ['empty', 'single', 'doc', 'no-ports', 'large'];

    for (const graph of GRAPHS) {
      it(`graph=${graph}: appends the node to the layer`, async () => {
        const c = combo({ graph });
        const data = graphOf(c);
        el = await makeFlow(c, data);

        const added: FlowNode = {
          id: 'added', x: 720, y: 320, label: 'Added',
          inputs: [{ id: 'in', label: 'In' }],
        };
        el.addNode(added);
        await wait(REBUILD);

        expect(el.nodes).toHaveLength(data.nodes.length + 1);
        expect(el.nodes[el.nodes.length - 1]).toBe(added);
        expectClean(structureProblems(el, c, { nodes: el.nodes, edges: el.edges }), `add/${graph}`);
      });
    }
  });

  describe('addEdge', () => {
    const CASES: Array<[GraphName, FlowEdge]> = [
      ['doc', { id: 'new1', source: 'b', target: 'a', sourcePort: 'out', targetPort: 'in' }],
      ['chain', { id: 'new2', source: 'n1', target: 'n3', sourcePort: 'o', targetPort: 'i' }],
      ['multi-port', { id: 'new3', source: 'src', target: 'dst', sourcePort: 'o2', targetPort: 'i2', label: 'added' }],
      ['styled-edges', { id: 'new4', source: 'p', target: 'q', sourcePort: 'o', targetPort: 'i', animated: true }],
    ];

    for (const [graph, edge] of CASES) {
      it(`graph=${graph}: appends the edge to the canvas`, async () => {
        const c = combo({ graph });
        const data = graphOf(c);
        el = await makeFlow(c, data);

        el.addEdge(edge);
        await wait(REBUILD);

        expect(el.edges).toHaveLength(data.edges.length + 1);
        const rendered = readFacts(el).edges.map(path => path.id);
        expect(rendered).toContain(edge.id);
        expectClean(structureProblems(el, c, { nodes: el.nodes, edges: el.edges }), `addEdge/${graph}`);
      });
    }
  });

  describe('removeNode removes the node and its edges', () => {
    const CASES: Array<[GraphName, string, number, number]> = [
      // [graph, node id, remaining nodes, remaining edges]
      ['doc', 'a', 1, 0],
      ['doc', 'b', 1, 0],
      ['doc', 'missing', 2, 1],
      ['chain', 'n2', 2, 0],      // both edges touched n2
      ['chain', 'n1', 2, 1],
      ['chain', 'n3', 2, 1],
      ['multi-port', 'src', 1, 0],
    ];

    for (const [graph, id, nodes, edges] of CASES) {
      it(`graph=${graph}/removeNode("${id}"): leaves ${nodes} nodes, ${edges} edges`, async () => {
        const c = combo({ graph });
        el = await makeFlow(c);

        el.removeNode(id);
        await wait(REBUILD);

        expect(el.nodes).toHaveLength(nodes);
        expect(el.edges).toHaveLength(edges);
        expect(el.nodes.some((node: FlowNode) => node.id === id)).toBe(false);
        // "and connected edges": nothing may point at a node that is gone.
        for (const edge of el.edges as FlowEdge[]) {
          expect(edge.source).not.toBe(id);
          expect(edge.target).not.toBe(id);
        }
        const facts = readFacts(el);
        expect(facts.nodes).toHaveLength(nodes);
        expect(facts.edges).toHaveLength(edges);
      });
    }
  });

  describe('removeEdge', () => {
    const CASES: Array<[GraphName, string, number]> = [
      ['doc', 'e1', 0],
      ['chain', 'e1', 1],
      ['chain', 'e2', 1],
      ['chain', 'missing', 2],
      ['styled-edges', 'e2', 1],
    ];

    for (const [graph, id, remaining] of CASES) {
      it(`graph=${graph}/removeEdge("${id}"): leaves ${remaining} edges`, async () => {
        const c = combo({ graph });
        const data = graphOf(c);
        el = await makeFlow(c, data);
        const seen = collectEvents(el);
        const target = data.edges.find(edge => edge.id === id);

        el.removeEdge(id);
        await wait(REBUILD);

        expect(el.edges).toHaveLength(remaining);
        expect(el.nodes).toHaveLength(data.nodes.length);   // nodes are untouched
        expect(readFacts(el).edges).toHaveLength(remaining);

        // "edge-disconnect → { edge: FlowEdge }" — for a real removal only.
        const disconnects = seen.filter(event => event.type === 'edge-disconnect');
        if (target) {
          expect(disconnects).toHaveLength(1);
          expect(disconnects[0].detail.edge).toBe(target);
        } else {
          expect(disconnects).toHaveLength(0);
        }
      });
    }
  });

  describe('fitView', () => {
    const GRAPHS: GraphName[] = ['single', 'doc', 'large', 'off-origin', 'sized'];

    for (const graph of GRAPHS) {
      it(`graph=${graph}: brings the nodes into the canvas`, async () => {
        const c = combo({ graph });
        const data = graphOf(c);
        el = await makeFlow(c, data);

        el.fitView();
        await wait(REBUILD);

        // "Auto-zoom to fit all nodes" is a VIEW operation: the node
        // coordinates are the caller's data and must come back untouched.
        expect(el.nodes.map((node: FlowNode) => ({ x: node.x, y: node.y })))
          .toEqual(data.nodes.map(node => ({ x: node.x, y: node.y })));
        // …and the render still shows every node.
        expect(readFacts(el).nodes).toHaveLength(data.nodes.length);
        // …at a real, finite screen position.
        for (const node of data.nodes) {
          const placed = nodeTransformOf(el, node.id);
          expect(placed, `node "${node.id}" has no placement after fitView`).not.toBeNull();
          expect(Number.isFinite(placed!.left)).toBe(true);
          expect(Number.isFinite(placed!.top)).toBe(true);
        }
      });
    }

    it('fitView on an empty graph is a no-op', async () => {
      const c = combo({ graph: 'empty' });
      el = await makeFlow(c);
      const before = nodeTransformOf(el, 'nothing');
      expect(() => el.fitView()).not.toThrow();
      await wait(REBUILD);
      expect(before).toBeNull();
      expect(readFacts(el).nodes).toHaveLength(0);
    });
  });

  describe('node-select and canvas-click', () => {
    for (const graph of ['doc', 'chain', 'large'] as GraphName[]) {
      it(`graph=${graph}: pressing a node selects it`, async () => {
        const c = combo({ graph });
        const data = graphOf(c);
        el = await makeFlow(c, data);
        const seen = collectEvents(el);

        const target = data.nodes[data.nodes.length - 1];
        await dragNode(el, target.id, { x: 100, y: 100 }, { x: 100, y: 100 });

        const selects = seen.filter(event => event.type === 'node-select');
        expect(selects.length).toBeGreaterThan(0);
        expect(selects[0].detail.node).toBe(target);
        // The selection is visible on the node itself.
        expect(readFacts(el).nodes.find(node => node.id === target.id)!.selected).toBe(true);
      });

      it(`graph=${graph}: clicking the canvas deselects and reports coordinates`, async () => {
        const c = combo({ graph, panEnabled: false });
        const data = graphOf(c);
        el = await makeFlow(c, data);

        await dragNode(el, data.nodes[0].id, { x: 100, y: 100 }, { x: 100, y: 100 });
        const seen = collectEvents(el);

        expect(await clickCanvas(el, 220, 180)).toBe(true);

        // "node-select → { node: FlowNode | null }" — the documented null case.
        const selects = seen.filter(event => event.type === 'node-select');
        expect(selects).toHaveLength(1);
        expect(selects[0].detail.node).toBeNull();

        // "canvas-click → { x, y }"
        const clicks = seen.filter(event => event.type === 'canvas-click');
        expect(clicks).toHaveLength(1);
        expect(Number.isFinite(clicks[0].detail.x)).toBe(true);
        expect(Number.isFinite(clicks[0].detail.y)).toBe(true);

        expect(readFacts(el).nodes.every(node => !node.selected)).toBe(true);
      });
    }

    it('removeNode of the selected node reports the null selection', async () => {
      const c = combo({ graph: 'chain' });
      const data = graphOf(c);
      el = await makeFlow(c, data);
      await dragNode(el, 'n2', { x: 100, y: 100 }, { x: 100, y: 100 });
      const seen = collectEvents(el);

      el.removeNode('n2');
      await wait(REBUILD);

      const selects = seen.filter(event => event.type === 'node-select');
      expect(selects).toHaveLength(1);
      expect(selects[0].detail.node).toBeNull();
    });

    it('removeNode of an unselected node reports no selection change', async () => {
      const c = combo({ graph: 'chain' });
      el = await makeFlow(c);
      await dragNode(el, 'n1', { x: 100, y: 100 }, { x: 100, y: 100 });
      const seen = collectEvents(el);

      el.removeNode('n3');
      await wait(REBUILD);

      expect(seen.filter(event => event.type === 'node-select')).toHaveLength(0);
    });
  });

  describe('node-drag detail', () => {
    const CASES: Array<[GraphName, string, { x: number; y: number }]> = [
      ['doc', 'a', { x: 340, y: 260 }],
      ['doc', 'b', { x: 180, y: 420 }],
      ['chain', 'n2', { x: 500, y: 120 }],
      ['large', 'L4', { x: 260, y: 260 }],
      ['off-origin', 'neg', { x: 60, y: 60 }],
      ['sized', 'wide', { x: 420, y: 380 }],
    ];

    for (const [graph, id, to] of CASES) {
      it(`graph=${graph}/drag ${id}: the detail matches the node's new position`, async () => {
        const c = combo({ graph });
        const data = graphOf(c);
        el = await makeFlow(c, data);
        const seen = collectEvents(el);

        expect(await dragNode(el, id, { x: 120, y: 120 }, to)).toBe(true);

        const drags = seen.filter(event => event.type === 'node-drag');
        expect(drags.length).toBeGreaterThan(0);
        const last = drags[drags.length - 1].detail;

        // "node-drag → { node, x, y }" — the caller's own object, and the
        // coordinates that object now holds.
        const node = data.nodes.find(n => n.id === id)!;
        expect(last.node).toBe(node);
        expect(last.x).toBe(node.x);
        expect(last.y).toBe(node.y);
      });
    }
  });

  // ── MATRIX-flow-3 (fixed) ─────────────────────────────────────────────────
  describe('MATRIX-flow-3 (fixed): removeNode and edge-disconnect', () => {
    const CASES: Array<[GraphName, string, number]> = [
      ['chain', 'n2', 2],       // both edges are connected to n2
      ['doc', 'a', 1],
      ['multi-port', 'src', 2],
    ];

    for (const [graph, id, expected] of CASES) {
      it(`graph=${graph}/removeNode("${id}"): emits ${expected} edge-disconnect events (fixed)`, async () => {
        const c = combo({ graph });
        const data = graphOf(c);
        const doomed = data.edges.filter(edge => edge.source === id || edge.target === id);
        el = await makeFlow(c, data);
        const seen = collectEvents(el);

        el.removeNode(id);
        await wait(REBUILD);

        // The removal itself is correct…
        expect(el.edges).toHaveLength(data.edges.length - doomed.length);
        // …but the documented event does not follow it.
        const disconnects = seen.filter(event => event.type === 'edge-disconnect');
        expect(disconnects).toHaveLength(expected);
        expect(disconnects.map(event => event.detail.edge).sort()).toEqual(doomed.slice().sort());
      });
    }

    it('removeEdge does emit it for the same deletion', async () => {
      // The comparison that makes the finding a divergence rather than a
      // preference: the other removal route announces itself.
      const c = combo({ graph: 'chain' });
      const data = graphOf(c);
      el = await makeFlow(c, data);
      const seen = collectEvents(el);

      el.removeEdge('e1');
      await wait(REBUILD);

      const disconnects = seen.filter(event => event.type === 'edge-disconnect');
      expect(disconnects).toHaveLength(1);
      expect(disconnects[0].detail.edge).toBe(data.edges[0]);
    });
  });
});
