/**
 * snice-grid matrix — the public API and layout persistence.
 *
 * Documented surface:
 *   · `getLayout()` — "Returns `GridLayout` (Record<string, GridLayoutEntry>)
 *     with positions/spans/order";
 *   · `setLayout(layout)` — "Apply saved layout (reorder, reposition,
 *     hide/show)";
 *   · `fit(element, col?, row?)`, `layout()`, `reloadItems()`,
 *     `getItemElements()`;
 *   · item attributes `grid-col`/`grid-row`/`grid-colspan`/`grid-rowspan`,
 *     `name` ("identifier for getLayout/setLayout persistence") and `hidden`
 *     ("hides item from layout").
 *
 * 26 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  cleanupGrid, expectPlacements, makeGrid, wait,
  type GridOptions, type ItemSpec, type MountedGrid,
} from './grid-matrix-utils';

const BASE: GridOptions = { columnWidth: 100, rowHeight: 100, gap: '10px' };

const THREE: ItemSpec[] = [
  { name: 'a', col: 0, row: 0 },
  { name: 'b', col: 1, row: 0 },
  { name: 'c', col: 0, row: 1, colspan: 2 },
];

let mounted: MountedGrid | undefined;
afterEach(() => { cleanupGrid(mounted); mounted = undefined; });

describe('grid matrix: getLayout', () => {
  it('reports every named item with its resolved position, spans and order', async () => {
    mounted = await makeGrid(BASE, THREE);
    expect(mounted.grid.getLayout()).toEqual({
      a: { col: 0, row: 0, colspan: 1, rowspan: 1, order: 0 },
      b: { col: 1, row: 0, colspan: 1, rowspan: 1, order: 1 },
      c: { col: 0, row: 1, colspan: 2, rowspan: 1, order: 2 },
    });
  });

  it('reports the position the resolver settled on, not the authored one', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 0, row: 0 },
    ]);
    const layout = mounted.grid.getLayout();
    expect(layout.a).toMatchObject({ col: 0, row: 0 });
    expect(layout.b, 'the pushed item still reports its authored cell')
      .toMatchObject({ col: 1, row: 0 });
  });

  it('marks hidden items', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0 },
      { name: 'ghost', col: 1, row: 0, hidden: true },
    ]);
    const layout = mounted.grid.getLayout();
    expect(layout.ghost.hidden).toBe(true);
    expect(layout.a.hidden).toBeUndefined();
  });

  it('leaves unnamed items out — `name` is the persistence identifier', async () => {
    mounted = await makeGrid(BASE, THREE);
    const nameless = document.createElement('div');
    nameless.setAttribute('grid-col', '3');
    nameless.setAttribute('grid-row', '0');
    mounted.grid.appendChild(nameless);
    mounted.grid.reloadItems();
    await wait(30);

    expect(Object.keys(mounted.grid.getLayout())).toEqual(['a', 'b', 'c']);
    expect(mounted.grid.getItemElements()).toHaveLength(4);
  });
});

describe('grid matrix: setLayout', () => {
  it('repositions items to the saved coordinates', async () => {
    mounted = await makeGrid(BASE, THREE);
    mounted.grid.setLayout({
      a: { col: 2, row: 1, colspan: 1, rowspan: 1, order: 0 },
      b: { col: 0, row: 0, colspan: 1, rowspan: 1, order: 1 },
      c: { col: 0, row: 1, colspan: 2, rowspan: 1, order: 2 },
    });
    await wait(40);
    expectPlacements(mounted, BASE, {
      a: { col: 2, row: 1 },
      b: { col: 0, row: 0 },
      c: { col: 0, row: 1, colspan: 2 },
    });
  });

  it('applies saved spans', async () => {
    mounted = await makeGrid(BASE, THREE);
    mounted.grid.setLayout({
      a: { col: 0, row: 0, colspan: 2, rowspan: 2, order: 0 },
      b: { col: 2, row: 0, colspan: 1, rowspan: 1, order: 1 },
      c: { col: 2, row: 1, colspan: 1, rowspan: 1, order: 2 },
    });
    await wait(40);
    expectPlacements(mounted, BASE, {
      a: { col: 0, row: 0, colspan: 2, rowspan: 2 },
      b: { col: 2, row: 0 },
      c: { col: 2, row: 1 },
    });
  });

  it('reorders the items into the saved order', async () => {
    mounted = await makeGrid(BASE, THREE);
    mounted.grid.setLayout({
      c: { col: 0, row: 0, colspan: 2, rowspan: 1, order: 0 },
      b: { col: 2, row: 0, colspan: 1, rowspan: 1, order: 1 },
      a: { col: 0, row: 1, colspan: 1, rowspan: 1, order: 2 },
    });
    await wait(40);
    expect(mounted.order()).toEqual(['c', 'b', 'a']);
    expect(mounted.grid.getLayout().c.order).toBe(0);
  });

  it('hides and shows items', async () => {
    mounted = await makeGrid(BASE, THREE);
    mounted.grid.setLayout({
      a: { col: 0, row: 0, colspan: 1, rowspan: 1, order: 0, hidden: true },
      b: { col: 1, row: 0, colspan: 1, rowspan: 1, order: 1 },
      c: { col: 0, row: 1, colspan: 2, rowspan: 1, order: 2 },
    });
    await wait(40);
    expect(mounted.item('a').hasAttribute('hidden')).toBe(true);
    // "hides item from layout": the cell it held is free again, so another item
    // can take it without colliding.
    mounted.grid.fit(mounted.item('b'), 0, 0);
    await wait(30);
    expectPlacements(mounted, BASE, { b: { col: 0, row: 0 } });

    mounted.grid.setLayout({
      a: { col: 0, row: 0, colspan: 1, rowspan: 1, order: 0 },
      b: { col: 1, row: 0, colspan: 1, rowspan: 1, order: 1 },
      c: { col: 0, row: 1, colspan: 2, rowspan: 1, order: 2 },
    });
    await wait(40);
    expect(mounted.item('a').hasAttribute('hidden')).toBe(false);
    expectPlacements(mounted, BASE, { a: { col: 0, row: 0 } });
  });

  it('a getLayout/setLayout round trip is a no-op', async () => {
    mounted = await makeGrid(BASE, THREE);
    const saved = mounted.grid.getLayout();
    const before = mounted.items().map(item => item.style.transform);
    mounted.grid.setLayout(saved);
    await wait(40);
    expect(mounted.grid.getLayout()).toEqual(saved);
    expect(mounted.items().map(item => item.style.transform)).toEqual(before);
  });

  it('items missing from the saved layout are kept, shown, and placed last', async () => {
    mounted = await makeGrid(BASE, THREE);
    mounted.grid.setLayout({
      c: { col: 0, row: 0, colspan: 2, rowspan: 1, order: 0 },
    });
    await wait(40);
    expect(mounted.order().slice(0, 1)).toEqual(['c']);
    expect(mounted.order()).toHaveLength(3);
    expect(mounted.grid.getItemElements()).toHaveLength(3);
  });

  it('entries naming items that are not there are ignored', async () => {
    mounted = await makeGrid(BASE, THREE);
    mounted.grid.setLayout({
      a: { col: 0, row: 0, colspan: 1, rowspan: 1, order: 0 },
      gone: { col: 5, row: 5, colspan: 1, rowspan: 1, order: 1 },
      b: { col: 1, row: 0, colspan: 1, rowspan: 1, order: 2 },
      c: { col: 0, row: 1, colspan: 2, rowspan: 1, order: 3 },
    });
    await wait(40);
    expect(Object.keys(mounted.grid.getLayout())).toEqual(['a', 'b', 'c']);
  });
});

describe('grid matrix: fit, layout, reloadItems', () => {
  for (const target of [{ col: 2, row: 0 }, { col: 0, row: 2 }, { col: 3, row: 3 }]) {
    it(`fit() moves an item to (${target.col},${target.row}) and writes its attributes`, async () => {
      mounted = await makeGrid(BASE, THREE);
      mounted.grid.fit(mounted.item('a'), target.col, target.row);
      await wait(30);
      expectPlacements(mounted, BASE, { a: target });
      expect(mounted.item('a').getAttribute('grid-col')).toBe(String(target.col));
      expect(mounted.item('a').getAttribute('grid-row')).toBe(String(target.row));
    });
  }

  it('fit() without coordinates re-flows without moving the item', async () => {
    mounted = await makeGrid(BASE, THREE);
    const before = mounted.item('a').style.transform;
    mounted.grid.fit(mounted.item('a'));
    await wait(30);
    expect(mounted.item('a').style.transform).toBe(before);
  });

  it('fit() ignores an element that is not in the grid', async () => {
    mounted = await makeGrid(BASE, THREE);
    const stranger = document.createElement('div');
    document.body.appendChild(stranger);
    mounted.grid.fit(stranger, 0, 0);
    await wait(30);
    expect(stranger.style.transform).toBe('');
    expectPlacements(mounted, BASE, { a: { col: 0, row: 0 } });
    stranger.remove();
  });

  it('reloadItems() picks up items appended after mount', async () => {
    mounted = await makeGrid(BASE, THREE);
    const extra = document.createElement('div');
    extra.setAttribute('name', 'd');
    extra.setAttribute('grid-col', '2');
    extra.setAttribute('grid-row', '0');
    mounted.grid.appendChild(extra);
    mounted.grid.reloadItems();
    await wait(40);

    expect(mounted.grid.getItemElements()).toHaveLength(4);
    expectPlacements(mounted, BASE, { d: { col: 2, row: 0 } });
  });

  it('getItemElements() hands back a copy of the item list', async () => {
    mounted = await makeGrid(BASE, THREE);
    const taken = mounted.grid.getItemElements();
    taken.length = 0;
    expect(mounted.grid.getItemElements()).toHaveLength(3);
  });

  it('layout() re-runs the placement without changing it', async () => {
    mounted = await makeGrid(BASE, THREE);
    const before = mounted.items().map(item => item.style.transform);
    mounted.grid.layout();
    await wait(30);
    expect(mounted.items().map(item => item.style.transform)).toEqual(before);
  });

  for (const property of ['columnWidth', 'rowHeight', 'gap', 'columns'] as const) {
    it(`changing ${property} re-lays the grid out`, async () => {
      mounted = await makeGrid(BASE, THREE);
      const next: GridOptions = { ...BASE };
      if (property === 'columnWidth') next.columnWidth = 50;
      if (property === 'rowHeight') next.rowHeight = 40;
      if (property === 'gap') next.gap = '20px';
      if (property === 'columns') next.columns = 2;
      (mounted.grid as any)[property] = (next as any)[property];
      await wait(60);

      expectPlacements(mounted, next, {
        a: { col: 0, row: 0 },
        b: { col: 1, row: 0 },
        c: { col: 0, row: 1, colspan: 2 },
      });
    });
  }
});
