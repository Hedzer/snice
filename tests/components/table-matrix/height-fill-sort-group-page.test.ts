// Height-fill slice × sorting, grouping and pagination.
//
// The filler is re-derived at the end of every renderBody, cloned from whatever
// data row is last at that moment. Reordering, grouping and paging all change
// which row that is, so each of them must still leave exactly one empty filler
// at the bottom, the data rows intact, and the filler outside the data set.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, dataRows, wait } from './matrix-utils';
import {
  TALL, stubLayout, fillRow, fillRows, tbodyOf, columnsFor, makeRows, setLocalData,
  pipelines, deliveries, expectFillRowContract, expectFillNotCountedAsData,
  expectDisplayedCellsMatch, expectedDisplay, expectFillerCellsEmpty,
} from './height-fill-support';

type Mode = 'local' | 'remote';

let table: any;
afterEach(() => { if (table) { removeComponent(table); table = undefined; } });

async function build(mode: Mode, columns: any[], rows: any[], attrs?: Record<string, any>) {
  table = mode === 'remote'
    ? await makeTable({ columns, remote: true, height: '600px', attrs })
    : await makeTable({ columns, data: rows, height: '600px', attrs });
  stubLayout(table, TALL.frame, TALL.table);
  if (mode === 'remote') await deliver(table, rows);
  else { setLocalData(table, rows); table.renderBody(); await wait(20); }
}

// ── Sorting ──────────────────────────────────────────────────────────────────
//
// Local sorting is client-side over `data`; a valueGetter "runs for display,
// sort, aggregation" (docs/ai/components/table.md, ColumnDefinition), so a
// getter column sorts on its derived value. Remote sorting re-requests from the
// server, so the local order is whatever the server last delivered.

for (const pipeline of pipelines) {
  describe(`height fill · local · ${pipeline.name} · sort asc/desc`, () => {
    const columns = columnsFor(pipeline);

    it('keeps one empty filler last through both sort directions', async () => {
      const rows = makeRows();
      await build('local', columns, rows);
      expectFillRowContract(table, TALL.leftover);

      table.toggleSort(pipeline.column.key);
      await wait(30);
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, rows.length);

      table.toggleSort(pipeline.column.key);
      await wait(30);
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, rows.length);
    });

    it('orders the data rows by the documented display pipeline', async () => {
      const rows = makeRows();
      await build('local', columns, rows);

      table.toggleSort(pipeline.column.key);
      await wait(30);
      const asc = [...rows].sort((x, y) =>
        expectedDisplay(pipeline.column, x).localeCompare(expectedDisplay(pipeline.column, y)));
      expectDisplayedCellsMatch(table, asc);

      table.toggleSort(pipeline.column.key);
      await wait(30);
      expectDisplayedCellsMatch(table, [...asc].reverse());
    });

    it('the filler never inherits the newly-last row content', async () => {
      const rows = makeRows();
      await build('local', columns, rows);
      table.toggleSort(pipeline.column.key);
      await wait(30);
      // Against the header's cell count: a filler that lost its cells must not
      // pass by having nothing left to compare.
      expectFillerCellsEmpty(table);
      // The row it was cloned from is a real one that DOES show its text, so
      // "empty" is a property of the clone, not of the pipeline.
      const asc = [...rows].sort((x, y) =>
        expectedDisplay(pipeline.column, x).localeCompare(expectedDisplay(pipeline.column, y)));
      expectDisplayedCellsMatch(table, asc);
    });
  });

  describe(`height fill · remote · ${pipeline.name} · server sort round trip`, () => {
    it('re-delivering a server-sorted page keeps one empty filler last', async () => {
      const rows = makeRows();
      await build('remote', columnsFor(pipeline), rows);
      expectFillRowContract(table, TALL.leftover);

      const reversed = [...rows].reverse();
      await deliver(table, reversed);
      expectDisplayedCellsMatch(table, reversed);
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, reversed.length);
    });
  });
}

// ── Grouping ─────────────────────────────────────────────────────────────────

for (const mode of deliveries) {
  for (const pipeline of pipelines) {
    describe(`height fill · ${mode} · ${pipeline.name} · groupBy`, () => {
      const columns = [...columnsFor(pipeline), { key: 'g', label: 'G', type: 'text' }];

      it('group header rows and the filler are both excluded from the data rows', async () => {
        const rows = makeRows();
        table = mode === 'remote'
          ? await makeTable({ columns, remote: true, height: '600px' })
          : await makeTable({ columns, data: rows, height: '600px' });
        table.groupBy = 'g';
        stubLayout(table, TALL.frame, TALL.table);
        if (mode === 'remote') await deliver(table, rows);
        else { setLocalData(table, rows); table.renderBody(); await wait(30); }

        expect(tbodyOf(table).querySelectorAll('tr.group-header-row').length).toBe(2);
        expectFillRowContract(table, TALL.leftover);
        expectFillNotCountedAsData(table, rows.length);
        expect(fillRow(table)!.classList.contains('group-header-row')).toBe(false);
      });

      it('fully collapsed groups leave no data row to clone, so no filler', async () => {
        const rows = makeRows();
        table = mode === 'remote'
          ? await makeTable({ columns, remote: true, height: '600px' })
          : await makeTable({ columns, data: rows, height: '600px' });
        table.groupBy = 'g';
        table.groupDefaults = { expanded: false };
        stubLayout(table, TALL.frame, TALL.table);
        if (mode === 'remote') await deliver(table, rows);
        else { setLocalData(table, rows); table.renderBody(); await wait(30); }

        // The filler is "cloned from the last data row" (updateFillRow), so a
        // body made only of group headers has nothing to clone and the
        // documented no-last-row branch returns without appending anything.
        expect(dataRows(table)).toEqual([]);
        expect(tbodyOf(table).querySelectorAll('tr.group-header-row').length).toBe(2);
        expect(fillRows(table)).toEqual([]);
        expect(tbodyOf(table).children.length).toBe(2);

        // Re-expanding restores a single filler cloned from a real data row.
        table.groupDefaults = { expanded: true };
        table.groupBy = 'g';
        table.renderBody();
        await wait(30);
        expectFillRowContract(table, TALL.leftover);
        expectFillNotCountedAsData(table, rows.length);
      });
    });
  }
}

// ── Pagination ───────────────────────────────────────────────────────────────

for (const pipeline of pipelines) {
  describe(`height fill · local · ${pipeline.name} · client pagination`, () => {
    const columns = columnsFor(pipeline);
    const wide = () => Array.from({ length: 7 }, (_, i) => ({
      id: i, a: `A${i}`, src: `A${i}`, n: `n${i}`, g: i < 4 ? 'G1' : 'G2',
    }));

    it('every page — full and partial — gets exactly one empty filler', async () => {
      const rows = wide();
      await build('local', columns, rows, { pagination: true, 'page-size': 3 });

      for (const [page, slice] of [[1, [0, 3]], [2, [3, 6]], [3, [6, 7]]] as const) {
        table.goToPage(page);
        await wait(30);
        const expected = rows.slice(slice[0], slice[1]);
        expectDisplayedCellsMatch(table, expected);
        expectFillRowContract(table, TALL.leftover);
        expectFillNotCountedAsData(table, expected.length);
      }
    });

    it('the filler is not counted in totalItems or the page model', async () => {
      const rows = wide();
      await build('local', columns, rows, { pagination: true, 'page-size': 3 });
      table.goToPage(3);
      await wait(30);
      expect(table.totalItems).toBe(rows.length);
      expect(dataRows(table).length).toBe(1);
      expect(fillRows(table).length).toBe(1);
    });
  });

  describe(`height fill · remote · ${pipeline.name} · server pagination`, () => {
    it('each delivered page ends with one empty filler', async () => {
      const columns = columnsFor(pipeline);
      const rows = Array.from({ length: 7 }, (_, i) => ({
        id: i, a: `A${i}`, src: `A${i}`, n: `n${i}`, g: 'G1',
      }));
      table = await makeTable({
        columns, remote: true, height: '600px',
        attrs: { pagination: true, 'pagination-mode': 'server', 'page-size': 3 },
      });
      stubLayout(table, TALL.frame, TALL.table);

      for (const [start, end] of [[0, 3], [3, 6], [6, 7]] as const) {
        const page = rows.slice(start, end);
        await deliver(table, page, { totalItems: rows.length });
        expectDisplayedCellsMatch(table, page);
        expectFillRowContract(table, TALL.leftover);
        expectFillNotCountedAsData(table, page.length);
      }
    });
  });
}
