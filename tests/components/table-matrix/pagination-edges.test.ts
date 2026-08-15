// Matrix slice: PAGINATION edge transitions x delivery x display pipeline.
//
// These are the shapes that produce "blank or wrong rows until the user clicks
// something": a page that outlives the data behind it, overlapping page
// requests, a refetch in flight, an empty page, and a table that starts on a
// page other than 1.
//
// Documented contract (docs/ai/components/table.md):
//  - Pager summary "Showing a–b of n" describes the rows on screen.
//  - `goToPage` clamps to [1, totalPages]; `setPageSize` resets to page 1.
//  - Remote re-requests are debounced 150ms and fire on
//    `currentPage`/`currentSort`/`pageSize`; failed reloads KEEP the rows
//    already on screen (⚠️ row + empty state only when there is no data).
//  - Response `{data,totalItems?}`; `totalItems` is also a host property/attr.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, expectCellsMatch, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, pipelineColumns, makeRows,
  expectDisplayMatch, displayText, paginationInfo, pagerButton,
} from './pagination-support';

const SETTLE = 320;

/**
 * The body must show exactly the rows the pager claims to show. Parsing the
 * documented "Showing a–b of n" summary keeps this neutral about *how* a
 * shrunken dataset is reconciled (clamp the page, or keep it and show the
 * tail) — it only forbids the body and the summary disagreeing.
 */
function expectBodyMatchesPagerClaim(table: any, allRows: any[]) {
  const info = paginationInfo(table);
  const m = /^Showing (\d+)–(\d+) of (\d+)$/.exec(info);
  expect(m, `unparseable pager summary: "${info}"`).toBeTruthy();
  const [, a, b, n] = m!;
  expect(Number(n)).toBe(allRows.length);
  const claimed = allRows.slice(Number(a) - 1, Number(b));
  expectDisplayMatch(table, claimed);
}

describe('table matrix: pagination edge transitions', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  async function local(pipe: any, data: any[], pageSize = 3) {
    table = await makeTable({
      columns: pipelineColumns(pipe),
      data,
      attrs: { pagination: true, 'page-size': pageSize },
    });
    await wait(30);
    return table;
  }

  async function remote(pipe: any, attrs: Record<string, any>) {
    table = await makeTable({
      columns: pipelineColumns(pipe),
      remote: true,
      attrs: { pagination: true, ...attrs },
    });
    return table;
  }

  /** Capture a pending request without resolving its data promise. */
  function capture(): Promise<{ payload: any; resolve: (r: any) => void; reject: (e: any) => void }> {
    return new Promise(res => {
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        res({ payload: e.detail.payload, resolve: e.detail.data.resolve, reject: e.detail.data.reject });
      }, { once: true });
    });
  }

  for (const pipe of PIPELINES) {
    describe(`pipeline: ${pipe}`, () => {
      // --- data shrinks out from under the current page ---------------------
      // MATRIX-pagination-2 (fixed): renderBody() re-clamps `currentPage` to
      // [1, totalPages] before slicing a non-empty dataset, so data that
      // shrinks out from under the current page lands on the new last page.
      // Previously the slice ran past the end of the array and the body
      // rendered ZERO rows while the pager still advertised "Showing 4–4 of 4"
      // — blank until the user clicked a page button.
      it('local: body still matches the pager after the data shrinks below the current page', async () => {
        const data = makeRows(7);
        await local(pipe, data, 3);
        table.goToPage(3);
        await wait(30);
        expectDisplayMatch(table, data.slice(6, 7));

        const shrunk = data.slice(0, 4);
        table.data = shrunk;
        await wait(40);
        expectBodyMatchesPagerClaim(table, shrunk);
      });

      // MATRIX-pagination-2 (remote delivery form).
      it('remote+client: body still matches the pager after a shorter re-delivery', async () => {
        const rows = makeRows(7);
        await remote(pipe, { 'page-size': 3 });
        await deliver(table, rows);
        table.goToPage(3);
        await wait(30);

        const shrunk = rows.slice(0, 4);
        await deliver(table, shrunk);
        expectBodyMatchesPagerClaim(table, shrunk);
      });

      // MATRIX-pagination-2 (shrink past several pages).
      it('local: shrinking to a single page leaves that page rendered', async () => {
        const data = makeRows(9);
        await local(pipe, data, 3);
        table.goToPage(3);
        await wait(30);

        const shrunk = data.slice(0, 2);
        table.data = shrunk;
        await wait(40);
        expectBodyMatchesPagerClaim(table, shrunk);
      });

      // Pins down the repaired state of MATRIX-pagination-2 exactly: the rows
      // are on screen without any interaction, `currentPage` itself has moved
      // to the new last page (so the pager buttons agree), and a subsequent
      // page interaction still works from there.
      it('local: the shrunken dataset renders without waiting for a page interaction', async () => {
        const data = makeRows(7);
        await local(pipe, data, 3);
        table.goToPage(3);
        await wait(30);

        const shrunk = data.slice(0, 4);
        table.data = shrunk;
        await wait(40);
        expect(dataRows(table).length).toBe(1);
        expect(table.currentPage).toBe(2);
        expect(paginationInfo(table)).toBe('Showing 4–4 of 4');
        expect(table.totalItems).toBe(4);
        expectDisplayMatch(table, shrunk.slice(3, 4));

        pagerButton(table, '.pagination__first')!.click();
        await wait(40);
        expectDisplayMatch(table, shrunk.slice(0, 3));
      });

      it('remote+client: the shrunken delivery renders without waiting for a page interaction', async () => {
        const rows = makeRows(7);
        await remote(pipe, { 'page-size': 3 });
        await deliver(table, rows);
        table.goToPage(3);
        await wait(30);

        const shrunk = rows.slice(0, 4);
        await deliver(table, shrunk);
        expect(table.currentPage).toBe(2);
        expectDisplayMatch(table, shrunk.slice(3, 4));

        table.goToPage(1);
        await wait(40);
        expectDisplayMatch(table, shrunk.slice(0, 3));
      });

      // --- overlapping / debounced page requests ----------------------------
      it('remote+server: rapid page changes coalesce into one request for the final page', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });

        const payloads: any[] = [];
        const page3 = makeRows(3, 'r', 7);
        const handler = (e: any) => {
          payloads.push(e.detail.payload);
          e.detail.discovery.resolve();
          e.detail.data.resolve({ data: page3, totalItems: 9 });
        };
        table.addEventListener('@request/table/data', handler);
        table.goToPage(2);
        table.goToPage(3);
        await wait(SETTLE);
        table.removeEventListener('@request/table/data', handler);

        expect(payloads.length).toBe(1);
        expect(payloads[0].page).toBe(3);
        expect(table.currentPage).toBe(3);
        expectDisplayMatch(table, page3);
      });

      it('remote+server: a late earlier page response never overwrites the newer page', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });

        const first = capture();
        table.goToPage(2);
        const reqA = await first;
        expect(reqA.payload.page).toBe(2);

        const second = capture();
        table.goToPage(3);
        const reqB = await second;
        expect(reqB.payload.page).toBe(3);

        const page3 = makeRows(3, 'r', 7);
        reqB.resolve({ data: page3, totalItems: 9 });
        await wait(60);
        // The superseded page-2 response arrives afterwards and must be ignored.
        reqA.resolve({ data: makeRows(3, 'r', 4), totalItems: 9 });
        await wait(120);

        expect(table.currentPage).toBe(3);
        expectDisplayMatch(table, page3);
      });

      it('remote+server: rows stay on screen while the next page is in flight', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1, { totalItems: 9 });

        const pending = capture();
        table.goToPage(2);
        const req = await pending;
        await wait(30);
        // Refetch with rows present: the previous page keeps rendering.
        expectDisplayMatch(table, page1);

        const page2 = makeRows(3, 'r', 4);
        req.resolve({ data: page2, totalItems: 9 });
        await wait(80);
        expectDisplayMatch(table, page2);
      });

      it('remote+server: a failed page load keeps the rows already on screen', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1, { totalItems: 9 });

        const pending = capture();
        table.goToPage(2);
        const req = await pending;
        req.reject(new Error('boom'));
        await wait(120);
        expectDisplayMatch(table, page1);
      });

      // --- empty pages and recovery ----------------------------------------
      it('remote+server: an empty page renders the empty state, and the next page recovers', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3 });
        await deliver(table, makeRows(3, 'r', 1), { totalItems: 9 });

        await deliver(table, [], { totalItems: 9 });
        expect(dataRows(table).length).toBe(0);

        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1, { totalItems: 9 });
        expectDisplayMatch(table, page1);
      });

      it('local: paging into and back out of an empty dataset re-renders cells', async () => {
        const data = makeRows(7);
        await local(pipe, data, 3);
        table.goToPage(2);
        await wait(30);

        table.data = [];
        await wait(40);
        expect(dataRows(table).length).toBe(0);

        table.data = data;
        await wait(40);
        expectBodyMatchesPagerClaim(table, data);
      });

      // --- starting somewhere other than page 1 -----------------------------
      it('remote+server: an initial current-page of 2 fetches and renders page 2', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3, 'current-page': 2 });
        expect(table.currentPage).toBe(2);

        const page2 = makeRows(3, 'r', 4);
        let payload: any = null;
        table.addEventListener('@request/table/data', (e: any) => {
          payload = e.detail.payload;
          e.detail.discovery.resolve();
          e.detail.data.resolve({ data: page2, totalItems: 9 });
        }, { once: true });
        table.getTableData();
        await wait(80);
        expect(payload.page).toBe(2);
        expectDisplayMatch(table, page2);
        expect(paginationInfo(table)).toBe('Showing 4–6 of 9');
      });

      it('local: an initial current-page of 2 renders the second slice', async () => {
        const data = makeRows(7);
        table = await makeTable({
          columns: pipelineColumns(pipe),
          data,
          attrs: { pagination: true, 'page-size': 3, 'current-page': 2 },
        });
        await wait(40);
        expect(table.currentPage).toBe(2);
        expectDisplayMatch(table, data.slice(3, 6));
      });

      // --- total supplied by the host, not the response ---------------------
      it('remote+server: a host-supplied total-items drives paging when responses omit it', async () => {
        await remote(pipe, { 'pagination-mode': 'server', 'page-size': 3, 'total-items': 9 });
        const page1 = makeRows(3, 'r', 1);
        await deliver(table, page1);
        expect(paginationInfo(table)).toBe('Showing 1–3 of 9');

        const page2 = makeRows(3, 'r', 4);
        let payload: any = null;
        table.addEventListener('@request/table/data', (e: any) => {
          payload = e.detail.payload;
          e.detail.discovery.resolve();
          e.detail.data.resolve({ data: page2 });
        }, { once: true });
        table.goToPage(2);
        await wait(SETTLE);
        expect(payload.page).toBe(2);
        expectDisplayMatch(table, page2);
        expect(paginationInfo(table)).toBe('Showing 4–6 of 9');
      });

      // --- no cell may render blank ----------------------------------------
      it('no data cell renders blank on any page of any delivery', async () => {
        const data = makeRows(7);
        await local(pipe, data, 3);
        for (const page of [1, 2, 3]) {
          table.goToPage(page);
          await wait(20);
          // Pin the row count first: sweeping for blanks over zero rows would
          // pass trivially, and a blank body is the very failure being hunted.
          const rows = dataRows(table);
          expect(rows.length, `row count on page ${page}`).toBe(data.slice((page - 1) * 3, page * 3).length);
          for (const tr of rows) {
            for (const td of [...tr.querySelectorAll('td[data-key]')] as HTMLElement[]) {
              expect(displayText(td), `blank cell on page ${page}`).not.toBe('');
            }
          }
        }
      });

      it(
        'value-attribute oracle agrees after a shrinking re-delivery', async () => {
          const data = makeRows(7);
          await local(pipe, data, 3);
          const shrunk = data.slice(0, 4);
          table.data = shrunk;
          await wait(40);
          expectCellsMatch(table, shrunk.slice(0, 3));
        });
    });
  }

  // --- local rows under server pagination-mode ----------------------------
  // The host owns the slicing here: `paginationMode:'server'` means the table
  // must NOT re-slice `data`, and the pager total comes from `totalItems`.
  for (const pipe of PIPELINES) {
    it(`local mode + server pagination-mode renders the host-supplied page (${pipe})`, async () => {
      const page2 = makeRows(3, 'r', 4);
      table = await makeTable({
        columns: pipelineColumns(pipe),
        data: page2,
        attrs: {
          pagination: true, 'pagination-mode': 'server',
          'page-size': 3, 'current-page': 2, 'total-items': 7,
        },
      });
      await wait(40);
      expectDisplayMatch(table, page2);
      expect(paginationInfo(table)).toBe('Showing 4–6 of 7');

      const events: any[] = [];
      table.addEventListener('page-change', (e: any) => events.push(e.detail));
      table.goToPage(3);
      await wait(40);
      expect(events[0]).toEqual({ page: 3, pageSize: 3, totalPages: 3, totalItems: 7 });
      // Still the host's rows — a server-mode table never slices locally.
      expectDisplayMatch(table, page2);
    });
  }

  // --- pager affordances (pipeline-independent) ---------------------------
  it('local: pager buttons disable at the ends of the range', async () => {
    const data = makeRows(7);
    await local('none', data, 3);
    expect(pagerButton(table, '.pagination__first')!.disabled).toBe(true);
    expect(pagerButton(table, '.pagination__prev')!.disabled).toBe(true);
    expect(pagerButton(table, '.pagination__next')!.disabled).toBe(false);

    pagerButton(table, '.pagination__last')!.click();
    await wait(30);
    expect(table.currentPage).toBe(3);
    expectDisplayMatch(table, data.slice(6, 7));
    expect(pagerButton(table, '.pagination__next')!.disabled).toBe(true);
    expect(pagerButton(table, '.pagination__last')!.disabled).toBe(true);
  });

  it('local: numbered page buttons navigate to their page', async () => {
    const data = makeRows(9);
    await local('none', data, 3);
    const buttons = [...table.shadowRoot.querySelectorAll('.pagination__page')] as HTMLButtonElement[];
    expect(buttons.map(b => b.textContent)).toEqual(['1', '2', '3']);
    buttons[1].click();
    await wait(30);
    expectDisplayMatch(table, data.slice(3, 6));
  });

  it('local: the prev button steps back one page', async () => {
    const data = makeRows(7);
    await local('none', data, 3);
    table.goToPage(3);
    await wait(30);
    pagerButton(table, '.pagination__prev')!.click();
    await wait(30);
    expect(table.currentPage).toBe(2);
    expectDisplayMatch(table, data.slice(3, 6));
  });

  // The pager's own size selector is the user-facing "page-size change" path;
  // the rest of the slice drives setPageSize()/pageSize directly.
  it('local: the pager size selector resizes and resets to page 1', async () => {
    const data = makeRows(12);
    await local('none', data, 3);
    const select = table.shadowRoot.querySelector('.pagination__size-select') as any;
    expect(select).toBeTruthy();
    // pageSize 3 is not in the default pageSizes list, so it must still be
    // offered (and selected) rather than leaving the select on a placeholder.
    expect([...select.children].map((o: any) => o.getAttribute('value')))
      .toEqual(['3', '10', '25', '50', '100']);
    expect(select.value).toBe('3');

    table.goToPage(3);
    await wait(30);
    select.dispatchEvent(new CustomEvent('select-change', { detail: { value: '6' } }));
    await wait(40);
    expect(table.pageSize).toBe(6);
    expect(table.currentPage).toBe(1);
    expectDisplayMatch(table, data.slice(0, 6));
    expect(paginationInfo(table)).toBe('Showing 1–6 of 12');
  });

  it('local: an empty dataset reports a zero total in the pager', async () => {
    await local('none', [], 3);
    expect(dataRows(table).length).toBe(0);
    expect(paginationInfo(table)).toBe('Showing 0–0 of 0');
    expect(table.totalItems).toBe(0);
  });
});
