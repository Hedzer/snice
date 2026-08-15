/**
 * Matrix slice COLUMNS — resized columns, crossed with {local, remote}
 * delivery, the five value pipelines, and initial / re-delivery / mutated
 * re-delivery.
 *
 * Documented contract: `column-resize` enables the header resize handle;
 * dragging it emits `column-resize` per step and `column-resize-end` on
 * release, both `{key,width}`. `width`, `minWidth` and `maxWidth` on the column
 * definition bound the result, `resizable:false` disables the handle, and the
 * resulting width applies to the header cell and to every body cell of that
 * column — including rows delivered afterwards. A pinned column's sticky offset
 * is the running total of the widths of the pinned columns before it, so a
 * resize inside a pinned run must move the columns after it on that edge.
 * `autoSizeColumn(key)` / `autoSizeAllColumns()` are the other documented width
 * writers and measure the header cell AND every body cell, so whatever width
 * they settle on must land on both.
 *
 * it.fails policy (never weakened assertions): every assertion is the DOCUMENTED
 * expectation and runs in every pipeline — no pipeline is exempt.
 *   MATRIX-columns-5 (open) resizing a pinned column does not update the sticky
 *                    offsets of the pinned columns after it; a later body-only
 *                    re-render then leaves header and body disagreeing.
 *   MATRIX-columns-7 (fixed) autoSizeColumn()/autoSizeAllColumns() re-rendered
 *                    only the header, so the header cell took the new width
 *                    while every body cell of that column kept the old one —
 *                    the same header/body width disagreement as
 *                    MATRIX-columns-5, through a different entry point. Both
 *                    entry points now repaint the body with the measured width.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { expectCellsMatch, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, MODES, columnsFor, rowsFor, mutateRow,
  makeDelivered, redeliver, expectColumnOrder, expectNoBlankCells,
  resizeColumn, columnWidth, cellWidths, pinnedSides,
} from './columns-support';

const KEYS = ['a', 'b', 'c', 'd'];
const SPECS = [
  { id: 'r1', values: { a: 'A1', b: 'B1', c: 'C1', d: 'D1' } },
  { id: 'r2', values: { a: 'A2', b: 'B2', c: 'C2', d: 'D2' } },
];
const RESIZE_ATTRS = { 'column-resize': true };

describe('columns matrix: resized columns', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const { remote, label } of MODES) {
    for (const pipeline of PIPELINES) {
      const combo = `${label}/${pipeline}`;

      it(`${combo}: a resize gesture widens the header cell and every body cell`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });

        const steps: any[] = [];
        const ends: any[] = [];
        table.addEventListener('column-resize', (e: any) => steps.push(e.detail));
        table.addEventListener('column-resize-end', (e: any) => ends.push(e.detail));

        await resizeColumn(table, 'b', 60);

        expect(columnWidth(table, 'b')).toBe('210px');
        expect(cellWidths(table, 'b')).toEqual(['210px', '210px']);
        expect(steps).toEqual([{ key: 'b', width: 210 }]);
        expect(ends).toEqual([{ key: 'b', width: 210 }]);
        expectColumnOrder(table, KEYS);
      });

      it(`${combo}: a resize does not disturb any cell value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        await resizeColumn(table, 'b', 60);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: the resized width applies to rows delivered afterwards`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        await resizeColumn(table, 'c', 40);

        const grown = [...rows, rowsFor(pipeline, [{ id: 'r9', values: { a: 'A9', b: 'B9', c: 'C9', d: 'D9' } }])[0]];
        await redeliver(table, remote, grown);

        expect(dataRows(table).length).toBe(3);
        expect(columnWidth(table, 'c')).toBe('190px');
        expect(cellWidths(table, 'c')).toEqual(['190px', '190px', '190px']);
      });

      it(`${combo}: resize survives re-delivery of the same identities`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        await resizeColumn(table, 'a', 25);

        await redeliver(table, remote, [...rows]);
        expect(columnWidth(table, 'a')).toBe('175px');
        expect(cellWidths(table, 'a')).toEqual(['175px', '175px']);
        expectCellsMatch(table, rows, cols);
      });

      it(`${combo}: resize survives a mutated re-delivery`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        await resizeColumn(table, 'a', 25);

        const mutated = [mutateRow(pipeline, rows[0], 'a', 'A1x'), rows[1]];
        await redeliver(table, remote, mutated);

        expect(cellWidths(table, 'a')).toEqual(['175px', '175px']);
        expectCellsMatch(table, mutated, cols);
      });

      it(`${combo}: resize is clamped to minWidth / maxWidth`, async () => {
        const cols = columnsFor(KEYS, pipeline, { a: { minWidth: 120, maxWidth: 200 } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });

        await resizeColumn(table, 'a', 500);
        expect(columnWidth(table, 'a')).toBe('200px');
        expect(cellWidths(table, 'a')).toEqual(['200px', '200px']);

        await resizeColumn(table, 'a', -500);
        expect(columnWidth(table, 'a')).toBe('120px');
        expect(cellWidths(table, 'a')).toEqual(['120px', '120px']);
      });

      it(`${combo}: a resizable:false column has no resize handle`, async () => {
        const cols = columnsFor(KEYS, pipeline, { d: { resizable: false } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });

        const th = table.shadowRoot.querySelector('thead th[data-key="d"]');
        expect(th.querySelector('.resize-handle')).toBeNull();
        expect(columnWidth(table, 'd')).toBe('150px');
      });

      it(`${combo}: a declared width is applied to header and body cells`, async () => {
        const cols = columnsFor(KEYS, pipeline, { b: { width: '300' } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });

        expect(columnWidth(table, 'b')).toBe('300px');
        expect(cellWidths(table, 'b')).toEqual(['300px', '300px']);
      });

      it(`${combo}: resize combined with hide and pin keeps values aligned`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        table.pinColumn('d', 'left');
        table.setColumnVisible('b', false);
        await wait(30);
        await resizeColumn(table, 'd', 50);

        expectColumnOrder(table, ['d', 'a', 'c']);
        expect(cellWidths(table, 'd')).toEqual(['200px', '200px']);
        expectCellsMatch(table, rows, cols.filter(c => c.key !== 'b'));
      });

      // ── autoSizeColumn / autoSizeAllColumns ──

      // MATRIX-columns-7 (fixed): autoSizeColumn() used to call renderHeader()
      // only, so the measured width landed on the th and never on the tds.
      it(`${combo}: autoSizeColumn applies one width to header and body [MATRIX-columns-7]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });

        table.autoSizeColumn('b');
        await wait(30);

        const width = columnWidth(table, 'b');
        expect(cellWidths(table, 'b')).toEqual([width, width]);
      });

      // MATRIX-columns-7 (fixed), bulk entry point.
      it(`${combo}: autoSizeAllColumns applies one width per column to header and body [MATRIX-columns-7]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });

        table.autoSizeAllColumns();
        await wait(30);

        const disagreements = KEYS.filter(key =>
          cellWidths(table, key).some(w => w !== columnWidth(table, key)));
        expect(disagreements).toEqual([]);
      });

      it(`${combo}: autoSizeColumn leaves the painted column order and values alone`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });

        table.autoSizeColumn('b');
        table.autoSizeAllColumns();
        await wait(30);

        expectColumnOrder(table, KEYS);
        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table, rows.length);
      });

      // MATRIX-columns-5: resizing the first column of a pinned-left run must
      // push the sticky offset of the pinned columns after it.
      it.fails(`${combo}: resizing a pinned column updates the next pinned offset [MATRIX-columns-5]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        table.pinColumn('b', 'left');
        table.pinColumn('d', 'left');
        await wait(30);
        expectColumnOrder(table, ['b', 'd', 'a', 'c']);

        await resizeColumn(table, 'b', 100);
        expect(columnWidth(table, 'b')).toBe('250px');

        const { header, cell } = pinnedSides(table, 'd');
        expect({ header: header!.left, cell: cell!.left }).toEqual({ header: '250px', cell: '250px' });
      });

      // MATRIX-columns-5: after a body-only re-render the body picks up the new
      // offsets while the header keeps the stale ones.
      it.fails(`${combo}: pinned offsets agree between header and body after resize + re-delivery [MATRIX-columns-5]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        table.pinColumn('b', 'left');
        table.pinColumn('d', 'left');
        await wait(30);
        await resizeColumn(table, 'b', 100);
        await redeliver(table, remote, [...rows]);

        const { header, cell } = pinnedSides(table, 'd');
        expect({ header: header!.left, cell: cell!.left }).toEqual({ header: '250px', cell: '250px' });
      });

      // MATRIX-columns-5, right edge.
      it.fails(`${combo}: resizing a right-pinned column updates the offsets to its left [MATRIX-columns-5]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: RESIZE_ATTRS });
        table.pinColumn('c', 'right');
        table.pinColumn('d', 'right');
        await wait(30);

        await resizeColumn(table, 'd', 100);
        await redeliver(table, remote, [...rows]);

        const { header, cell } = pinnedSides(table, 'c');
        expect({ header: header!.right, cell: cell!.right }).toEqual({ header: '250px', cell: '250px' });
      });
    }
  }
});
