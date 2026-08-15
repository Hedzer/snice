// Matrix slice: PAGINATION x remote mode x SERVER pagination x display pipeline.
//
// Documented contract (docs/ai/components/table.md):
//  - Remote `table/data` payload `{search,sort,filter,selector,page?,pageSize?}`;
//    response `{data,totalItems?}`. Page requests require
//    `pagination-mode="server"`; remote re-requests are debounced 150ms and
//    happen on `currentPage` / `currentSort` / `pageSize` changes.
//  - In server mode the delivered page IS the page: every delivered row renders,
//    in order, with the pipeline applied (valueGetter runs for display; the key
//    need not be a row field).
//  - `totalItems` from the response drives the pager total, `goToPage` clamping
//    and the "Showing a–b of n" summary.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, respondWith, expectCellsMatch, wait } from './matrix-utils';
import {
  PIPELINES, pipelineColumns, makeRows,
  expectDisplayMatch, paginationInfo, pagerButton,
} from './pagination-support';

const DEBOUNCE_SETTLE = 320;

describe('table matrix: pagination x remote mode x server pagination', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  async function build(pipe: any, pageSize = 3) {
    table = await makeTable({
      columns: pipelineColumns(pipe),
      remote: true,
      attrs: { pagination: true, 'pagination-mode': 'server', 'page-size': pageSize },
    });
    return table;
  }

  /** Run `act` (which should trigger a debounced refetch) and serve `rows`. */
  async function serve(act: () => void, rows: any[], extra: Record<string, any> = {}) {
    let payload: any = null;
    table.addEventListener('@request/table/data', (e: any) => {
      payload = e.detail.payload;
      e.detail.discovery.resolve();
      e.detail.data.resolve({ data: rows, ...extra });
    }, { once: true });
    act();
    await wait(DEBOUNCE_SETTLE);
    return payload;
  }

  for (const pipe of PIPELINES) {
    describe(`pipeline: ${pipe}`, () => {
      // --- initial delivery -------------------------------------------------
      it('renders the first server page exactly as delivered', async () => {
        await build(pipe, 3);
        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1, { totalItems: 7 });
        expectDisplayMatch(table, page1);
        expect(table.totalItems).toBe(7);
        expect(paginationInfo(table)).toBe('Showing 1–3 of 7');
      });

      it('requests page 1 with the configured pageSize on the initial fetch', async () => {
        await build(pipe, 3);
        let payload: any = null;
        table.addEventListener('@request/table/data', (e: any) => {
          payload = e.detail.payload;
          e.detail.discovery.resolve();
          e.detail.data.resolve({ data: makeRows(3), totalItems: 7 });
        }, { once: true });
        table.getTableData();
        await wait(60);
        expect(payload.page).toBe(1);
        expect(payload.pageSize).toBe(3);
      });

      // --- page transitions -------------------------------------------------
      it('refetches on goToPage and renders the delivered page', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });

        const page2 = makeRows(3, 'r', 4);
        const payload = await serve(() => table.goToPage(2), page2, { totalItems: 7 });
        expect(payload.page).toBe(2);
        expect(payload.pageSize).toBe(3);
        expect(table.currentPage).toBe(2);
        expectDisplayMatch(table, page2);
        expect(paginationInfo(table)).toBe('Showing 4–6 of 7');

        const page3 = makeRows(1, 'r', 7);
        await serve(() => table.goToPage(3), page3, { totalItems: 7 });
        expectDisplayMatch(table, page3);
        expect(paginationInfo(table)).toBe('Showing 7–7 of 7');

        const back = makeRows(3, 'r', 1);
        await serve(() => table.goToPage(1), back, { totalItems: 7 });
        expectDisplayMatch(table, back);
      });

      it('renders a page reached by clicking the pager, not just goToPage', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });

        const page2 = makeRows(3, 'r', 4);
        await serve(() => pagerButton(table, '.pagination__next')!.click(), page2, { totalItems: 7 });
        expect(table.currentPage).toBe(2);
        expectDisplayMatch(table, page2);

        const last = makeRows(1, 'r', 7);
        await serve(() => pagerButton(table, '.pagination__last')!.click(), last, { totalItems: 7 });
        expect(table.currentPage).toBe(3);
        expectDisplayMatch(table, last);

        const first = makeRows(3, 'r', 1);
        await serve(() => pagerButton(table, '.pagination__first')!.click(), first, { totalItems: 7 });
        expect(table.currentPage).toBe(1);
        expectDisplayMatch(table, first);
      });

      it('refetches when currentPage is assigned directly', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });

        const page2 = makeRows(3, 'r', 4);
        const payload = await serve(() => { table.currentPage = 2; }, page2, { totalItems: 7 });
        expect(payload.page).toBe(2);
        expectDisplayMatch(table, page2);
      });

      it('clamps goToPage against the server-reported total', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });

        const last = makeRows(1, 'r', 7);
        await serve(() => table.goToPage(99), last, { totalItems: 7 });
        expect(table.currentPage).toBe(3);
        expectDisplayMatch(table, last);
      });

      // --- page-size changes ------------------------------------------------
      it('refetches with the new pageSize and resets to page 1', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });
        await serve(() => table.goToPage(2), makeRows(3, 'r', 4), { totalItems: 7 });

        const resized = makeRows(5, 'r', 1);
        const payload = await serve(() => table.setPageSize(5), resized, { totalItems: 7 });
        expect(payload.pageSize).toBe(5);
        expect(payload.page).toBe(1);
        expect(table.currentPage).toBe(1);
        expectDisplayMatch(table, resized);
        expect(paginationInfo(table)).toBe('Showing 1–5 of 7');
      });

      it('refetches when pageSize is assigned directly', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });

        const resized = makeRows(5, 'r', 1);
        const payload = await serve(() => { table.pageSize = 5; }, resized, { totalItems: 7 });
        expect(payload.pageSize).toBe(5);
        expect(table.currentPage).toBe(1);
        expectDisplayMatch(table, resized);
      });

      // --- deliveries per page ---------------------------------------------
      it('renders a short final page without leftover rows from the previous page', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });
        await serve(() => table.goToPage(3), makeRows(1, 'r', 7), { totalItems: 7 });
        expectDisplayMatch(table, makeRows(1, 'r', 7));
      });

      it('re-delivers the same page with the same identities (recycled row DOM)', async () => {
        await build(pipe, 3);
        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1, { totalItems: 7 });
        await deliver(table, [...page1], { totalItems: 7 });
        expectDisplayMatch(table, page1);
      });

      it('re-delivers the current page mutated (new objects, same order)', async () => {
        await build(pipe, 3);
        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1, { totalItems: 7 });

        const mutated = page1.map(r => ({ ...r, label: `${r.label}!` }));
        await deliver(table, mutated, { totalItems: 7 });
        expectDisplayMatch(table, mutated);
      });

      it('re-delivers page 2 mutated after navigating there', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });
        const page2 = makeRows(3, 'r', 4);
        await serve(() => table.goToPage(2), page2, { totalItems: 7 });

        const mutated = page2.map(r => ({ ...r, label: `${r.label}!` }));
        await deliver(table, mutated, { totalItems: 7 });
        expectDisplayMatch(table, mutated);
      });

      it('renders a page whose rows reuse the previous page row identities', async () => {
        // Servers that return the same objects (cache-backed) must not leave the
        // recycled <tr>s showing the previous page's values.
        await build(pipe, 3);
        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1, { totalItems: 6 });
        const page2 = makeRows(3, 'r', 4);
        await serve(() => table.goToPage(2), page2, { totalItems: 6 });
        expectDisplayMatch(table, page2);

        // Back to page 1 delivering the very same objects again.
        await serve(() => table.goToPage(1), page1, { totalItems: 6 });
        expectDisplayMatch(table, page1);
      });

      // --- total-count handling --------------------------------------------
      it('keeps the previous total when the response omits totalItems', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });
        expect(table.totalItems).toBe(7);

        await deliver(table, makeRows(3, 'r', 1));
        expect(table.totalItems).toBe(7);
        expect(paginationInfo(table)).toBe('Showing 1–3 of 7');
      });

      it('adopts a shrunken server total on the next delivery', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });
        await deliver(table, makeRows(2, 'r', 1), { totalItems: 2 });
        expectDisplayMatch(table, makeRows(2, 'r', 1));
        expect(paginationInfo(table)).toBe('Showing 1–2 of 2');
      });

      // The shrink cases above all happen while the table sits on page 1, where
      // a smaller total cannot strand the view. These three cover the shrink
      // that lands while the table is parked PAST the new last page.
      //
      // In server pagination the host owns the slice: docs scope the
      // `currentPage` re-clamp to CLIENT pagination ("Client pagination
      // re-clamps `currentPage` … an empty set keeps the declared page"), and
      // this file's contract is "the delivered page IS the page". So what is
      // pinned here is what the table itself owes: render the delivery whole,
      // adopt the new total, rebuild the pager against it, and clamp on the
      // next `goToPage`.
      it('adopts a shrunken server total delivered while off page 1', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });
        await serve(() => table.goToPage(3), makeRows(3, 'r', 7), { totalItems: 9 });
        expect(table.currentPage).toBe(3);
        expect(paginationInfo(table)).toBe('Showing 7–9 of 9');

        const shrunk = makeRows(1, 'r', 4);
        await deliver(table, shrunk, { totalItems: 4 });
        expectDisplayMatch(table, shrunk);
        expectCellsMatch(table, shrunk);
        expect(table.totalItems).toBe(4);
        // 4 items at pageSize 3 is two pages; the pager must not still offer 3.
        const buttons = [...table.shadowRoot.querySelectorAll('.pagination__page')] as HTMLButtonElement[];
        expect(buttons.map(b => b.textContent)).toEqual(['1', '2']);
        expect(pagerButton(table, '.pagination__last')!.getAttribute('data-page')).toBe('2');
      });

      it('renders every row of a delivery whose total shrinks below the current page', async () => {
        // A full page of rows arriving alongside a total that no longer reaches
        // the current page: none of those rows may be dropped, blanked or
        // re-sliced client-side, whatever the pager decides to say about them.
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });
        await serve(() => table.goToPage(3), makeRows(3, 'r', 7), { totalItems: 9 });

        const stranded = makeRows(3, 'r', 1);
        await deliver(table, stranded, { totalItems: 4 });
        expectDisplayMatch(table, stranded);
        expectCellsMatch(table, stranded);
        expect(table.totalItems).toBe(4);
      });

      it('re-clamps a stale page through goToPage once the server total shrinks', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });
        await serve(() => table.goToPage(3), makeRows(3, 'r', 7), { totalItems: 9 });
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 4 });

        // `goToPage` clamps against the NEW total, so one navigation puts the
        // body and the summary back in step without the host computing the
        // last page itself.
        const lastPage = makeRows(1, 'r', 4);
        const payload = await serve(() => table.goToPage(99), lastPage, { totalItems: 4 });
        expect(payload.page).toBe(2);
        expect(table.currentPage).toBe(2);
        expectDisplayMatch(table, lastPage);
        expect(paginationInfo(table)).toBe('Showing 4–4 of 4');
        expect(pagerButton(table, '.pagination__next')!.disabled).toBe(true);
        expect(pagerButton(table, '.pagination__last')!.disabled).toBe(true);
      });

      it('emits page-change with the server total', async () => {
        await build(pipe, 3);
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 7 });
        const events: any[] = [];
        table.addEventListener('page-change', (e: any) => events.push(e.detail));

        await serve(() => table.goToPage(2), makeRows(3, 'r', 4), { totalItems: 7 });
        expect(events[0]).toEqual({ page: 2, pageSize: 3, totalPages: 3, totalItems: 7 });
      });

      it('renders the delivered page even when the server ignores pageSize', async () => {
        // The server is the authority in server mode: whatever it returns is the
        // page, and none of it may be dropped or blanked client-side.
        await build(pipe, 3);
        const overflow = makeRows(5, 'r', 1);
        await deliver(table, overflow, { totalItems: 5 });
        expectDisplayMatch(table, overflow);
      });

      it(
        'value-attribute oracle agrees across server pages', async () => {
          await build(pipe, 3);
          const page1 = makeRows(3, 'r', 1);
          await deliver(table, page1, { totalItems: 7 });
          expectCellsMatch(table, page1);

          const page2 = makeRows(3, 'r', 4);
          respondWith(table, page2, { totalItems: 7 });
          table.goToPage(2);
          await wait(DEBOUNCE_SETTLE);
          expectCellsMatch(table, page2);
        });
    });
  }
});
