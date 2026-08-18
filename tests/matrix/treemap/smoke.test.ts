/**
 * Smoke slice of the snice-treemap matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/treemap, 94 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file is the
 * standing cost the everyday loop pays.
 *
 * Marquee combos only — one per feature family:
 *   · the doc's own example tree, which owns all four parts and the
 *     one-rectangle-per-child rule at once;
 *   · `show-values` on, the switch that regresses into "always hidden";
 *   · a drill down and back, the navigation contract;
 *   · click and hover, the two events a dashboard wires up;
 *   · an explicit node colour, the override that beats the scheme.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mountTreemap, expectChartMatches, rects, labels, values, fills, breadcrumbs,
  tooltip, text, captureEvents, keysOf, click, hover, TREES, wait, SETTLE,
} from './treemap-support';

describe('snice-treemap matrix smoke', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('the doc\'s own tree draws one rectangle per child', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    expectChartMatches(el, { tree: 'doc' });
    expect(rects(el)).toHaveLength(3);
    expect(labels(el).map(text).sort()).toEqual(['A', 'B', 'C']);
  });

  it('show-values writes each node\'s total into its rectangle', async () => {
    const el = await mountTreemap({ tree: 'doc', showValues: true });
    expect(values(el).map(text).sort()).toEqual(['20', '30', '50']);
  });

  it('an explicit node colour beats the scheme', async () => {
    const el = await mountTreemap({ tree: 'colored', colorScheme: 'rainbow' });
    expect(fills(el).sort()).toEqual(['#1565c0', '#2e7d32', '#e74c3c']);
  });

  it('drilling down and back navigates the tree', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const events = captureEvents(el, ['treemap-drill']);

    el.drillDown(TREES.deep.children![0]);
    await wait(SETTLE);
    expect(labels(el).map(text).sort()).toEqual(['Leaf 1', 'Leaf 2']);
    expect(breadcrumbs(el).map(text)).toEqual(['Root', 'Branch']);

    el.drillUp();
    await wait(SETTLE);
    expect(el.drillPath).toEqual([]);
    expect(events.map(event => event.type)).toEqual(['treemap-drill', 'treemap-drill']);
    expect(keysOf(events[0].detail)).toEqual(['node', 'path']);
  });

  it('click and hover announce the node and its depth', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    const events = captureEvents(el, ['treemap-click', 'treemap-hover']);

    click(rects(el)[0]);
    hover(rects(el)[0]);
    await wait(SETTLE);

    expect(events.map(event => event.type)).toEqual(['treemap-click', 'treemap-hover']);
    expect(keysOf(events[0].detail)).toEqual(['depth', 'node']);
    expect(text(tooltip(el))).toBe('A: 50');
  });

  // MATRIX-treemap-1 (fixed): the palette walk used to paint neighbouring
  // rectangles the same colour. The guard stays so the everyday loop notices
  // a regression.
  it('MATRIX-treemap-1 (fixed): no two neighbouring rectangles share a colour', async () => {
    const el = await mountTreemap({ tree: 'many', colorScheme: 'rainbow' });
    const painted = fills(el);
    expect(painted.filter((fill, index) => index > 0 && fill === painted[index - 1])).toEqual([]);
  });

  it('a leaf draws nothing and does not throw', async () => {
    const el = await mountTreemap({ tree: 'leaf' });
    expect(rects(el)).toEqual([]);
    el.drillUp();
    el.drillToRoot();
    await wait(SETTLE);
    expect(rects(el)).toEqual([]);
  });
});
