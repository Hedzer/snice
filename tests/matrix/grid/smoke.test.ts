/**
 * Smoke slice of the snice-grid matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/grid) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file samples one
 * combo per feature family:
 *   · geometry   — an item's box and offset come from columnWidth/rowHeight/gap;
 *   · spans      — a spanning item covers its cells AND the gaps between them;
 *   · container  — the container is the occupied extent, or the fixed count;
 *   · collision  — a single occupant swaps with the incoming item;
 *   · clamping   — `col + colspan > columns` clamps to `columns - colspan`;
 *   · persistence— a getLayout/setLayout round trip restores the layout;
 *   · structure  — part `base` with `role="list"`, and `grid-layout-complete`.
 *
 * Every assertion routes through the matrix oracle (`expectPlacements` /
 * `expectContainer` in matrix/grid/grid-matrix-utils.ts).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  cleanupGrid, expectContainer, expectPlacements, makeGrid, wait,
  type GridOptions, type MountedGrid,
} from './grid-matrix-utils';

const BASE: GridOptions = { columnWidth: 100, rowHeight: 100, gap: '10px' };

let mounted: MountedGrid | undefined;
afterEach(() => { cleanupGrid(mounted); mounted = undefined; });

describe('grid matrix smoke', () => {
  it('geometry: items land on their documented boxes', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 1, row: 0 },
      { name: 'c', col: 0, row: 1 },
    ]);
    expectPlacements(mounted, BASE, {
      a: { col: 0, row: 0 },
      b: { col: 1, row: 0 },
      c: { col: 0, row: 1 },
    });
  });

  it('spans: a 2x2 item covers its cells and the gaps between them', async () => {
    mounted = await makeGrid(BASE, [{ name: 'big', col: 0, row: 0, colspan: 2, rowspan: 2 }]);
    expectPlacements(mounted, BASE, { big: { col: 0, row: 0, colspan: 2, rowspan: 2 } });
    expect(mounted.item('big').style.width).toBe('210px');
    expect(mounted.item('big').style.height).toBe('210px');
  });

  it('container: sized to the fixed column/row count when one is given', async () => {
    const opts: GridOptions = { ...BASE, columns: 3, rows: 2 };
    mounted = await makeGrid(opts, [{ name: 'a', col: 0, row: 0 }]);
    expectContainer(mounted, opts, [{ col: 0, row: 0 }]);
  });

  it('collision: a single occupant swaps with the incoming item', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 1, row: 0 },
    ]);
    mounted.grid.fit(mounted.item('a'), 1, 0);
    await wait(30);
    expectPlacements(mounted, BASE, { a: { col: 1, row: 0 }, b: { col: 0, row: 0 } });
  });

  it('clamping: col + colspan > columns clamps to columns - colspan', async () => {
    const opts: GridOptions = { ...BASE, columns: 3 };
    mounted = await makeGrid(opts, [{ name: 'a', col: 2, row: 0, colspan: 2 }]);
    expectPlacements(mounted, opts, { a: { col: 1, row: 0, colspan: 2 } });
  });

  it('persistence: a getLayout/setLayout round trip restores the layout', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 1, row: 0 },
    ]);
    const saved = mounted.grid.getLayout();
    mounted.grid.setLayout({
      b: { col: 0, row: 0, colspan: 1, rowspan: 1, order: 0 },
      a: { col: 1, row: 0, colspan: 1, rowspan: 1, order: 1 },
    });
    await wait(40);
    expect(mounted.order()).toEqual(['b', 'a']);

    mounted.grid.setLayout(saved);
    await wait(40);
    expect(mounted.grid.getLayout()).toEqual(saved);
    expectPlacements(mounted, BASE, { a: { col: 0, row: 0 }, b: { col: 1, row: 0 } });
  });

  it('structure: part="base" is a role="list", and layouts are reported', async () => {
    mounted = await makeGrid(BASE, [{ name: 'a', col: 0, row: 0 }]);
    const container = mounted.grid.shadowRoot.querySelector('[part~="base"]');
    expect(container.getAttribute('role')).toBe('list');

    const seen: any[] = [];
    mounted.grid.addEventListener('grid-layout-complete', (event: any) => seen.push(event.detail));
    mounted.grid.layout();
    await wait(30);
    expect(seen[0].items).toHaveLength(1);
  });
});
