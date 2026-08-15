// Matrix slice: PAGINATION x local mode x display pipeline.
//
// Documented contract exercised here (docs/ai/components/table.md):
//  - `pagination` + `paginationMode:'client'` (the default) pages `data`
//    client-side: page N shows data[(N-1)*pageSize .. N*pageSize).
//  - `goToPage(page)` clamps to [1, totalPages]; `setPageSize(size)` resizes
//    and resets to page 1.
//  - `totalItems` reflects the client-side total; the pager reads
//    "Showing a–b of n".
//  - valueGetter "runs for display, sort, aggregation"; formatter /
//    valueFormatter produce the display text. None of that may change with the
//    page the row happens to land on.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, expectCellsMatch, expectedCellText, cellText, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, isFormatted, pipelineColumns, makeRows,
  expectDisplayMatch, displayText, paginationInfo,
} from './pagination-support';

describe('table matrix: pagination x local mode', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  async function build(pipe: any, data: any[], pageSize = 3) {
    table = await makeTable({
      columns: pipelineColumns(pipe),
      data,
      attrs: { pagination: true, 'page-size': pageSize },
    });
    await wait(30);
    return table;
  }

  for (const pipe of PIPELINES) {
    describe(`pipeline: ${pipe}`, () => {
      // --- initial delivery -------------------------------------------------
      it('renders only the first page on initial delivery', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);
        expectDisplayMatch(table, data.slice(0, 3));
        expect(paginationInfo(table)).toBe('Showing 1–3 of 7');
      });

      // --- page transitions -------------------------------------------------
      it('renders the exact slice for every page transition', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);

        table.goToPage(2);
        await wait(30);
        expectDisplayMatch(table, data.slice(3, 6));
        expect(paginationInfo(table)).toBe('Showing 4–6 of 7');

        table.goToPage(3);
        await wait(30);
        expectDisplayMatch(table, data.slice(6, 7));
        expect(paginationInfo(table)).toBe('Showing 7–7 of 7');

        // Back to a page whose rows were rendered before: the reconciler is
        // keyed on row identity, so these <tr>s are rebuilt from scratch after
        // having been evicted. They must not come back blank or stale.
        table.goToPage(1);
        await wait(30);
        expectDisplayMatch(table, data.slice(0, 3));
      });

      it('clamps out-of-range pages instead of rendering an empty page', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);

        table.goToPage(99);
        await wait(30);
        expect(table.currentPage).toBe(3);
        expectDisplayMatch(table, data.slice(6, 7));

        table.goToPage(0);
        await wait(30);
        expect(table.currentPage).toBe(1);
        expectDisplayMatch(table, data.slice(0, 3));
      });

      it('re-renders every visited page identically on a second visit', async () => {
        const data = makeRows(9);
        await build(pipe, data, 3);
        for (const page of [1, 2, 3, 2, 1, 3]) {
          table.goToPage(page);
          await wait(20);
          expectDisplayMatch(table, data.slice((page - 1) * 3, page * 3));
        }
      });

      // --- page-size changes ------------------------------------------------
      it('resets to page 1 and re-slices on setPageSize', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);
        table.goToPage(3);
        await wait(30);

        table.setPageSize(5);
        await wait(30);
        expect(table.currentPage).toBe(1);
        expectDisplayMatch(table, data.slice(0, 5));
        expect(paginationInfo(table)).toBe('Showing 1–5 of 7');

        table.setPageSize(2);
        await wait(30);
        expectDisplayMatch(table, data.slice(0, 2));

        table.setPageSize(20);
        await wait(30);
        expectDisplayMatch(table, data);
        expect(paginationInfo(table)).toBe('Showing 1–7 of 7');
      });

      it('keeps cells correct when the page size grows while off page 1', async () => {
        const data = makeRows(10);
        await build(pipe, data, 2);
        table.goToPage(4); // rows 7-8
        await wait(30);
        expectDisplayMatch(table, data.slice(6, 8));

        table.setPageSize(4);
        await wait(30);
        expect(table.currentPage).toBe(1);
        expectDisplayMatch(table, data.slice(0, 4));
      });

      // --- re-delivery ------------------------------------------------------
      it('re-delivers the same row identities without stale or blank cells', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);
        table.goToPage(2);
        await wait(30);

        // Same objects, new array: the reconciler recycles each <tr>.
        table.data = [...data];
        await wait(40);
        expectDisplayMatch(table, data.slice(3, 6));
      });

      it('re-delivers mutated rows (new objects, same order) on the current page', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);
        table.goToPage(2);
        await wait(30);

        const mutated = data.map(r => ({ ...r, label: `${r.label}!` }));
        table.data = mutated;
        await wait(40);
        expectDisplayMatch(table, mutated.slice(3, 6));
      });

      it('re-delivers a longer dataset and pages over the new rows', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);

        const grown = [...data, ...makeRows(3, 'r', 8)];
        table.data = grown;
        await wait(40);
        expectDisplayMatch(table, grown.slice(0, 3));

        table.goToPage(4);
        await wait(30);
        expectDisplayMatch(table, grown.slice(9, 10));
        expect(paginationInfo(table)).toBe('Showing 10–10 of 10');
      });

      // --- total-count handling --------------------------------------------
      it('reports the client-side total through totalItems and page-change', async () => {
        const data = makeRows(7);
        await build(pipe, data, 3);
        expect(table.totalItems).toBe(7);

        const events: any[] = [];
        table.addEventListener('page-change', (e: any) => events.push(e.detail));
        table.goToPage(2);
        await wait(30);
        expect(events).toEqual([{ page: 2, pageSize: 3, totalPages: 3, totalItems: 7 }]);

        table.setPageSize(5);
        await wait(30);
        expect(events[1]).toEqual({ page: 1, pageSize: 5, totalPages: 2, totalItems: 7 });
      });

      // --- value-attribute oracle (matrix-utils) ----------------------------
      // The cell element's `value` attribute carries the DISPLAY value, so it
      // agrees with the painted text for every pipeline.
      if (isFormatted(pipe)) {
        it('exposes the display value on the cell value attribute', async () => {
          const data = makeRows(7);
          await build(pipe, data, 3);
          table.goToPage(2);
          await wait(30);

          const col = pipelineColumns(pipe)[1];
          const rows = dataRows(table);
          const tds = rows.map(tr => tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement);
          const expected = data.slice(3, 6).map(r => expectedCellText(col, r));
          expect(tds.map(cellText)).toEqual(expected);
          expect(tds.map(displayText)).toEqual(expected);
        });
      }

      it(
        'value-attribute oracle agrees across pages', async () => {
          const data = makeRows(7);
          await build(pipe, data, 3);
          expectCellsMatch(table, data.slice(0, 3));
          table.goToPage(2);
          await wait(30);
          expectCellsMatch(table, data.slice(3, 6));
          table.setPageSize(5);
          await wait(30);
          expectCellsMatch(table, data.slice(0, 5));
        });
    });
  }
});
