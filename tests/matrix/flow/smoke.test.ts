/**
 * Smoke slice of the snice-flow matrix — the everyday-loop tier.
 *
 * `tests/matrix/**` is excluded from the default Vitest include except each
 * directory's `smoke.test.ts` (vitest.config.ts), so this file is the one flow
 * matrix file the everyday `vitest run` still collects. The full 156-combo
 * matrix runs only via `npm run test:matrix`.
 *
 * One combo per feature family, chosen so a family that breaks cannot hide:
 *   · structure — the doc's own Basic Usage graph renders nodes, ports, and a
 *                 bezier edge in the canvas layer;
 *   · switches  — snap-to-grid really snaps; pan moves the view and not the data;
 *   · methods   — addNode/addEdge/removeNode/removeEdge/fitView;
 *   · events    — node-select, canvas-click's null selection, node-drag detail;
 *   · findings  — the three marquee regressions, pinned here as well as in the
 *                 matrix tier so a FIX surfaces in the everyday loop at once.
 *
 * Every assertion routes through the matrix's own oracle (flow-support.ts), so
 * this file cannot drift into asserting something weaker than the suite it
 * stands in for.
 *
 * BUDGET: ~1.5s, and this component sets its own floor. Every gesture here has
 * to survive the flow's imperative rebuild — the node layer is written, then
 * the port geometry is measured, then the edge layer is written — so a drag
 * costs two settles and a mount costs one. Families are merged into single
 * tests to pay for as few of those settles as possible; adding combos belongs
 * in the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, graphOf, makeFlow, readFacts, structureProblems, edgeProblems,
  minimapProblems, collectEvents, dragNode, dragCanvas, clickCanvas,
  nodeTransformOf, expectClean, removeComponent, wait, REBUILD,
} from './flow-support';

describe('flow matrix smoke', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('structure: the documented Basic Usage graph renders nodes, ports and a bezier edge', async () => {
    const c = combo();
    const data = graphOf(c);
    el = await makeFlow(c, data);
    expectClean(structureProblems(el, c, data), comboId(c));
    expectClean(edgeProblems(el, data), comboId(c));

    const facts = readFacts(el);
    expect(facts.presentParts).toEqual(['base', 'canvas', 'nodes', 'minimap']);
    expect(facts.nodes.map(node => node.id)).toEqual(['a', 'b']);
    expect(facts.nodes[0].outputs).toEqual(['out']);
    expect(facts.nodes[1].inputs).toEqual(['in']);
    expect(facts.edges).toHaveLength(1);
    expect(facts.edges[0].d).toMatch(/^M [-\d.]+ [-\d.]+ C /);
  });

  it('switches: snap-to-grid snaps the drag, panning moves only the view', async () => {
    const c = combo({ snapToGrid: true, gridSize: 20, panEnabled: true });
    const data = graphOf(c);
    el = await makeFlow(c, data);
    const seen = collectEvents(el);

    expect(await dragNode(el, 'a', { x: 100, y: 100 }, { x: 317, y: 243 })).toBe(true);

    const drags = seen.filter(event => event.type === 'node-drag');
    expect(drags.length).toBeGreaterThan(0);
    const last = drags[drags.length - 1].detail;
    expect(last.x % 20).toBe(0);
    expect(last.y % 20).toBe(0);

    const before = nodeTransformOf(el, 'b');
    const dataBefore = { x: data.nodes[1].x, y: data.nodes[1].y };
    expect(await dragCanvas(el, 120, -60)).toBe(true);

    expect(nodeTransformOf(el, 'b')).toEqual({ left: before!.left + 120, top: before!.top - 60 });
    expect({ x: data.nodes[1].x, y: data.nodes[1].y }).toEqual(dataBefore);
  });

  it('methods: add, remove and fitView keep the layers in step', async () => {
    const c = combo({ graph: 'chain' });
    const data = graphOf(c);
    el = await makeFlow(c, data);
    const seen = collectEvents(el);
    const coordinates = data.nodes.map(node => ({ x: node.x, y: node.y }));

    el.addNode({ id: 'n4', x: 700, y: 40, label: 'Extra', inputs: [{ id: 'i' }] });
    el.addEdge({ id: 'e3', source: 'n2', target: 'n4', sourcePort: 'o', targetPort: 'i' });
    await wait(REBUILD);
    expect(readFacts(el).nodes).toHaveLength(4);
    expect(readFacts(el).edges).toHaveLength(3);

    el.removeEdge('e3');
    el.removeNode('n2');
    await wait(REBUILD);
    expect(el.nodes).toHaveLength(3);
    expect(el.edges).toHaveLength(0);   // "and connected edges"
    expect(seen.filter(event => event.type === 'edge-disconnect')).toHaveLength(1);

    // "Auto-zoom to fit all nodes" is a view operation over the caller's data.
    el.fitView();
    await wait(REBUILD);
    expect(el.nodes.map((node: any) => ({ x: node.x, y: node.y })))
      .toEqual([coordinates[0], coordinates[2], { x: 700, y: 40 }]);
  });

  it('events: pressing a node selects it, clicking the canvas clears the selection', async () => {
    const c = combo({ panEnabled: false });
    const data = graphOf(c);
    el = await makeFlow(c, data);

    await dragNode(el, 'b', { x: 100, y: 100 }, { x: 100, y: 100 });
    expect(readFacts(el).nodes.find(node => node.id === 'b')!.selected).toBe(true);

    const seen = collectEvents(el);
    expect(await clickCanvas(el, 200, 200)).toBe(true);

    const selects = seen.filter(event => event.type === 'node-select');
    expect(selects).toHaveLength(1);
    expect(selects[0].detail.node).toBeNull();
    expect(seen.filter(event => event.type === 'canvas-click')).toHaveLength(1);
  });

  // The three marquee regressions, kept at full strength. See
  // matrix/flow/switches.test.ts and matrix/flow/methods.test.ts.
  it.fails('MATRIX-flow-1 editable=false leaves a dragged node where it was', async () => {
    const c = combo({ editable: false });
    const data = graphOf(c);
    const before = { x: data.nodes[0].x, y: data.nodes[0].y };
    el = await makeFlow(c, data);
    const seen = collectEvents(el);

    await dragNode(el, 'a', { x: 100, y: 100 }, { x: 300, y: 240 });

    expect(seen.filter(event => event.type === 'node-drag')).toHaveLength(0);
    expect({ x: data.nodes[0].x, y: data.nodes[0].y }).toEqual(before);
  });

  it.fails('MATRIX-flow-2 minimap=false hides the minimap panel', async () => {
    const c = combo({ minimap: false });
    const data = graphOf(c);
    el = await makeFlow(c, data);
    expectClean(minimapProblems(el, c, data), comboId(c));
  });

  it.fails('MATRIX-flow-3 removeNode emits edge-disconnect for the edges it removes', async () => {
    const c = combo({ graph: 'chain' });
    const data = graphOf(c);
    el = await makeFlow(c, data);
    const seen = collectEvents(el);

    el.removeNode('n2');
    await wait(REBUILD);

    expect(el.edges).toHaveLength(0);
    expect(seen.filter(event => event.type === 'edge-disconnect')).toHaveLength(2);
  });
});
