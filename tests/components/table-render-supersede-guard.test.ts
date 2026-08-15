// Invariant guard: snice-table remote rows must be painted by the time the data
// response has been applied — never left blank waiting on an animation frame,
// and never blanked by a render that supersedes a pending one.
//
// Two ways that could break, both asserted below:
//   (a) a re-render landing between the response and the frame supersedes the
//       pending renderBody -> tbody exists but the cells are empty;
//   (b) a background / throttled window never runs the frame -> the body stays
//       blank from the start while table.data is already populated.
//
// What keeps it true: the rAF renderBody in getTableData
// (packages/components/src/table/snice-table.ts:326-329) is only a redundant
// repaint. `this.data = response.data` (line 318) fires the data watcher ->
// scheduleRender('body') (snice-table.ts:1926-1934) and `this.loading = false`
// (line 325) fires the loading watcher -> synchronous renderBody()
// (snice-table.ts:1936-1940), both BEFORE the await. Dropping the frame, or
// never running it at all, therefore cannot leave the body unpainted — which is
// exactly what these tests pin down by stubbing requestAnimationFrame.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

describe('snice-table — remote body paint survives dropped/superseded frames', () => {
  let table: any;
  let rafQueue: FrameRequestCallback[] = [];
  // Runs synchronously at the moment the component asks for a frame — i.e.
  // exactly between the data response and the awaited paint frame.
  let atFrameBoundary: (() => void) | null = null;

  afterEach(() => {
    vi.unstubAllGlobals();
    rafQueue = [];
    atFrameBoundary = null;
    if (table) removeComponent(table);
    table = null;
  });

  /** Replace rAF with a queue we flush by hand — a throttled/background tab. */
  function stubRaf() {
    rafQueue = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      if (atFrameBoundary) {
        const hook = atFrameBoundary;
        atFrameBoundary = null;
        hook();
      }
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

  const COLUMNS = () => [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
  ];

  const ROWS = [
    { name: 'Acme', city: 'Berlin' },
    { name: 'Globex', city: 'Oslo' },
  ];

  function respondWith(rows: any[]) {
    table.addEventListener('@request/table/data', (e: any) => {
      e.detail.discovery.resolve();
      e.detail.data.resolve({ data: rows, totalItems: rows.length });
    }, { once: true });
  }

  function bodyCellTexts(): string[] {
    const cells = [...table.shadowRoot.querySelectorAll('tbody td[data-key="name"]')] as HTMLElement[];
    return cells.map(td => (td.querySelector('[value]')?.getAttribute('value')
      ?? td.textContent?.trim() ?? ''));
  }

  async function makeRemoteTable() {
    table = await createComponent<any>('snice-table');
    table.mode = 'remote';
    table.columns = COLUMNS();
    await wait(10);
  }

  // (b) the frame never arrives (background / throttled window). The rows
  // must already be on screen once the response has been applied.
  it('paints rows in a throttled window where the paint frame never fires', async () => {
    await makeRemoteTable();
    stubRaf();

    respondWith(ROWS);
    table.getTableData();
    await wait(50); // deliberately no flushRaf()

    expect(table.data).toHaveLength(2);
    expect(table.shadowRoot.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(bodyCellTexts()).toEqual(['Acme', 'Globex']);
  });

  // (a) a parent re-render with fresh column array identity, landing
  // exactly between the response and the paint frame, must not swallow the body.
  it('paints rows when fresh columns land at the response/frame boundary', async () => {
    await makeRemoteTable();
    stubRaf();
    atFrameBoundary = () => { table.columns = COLUMNS(); }; // fresh identity

    respondWith(ROWS);
    table.getTableData();
    await wait(30);

    expect(bodyCellTexts()).toEqual(['Acme', 'Globex']); // before any frame
    flushRaf();
    await wait(30);
    expect(bodyCellTexts()).toEqual(['Acme', 'Globex']); // and after it
  });

  // (a) supersede variant: a newer data request at the frame boundary
  // bumps dataRequestSeq, so the pending guarded renderBody is dropped
  // outright. The rows applied by the first response must stay painted.
  it('keeps rows painted when a newer request supersedes the pending frame', async () => {
    await makeRemoteTable();
    stubRaf();
    atFrameBoundary = () => {
      respondWith([{ name: 'Initech', city: 'Rome' }]);
      table.getTableData(); // seq++ -> the pending renderBody is discarded
    };

    respondWith(ROWS);
    table.getTableData();
    await wait(30);
    // The superseding response lands here too; whichever is current, the body
    // must never be a set of empty rows.
    expect(bodyCellTexts().length).toBeGreaterThan(0);
    expect(bodyCellTexts().every(t => t.length > 0)).toBe(true);

    flushRaf();
    await wait(50);
    expect(bodyCellTexts()).toEqual(['Initech']); // second response painted too
  });

  // (a) controlled-sort variant: a fresh currentSort array identity
  // re-requests in remote mode (debounced) while the first frame is pending.
  it('keeps rows painted when a controlled sort supersedes the pending frame', async () => {
    await makeRemoteTable();
    stubRaf();

    respondWith(ROWS);
    table.getTableData();
    await wait(20);

    table.currentSort = [{ key: 'name', direction: 'asc' }];
    respondWith(ROWS);
    await wait(300); // 150ms debounce + response
    flushRaf();
    await wait(20);

    expect(bodyCellTexts()).toEqual(['Acme', 'Globex']);
  });

  // (b) realistic bootstrap: mode="remote" attribute + a controller
  // attaching, which fires the table/config and table/data requests together —
  // both of which await a frame before rendering. Throttled window: no frame
  // ever runs, yet header and body must both be painted.
  it('paints header and body on controller bootstrap with no frames at all', async () => {
    stubRaf();
    table = document.createElement('snice-table') as any;
    table.setAttribute('mode', 'remote');
    table.addEventListener('@request/table/config', (e: any) => {
      e.detail.discovery.resolve();
      e.detail.data.resolve({ columns: COLUMNS(), selectorOptions: [] });
    });
    table.addEventListener('@request/table/data', (e: any) => {
      e.detail.discovery.resolve();
      e.detail.data.resolve({ data: ROWS, totalItems: ROWS.length });
    });
    document.body.appendChild(table);
    await table.ready;
    table.dispatchEvent(new CustomEvent('controller-attached', { detail: {} }));
    await wait(60); // no flushRaf()

    expect(table.data).toHaveLength(2);
    expect(table.shadowRoot.querySelectorAll('thead th').length).toBeGreaterThan(0);
    expect(bodyCellTexts()).toEqual(['Acme', 'Globex']);
  });
});
