/**
 * Regression coverage for snice-table's ZERO-ROW states: the loading spinner,
 * the ⚠️ load error, and the empty state.
 *
 * These three share one message row (`createEmptyBodyRow`), so they also share
 * every way of going wrong: a state that never paints, a state that paints and
 * never clears, and a state that is shadowed by a staler one. The suite walks
 * the transitions between them on both render paths (ordinary and virtualized)
 * because the virtualizer wipes and rebuilds the tbody itself and therefore
 * owns its own copy of the contract.
 *
 * Documented contract (docs/components/table.md):
 *  - `loading` with no rows shows a full-row spinner; with rows it dims the
 *    body and adds the overlay instead.
 *  - a failed remote load shows `⚠️ <message>` and marks the host `table--error`.
 *  - otherwise a zero-row body shows the `empty-state` slot clone, or the
 *    default "No data" placeholder.
 *  - `virtualize` "keeps every zero-row state".
 *  - the fill row is layout only: it never stands in for, hides, or duplicates
 *    the message row.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'role', label: 'Role', type: 'text' },
];

const ROWS = (n: number, tag = '') =>
  Array.from({ length: n }, (_, i) => ({ name: `n${i}${tag}`, role: `r${i}${tag}` }));

interface Options {
  remote?: boolean;
  virtualize?: boolean;
  data?: any[];
}

async function makeTable(opts: Options = {}): Promise<any> {
  const table = await createComponent<any>('snice-table');
  if (opts.remote) table.mode = 'remote';
  if (opts.virtualize) {
    table.virtualize = true;
    table.rowHeight = 36;
  }
  table.columns = COLUMNS;
  if (!opts.remote) {
    table.data = opts.data ?? [];
    table.unsortedData = [...(opts.data ?? [])];
  }
  table.columnManager.initialize(COLUMNS, table);
  await wait(20);
  table.renderHeader();
  table.renderBody();
  await wait(40);
  return table;
}

// ── DOM oracles ─────────────────────────────────────────────────────────────

function messageCells(table: any): HTMLElement[] {
  return [...table.shadowRoot.querySelectorAll('tbody td.no-data')] as HTMLElement[];
}

function dataRows(table: any): HTMLElement[] {
  return [...table.shadowRoot.querySelectorAll('tbody tr[data-index]')] as HTMLElement[];
}

function fillRows(table: any): HTMLElement[] {
  return [...table.shadowRoot.querySelectorAll('tbody tr.table-fill-row')] as HTMLElement[];
}

/**
 * The single state the body is currently showing a user. Deliberately reports
 * `blank` (a body with neither rows nor a message) as its own value — that is
 * the failure mode these tests exist to catch, and folding it into `empty`
 * would hide it.
 */
function bodyState(table: any): string {
  const cells = messageCells(table);
  if (cells.length > 1) return `multiple-messages(${cells.length})`;
  const cell = cells[0];
  if (cell) {
    if (cell.querySelector('snice-progress')) return 'loading';
    if (cell.querySelector('.table-error-message')) return 'error';
    if (cell.querySelector('snice-empty-state')) return 'empty';
    if (cell.querySelector('[slot="empty-state"], .custom-empty')) return 'empty-slotted';
    return 'message-blank';
  }
  return dataRows(table).length > 0 ? 'rows' : 'blank';
}

function errorText(table: any): string {
  return table.shadowRoot.querySelector('.table-error-message')?.textContent ?? '';
}

// ── remote request control ──────────────────────────────────────────────────

/** Arm the next table/data request and keep its resolution in the test's hands. */
function pendRequest(table: any) {
  const control: any = { resolve: null, reject: null };
  table.addEventListener('@request/table/data', (e: any) => {
    e.detail.discovery.resolve();
    control.resolve = e.detail.data.resolve;
    control.reject = e.detail.data.reject;
  }, { once: true });
  return control;
}

async function deliver(table: any, rows: any[]) {
  const req = pendRequest(table);
  table.getTableData();
  await wait(20);
  req.resolve({ data: rows });
  await wait(60);
}

async function failDelivery(table: any, message: string) {
  const req = pendRequest(table);
  table.getTableData();
  await wait(20);
  req.reject(new Error(message));
  await wait(80);
}

// ── suite ───────────────────────────────────────────────────────────────────

const PATHS: Array<[string, boolean]> = [['ordinary', false], ['virtualized', true]];

// The message row is built from OTHER custom elements. Every other assertion in
// this file is a tag-name query, which passes just as happily on an element the
// page never registered — an unregistered custom element is a 0x0 inline box,
// so a "loading" state that satisfies `querySelector('snice-progress')` can
// still paint literally nothing for a real consumer. (It did: importing the
// table pulled in this folder's ./snice-progress, which registers
// `snice-table-progress` for the progress CELL, and never the real one.)
// Registration is therefore asserted directly, once, at the module level.
describe('snice-table zero-row states register the elements they emit', () => {
  it.each(['snice-progress', 'snice-empty-state'])(
    'importing snice-table defines %s',
    (tag) => {
      expect(customElements.get(tag)).toBeTruthy();
    },
  );
});

describe.each(PATHS)('snice-table zero-row states (%s render path)', (_label, virtualize) => {
  let table: any;
  let errorSpy: any;

  afterEach(() => {
    if (table) removeComponent(table as HTMLElement);
    table = null;
    errorSpy?.mockRestore();
    errorSpy = null;
  });

  it('shows the loading spinner before any data has arrived', async () => {
    table = await makeTable({ virtualize });
    table.loading = true;
    await wait(40);

    expect(bodyState(table)).toBe('loading');
  });

  it('clears the loading state and paints rows once data is delivered', async () => {
    table = await makeTable({ virtualize });
    table.loading = true;
    await wait(40);
    expect(bodyState(table)).toBe('loading');

    const rows = ROWS(3);
    table.unsortedData = [...rows];
    table.data = rows;
    table.loading = false;
    await wait(60);

    expect(bodyState(table)).toBe('rows');
    expect(dataRows(table).length).toBe(3);
    expect(messageCells(table)).toHaveLength(0);
    expect(table.shadowRoot.querySelector('[part~="loading-overlay"]')).toBeNull();
  });

  it('renders the empty state for a local empty dataset', async () => {
    table = await makeTable({ virtualize, data: [] });

    expect(bodyState(table)).toBe('empty');
  });

  it('renders the empty state after rows are replaced by a local empty dataset', async () => {
    table = await makeTable({ virtualize, data: ROWS(3) });
    expect(bodyState(table)).toBe('rows');

    table.unsortedData = [];
    table.data = [];
    await wait(60);

    expect(bodyState(table)).toBe('empty');
  });

  it('re-creates the right message row across empty -> rows -> empty transitions', async () => {
    table = await makeTable({ virtualize, data: [] });
    const seen: string[] = [bodyState(table)];

    const rows = ROWS(2, 'a');
    table.unsortedData = [...rows];
    table.data = rows;
    await wait(60);
    seen.push(bodyState(table));

    table.unsortedData = [];
    table.data = [];
    await wait(60);
    seen.push(bodyState(table));

    const more = ROWS(4, 'b');
    table.unsortedData = [...more];
    table.data = more;
    await wait(60);
    seen.push(bodyState(table));

    table.unsortedData = [];
    table.data = [];
    await wait(60);
    seen.push(bodyState(table));

    expect(seen).toEqual(['empty', 'rows', 'empty', 'rows', 'empty']);
    expect(messageCells(table)).toHaveLength(1);
  });

  it('shows the loading state while a remote request is in flight', async () => {
    table = await makeTable({ remote: true, virtualize });
    const req = pendRequest(table);
    table.getTableData();
    await wait(40);

    expect(bodyState(table)).toBe('loading');

    req.resolve({ data: ROWS(3) });
    await wait(60);
    expect(bodyState(table)).toBe('rows');
  });

  it('shows the empty state when a remote request succeeds with no rows', async () => {
    table = await makeTable({ remote: true, virtualize });
    await deliver(table, []);

    expect(bodyState(table)).toBe('empty');
    expect(table.loading).toBe(false);
  });

  it('shows the load error when a remote request fails', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await failDelivery(table, 'network down');

    expect(bodyState(table)).toBe('error');
    expect(errorText(table)).toContain('network down');
    expect(table.classList.contains('table--error')).toBe(true);
  });

  it('clears the load error when a re-request succeeds', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await failDelivery(table, 'network down');
    expect(bodyState(table)).toBe('error');

    await deliver(table, ROWS(2));

    expect(bodyState(table)).toBe('rows');
    expect(table.classList.contains('table--error')).toBe(false);
  });

  it('clears the load error when a re-request succeeds with no rows', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await failDelivery(table, 'network down');
    expect(bodyState(table)).toBe('error');

    await deliver(table, []);

    expect(bodyState(table)).toBe('empty');
    expect(table.classList.contains('table--error')).toBe(false);
  });

  // Candidate 5: `loadError` is set by the remote catch path and cleared only
  // by the remote success path. An app that falls back to local data after a
  // failed load keeps a table permanently marked `table--error`, and its next
  // empty render shows the stale ⚠️ instead of the empty state.
  it('clears the load error when rows are assigned locally after a failure', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await failDelivery(table, 'network down');
    expect(bodyState(table)).toBe('error');

    const rows = ROWS(2);
    table.unsortedData = [...rows];
    table.data = rows;
    await wait(60);

    expect(bodyState(table)).toBe('rows');
    expect(table.classList.contains('table--error')).toBe(false);
  });

  it('shows the empty state, not the stale error, after a local empty assignment', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await failDelivery(table, 'network down');
    expect(bodyState(table)).toBe('error');

    table.unsortedData = [];
    table.data = [];
    await wait(60);

    expect(bodyState(table)).toBe('empty');
    expect(table.classList.contains('table--error')).toBe(false);
  });

  // The counterpart to the two tests above: clearing on ANY `data` assignment
  // is too broad on its own, because the row-reorder handler republishes the
  // SAME rows as a new array. That is not a delivery, and the documented
  // contract keeps a failed reload's error until data actually arrives — so a
  // drag must not silently dismiss it.
  it('keeps the load error when a row drag republishes the same rows', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await deliver(table, ROWS(3));
    await failDelivery(table, 'network down');
    expect(table.classList.contains('table--error')).toBe(true);

    table.dispatchEvent(new CustomEvent('row-reorder', {
      detail: { fromIndex: 0, toIndex: 2 },
    }));
    await wait(60);

    expect(table.data.map((r: any) => r.name)).toEqual(['n1', 'n2', 'n0']);
    expect(table.loadError).toBe('network down');
    expect(table.classList.contains('table--error')).toBe(true);
  });

  // The documented LIMIT of the two clearing tests above (docs/components/
  // table.md): a request that was ALREADY in flight when the local rows landed
  // still reports its own failure when it settles — nothing superseded it, so
  // it is the newest attempt and it did fail. Pinned so the semantics can only
  // ever change deliberately, together with the docs.
  it('still reports an in-flight failure that settles after a local assignment', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const req = pendRequest(table);
    table.getTableData();
    await wait(20);

    const rows = ROWS(2);
    table.unsortedData = [...rows];
    table.data = rows;
    await wait(40);
    expect(table.classList.contains('table--error')).toBe(false);

    req.reject(new Error('late failure'));
    await wait(60);

    expect(table.loadError).toBe('late failure');
    expect(table.classList.contains('table--error')).toBe(true);
    // The locally assigned rows stay: the ⚠️ row only replaces an EMPTY body.
    expect(bodyState(table)).toBe('rows');
  });

  it('renders a slotted empty-state clone instead of the default placeholder', async () => {
    table = await makeTable({ virtualize, data: [] });
    const custom = document.createElement('div');
    custom.className = 'custom-empty';
    custom.setAttribute('slot', 'empty-state');
    custom.textContent = 'Nothing here yet';
    table.appendChild(custom);

    table.renderBody();
    await wait(40);

    const cells = messageCells(table);
    expect(cells).toHaveLength(1);
    expect(cells[0].querySelector('.custom-empty')?.textContent).toBe('Nothing here yet');
    expect(cells[0].querySelector('snice-empty-state')).toBeNull();
  });

  it('spans the message row across every rendered column', async () => {
    table = await makeTable({ virtualize, data: [] });
    const cell = messageCells(table)[0] as HTMLTableCellElement;

    expect(cell).toBeTruthy();
    expect(cell.colSpan).toBe(COLUMNS.length);
  });
});

// ── fill-row interaction (explicit host height) ─────────────────────────────
//
// happy-dom performs no layout, so the two boxes `updateFillRow()` compares
// are pinned exactly the way tests/matrix/table/height-fill-support
// does. This pins the RULE, not the browser's box arithmetic.

function stubLayout(table: any, frameHeight: number, tableHeight: number) {
  const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement | null;
  const tableEl = frame?.querySelector('table') as HTMLElement | null;
  if (!frame || !tableEl) throw new Error('table frame not rendered yet');
  Object.defineProperty(frame, 'clientHeight', { get: () => frameHeight, configurable: true });
  Object.defineProperty(tableEl, 'offsetHeight', { get: () => tableHeight, configurable: true });
  table.style.height = `${frameHeight}px`;
}

describe.each(PATHS)('snice-table zero-row states with an explicit height (%s)', (_label, virtualize) => {
  let table: any;
  let errorSpy: any;

  afterEach(() => {
    if (table) removeComponent(table as HTMLElement);
    table = null;
    errorSpy?.mockRestore();
    errorSpy = null;
  });

  it('shows exactly one empty-state message row and no filler', async () => {
    table = await makeTable({ virtualize, data: [] });
    stubLayout(table, 600, 100);
    table.renderBody();
    await wait(60);

    expect(messageCells(table)).toHaveLength(1);
    expect(bodyState(table)).toBe('empty');
    // The filler clones a DATA row; with none on screen there is nothing to
    // clone, and cloning the message row would duplicate it on screen.
    expect(fillRows(table)).toHaveLength(0);
  });

  it('shows exactly one loading message row and no filler', async () => {
    table = await makeTable({ virtualize, data: [] });
    stubLayout(table, 600, 100);
    table.loading = true;
    await wait(60);

    expect(messageCells(table)).toHaveLength(1);
    expect(bodyState(table)).toBe('loading');
    expect(fillRows(table)).toHaveLength(0);
  });

  it('shows exactly one error message row and no filler', async () => {
    table = await makeTable({ remote: true, virtualize });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubLayout(table, 600, 100);
    await failDelivery(table, 'network down');

    expect(messageCells(table)).toHaveLength(1);
    expect(bodyState(table)).toBe('error');
    expect(fillRows(table)).toHaveLength(0);
  });

  it('swaps between the filler and the message row across rows -> empty -> rows', async () => {
    table = await makeTable({ virtualize, data: ROWS(3) });
    stubLayout(table, 600, 100);
    table.renderBody();
    await wait(60);

    expect(bodyState(table)).toBe('rows');
    expect(fillRows(table)).toHaveLength(1);
    expect(messageCells(table)).toHaveLength(0);

    table.unsortedData = [];
    table.data = [];
    await wait(60);

    expect(bodyState(table)).toBe('empty');
    expect(messageCells(table)).toHaveLength(1);
    expect(fillRows(table)).toHaveLength(0);

    const rows = ROWS(2, 'z');
    table.unsortedData = [...rows];
    table.data = rows;
    await wait(60);

    expect(bodyState(table)).toBe('rows');
    expect(fillRows(table)).toHaveLength(1);
    expect(messageCells(table)).toHaveLength(0);
  });
});
