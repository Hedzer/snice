/**
 * Matrix slice COLUMNS — column operations interleaved with the delivery
 * pipeline: applied while a remote request is still in flight, while `loading`
 * is set, between two deliveries, and when an earlier request is superseded.
 * These are the sequences behind "rows render blank/wrong until the user
 * interacts": the column layout changes at a moment when only one of the two
 * render paths (header vs body) is scheduled.
 *
 * it.fails policy (never weakened assertions): every assertion here is the
 * DOCUMENTED expectation and runs in every pipeline — no pipeline is exempt and
 * nothing in this file is expected to fail.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, expectCellsMatch, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, MODES, columnsFor, rowsFor, mutateRow,
  makeDelivered, redeliver, expectColumnOrder, expectNoBlankCells, collectPending,
} from './columns-support';

const KEYS = ['a', 'b', 'c', 'd'];
const SPECS = [
  { id: 'r1', values: { a: 'A1', b: 'B1', c: 'C1', d: 'D1' } },
  { id: 'r2', values: { a: 'A2', b: 'B2', c: 'C2', d: 'D2' } },
];

describe('columns matrix: column operations interleaved with delivery', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const pipeline of PIPELINES) {
    // ── remote-only: operations applied while the request is in flight ──

    it(`remote/${pipeline}: hiding a column mid-request paints the reduced set on arrival`, async () => {
      const cols = columnsFor(KEYS, pipeline);
      const rows = rowsFor(pipeline, SPECS);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      table.setColumnVisible('b', false);
      await wait(20);
      expect(pending.length).toBe(1);
      pending[0].resolve({ data: rows });
      await wait(60);

      expectColumnOrder(table, ['a', 'c', 'd']);
      expect(dataRows(table).length).toBe(rows.length);
    });

    it(`remote/${pipeline}: hiding a column mid-request renders every value on arrival`, async () => {
      const cols = columnsFor(KEYS, pipeline);
      const rows = rowsFor(pipeline, SPECS);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      table.setColumnVisible('b', false);
      await wait(20);
      pending[0].resolve({ data: rows });
      await wait(60);

      expectCellsMatch(table, rows, cols.filter(c => c.key !== 'b'));
      expectNoBlankCells(table);
    });

    it(`remote/${pipeline}: pinning a column mid-request paints it at the edge on arrival`, async () => {
      const cols = columnsFor(KEYS, pipeline);
      const rows = rowsFor(pipeline, SPECS);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      table.pinColumn('d', 'left');
      await wait(20);
      pending[0].resolve({ data: rows });
      await wait(60);

      expectColumnOrder(table, ['d', 'a', 'b', 'c']);
    });

    it(`remote/${pipeline}: pinning a column mid-request renders every value on arrival`, async () => {
      const cols = columnsFor(KEYS, pipeline);
      const rows = rowsFor(pipeline, SPECS);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      table.pinColumn('d', 'left');
      await wait(20);
      pending[0].resolve({ data: rows });
      await wait(60);

      expectCellsMatch(table, rows, cols);
      expectNoBlankCells(table);
    });

    it(`remote/${pipeline}: reordering mid-request paints the new order on arrival`, async () => {
      const cols = columnsFor(KEYS, pipeline);
      const rows = rowsFor(pipeline, SPECS);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      table.moveColumn('c', 0);
      await wait(20);
      pending[0].resolve({ data: rows });
      await wait(60);

      expectColumnOrder(table, ['c', 'a', 'b', 'd']);
    });

    it(`remote/${pipeline}: reordering mid-request renders every value on arrival`, async () => {
      const cols = columnsFor(KEYS, pipeline);
      const rows = rowsFor(pipeline, SPECS);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      table.moveColumn('c', 0);
      await wait(20);
      pending[0].resolve({ data: rows });
      await wait(60);

      expectCellsMatch(table, rows, cols);
      expectNoBlankCells(table);
    });

    it(`remote/${pipeline}: a column-set change mid-request renders the new columns on arrival`, async () => {
      const cols = columnsFor(['a', 'b'], pipeline);
      const rows = rowsFor(pipeline, SPECS);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      const next = columnsFor(['a', 'b', 'c'], pipeline);
      table.columns = next;
      await wait(30);
      pending[0].resolve({ data: rows });
      await wait(60);

      expectColumnOrder(table, ['a', 'b', 'c']);
      expectCellsMatch(table, rows, next);
      expectNoBlankCells(table);
    });

    it(`remote/${pipeline}: a superseded request does not undo a column operation`, async () => {
      const cols = columnsFor(KEYS, pipeline);
      const first = rowsFor(pipeline, SPECS);
      const second = rowsFor(pipeline, [
        { id: 's1', values: { a: 'S1', b: 'T1', c: 'U1', d: 'V1' } },
      ]);
      table = await makeTable({ columns: cols, remote: true });
      const pending = collectPending(table);

      table.getTableData();
      await wait(20);
      table.getTableData();     // supersedes the first request
      await wait(20);
      table.setColumnVisible('c', false);
      await wait(20);
      expect(pending.length).toBe(2);

      pending[1].resolve({ data: second });
      await wait(60);
      pending[0].resolve({ data: first });   // stale — must be ignored
      await wait(60);

      expectColumnOrder(table, ['a', 'b', 'd']);
      expectCellsMatch(table, second, cols.filter(c => c.key !== 'c'));
    });

    // ── both modes: operations around the loading flag and between deliveries ──

    for (const { remote, label } of MODES) {
      it(`${label}/${pipeline}: a column operation while loading survives the reload`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        table.loading = true;
        table.setColumnVisible('a', false);
        table.pinColumn('d', 'left');
        await wait(30);
        table.loading = false;
        await wait(40);

        expectColumnOrder(table, ['d', 'b', 'c']);
        expectCellsMatch(table, rows, cols.filter(c => c.key !== 'a'));
        expectNoBlankCells(table);
      });

      it(`${label}/${pipeline}: column operations between two deliveries hold across both`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        table.pinColumn('d', 'left');
        table.setColumnVisible('b', false);
        table.moveColumn('c', 0);
        await wait(30);
        expectColumnOrder(table, ['d', 'c', 'a']);

        const grown = [...rows, rowsFor(pipeline, [{ id: 'r9', values: { a: 'A9', b: 'B9', c: 'C9', d: 'D9' } }])[0]];
        await redeliver(table, remote, grown);
        expectColumnOrder(table, ['d', 'c', 'a']);
        expectCellsMatch(table, grown, cols.filter(c => c.key !== 'b'));

        const mutated = [mutateRow(pipeline, grown[0], 'd', 'D1x'), grown[1], grown[2]];
        await redeliver(table, remote, mutated);
        expectColumnOrder(table, ['d', 'c', 'a']);
        expectCellsMatch(table, mutated, cols.filter(c => c.key !== 'b'));
      });

      it(`${label}/${pipeline}: an empty delivery then a repopulating one keeps the column layout`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'left');
        table.setColumnVisible('a', false);
        await wait(30);

        await redeliver(table, remote, []);
        expect(dataRows(table).length).toBe(0);

        await redeliver(table, remote, rows);
        expectColumnOrder(table, ['c', 'b', 'd']);
        expectCellsMatch(table, rows, cols.filter(c => c.key !== 'a'));
        expectNoBlankCells(table);
      });
    }
  }
});
