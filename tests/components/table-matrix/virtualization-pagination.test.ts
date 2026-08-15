// Matrix slice: VIRTUALIZATION × pagination.
//
// Coverage gap closed: `virtualize` and `pagination` were never crossed
// anywhere in the matrix, even though renderBody() keeps calling
// renderPagination() on the virtual path. The contract under test is the
// documented one (docs/ai/components/table.md): the pager summarises
// "Showing a–b of n" and "the body always shows the rows the summary claims" —
// virtualized or not. Under virtualization "shows" means the window is a slice
// of the CLAIMED PAGE and the spacers reserve the page's height, not the whole
// dataset's.
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent, wait } from '../test-utils';
import { expectCellsMatch, makeTable, respondWith } from './matrix-utils';
import { paginationInfo } from './pagination-support';
import {
  CONTROL_COLUMN,
  columnsFor,
  deliverRows,
  expectControlCells,
  expectVirtualWindow,
  expectWindowCells,
  makeRows,
  pipelineColumn,
  readWindow,
  visibleCellText,
} from './virtualization-support';

const COLUMNS = columnsFor('valueGetter');
const GETTER_COLUMN = pipelineColumn('valueGetter');
const TOTAL = 30;
const PAGE_SIZE = 10;

/** The label of every rendered row, read as the user sees it. */
function shownLabels(table: any): string[] {
  return readWindow(table).rows.map(tr =>
    visibleCellText(tr.querySelector(`td[data-key="${CONTROL_COLUMN.key}"]`) as HTMLElement));
}

describe('virtualization × client pagination', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  async function paginatedTable(remote: boolean, virtualize: boolean, rows: any[]) {
    table = await makeTable({
      columns: COLUMNS,
      data: remote ? undefined : [],
      remote,
      attrs: {
        pagination: true,
        'page-size': PAGE_SIZE,
        ...(virtualize ? { virtualize: true } : {}),
      },
    });
    await deliverRows(table, rows, remote);
    return rows;
  }

  const pageOf = (rows: any[], page: number) =>
    rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    // Control: without virtualization the body is exactly the claimed page.
    for (const page of [1, 2, 3]) {
      it(`${mode} / not virtualized: page ${page} renders the rows the pager claims`, async () => {
        const rows = await paginatedTable(remote, false, makeRows(TOTAL));
        if (page !== 1) { table.goToPage(page); await wait(80); }

        const expected = pageOf(rows, page);
        expect(paginationInfo(table))
          .toBe(`Showing ${(page - 1) * PAGE_SIZE + 1}–${page * PAGE_SIZE} of ${TOTAL}`);
        expectCellsMatch(table, expected, [CONTROL_COLUMN, GETTER_COLUMN]);
        expect(shownLabels(table)).toEqual(expected.map(r => r.label));
      });
    }

    // MATRIX-virtualization-6 (NEW): with `virtualize` on, the virtual model is
    // the whole filtered dataset, never the page — snice-table.ts
    // getVirtualRows() returns getFilteredData() and ignores currentPage /
    // pageSize. So the spacers reserve 30 rows for a 10-row page, and paging
    // moves the summary while the body keeps rendering page 1.
    for (const page of [1, 2]) {
      it.fails(`${mode} / virtualized: page ${page} windows the rows the pager claims`, async () => {
        const rows = await paginatedTable(remote, true, makeRows(TOTAL));
        if (page !== 1) { table.goToPage(page); await wait(80); }

        const expected = pageOf(rows, page);
        expect(paginationInfo(table))
          .toBe(`Showing ${(page - 1) * PAGE_SIZE + 1}–${page * PAGE_SIZE} of ${TOTAL}`);

        const w = readWindow(table);
        // The reserved scroll height is the page's, not the dataset's.
        expect(w.topPx + w.rows.length * table.rowHeight + w.bottomPx)
          .toBe(expected.length * table.rowHeight);
        // …and the window is a contiguous slice of that page, in order.
        const offset = w.topPx / table.rowHeight;
        expect(shownLabels(table))
          .toEqual(expected.slice(offset, offset + w.rows.length).map(r => r.label));
      });
    }
  }
});

describe('virtualization × server pagination', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  /** Run `trigger`, answer the refetch it schedules with `rows`. */
  async function serve(trigger: () => void, rows: any[]) {
    respondWith(table, rows, { totalItems: TOTAL });
    trigger();
    await wait(250); // remote re-requests are debounced 150ms
  }

  async function serverPaginated(virtualize: boolean, rows: any[]) {
    table = await makeTable({
      columns: COLUMNS,
      remote: true,
      attrs: {
        pagination: true,
        'pagination-mode': 'server',
        'page-size': PAGE_SIZE,
        ...(virtualize ? { virtualize: true } : {}),
      },
    });
    respondWith(table, rows, { totalItems: TOTAL });
    table.getTableData();
    await wait(60);
  }

  // On the server path the delivered page IS the dataset the table holds, so
  // the virtual model and the pager agree.
  it('virtualized: the delivered page is the whole virtual model', async () => {
    const page1 = makeRows(PAGE_SIZE);
    await serverPaginated(true, page1);

    expect(paginationInfo(table)).toBe(`Showing 1–${PAGE_SIZE} of ${TOTAL}`);
    const w = expectVirtualWindow(table, page1, COLUMNS.length);
    expect(w.rows.length).toBeGreaterThan(0);
    expect(w.rows.length).toBeLessThan(page1.length);
    expect(w.bottomPx).toBe((page1.length - w.rows.length) * table.rowHeight);
    expectControlCells(table, page1);
    expectWindowCells(table, page1, [CONTROL_COLUMN, GETTER_COLUMN]);
  });

  it('virtualized: goToPage refetches and windows the new page', async () => {
    await serverPaginated(true, makeRows(PAGE_SIZE));
    const page2 = makeRows(PAGE_SIZE, '#p2');
    await serve(() => table.goToPage(2), page2);

    expect(table.currentPage).toBe(2);
    expect(paginationInfo(table)).toBe(`Showing ${PAGE_SIZE + 1}–${PAGE_SIZE * 2} of ${TOTAL}`);
    expectVirtualWindow(table, page2, COLUMNS.length);
    expectControlCells(table, page2);
    expectWindowCells(table, page2, [CONTROL_COLUMN, GETTER_COLUMN]);
    expect(shownLabels(table)).toEqual(page2.slice(0, readWindow(table).rows.length).map(r => r.label));
  });

  it('virtualized: a short last page shrinks the window and the spacers', async () => {
    await serverPaginated(true, makeRows(PAGE_SIZE));
    const last = makeRows(3, '#last');
    await serve(() => table.goToPage(3), last);

    const w = expectVirtualWindow(table, last, COLUMNS.length);
    expect(w.rows.length).toBe(last.length); // three rows fit in any window
    expect(w.topSpacer).toBeNull();
    expect(w.bottomSpacer).toBeNull();
    expectControlCells(table, last);
    expectWindowCells(table, last, [CONTROL_COLUMN, GETTER_COLUMN]);
  });
});
