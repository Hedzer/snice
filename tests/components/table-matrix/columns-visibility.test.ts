/**
 * Matrix slice COLUMNS — hidden columns, crossed with {local, remote} delivery,
 * the five documented value pipelines, and initial / re-delivery / mutated
 * re-delivery.
 *
 * Documented contract: `setColumnVisible(key,visible)` sets visibility,
 * `showAllColumns()` / `hideAllColumns()` (hideable only) apply it in bulk,
 * `getColumnVisibility()` reads the model, and `column-visibility-change`
 * carries `{key,visible,visibility}`. A re-assigned `columns` array is the new
 * configuration, so a column it declares must be paintable again.
 *
 * it.fails policy (never weakened assertions): every assertion here is the
 * DOCUMENTED expectation, in every pipeline — no pipeline is exempt.
 *   MATRIX-columns-6 (fixed) a column hidden with setColumnVisible() stayed hidden
 *                    forever, even after the configuration re-declares it. Same
 *                    family as MATRIX-columns-2/3/4 (stale column state wins
 *                    over the new declared configuration).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { expectCellsMatch, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, MODES, columnsFor, rowsFor, mutateRow,
  makeDelivered, redeliver, expectColumnOrder, expectNoBlankCells, headerKeys,
  collectEvents,
} from './columns-support';

const KEYS = ['a', 'b', 'c', 'd'];
const SPECS = [
  { id: 'r1', values: { a: 'A1', b: 'B1', c: 'C1', d: 'D1' } },
  { id: 'r2', values: { a: 'A2', b: 'B2', c: 'C2', d: 'D2' } },
  { id: 'r3', values: { a: 'A3', b: 'B3', c: 'C3', d: 'D3' } },
];

describe('columns matrix: hidden columns', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const { remote, label } of MODES) {
    for (const pipeline of PIPELINES) {
      const combo = `${label}/${pipeline}`;
      const only = (keys: string[], cols: any[]) => cols.filter(c => keys.includes(c.key));

      it(`${combo}: hiding a column after delivery removes exactly that column`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expectColumnOrder(table, KEYS);

        table.setColumnVisible('b', false);
        await wait(30);

        expectColumnOrder(table, ['a', 'c', 'd']);
        expect(table.getColumnVisibility()).toEqual({ a: true, b: false, c: true, d: true });
        expect(dataRows(table).length).toBe(rows.length);
      });

      it(`${combo}: remaining cells keep their own values after hiding`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('b', false);
        await wait(30);

        expectCellsMatch(table, rows, only(['a', 'c', 'd'], cols));
        expectNoBlankCells(table);
      });

      it(`${combo}: hiding before delivery paints the reduced column set`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows: [], remote });
        table.setColumnVisible('c', false);
        await wait(20);
        await redeliver(table, remote, rows);

        expectColumnOrder(table, ['a', 'b', 'd']);
        expect(dataRows(table).length).toBe(rows.length);
      });

      it(`${combo}: hiding before delivery still renders every value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows: [], remote });
        table.setColumnVisible('c', false);
        await wait(20);
        await redeliver(table, remote, rows);

        expectCellsMatch(table, rows, only(['a', 'b', 'd'], cols));
        expectNoBlankCells(table);
      });

      it(`${combo}: hidden column survives re-delivery of the same identities`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('d', false);
        await wait(30);

        await redeliver(table, remote, [...rows]);
        expectColumnOrder(table, ['a', 'b', 'c']);
        expectCellsMatch(table, rows, only(['a', 'b', 'c'], cols));
      });

      it(`${combo}: hidden column survives a mutated re-delivery`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('d', false);
        await wait(30);

        const mutated = [mutateRow(pipeline, rows[0], 'a', 'A1x'), rows[1], rows[2]];
        await redeliver(table, remote, mutated);

        expectColumnOrder(table, ['a', 'b', 'c']);
        expectCellsMatch(table, mutated, only(['a', 'b', 'c'], cols));
      });

      it(`${combo}: re-showing a hidden column restores its values`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('a', false);
        table.setColumnVisible('c', false);
        await wait(30);
        expectColumnOrder(table, ['b', 'd']);

        table.setColumnVisible('c', true);
        await wait(30);
        expectColumnOrder(table, ['b', 'c', 'd']);
        expectCellsMatch(table, rows, only(['b', 'c', 'd'], cols));
      });

      it(`${combo}: hideAllColumns leaves the row set intact and showAll restores it`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        table.hideAllColumns();
        await wait(30);
        expect(headerKeys(table)).toEqual([]);
        expect(dataRows(table).length).toBe(rows.length);
        expect(table.getColumnVisibility()).toEqual({ a: false, b: false, c: false, d: false });

        table.showAllColumns();
        await wait(30);
        expectColumnOrder(table, KEYS);
        expect(table.getColumnVisibility()).toEqual({ a: true, b: true, c: true, d: true });
        expectNoBlankCells(table, rows.length);
      });

      it(`${combo}: showAllColumns re-renders every value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.hideAllColumns();
        await wait(30);
        table.showAllColumns();
        await wait(30);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: setColumnVisible emits column-visibility-change with the whole model`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        const seen = collectEvents(table, 'column-visibility-change');

        table.setColumnVisible('b', false);
        await wait(30);
        table.setColumnVisible('b', true);
        await wait(30);

        expect(seen).toEqual([
          { key: 'b', visible: false, visibility: { a: true, b: false, c: true, d: true } },
          { key: 'b', visible: true, visibility: { a: true, b: true, c: true, d: true } },
        ]);
        expectColumnOrder(table, KEYS);
      });

      it(`${combo}: a re-delivery after hiding emits no further visibility events`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('c', false);
        await wait(30);

        const seen = collectEvents(table, 'column-visibility-change');
        await redeliver(table, remote, [...rows]);

        expect(seen).toEqual([]);
        expectColumnOrder(table, ['a', 'b', 'd']);
        expectNoBlankCells(table, rows.length);
      });

      // MATRIX-columns-6 (fixed): `visible: existing?.visible ?? true` in
      // TableColumnManager.initialize() plus states that were never dropped
      // meant a hidden column could never be brought back by a new
      // configuration array — the same stale-state family as
      // MATRIX-columns-2/3/4. An assignment to `columns` now re-applies the
      // declaration wholesale (applyConfiguration), so a re-declared column is
      // visible again.
      it(`${combo}: a re-declared column is visible again [MATRIX-columns-6]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.setColumnVisible('b', false);
        await wait(30);
        expectColumnOrder(table, ['a', 'c', 'd']);

        table.columns = columnsFor(['a', 'c', 'd'], pipeline);
        await wait(60);
        table.columns = columnsFor(KEYS, pipeline);
        await wait(60);

        expectColumnOrder(table, KEYS);
        expect(table.getColumnVisibility()).toEqual({ a: true, b: true, c: true, d: true });
      });

      it(`${combo}: hideable:false column is never hidden`, async () => {
        const cols = columnsFor(KEYS, pipeline, { a: { hideable: false } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        table.setColumnVisible('a', false);
        await wait(30);
        expectColumnOrder(table, KEYS);

        table.hideAllColumns();
        await wait(30);
        expectColumnOrder(table, ['a']);
      });
    }
  }
});
