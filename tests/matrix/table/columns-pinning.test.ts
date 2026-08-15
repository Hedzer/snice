/**
 * Matrix slice COLUMNS — pinned columns (left / right / both), crossed with
 * {local, remote} delivery, the five value pipelines, and initial /
 * re-delivery / mutated re-delivery.
 *
 * Documented contract used here: `pinned?: 'left'|'right'|false` on the column
 * definition, `pinColumn(key, side)` / `unpinColumn(key)`, and `pinnable`.
 * Pinned columns are partitioned to their physical edges — left-pinned first,
 * then unpinned, then right-pinned — while their declared relative order is
 * preserved, and the sticky offset of each pinned column is the running total
 * of the widths of the pinned columns before it on that edge. Pinning also
 * emits `column-pin-change` -> `{key,pinned}`.
 *
 * it.fails policy (never weakened assertions): every assertion here is the
 * DOCUMENTED expectation and runs in every pipeline — no pipeline is exempt and
 * nothing in this file is expected to fail.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { expectCellsMatch, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, MODES, columnsFor, rowsFor, mutateRow,
  makeDelivered, redeliver, expectColumnOrder, expectNoBlankCells, pinnedSides,
  collectEvents,
} from './columns-support';

const KEYS = ['a', 'b', 'c', 'd'];
const SPECS = [
  { id: 'r1', values: { a: 'A1', b: 'B1', c: 'C1', d: 'D1' } },
  { id: 'r2', values: { a: 'A2', b: 'B2', c: 'C2', d: 'D2' } },
];

/** Header and every body cell of a pinned column must carry the same sticky
 * placement — a disagreement is a visibly misaligned column. */
function expectSticky(table: any, key: string, side: 'left' | 'right', offset: string) {
  const { header, cell } = pinnedSides(table, key);
  expect({ key, ...header }).toEqual({ key, position: 'sticky', left: side === 'left' ? offset : '', right: side === 'right' ? offset : '' });
  expect({ key, ...cell }).toEqual({ key, position: 'sticky', left: side === 'left' ? offset : '', right: side === 'right' ? offset : '' });
}

describe('columns matrix: pinned columns', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const { remote, label } of MODES) {
    for (const pipeline of PIPELINES) {
      const combo = `${label}/${pipeline}`;

      it(`${combo}: pinned declared on the column definition paints at the edge`, async () => {
        const cols = columnsFor(KEYS, pipeline, { c: { pinned: 'left' }, a: { pinned: 'right' } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        expectColumnOrder(table, ['c', 'b', 'd', 'a']);
        expectSticky(table, 'c', 'left', '0px');
        expectSticky(table, 'a', 'right', '0px');
      });

      it(`${combo}: declared pinned columns render their own values`, async () => {
        const cols = columnsFor(KEYS, pipeline, { c: { pinned: 'left' }, a: { pinned: 'right' } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: pinColumn left after delivery moves the column to the left edge`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('d', 'left');
        await wait(30);

        expectColumnOrder(table, ['d', 'a', 'b', 'c']);
        expectSticky(table, 'd', 'left', '0px');
        expect(dataRows(table).length).toBe(rows.length);
      });

      it(`${combo}: pinColumn left keeps every cell on its own column`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('d', 'left');
        await wait(30);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: pinColumn right after delivery moves the column to the right edge`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('a', 'right');
        await wait(30);

        expectColumnOrder(table, ['b', 'c', 'd', 'a']);
        expectSticky(table, 'a', 'right', '0px');
      });

      it(`${combo}: pinColumn right keeps every cell on its own column`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('a', 'right');
        await wait(30);

        expectCellsMatch(table, rows, cols);
      });

      it(`${combo}: pinning both edges partitions left / unpinned / right`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'left');
        table.pinColumn('a', 'right');
        await wait(30);

        expectColumnOrder(table, ['c', 'b', 'd', 'a']);
        expectSticky(table, 'c', 'left', '0px');
        expectSticky(table, 'a', 'right', '0px');
      });

      it(`${combo}: pinning both edges preserves every value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'left');
        table.pinColumn('a', 'right');
        await wait(30);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: two left-pinned columns keep declared order and stack their offsets`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('d', 'left');
        table.pinColumn('b', 'left');
        await wait(30);

        // Declared order is a,b,c,d — so b precedes d inside the pinned run.
        expectColumnOrder(table, ['b', 'd', 'a', 'c']);
        expectSticky(table, 'b', 'left', '0px');
        expectSticky(table, 'd', 'left', '150px');
      });

      it(`${combo}: two right-pinned columns stack their offsets from the right`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'right');
        table.pinColumn('d', 'right');
        await wait(30);

        expectColumnOrder(table, ['a', 'b', 'c', 'd']);
        expectSticky(table, 'd', 'right', '0px');
        expectSticky(table, 'c', 'right', '150px');
      });

      it(`${combo}: pinning before delivery survives the first render`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows: [], remote });
        table.pinColumn('c', 'left');
        table.pinColumn('b', 'right');
        await wait(20);
        await redeliver(table, remote, rows);

        expectColumnOrder(table, ['c', 'a', 'd', 'b']);
        expectSticky(table, 'c', 'left', '0px');
        expectSticky(table, 'b', 'right', '0px');
      });

      it(`${combo}: pinning before delivery renders every value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows: [], remote });
        table.pinColumn('c', 'left');
        table.pinColumn('b', 'right');
        await wait(20);
        await redeliver(table, remote, rows);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: pinned layout survives re-delivery of the same identities`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'left');
        table.pinColumn('a', 'right');
        await wait(30);

        await redeliver(table, remote, [...rows]);
        expectColumnOrder(table, ['c', 'b', 'd', 'a']);
        expectCellsMatch(table, rows, cols);
      });

      it(`${combo}: pinned layout survives a mutated re-delivery`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'left');
        await wait(30);

        const mutated = [mutateRow(pipeline, rows[0], 'c', 'C1x'), rows[1]];
        await redeliver(table, remote, mutated);

        expectColumnOrder(table, ['c', 'a', 'b', 'd']);
        expectCellsMatch(table, mutated, cols);
      });

      it(`${combo}: pinned layout survives a re-delivery that adds a row`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('a', 'right');
        await wait(30);

        const grown = [...rows, rowsFor(pipeline, [{ id: 'r9', values: { a: 'A9', b: 'B9', c: 'C9', d: 'D9' } }])[0]];
        await redeliver(table, remote, grown);

        expectColumnOrder(table, ['b', 'c', 'd', 'a']);
        expectCellsMatch(table, grown, cols);
      });

      it(`${combo}: unpinning restores the declared column order`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('d', 'left');
        table.pinColumn('a', 'right');
        await wait(30);
        expectColumnOrder(table, ['d', 'b', 'c', 'a']);

        table.unpinColumn('d');
        table.unpinColumn('a');
        await wait(30);
        expectColumnOrder(table, KEYS);
        const { header, cell } = pinnedSides(table, 'd');
        expect(header!.position).toBe('');
        expect(cell!.position).toBe('');
      });

      it(`${combo}: unpinning keeps every value on its column`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('d', 'left');
        await wait(30);
        table.unpinColumn('d');
        await wait(30);

        expectCellsMatch(table, rows, cols);
        expectNoBlankCells(table);
      });

      it(`${combo}: pinColumn / unpinColumn emit column-pin-change`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        const seen = collectEvents(table, 'column-pin-change');

        table.pinColumn('c', 'left');
        await wait(20);
        table.pinColumn('a', 'right');
        await wait(20);
        table.unpinColumn('c');
        await wait(20);

        expect(seen).toEqual([
          { key: 'c', pinned: 'left' },
          { key: 'a', pinned: 'right' },
          { key: 'c', pinned: false },
        ]);
        expectColumnOrder(table, ['b', 'c', 'd', 'a']);
        expectNoBlankCells(table, rows.length);
      });

      it(`${combo}: a re-delivery emits no column-pin-change of its own`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('d', 'left');
        await wait(30);

        const seen = collectEvents(table, 'column-pin-change');
        await redeliver(table, remote, [...rows]);

        expect(seen).toEqual([]);
        expectSticky(table, 'd', 'left', '0px');
      });

      it(`${combo}: pinnable:false column ignores pinColumn`, async () => {
        const cols = columnsFor(KEYS, pipeline, { b: { pinnable: false } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('b', 'left');
        await wait(30);

        expectColumnOrder(table, KEYS);
        expect(pinnedSides(table, 'b').header!.position).toBe('');
      });

      it(`${combo}: hiding a pinned column drops it and keeps the rest`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'left');
        table.setColumnVisible('c', false);
        await wait(30);

        expectColumnOrder(table, ['a', 'b', 'd']);
        expectCellsMatch(table, rows, cols.filter(c => c.key !== 'c'));
      });

      it(`${combo}: re-showing a hidden pinned column returns it to its edge`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        table.pinColumn('c', 'left');
        table.setColumnVisible('c', false);
        await wait(30);
        table.setColumnVisible('c', true);
        await wait(30);

        expectColumnOrder(table, ['c', 'a', 'b', 'd']);
        expectSticky(table, 'c', 'left', '0px');
      });
    }
  }
});
