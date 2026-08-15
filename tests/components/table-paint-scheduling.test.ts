/**
 * Paint-scheduling regressions for snice-table (audit candidates 4, 6, 7, 8).
 *
 * All four are about a paint being scheduled against state that has already
 * moved on — the render machinery itself is fine, its *inputs* are not:
 *
 *  4. the remote FAILURE path awaited a frame and then repainted without
 *     re-checking `dataRequestSeq`, while the success path right above it does.
 *     A failure and a success interleaved inside one frame therefore cost two
 *     full body rebuilds, and the loser was the stale one.
 *  6. `debouncedDataRequest()` only bumped `dataRequestSeq` when its 150ms
 *     timeout fired, so for that whole window an already-superseded in-flight
 *     response still satisfied the guard and painted rows for the OLD sort
 *     under the NEW header.
 *  7. `ensureKeyboardRowRendered()` resolved the target through a freshly built
 *     `getVirtualRows()` but the virtualizer then painted the window from the
 *     stale `virtualRowsSnapshot` — the requested row never entered the DOM.
 *  8. `renderBody()` clamps `currentPage` from inside itself; the @watch turned
 *     that into a second, redundant full body pass. (Its server branch would
 *     re-enter renderBody synchronously through the `loading` watcher, but every
 *     clamp site is client-pagination-only, so that branch stays unreachable —
 *     the guard is what keeps it so.)
 *
 * Candidate 5 (`loadError` clearing) is covered by
 * tests/components/table-loading-empty-states.test.ts — clearing on any
 * arriving dataset, keeping the error across a drag reorder — and its remaining
 * documented limit (an already in-flight request still reports its own failure
 * when it settles) is asserted there too. Nothing is duplicated here.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const COLUMNS = () => [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'role', label: 'Role', type: 'text' },
];

const ROWS = (n: number, tag = '') =>
  Array.from({ length: n }, (_, i) => ({ name: `n${i}${tag}`, role: `r${i}${tag}` }));

/** Painted body rows, in DOM order, read back through the name column. */
function bodyNames(table: any): string[] {
  const cells = [...table.shadowRoot.querySelectorAll('tbody td[data-key="name"]')] as HTMLElement[];
  return cells.map(td => (td.querySelector('[value]')?.getAttribute('value')
    ?? td.textContent?.trim() ?? ''));
}

/** Arm the next table/data request and keep its settlement in the test's hands. */
function pendRequest(table: any) {
  const control: any = { resolve: null, reject: null };
  table.addEventListener('@request/table/data', (e: any) => {
    e.detail.discovery.resolve();
    control.resolve = e.detail.data.resolve;
    control.reject = e.detail.data.reject;
  }, { once: true });
  return control;
}

describe('snice-table paint scheduling', () => {
  let table: any;
  let errorSpy: any;
  let rafQueue: FrameRequestCallback[] = [];

  afterEach(() => {
    vi.unstubAllGlobals();
    rafQueue = [];
    errorSpy?.mockRestore();
    errorSpy = null;
    if (table) removeComponent(table);
    table = null;
  });

  /** Replace rAF with a queue we flush by hand — a throttled/background tab. */
  function stubRaf() {
    rafQueue = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  }

  function flushRaf() {
    const queued = rafQueue;
    rafQueue = [];
    queued.forEach(cb => cb(0));
  }

  async function makeTable(opts: { remote?: boolean; virtualize?: boolean; data?: any[] } = {}) {
    const el = await createComponent<any>('snice-table');
    if (opts.remote) el.mode = 'remote';
    if (opts.virtualize) {
      el.virtualize = true;
      el.rowHeight = 40;
    }
    el.columns = COLUMNS();
    if (!opts.remote) {
      el.unsortedData = [...(opts.data ?? [])];
      el.data = opts.data ?? [];
    }
    await wait(40);
    return el;
  }

  // ── candidate 4 ───────────────────────────────────────────────────────────

  it('drops the failed load’s deferred repaint once a newer request has painted', async () => {
    table = await makeTable({ remote: true });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const failing = pendRequest(table);
    table.getTableData();
    await wait(20);

    stubRaf(); // from here on, no frame runs until the test says so
    failing.reject(new Error('network down'));
    await wait(20);
    expect(table.classList.contains('table--error')).toBe(true);

    // A newer request supersedes the failure and paints, all before the failed
    // request's awaited frame gets to run.
    const succeeding = pendRequest(table);
    table.getTableData();
    await wait(20);
    succeeding.resolve({ data: ROWS(2) });
    await wait(20);

    expect(bodyNames(table)).toEqual(['n0', 'n1']);
    expect(table.classList.contains('table--error')).toBe(false);

    const renderBody = vi.spyOn(table, 'renderBody');
    flushRaf();
    await wait(20);

    // Only the winning request still owes a repaint. The superseded failure's
    // frame must bail on the seq check exactly like the success path does.
    expect(renderBody).toHaveBeenCalledTimes(1);
    expect(bodyNames(table)).toEqual(['n0', 'n1']);
    expect(table.classList.contains('table--error')).toBe(false);
    renderBody.mockRestore();
  });

  // ── candidate 6 ───────────────────────────────────────────────────────────

  it('discards an in-flight response that a debounced re-request already superseded', async () => {
    table = await makeTable({ remote: true });

    const inFlight = pendRequest(table);
    table.getTableData();
    await wait(20);

    // Controlled sort change: remote mode re-requests through the 150ms
    // debounce. The header already shows the new sort from this moment on.
    table.currentSort = [{ key: 'name', direction: 'desc' }];
    await wait(20); // still inside the debounce window

    const debounced = pendRequest(table);
    inFlight.resolve({ data: ROWS(2, '-old') });
    await wait(40);

    // The old payload belongs to the pre-sort request and must never reach the
    // body — a flash of rows contradicting the header.
    expect(bodyNames(table)).toEqual([]);
    expect(table.data).toEqual([]);

    await wait(160); // debounce fires
    debounced.resolve({ data: ROWS(2, '-new') });
    await wait(60);

    expect(bodyNames(table)).toEqual(['n0-new', 'n1-new']);
  });

  // ── candidate 7 ───────────────────────────────────────────────────────────

  it('paints the keyboard target from the row model it resolved the target in', async () => {
    table = await makeTable({ virtualize: true, data: ROWS(40) });
    expect(bodyNames(table)[0]).toBe('n0');

    // In-place mutation: the model moves without a data assignment, so nothing
    // refreshes `virtualRowsSnapshot` — the desync candidate 7 is about.
    table.data.reverse();

    table.ensureKeyboardRowRendered(0); // keyboard row 0 is now n39
    await wait(40);

    expect(bodyNames(table)[0]).toBe('n39');
    expect(bodyNames(table)).toContain('n39');
  });

  // ── candidate 8 ───────────────────────────────────────────────────────────

  it('costs exactly one body pass when a shortening delivery re-clamps the page', async () => {
    table = await makeTable({ data: ROWS(20) });
    table.pagination = true;
    table.paginationMode = 'client';
    table.pageSize = 5;
    await wait(40);
    table.goToPage(3);
    await wait(40);
    expect(table.currentPage).toBe(3);

    const renderBody = vi.spyOn(table, 'renderBody');
    const shorter = ROWS(3, '-s');
    table.unsortedData = [...shorter];
    table.data = shorter;
    await wait(60);

    // The clamp is a correction to the state THIS pass is already painting, not
    // a page navigation: re-scheduling repaints identical DOM. (Every clamp site
    // is client-pagination-only, so the watcher's server branch — which would
    // re-enter renderBody synchronously via `loading` — is unreachable from a
    // clamp today; the guard keeps it that way.)
    expect(renderBody).toHaveBeenCalledTimes(1);
    expect(table.currentPage).toBe(1);
    expect(bodyNames(table)).toEqual(['n0-s', 'n1-s', 'n2-s']);
    renderBody.mockRestore();
  });
});
