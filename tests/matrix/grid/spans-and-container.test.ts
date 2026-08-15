// snice-grid matrix — spanning and container sizing.
//
// Two documented claims, crossed:
//
//   * "Items sized automatically from columnWidth/rowHeight + colspan/rowspan"
//     — the full 3x3 cross of colspan x rowspan, so a span that forgets to add
//     the interior gaps (or multiplies the wrong axis) is caught.
//   * "columns / rows — fixed column/row count (0 = auto)" — the container is
//     sized to the fixed count when one is given, and to the occupied extent
//     when it is 0.
import { describe, it, expect, afterEach } from 'vitest';
import {
  makeGrid, cleanupGrid, expectPlacements, expectContainer, expectedContainerSize,
  container, type GridOptions, type MountedGrid, type Placement,
} from './grid-matrix-utils';

const SPANS = [1, 2, 3];
const BASE: GridOptions = { columnWidth: 100, rowHeight: 50, gap: '10px' };

let mounted: MountedGrid | undefined;
afterEach(() => { cleanupGrid(mounted); mounted = undefined; });

describe('grid matrix: spans', () => {
  for (const colspan of SPANS) {
    for (const rowspan of SPANS) {
      it(`colspan ${colspan} x rowspan ${rowspan}: box spans the cells and the gaps between them`, async () => {
        mounted = await makeGrid(BASE, [{ name: 'a', col: 0, row: 0, colspan, rowspan }]);
        const expected: Record<string, Placement> = { a: { col: 0, row: 0, colspan, rowspan } };
        expectPlacements(mounted, BASE, expected);
        // A spanning item defines the occupied extent, so the container is
        // exactly the item's own box when it is the only one.
        expectContainer(mounted, BASE, Object.values(expected));
      });
    }
  }
});

describe('grid matrix: container sizing', () => {
  for (const columns of [0, 2, 4]) {
    for (const rows of [0, 3]) {
      it(`columns=${columns} rows=${rows}: container is the fixed count, or the occupied extent at 0`, async () => {
        const opts: GridOptions = { ...BASE, columns, rows };
        // Two 1x1 items in row 0 occupy 2 columns and 1 row, and fit inside
        // every fixed column count under test, so nothing is clamped here.
        mounted = await makeGrid(opts, [
          { name: 'a', col: 0, row: 0 },
          { name: 'b', col: 1, row: 0 },
        ]);
        const expected: Record<string, Placement> = {
          a: { col: 0, row: 0 },
          b: { col: 1, row: 0 },
        };
        expectPlacements(mounted, opts, expected);
        expectContainer(mounted, opts, Object.values(expected));

        // Spelled out, so the helper cannot be silently wrong in both places:
        // 2 columns of 100px with one 10px gap is 210px; 4 is 430px; the auto
        // extent is the 2 occupied columns. Rows: 3 x 50 + 2 x 10 = 170px, auto
        // is the single occupied row at 50px.
        const want = expectedContainerSize(opts, Object.values(expected));
        expect(want.width).toBe(columns === 0 ? '210px' : columns === 2 ? '210px' : '430px');
        expect(want.height).toBe(rows === 0 ? '50px' : '170px');
        expect(container(mounted).style.width).toBe(want.width);
        expect(container(mounted).style.height).toBe(want.height);
      });
    }
  }
});
