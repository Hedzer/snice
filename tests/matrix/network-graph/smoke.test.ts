/**
 * Smoke slice of the snice-network-graph matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full cross (66 layout combos plus the interaction
 * slice) runs only via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and pays for the marquee combos only:
 *
 *   · the docs' own two-node example under all three layouts — the closed-form
 *     circular and grid placement, and the force layout's static build;
 *   · pinned x/y — the caller's coordinates, which nothing may move;
 *   · parallel edges — the curve that keeps the second edge visible;
 *   · an edge naming a node that does not exist — the drop;
 *   · labels off — the branch that removes every text node;
 *   · one drag and one hover — the two gestures the whole component exists for.
 *
 * Every structural assertion routes through the matrix's own oracle
 * (`graphProblems`), so this file cannot drift into asserting something weaker
 * than the suite it stands in for. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FIXTURE, combo, mountGraph, graphProblems, readNodes, readEdges, tooltipState,
  removeComponent, wait, sr,
} from './network-graph-support';

const MARQUEE = [
  combo('doc example / circular', FIXTURE['pair'], { layout: 'circular' }),
  combo('doc example / grid', FIXTURE['pair'], { layout: 'grid' }),
  combo('doc example / force', FIXTURE['pair'], { layout: 'force' }),
  combo('pinned coordinates survive', FIXTURE['pinned'], { layout: 'circular' }),
  combo('parallel edges curve apart', FIXTURE['multi-edge'], { layout: 'grid' }),
  combo('dangling edges are dropped', FIXTURE['dangling-edge'], { layout: 'grid' }),
  combo('labels off', FIXTURE['styled'], { layout: 'grid', showLabels: false }),
  combo('groups share a colour', FIXTURE['groups'], { layout: 'grid' }),
];

let graph: any;
afterEach(() => { if (graph) { removeComponent(graph); graph = null; } });

describe('network-graph matrix smoke', () => {
  for (const c of MARQUEE) {
    it(c.id, async () => {
      graph = await mountGraph(c);
      expect(graphProblems(graph, c), `combo ${c.id}`).toEqual([]);
    });
  }

  it('dragging a node moves it and reports node-drag', async () => {
    const c = combo('drag', FIXTURE['pinned'], { layout: 'grid' });
    graph = await mountGraph(c);
    const drags: any[] = [];
    graph.addEventListener('node-drag', (e: CustomEvent) => drags.push(e.detail));

    const group = sr(graph).querySelector('[data-node-id="a"]')!;
    group.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, composed: true, cancelable: true, clientX: 100, clientY: 100,
    }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 250, clientY: 180 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 250, clientY: 180 }));
    await wait(30);

    expect(drags).toHaveLength(1);
    const moved = readNodes(graph).find(n => n.id === 'a')!;
    expect([moved.x, moved.y]).toEqual([250, 180]);
    // The dragged node is now somewhere its `x`/`y` never said, so the oracle's
    // placement rule no longer applies; what must still hold is that the edges
    // touching it followed, which is the claim a moved node can break.
    const touching = readEdges(graph).filter(edge =>
      (edge.from.x === moved.x && edge.from.y === moved.y)
      || (edge.to.x === moved.x && edge.to.y === moved.y));
    expect(touching, 'both edges touching the dragged node followed it').toHaveLength(2);
  });

  it('hovering a node shows a tooltip naming its degree', async () => {
    const c = combo('hover', FIXTURE['star'], { layout: 'grid' });
    graph = await mountGraph(c);

    sr(graph).querySelector('[data-node-id="hub"]')!.dispatchEvent(
      new MouseEvent('mouseenter', { composed: true, clientX: 20, clientY: 20 }),
    );
    await wait(30);

    const tip = tooltipState(graph);
    expect(tip.visible).toBe(true);
    expect(tip.text).toContain('HUB');
    expect(tip.text).toContain('4 connections');
  });
});
