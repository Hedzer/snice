// snice-grid matrix — placement geometry.
//
// The full cross of {gap} x {cell size} x {origin} against a four-item layout
// that exercises every span shape (1x1, 2x1, 1x2, 2x2) at once. 3 x 2 x 4 = 24
// combos, each asserting four boxes plus the container box.
//
// Everything asserted here is a documented formula (see grid-matrix-utils.ts):
// item box from columnWidth/rowHeight + spans + gap, position from the grid
// coordinate, and the opposite-edge measurement when `origin-left`/`origin-top`
// are false. No expectation in this file was read off the component.
import { describe, it, afterEach } from 'vitest';
import {
  makeGrid, cleanupGrid, stubHostBox, expectPlacements, expectContainer,
  type GridOptions, type ItemSpec, type MountedGrid, type Placement, wait,
} from './grid-matrix-utils';

/** px and rem are the two units the documented conversion covers. */
const GAPS = ['0px', '8px', '1rem'] as const;
const CELLS = [
  { columnWidth: 100, rowHeight: 100 },
  { columnWidth: 120, rowHeight: 60 },
] as const;
const ORIGINS = [
  { originLeft: true, originTop: true },
  { originLeft: false, originTop: true },
  { originLeft: true, originTop: false },
  { originLeft: false, originTop: false },
] as const;

/** A pinned host box, so the flipped-origin formula has real operands. */
const HOST = { width: 640, height: 480 };

/** Four items, disjoint, covering every span shape. */
const ITEMS: ItemSpec[] = [
  { name: 'a', col: 0, row: 0 },
  { name: 'b', col: 1, row: 0, colspan: 2 },
  { name: 'c', col: 0, row: 1, rowspan: 2 },
  { name: 'd', col: 1, row: 1, colspan: 2, rowspan: 2 },
];

const EXPECTED: Record<string, Placement> = {
  a: { col: 0, row: 0, colspan: 1, rowspan: 1 },
  b: { col: 1, row: 0, colspan: 2, rowspan: 1 },
  c: { col: 0, row: 1, colspan: 1, rowspan: 2 },
  d: { col: 1, row: 1, colspan: 2, rowspan: 2 },
};

let mounted: MountedGrid | undefined;
afterEach(() => { cleanupGrid(mounted); mounted = undefined; });

describe('grid matrix: placement geometry', () => {
  for (const gap of GAPS) {
    for (const cell of CELLS) {
      for (const origin of ORIGINS) {
        const opts: GridOptions = { gap, ...cell, ...origin };
        const id = `gap ${gap} / ${cell.columnWidth}x${cell.rowHeight}`
          + ` / origin ${origin.originLeft ? 'left' : 'right'}-${origin.originTop ? 'top' : 'bottom'}`;

        it(`${id}: every item lands on its documented box`, async () => {
          mounted = await makeGrid(opts, ITEMS);
          // The origin flips measure from the host's own content box, which
          // happy-dom reports as 0. Pin it, then re-layout against it.
          stubHostBox(mounted.grid, HOST.width, HOST.height);
          mounted.grid.layout();
          await wait(30);

          expectPlacements(mounted, opts, EXPECTED, HOST);
          expectContainer(mounted, opts, Object.values(EXPECTED));
        });
      }
    }
  }
});
