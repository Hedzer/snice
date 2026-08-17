/**
 * snice-treemap — drill-down navigation and the three documented events.
 *
 * The doc gives three navigation methods and one read-only property:
 *
 *   drillDown(node)  "Drill into node's children"
 *   drillUp()        "Go back one level"
 *   drillToRoot()    "Reset to root"
 *   drillPath        TreemapNode[] (read-only)
 *
 * and three events: `treemap-click { node, depth }`,
 * `treemap-hover { node, depth } | null`, `treemap-drill { node, path }`.
 *
 * AXES: every level of a three-level tree x every way of getting there (the
 * methods, a rectangle click, a breadcrumb click), crossed against the trees
 * where drilling is a no-op (a leaf, the empty default).
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mountTreemap, expectChartMatches, rects, labels, breadcrumbs, tooltip, text,
  captureEvents, keysOf, click, hover, unhover, TREES, wait, SETTLE,
} from './treemap-support';

afterEach(() => { document.body.innerHTML = ''; });

describe('snice-treemap matrix: drillDown', () => {
  it('drilling into a branch shows that branch\'s children', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    expect(labels(el).map(text).sort()).toEqual(['Branch', 'Other']);

    el.drillDown(TREES.deep.children![0]);
    await wait(SETTLE);
    expect(labels(el).map(text).sort()).toEqual(['Leaf 1', 'Leaf 2']);
    expect(el.drillPath.map(node => node.label)).toEqual(['Branch']);
  });

  it('drilling twice descends two levels', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const branch = TREES.deep.children![0];
    el.drillDown(branch);
    await wait(SETTLE);
    el.drillDown(branch.children![0]);
    await wait(SETTLE);

    expect(el.drillPath.map(node => node.label)).toEqual(['Branch', 'Leaf 1']);
    expect(labels(el).map(text)).toEqual(['Deep']);
  });

  it('drilling into a leaf is a no-op', async () => {
    // "Drill into node's children" — a node with none has nothing to show, and
    // a treemap that cleared itself would look broken.
    const el = await mountTreemap({ tree: 'doc' });
    const events = captureEvents(el, ['treemap-drill']);
    el.drillDown(TREES.doc.children![0]);
    await wait(SETTLE);

    expect(el.drillPath).toEqual([]);
    expect(events).toEqual([]);
    expect(rects(el)).toHaveLength(3);
  });

  it('drilling announces the node and the whole path', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const events = captureEvents(el, ['treemap-drill']);
    const branch = TREES.deep.children![0];

    el.drillDown(branch);
    await wait(SETTLE);
    expect(events).toHaveLength(1);
    expect(keysOf(events[0].detail)).toEqual(['node', 'path']);
    expect(events[0].detail.node.label).toBe('Branch');
    expect(events[0].detail.path.map((node: any) => node.label)).toEqual(['Branch']);

    el.drillDown(branch.children![0]);
    await wait(SETTLE);
    expect(events[1].detail.path.map((node: any) => node.label)).toEqual(['Branch', 'Leaf 1']);
  });

  it('a drilled chart still satisfies the whole-chart oracle', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    el.drillDown(TREES.deep.children![0]);
    await wait(SETTLE);
    expectChartMatches(el, { tree: 'deep' });
  });
});

describe('snice-treemap matrix: drillUp and drillToRoot', () => {
  it('drillUp goes back exactly one level', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const branch = TREES.deep.children![0];
    el.drillDown(branch);
    await wait(SETTLE);
    el.drillDown(branch.children![0]);
    await wait(SETTLE);

    el.drillUp();
    await wait(SETTLE);
    expect(el.drillPath.map(node => node.label)).toEqual(['Branch']);
    expect(labels(el).map(text).sort()).toEqual(['Leaf 1', 'Leaf 2']);

    el.drillUp();
    await wait(SETTLE);
    expect(el.drillPath).toEqual([]);
    expect(labels(el).map(text).sort()).toEqual(['Branch', 'Other']);
  });

  it('drillUp at the root is a no-op', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const events = captureEvents(el, ['treemap-drill']);
    el.drillUp();
    await wait(SETTLE);
    expect(el.drillPath).toEqual([]);
    expect(events).toEqual([]);
  });

  it('drillToRoot resets from any depth', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const branch = TREES.deep.children![0];
    el.drillDown(branch);
    await wait(SETTLE);
    el.drillDown(branch.children![0]);
    await wait(SETTLE);

    const events = captureEvents(el, ['treemap-drill']);
    el.drillToRoot();
    await wait(SETTLE);

    expect(el.drillPath).toEqual([]);
    expect(labels(el).map(text).sort()).toEqual(['Branch', 'Other']);
    expect(events).toHaveLength(1);
    expect(events[0].detail.path).toEqual([]);
  });

  it('new data resets the drill path', async () => {
    // The path names nodes of the OLD tree; keeping it would show a view of a
    // tree that is no longer there.
    const el = await mountTreemap({ tree: 'deep' });
    el.drillDown(TREES.deep.children![0]);
    await wait(SETTLE);
    expect(el.drillPath).toHaveLength(1);

    el.data = TREES.doc;
    await wait(SETTLE);
    expect(el.drillPath).toEqual([]);
    expect(labels(el).map(text).sort()).toEqual(['A', 'B', 'C']);
  });
});

describe('snice-treemap matrix: breadcrumbs', () => {
  it('there are no breadcrumbs at the root', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    expect(breadcrumbs(el)).toEqual([]);
  });

  it('drilling grows a trail from the root label', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const branch = TREES.deep.children![0];
    el.drillDown(branch);
    await wait(SETTLE);
    expect(breadcrumbs(el).map(text)).toEqual(['Root', 'Branch']);

    el.drillDown(branch.children![0]);
    await wait(SETTLE);
    expect(breadcrumbs(el).map(text)).toEqual(['Root', 'Branch', 'Leaf 1']);
  });

  it('the current level is not a link back to itself', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    el.drillDown(TREES.deep.children![0]);
    await wait(SETTLE);

    const trail = breadcrumbs(el);
    expect(trail[0].tagName.toLowerCase()).toBe('button');
    expect(trail[trail.length - 1].tagName.toLowerCase()).not.toBe('button');
  });

  it('the root breadcrumb goes back to the root', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const branch = TREES.deep.children![0];
    el.drillDown(branch);
    await wait(SETTLE);
    el.drillDown(branch.children![0]);
    await wait(SETTLE);

    click(breadcrumbs(el)[0]);
    await wait(SETTLE);
    expect(el.drillPath).toEqual([]);
    expect(labels(el).map(text).sort()).toEqual(['Branch', 'Other']);
  });

  it('an intermediate breadcrumb goes back to that level', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const branch = TREES.deep.children![0];
    el.drillDown(branch);
    await wait(SETTLE);
    el.drillDown(branch.children![0]);
    await wait(SETTLE);

    // Root / Branch / Leaf 1 — clicking "Branch" returns to Branch's children.
    click(breadcrumbs(el)[1]);
    await wait(SETTLE);
    expect(el.drillPath.map(node => node.label)).toEqual(['Branch']);
    expect(labels(el).map(text).sort()).toEqual(['Leaf 1', 'Leaf 2']);
  });

  it('a root without a label still names the trail', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    el.data = { label: '', value: 0, children: TREES.deep.children };
    await wait(SETTLE);
    el.drillDown(el.data.children![0]);
    await wait(SETTLE);
    expect(text(breadcrumbs(el)[0])).toBe('Root');
  });
});

describe('snice-treemap matrix: click and hover', () => {
  it('clicking a rectangle announces the node and its depth', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    const events = captureEvents(el, ['treemap-click']);

    click(rects(el)[0]);
    await wait(SETTLE);
    expect(events).toHaveLength(1);
    expect(keysOf(events[0].detail)).toEqual(['depth', 'node']);
    expect(events[0].detail.depth).toBe(0);
    expect(typeof events[0].detail.node.label).toBe('string');
  });

  it('clicking a rectangle with children drills into it', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    const events = captureEvents(el);
    const branchRect = rects(el)[labels(el).map(text).indexOf('Branch')];

    click(branchRect);
    await wait(SETTLE);
    expect(events.map(event => event.type)).toEqual(['treemap-click', 'treemap-drill']);
    expect(el.drillPath.map(node => node.label)).toEqual(['Branch']);
  });

  it('clicking a leaf rectangle announces without drilling', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    const events = captureEvents(el);
    const leafRect = rects(el)[labels(el).map(text).indexOf('A')];

    click(leafRect);
    await wait(SETTLE);
    expect(events.map(event => event.type)).toEqual(['treemap-click']);
    expect(el.drillPath).toEqual([]);
  });

  it('hovering announces the node, leaving announces null', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    const events = captureEvents(el, ['treemap-hover']);

    hover(rects(el)[0]);
    await wait(SETTLE);
    expect(keysOf(events[0].detail)).toEqual(['depth', 'node']);

    unhover(rects(el)[0]);
    await wait(SETTLE);
    expect(events).toHaveLength(2);
    expect(events[1].detail).toBeNull();
  });

  it('the tooltip appears on hover and names the node and its total', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    const tip = tooltip(el)!;
    expect(text(tip)).toBe('');

    hover(rects(el)[0]);
    await wait(SETTLE);
    // The biggest child of the doc tree is A with 50.
    expect(text(tip)).toBe('A: 50');
    expect(tip.classList.contains('treemap__tooltip--visible')).toBe(true);

    unhover(rects(el)[0]);
    await wait(SETTLE);
    expect(tip.classList.contains('treemap__tooltip--visible')).toBe(false);
  });

  it('a parent\'s tooltip shows the sum of its children', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    const index = labels(el).map(text).indexOf('C');
    hover(rects(el)[index]);
    await wait(SETTLE);
    expect(text(tooltip(el))).toBe('C: 20');
  });

  it('hovering after a drill announces the drilled level', async () => {
    const el = await mountTreemap({ tree: 'deep' });
    el.drillDown(TREES.deep.children![0]);
    await wait(SETTLE);

    const events = captureEvents(el, ['treemap-hover']);
    hover(rects(el)[0]);
    await wait(SETTLE);
    expect(['Leaf 1', 'Leaf 2']).toContain(events[0].detail.node.label);
  });
});
