// Matrix slice: PAGINATION x remote mode x CLIENT pagination x display pipeline.
//
// Documented contract (docs/ai/components/table.md):
//  - `mode="remote"` fetches rows through `@request/table/data`; the automatic
//    initial request requires `mode="remote"`, while *page* requests also
//    require `pagination-mode="server"`. With the default
//    `paginationMode:'client'` a page change must therefore NOT refetch — the
//    delivered rows are paged client-side.
//  - Page N shows delivered-row window [(N-1)*pageSize .. N*pageSize).
//  - valueGetter runs for display (its key need not be a row field), and
//    formatter / valueFormatter produce the display text — on every page, on
//    initial delivery, on re-delivery of the same identities, and on mutated
//    re-delivery.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, expectCellsMatch, wait } from './matrix-utils';
import {
  PIPELINES, pipelineColumns, makeRows,
  expectDisplayMatch, paginationInfo,
} from './pagination-support';

describe('table matrix: pagination x remote mode x client pagination', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  async function build(pipe: any, pageSize = 3) {
    table = await makeTable({
      columns: pipelineColumns(pipe),
      remote: true,
      attrs: { pagination: true, 'page-size': pageSize },
    });
    return table;
  }

  /** Count (and satisfy) any data request raised during `fn`. */
  async function countRequests(fn: () => void, rows: any[]): Promise<number> {
    let n = 0;
    const handler = (e: any) => {
      n++;
      e.detail.discovery.resolve();
      e.detail.data.resolve({ data: rows });
    };
    table.addEventListener('@request/table/data', handler);
    fn();
    await wait(300);
    table.removeEventListener('@request/table/data', handler);
    return n;
  }

  for (const pipe of PIPELINES) {
    describe(`pipeline: ${pipe}`, () => {
      it('pages server-delivered rows client-side on initial delivery', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);
        expectDisplayMatch(table, rows.slice(0, 3));
        expect(paginationInfo(table)).toBe('Showing 1–3 of 7');
      });

      it('renders the exact slice for every page transition without refetching', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);

        expect(await countRequests(() => table.goToPage(2), rows)).toBe(0);
        expectDisplayMatch(table, rows.slice(3, 6));

        table.goToPage(3);
        await wait(30);
        expectDisplayMatch(table, rows.slice(6, 7));

        table.goToPage(1);
        await wait(30);
        expectDisplayMatch(table, rows.slice(0, 3));
      });

      it('clamps out-of-range pages', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);

        table.goToPage(42);
        await wait(30);
        expect(table.currentPage).toBe(3);
        expectDisplayMatch(table, rows.slice(6, 7));
      });

      it('resets to page 1 and re-slices on setPageSize (no refetch)', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);
        table.goToPage(3);
        await wait(30);

        expect(await countRequests(() => table.setPageSize(4), rows)).toBe(0);
        expect(table.currentPage).toBe(1);
        expectDisplayMatch(table, rows.slice(0, 4));
        expect(paginationInfo(table)).toBe('Showing 1–4 of 7');
      });

      it('re-delivers the same row identities while off page 1', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);
        table.goToPage(2);
        await wait(30);

        // Same objects — the reconciler recycles the existing <tr>s.
        await deliver(table, [...rows]);
        expectDisplayMatch(table, rows.slice(3, 6));
      });

      it('re-delivers mutated rows while off page 1', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);
        table.goToPage(2);
        await wait(30);

        const mutated = rows.map(r => ({ ...r, label: `${r.label}!` }));
        await deliver(table, mutated);
        expectDisplayMatch(table, mutated.slice(3, 6));
      });

      it('re-delivers a grown dataset and pages over the new rows', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);

        const grown = [...rows, ...makeRows(3, 'r', 8)];
        await deliver(table, grown);
        expectDisplayMatch(table, grown.slice(0, 3));

        table.goToPage(4);
        await wait(30);
        expectDisplayMatch(table, grown.slice(9, 10));
      });

      it('re-delivers a shrunken dataset and reports the new total', async () => {
        const rows = makeRows(7);
        await build(pipe, 3);
        await deliver(table, rows);

        const shrunk = rows.slice(0, 4);
        await deliver(table, shrunk);
        expectDisplayMatch(table, shrunk.slice(0, 3));
        expect(table.totalItems).toBe(4);
        expect(paginationInfo(table)).toBe('Showing 1–3 of 4');
      });

      it('sends page + pageSize on the data request even in client mode', async () => {
        // Documented payload: {search,sort,filter,selector,page?,pageSize?}.
        await build(pipe, 3);
        let payload: any = null;
        table.addEventListener('@request/table/data', (e: any) => {
          payload = e.detail.payload;
          e.detail.discovery.resolve();
          e.detail.data.resolve({ data: makeRows(7) });
        }, { once: true });
        table.getTableData();
        await wait(60);
        expect(payload.page).toBe(1);
        expect(payload.pageSize).toBe(3);
      });

      it(
        'value-attribute oracle agrees across pages', async () => {
          const rows = makeRows(7);
          await build(pipe, 3);
          await deliver(table, rows);
          expectCellsMatch(table, rows.slice(0, 3));
          table.goToPage(2);
          await wait(30);
          expectCellsMatch(table, rows.slice(3, 6));
        });
    });
  }
});
