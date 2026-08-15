// Matrix slice: PAGINATION x delivery mechanics x display pipeline.
//
// Focused on the customer symptom — cells that come up blank or stale until
// something is clicked — across the ways rows arrive: `data =`, `setData()`,
// and remote deliveries, in both client and server pagination.
//
// Documented contract (docs/ai/components/table.md):
//  - "`table.columns =`/`table.data =` rerender; `setData()` is non-eager, so
//    call `renderBody()` when unpaired."
//  - Remote response `{data,totalItems?}`; page requests require
//    `pagination-mode="server"`; re-requests debounce 150ms.
//  - valueGetter runs for display; formatter / valueFormatter produce the
//    display text.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, respondWith, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, pipelineColumns, makeRows,
  expectDisplayMatch, displayText, paginationInfo,
} from './pagination-support';

const SETTLE = 320;

/**
 * No rendered data cell may be empty for these (never-empty) fixtures.
 *
 * `expectedRows` is REQUIRED: sweeping the rendered rows for blanks passes
 * trivially when zero rows render, and a blank body is exactly the failure this
 * slice exists to catch. Pinning the count first makes the sweep meaningful.
 */
function expectNoBlankCells(table: any, where: string, expectedRows: number) {
  const rows = dataRows(table);
  expect(rows.length, `${where}: rendered row count`).toBe(expectedRows);
  const blanks: string[] = [];
  rows.forEach((tr, i) => {
    for (const td of [...tr.querySelectorAll('td[data-key]')] as HTMLElement[]) {
      if (displayText(td) === '') blanks.push(`${where}: row ${i} td[${td.getAttribute('data-key')}]`);
    }
  });
  expect(blanks).toEqual([]);
}

describe('table matrix: pagination x delivery mechanics', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  async function remote(pipe: any, attrs: Record<string, any>) {
    table = await makeTable({
      columns: pipelineColumns(pipe),
      remote: true,
      attrs: { pagination: true, ...attrs },
    });
    return table;
  }

  for (const pipe of PIPELINES) {
    describe(`pipeline: ${pipe}`, () => {
      // --- setData (non-eager) ---------------------------------------------
      it('local: setData + renderBody paginates the new rows', async () => {
        table = await makeTable({
          columns: pipelineColumns(pipe),
          data: [],
          attrs: { pagination: true, 'page-size': 3 },
        });
        const data = makeRows(7);
        table.setData(data);
        table.renderBody();
        await wait(40);
        expectDisplayMatch(table, data.slice(0, 3));
        expect(paginationInfo(table)).toBe('Showing 1–3 of 7');

        table.goToPage(2);
        await wait(30);
        expectDisplayMatch(table, data.slice(3, 6));
        expectNoBlankCells(table, 'setData page 2', 3);
      });

      it('local: setData replacing a longer dataset re-slices page 1', async () => {
        const data = makeRows(7);
        table = await makeTable({
          columns: pipelineColumns(pipe),
          data,
          attrs: { pagination: true, 'page-size': 3 },
        });
        await wait(30);
        const next = makeRows(5, 'x');
        table.setData(next);
        table.renderBody();
        await wait(40);
        expectDisplayMatch(table, next.slice(0, 3));

        table.goToPage(2);
        await wait(30);
        expectDisplayMatch(table, next.slice(3, 5));
      });

      // --- blank-cell sweeps -----------------------------------------------
      it('remote+client: no blank cells on any page across two deliveries', async () => {
        const rows = makeRows(9);
        await remote(pipe, { 'page-size': 3 });
        await deliver(table, rows);
        for (const page of [1, 2, 3]) {
          table.goToPage(page);
          await wait(20);
          expectDisplayMatch(table, rows.slice((page - 1) * 3, page * 3));
          expectNoBlankCells(table, `client delivery 1 page ${page}`, 3);
        }

        const redelivered = rows.map(r => ({ ...r }));
        await deliver(table, redelivered);
        for (const page of [1, 2, 3]) {
          table.goToPage(page);
          await wait(20);
          expectDisplayMatch(table, redelivered.slice((page - 1) * 3, page * 3));
          expectNoBlankCells(table, `client delivery 2 page ${page}`, 3);
        }
      });

      it('remote+server: no blank cells on any delivered page', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        const pages = [makeRows(3, 'r', 1), makeRows(3, 'r', 4), makeRows(3, 'r', 7)];
        await deliver(table, pages[0], { totalItems: 9 });
        expectNoBlankCells(table, 'server page 1', pages[0].length);

        for (const p of [2, 3]) {
          respondWith(table, pages[p - 1], { totalItems: 9 });
          table.goToPage(p);
          await wait(SETTLE);
          expectDisplayMatch(table, pages[p - 1]);
          expectNoBlankCells(table, `server page ${p}`, pages[p - 1].length);
        }
      });

      // --- timing: navigate immediately after a delivery --------------------
      it('remote+client: a page change issued right after delivery renders that page', async () => {
        const rows = makeRows(9);
        await remote(pipe, { 'page-size': 3 });
        respondWith(table, rows);
        table.getTableData();
        await wait(50);
        table.goToPage(3);
        await wait(40);
        expectDisplayMatch(table, rows.slice(6, 9));
      });

      it('remote+server: a page-size change while a page request is in flight wins', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });

        // Hold the page-2 request open, then resize; the resize request is newer.
        let stale: ((r: any) => void) | null = null;
        table.addEventListener('@request/table/data', (e: any) => {
          e.detail.discovery.resolve();
          stale = e.detail.data.resolve;
        }, { once: true });
        table.goToPage(2);
        await wait(SETTLE);
        expect(stale).toBeTruthy();

        const resized = makeRows(6, 'r', 1);
        respondWith(table, resized, { totalItems: 9 });
        table.setPageSize(6);
        await wait(SETTLE);
        // The superseded page-2 response lands late and must be discarded.
        stale!({ data: makeRows(3, 'r', 4), totalItems: 9 });
        await wait(120);

        expect(table.currentPage).toBe(1);
        expect(table.pageSize).toBe(6);
        expectDisplayMatch(table, resized);
      });

      // --- consecutive deliveries for the same page -------------------------
      it('remote+server: two deliveries for the same page with different identities', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        const first = makeRows(3, 'r', 1);
        await deliver(table, first, { totalItems: 9 });

        const second = [
          { id: 1, label: 'alpha' },
          { id: 2, label: 'beta' },
          { id: 3, label: 'gamma' },
        ];
        await deliver(table, second, { totalItems: 9 });
        expectDisplayMatch(table, second);
        expectNoBlankCells(table, 'server same-page redelivery', second.length);
      });

      it('remote+server: a delivery that ignores the requested page still renders in full', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });

        const ignored = makeRows(3, 'r', 1); // server returned page 1 again
        respondWith(table, ignored, { totalItems: 9 });
        table.goToPage(2);
        await wait(SETTLE);
        expectDisplayMatch(table, ignored);
      });

      // --- page-size cycling ------------------------------------------------
      it('remote+client: cycling page sizes always renders the leading window', async () => {
        const rows = makeRows(12);
        await remote(pipe, { 'page-size': 3 });
        await deliver(table, rows);
        for (const size of [4, 6, 2, 12, 5]) {
          table.setPageSize(size);
          await wait(30);
          expect(table.currentPage).toBe(1);
          expectDisplayMatch(table, rows.slice(0, Math.min(size, rows.length)));
          expectNoBlankCells(table, `client pageSize ${size}`, Math.min(size, rows.length));
        }
      });

      it('local: cycling page sizes always renders the leading window', async () => {
        const rows = makeRows(12);
        table = await makeTable({
          columns: pipelineColumns(pipe),
          data: rows,
          attrs: { pagination: true, 'page-size': 3 },
        });
        await wait(30);
        for (const size of [4, 6, 2, 12, 5]) {
          table.setPageSize(size);
          await wait(30);
          expectDisplayMatch(table, rows.slice(0, Math.min(size, rows.length)));
          expectNoBlankCells(table, `local pageSize ${size}`, Math.min(size, rows.length));
        }
      });
    });
  }
});
