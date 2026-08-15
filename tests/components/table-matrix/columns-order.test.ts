/**
 * Matrix slice COLUMNS — reordered columns (`moveColumn(key, toIndex)`),
 * crossed with {local, remote} delivery, the five value pipelines, and
 * initial / re-delivery / mutated re-delivery.
 *
 * Documented contract: `moveColumn(key,index)` moves one column to a display
 * index (indices count painted columns), emits `column-order-change`, and a
 * `reorderable:false` or pinned column has a fixed position. Columns other than
 * the moved one keep their relative order, and every cell stays under its own
 * key in both header and body. The `column-reorder` attribute additionally makes
 * header cells drag sources; a drop emits `column-reorder` -> `{fromKey,toKey}`
 * and lands the dragged column at the drop target's painted index.
 *
 * it.fails policy (never weakened assertions): every assertion here is the
 * DOCUMENTED expectation and runs in every pipeline — no pipeline is exempt and
 * nothing in this file is expected to fail.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { expectCellsMatch, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, MODES, columnsFor, rowsFor, mutateRow,
  makeDelivered, redeliver, expectColumnOrder, expectNoBlankCells,
  collectEvents, dragColumnOnto, headerDraggable,
} from './columns-support';

const KEYS = ['a', 'b', 'c', 'd'];
const SPECS = [
  { id: 'r1', values: { a: 'A1', b: 'B1', c: 'C1', d: 'D1' } },
  { id: 'r2', values: { a: 'A2', b: 'B2', c: 'C2', d: 'D2' } },
];

describe('columns matrix: reordered columns', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const { remote, label } of MODES) {
    for (const pipeline of PIPELINES) {
      const combo = `${label}/${pipeline}`;

      it(`${combo}: moveColumn to index 0 repaints header and body together`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const seen: any[] = [];
        table.addEventListener('column-order-change', (e: any) => seen.push(e.detail));
        table.moveColumn('d', 0);
        await wait(30);

        expectColumnOrder(table, ['d', 'a', 'b', 'c']);
        expect(seen).toEqual([{ key: 'd', toIndex: 0 }]);
        expect(dataRows(table).length).toBe(rows.length);
      });

      it(`${combo}: values follow their column after moveColumn to 0`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('d', 0);
        await wait(30);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: moveColumn to the last index keeps the others in declared order`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('a', 3);
        await wait(30);

        expectColumnOrder(table, ['b', 'c', 'd', 'a']);
      });

      it(`${combo}: values follow their column after moveColumn to the end`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('a', 3);
        await wait(30);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: a second moveColumn composes with the first`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('d', 0);
        await wait(20);
        table.moveColumn('a', 3);
        await wait(20);

        expectColumnOrder(table, ['d', 'b', 'c', 'a']);
      });

      it(`${combo}: two moves keep every value on its own column`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('d', 0);
        await wait(20);
        table.moveColumn('a', 3);
        await wait(20);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: reordering before delivery survives the first render`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows: [], remote });
        table.moveColumn('c', 0);
        await wait(20);
        await redeliver(table, remote, rows);

        expectColumnOrder(table, ['c', 'a', 'b', 'd']);
        expect(dataRows(table).length).toBe(rows.length);
      });

      it(`${combo}: reordering before delivery renders every value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows: [], remote });
        table.moveColumn('c', 0);
        await wait(20);
        await redeliver(table, remote, rows);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: column order survives re-delivery of the same identities`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('d', 0);
        await wait(30);

        await redeliver(table, remote, [...rows]);
        expectColumnOrder(table, ['d', 'a', 'b', 'c']);
        expectCellsMatch(table, rows, cols);
      });

      it(`${combo}: column order survives a mutated re-delivery`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('d', 0);
        await wait(30);

        const mutated = [mutateRow(pipeline, rows[0], 'd', 'D1x'), rows[1]];
        await redeliver(table, remote, mutated);

        expectColumnOrder(table, ['d', 'a', 'b', 'c']);
        expectCellsMatch(table, mutated, cols);
      });

      it(`${combo}: column order survives a re-delivery that adds a row`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('b', 0);
        await wait(30);

        const grown = [...rows, rowsFor(pipeline, [{ id: 'r9', values: { a: 'A9', b: 'B9', c: 'C9', d: 'D9' } }])[0]];
        await redeliver(table, remote, grown);

        expectColumnOrder(table, ['b', 'a', 'c', 'd']);
        expectCellsMatch(table, grown, cols);
      });

      it(`${combo}: reordering with a hidden column only moves painted columns`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('b', false);
        await wait(20);
        table.moveColumn('d', 0);
        await wait(20);

        expectColumnOrder(table, ['d', 'a', 'c']);
      });

      it(`${combo}: reordering with a hidden column keeps the painted values`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('b', false);
        await wait(20);
        table.moveColumn('d', 0);
        await wait(20);

        expectCellsMatch(table, rows, cols.filter(c => c.key !== 'b'));
        expectNoBlankCells(table);
      });

      it(`${combo}: unhiding after a reorder paints each column exactly once`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('b', false);
        await wait(20);
        table.moveColumn('d', 0);
        await wait(20);
        table.setColumnVisible('b', true);
        await wait(20);

        // d was moved to the front; a, b, c keep their declared relative order.
        expectColumnOrder(table, ['d', 'a', 'b', 'c']);
      });

      it(`${combo}: a pinned column ignores moveColumn`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('a', 'left');
        await wait(20);
        table.moveColumn('a', 3);
        await wait(20);

        expectColumnOrder(table, KEYS);
      });

      it(`${combo}: a reorderable:false column ignores moveColumn`, async () => {
        const cols = columnsFor(KEYS, pipeline, { c: { reorderable: false } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.moveColumn('c', 0);
        await wait(20);

        expectColumnOrder(table, KEYS);
      });

      // ── DnD reorder (`column-reorder` attribute + event) ──

      it(`${combo}: column-reorder makes header cells drag sources`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expect(KEYS.map(k => headerDraggable(table, k))).toEqual([false, false, false, false]);

        removeComponent(table);
        table = await makeDelivered({
          columns: columnsFor(KEYS, pipeline), rows, remote,
          attrs: { 'column-reorder': true },
        });
        expect(KEYS.map(k => headerDraggable(table, k))).toEqual([true, true, true, true]);
      });

      it(`${combo}: dropping a header onto another emits column-reorder and repaints`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({
          columns: cols, rows, remote, attrs: { 'column-reorder': true },
        });
        const seen = collectEvents(table, 'column-reorder');

        await dragColumnOnto(table, 'd', 'a');

        expect(seen).toEqual([{ fromKey: 'd', toKey: 'a' }]);
        expectColumnOrder(table, ['d', 'a', 'b', 'c']);
        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table, rows.length);
      });

      it(`${combo}: dropping onto a later header moves the column to that index`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({
          columns: cols, rows, remote, attrs: { 'column-reorder': true },
        });

        await dragColumnOnto(table, 'a', 'd');

        expectColumnOrder(table, ['b', 'c', 'd', 'a']);
        expectCellsMatch(table, rows, cols);
      });

      it(`${combo}: a DnD reorder survives a re-delivery`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({
          columns: cols, rows, remote, attrs: { 'column-reorder': true },
        });
        await dragColumnOnto(table, 'c', 'a');
        expectColumnOrder(table, ['c', 'a', 'b', 'd']);

        const mutated = [mutateRow(pipeline, rows[0], 'c', 'C1x'), rows[1]];
        await redeliver(table, remote, mutated);

        expectColumnOrder(table, ['c', 'a', 'b', 'd']);
        expectCellsMatch(table, mutated, cols);
      });

      it(`${combo}: a pinned or reorderable:false header is not a drag source`, async () => {
        const cols = columnsFor(KEYS, pipeline, { b: { reorderable: false } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({
          columns: cols, rows, remote, attrs: { 'column-reorder': true },
        });
        table.pinColumn('c', 'left');
        await wait(30);

        expect({
          a: headerDraggable(table, 'a'),
          b: headerDraggable(table, 'b'),
          c: headerDraggable(table, 'c'),
        }).toEqual({ a: true, b: false, c: false });
      });

      it(`${combo}: reorder + pin + hide together keep every value aligned`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('d', 'left');
        table.setColumnVisible('b', false);
        table.moveColumn('c', 0);
        await wait(30);

        expectColumnOrder(table, ['d', 'c', 'a']);
        expectCellsMatch(table, rows, cols.filter(c => c.key !== 'b'));
        expectNoBlankCells(table);
      });
    }
  }
});
