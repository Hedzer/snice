/**
 * snice-network-graph matrix — the LAYOUT slice.
 *
 * Eleven graph shapes x three documented layouts x `showLabels` = 66 combos.
 * Each asserts the whole documented contract through `graphProblems`: the
 * closed-form circular/grid placement, pinned x/y under every layout, the
 * degree-driven radius, group colouring, per-node and per-edge overrides,
 * parallel-edge separation, undrawable edges, and — the claim the picture lives
 * or dies by — every edge really joining the two nodes it names.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FIXTURES, LAYOUTS, combo, mountGraph, graphProblems, removeComponent,
  type GraphCombo,
} from './network-graph-support';

function layoutCombos(): GraphCombo[] {
  const combos: GraphCombo[] = [];
  for (const fixture of FIXTURES) {
    for (const layout of LAYOUTS) {
      for (const showLabels of [true, false]) {
        combos.push(combo(`${fixture.id}/${layout}/labels:${showLabels}`, fixture, {
          layout, showLabels,
        }));
      }
    }
  }
  return combos;
}

let graph: any;
afterEach(() => { if (graph) { removeComponent(graph); graph = null; } });

describe('network-graph matrix: graphs x layouts x labels', () => {
  const combos = layoutCombos();

  it('enumerates the full cross', () => {
    expect(combos).toHaveLength(FIXTURES.length * LAYOUTS.length * 2);
    expect(new Set(combos.map(c => c.id)).size).toBe(combos.length);
  });

  for (const c of combos) {
    it(c.id, async () => {
      graph = await mountGraph(c);
      expect(graphProblems(graph, c), `combo ${c.id} — ${c.fixture.why}`).toEqual([]);
    });
  }
});

describe('network-graph matrix: the force simulation respects pinned nodes', () => {
  // A node with explicit x/y is placed there and PINNED: the docs give x and y
  // as node properties, and a simulation that drifts them is ignoring the
  // caller. This runs the REAL animated force layout, not the static build.
  it('leaves pinned nodes exactly where the caller put them', async () => {
    const c = combo('pinned + live force', FIXTURES.find(f => f.id === 'pinned')!, {
      layout: 'force', animation: true,
    });
    graph = await mountGraph(c);

    const problems: string[] = [];
    for (const step of [0, 1, 2]) {
      await new Promise(resolve => setTimeout(resolve, 40));
      problems.push(...graphProblems(graph, c).map(p => `after settle ${step}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('keeps unpinned nodes finite while the simulation runs', async () => {
    const c = combo('star + live force', FIXTURES.find(f => f.id === 'star')!, {
      layout: 'force', animation: true,
    });
    graph = await mountGraph(c);

    const problems: string[] = [];
    for (const step of [0, 1, 2]) {
      await new Promise(resolve => setTimeout(resolve, 40));
      problems.push(...graphProblems(graph, c).map(p => `tick ${step}: ${p}`));
    }
    expect(problems).toEqual([]);
  });
});

describe('network-graph matrix: layout and data are live', () => {
  it('re-lays-out when `layout` changes under fixed data', async () => {
    const fixture = FIXTURES.find(f => f.id === 'twelve')!;
    const base = combo('layout-walk', fixture);
    graph = await mountGraph(base);

    const problems: string[] = [];
    for (const layout of ['circular', 'grid', 'circular', 'force', 'grid'] as const) {
      graph.layout = layout;
      await new Promise(resolve => setTimeout(resolve, 60));
      const next = { ...base, layout, id: `layout-walk -> ${layout}` };
      problems.push(...graphProblems(graph, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('re-draws for every graph it is handed', async () => {
    const base = combo('data-walk', FIXTURES[0], { layout: 'circular' });
    graph = await mountGraph(base);

    const problems: string[] = [];
    for (const fixture of FIXTURES) {
      graph.data = fixture.data;
      await new Promise(resolve => setTimeout(resolve, 60));
      const next = { ...base, fixture, id: `data-walk -> ${fixture.id}` };
      problems.push(...graphProblems(graph, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('shows and hides every label when `showLabels` is toggled', async () => {
    const base = combo('labels-walk', FIXTURES.find(f => f.id === 'styled')!, {
      layout: 'grid',
    });
    graph = await mountGraph(base);

    const problems: string[] = [];
    for (const showLabels of [false, true, false, true]) {
      graph.showLabels = showLabels;
      await new Promise(resolve => setTimeout(resolve, 60));
      const next = { ...base, showLabels, id: `labels-walk -> ${showLabels}` };
      problems.push(...graphProblems(graph, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });
});
