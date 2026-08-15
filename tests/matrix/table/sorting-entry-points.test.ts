// Matrix slice: SORTING x sort ENTRY POINT x { local, remote }.
//
// The other sorting files drive the imperative API (toggleSort, currentSort,
// setSortComparator). This one covers the surfaces a user actually touches,
// which the imperative tests structurally cannot observe:
//
//   - the table-level `sortable` property (docs/ai/components/table.md:13,
//     default false) that turns headers into sort controls;
//   - clicking / keyboard-activating a sortable header;
//   - the `aria-sort` reflection and the `sort-indicator` element state;
//   - the `sort-change` -> `{sort}` event (docs/ai/components/table.md:114,
//     docs/components/table.md: emitted by `toggleSort()` or a sortable-header
//     state change);
//   - the toolbar sort panel (`setToolbar({showSort:true})`).
//
// Both modes are covered: local mode must re-order the rendered rows, remote
// mode must re-request with the new sort and render the server's answer.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, cellText, dataRows, wait, type MatrixColumn } from './matrix-utils';

const ROWS = [
  { id: '1', name: 'Alice', grp: 'b' },
  { id: '2', name: 'Charlie', grp: 'a' },
  { id: '3', name: 'Bob', grp: 'b' },
];

const cols = (over: Partial<MatrixColumn> = {}): MatrixColumn[] => ([
  { key: 'id', label: 'Id', type: 'text' },
  { key: 'grp', label: 'Grp', type: 'text' },
  { key: 'name', label: 'Name', type: 'text', ...over },
]);

describe('sorting x entry point x sortable header', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  const ids = () =>
    dataRows(table).map(tr => cellText(tr.querySelector('td[data-key="id"]') as HTMLElement));
  const th = (key: string) =>
    table.shadowRoot.querySelector(`th[data-key="${key}"]`) as HTMLElement;

  async function sortableTable(columns = cols(), data: any[] | null = ROWS) {
    table = await makeTable({ columns, data: data ?? [], attrs: { sortable: true } });
    return columns;
  }

  it('[a11y] a sortable header is focusable, labelled, and starts aria-sort="none"', async () => {
    await sortableTable();
    const header = th('name');
    expect(header.classList.contains('sortable')).toBe(true);
    expect(header.getAttribute('tabindex')).toBe('0');
    expect(header.getAttribute('aria-label')).toBe('Sort by Name');
    expect(header.getAttribute('aria-sort')).toBe('none');
  });

  it('[order] clicking a header sorts the rows ascending', async () => {
    await sortableTable();
    th('name').click();
    await wait(80);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
    // Alice(1), Bob(3), Charlie(2) — distinct from the delivery order.
    expect(ids()).toEqual(['1', '3', '2']);
  });

  it('[a11y] aria-sort follows the click cycle asc -> desc -> none', async () => {
    await sortableTable();
    th('name').click();
    await wait(80);
    expect(th('name').getAttribute('aria-sort')).toBe('ascending');

    th('name').click();
    await wait(80);
    expect(th('name').getAttribute('aria-sort')).toBe('descending');
    expect(ids()).toEqual(['2', '3', '1']);

    th('name').click();
    await wait(80);
    expect(th('name').getAttribute('aria-sort')).toBe('none');
    expect(table.currentSort).toEqual([]);
    expect(ids()).toEqual(['1', '2', '3']);
  });

  it('[a11y] Enter and Space on a focused header sort it too', async () => {
    await sortableTable();
    const press = (key: string) => th('name').dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
    );

    press('Enter');
    await wait(80);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
    expect(ids()).toEqual(['1', '3', '2']);

    press(' ');
    await wait(80);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'desc' }]);
    expect(ids()).toEqual(['2', '3', '1']);
  });

  it('[order] a second header click appends a secondary sort key', async () => {
    await sortableTable();
    th('grp').click();
    await wait(80);
    th('name').click();
    await wait(80);

    expect(table.currentSort).toEqual([
      { column: 'grp', direction: 'asc' },
      { column: 'name', direction: 'asc' },
    ]);
    // a/Charlie(2), then b/Alice(1), b/Bob(3)
    expect(ids()).toEqual(['2', '1', '3']);
    expect(th('grp').getAttribute('aria-sort')).toBe('ascending');
    expect(th('name').getAttribute('aria-sort')).toBe('ascending');
  });

  it('[indicator] the sort indicator activates on the sorted column and numbers multi-sort keys', async () => {
    await sortableTable();
    const indicator = (key: string) =>
      th(key).querySelector('.sort-indicator') as HTMLElement;

    expect(indicator('name').classList.contains('active')).toBe(false);

    th('grp').click();
    await wait(80);
    expect(indicator('grp').classList.contains('active')).toBe(true);
    expect(indicator('name').classList.contains('active')).toBe(false);
    // A single sort key carries no order badge.
    expect(indicator('grp').querySelector('.sort-order')).toBeNull();

    th('name').click();
    await wait(80);
    expect(indicator('grp').querySelector('.sort-order')?.textContent).toBe('1');
    expect(indicator('name').querySelector('.sort-order')?.textContent).toBe('2');
  });

  it('[a11y] a column with sortable:false is not a sort control', async () => {
    await sortableTable(cols({ sortable: false }));
    const header = th('name');
    expect(header.classList.contains('sortable')).toBe(false);
    expect(header.getAttribute('aria-sort')).toBeNull();

    header.click();
    await wait(80);
    expect(table.currentSort).toEqual([]);
    expect(ids()).toEqual(['1', '2', '3']);
  });

  it('[a11y] headers are inert while the table-level sortable stays false', async () => {
    table = await makeTable({ columns: cols(), data: ROWS });
    const header = th('name');
    expect(header.classList.contains('sortable')).toBe(false);
    expect(header.getAttribute('aria-sort')).toBeNull();

    header.click();
    await wait(80);
    expect(table.currentSort).toEqual([]);
  });
});

describe('sorting x entry point x sort-change event', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  function listen() {
    const seen: any[] = [];
    table.addEventListener('sort-change', (e: any) => seen.push(JSON.parse(JSON.stringify(e.detail))));
    return seen;
  }

  it('[event] toggleSort emits sort-change carrying the new sort model', async () => {
    table = await makeTable({ columns: cols(), data: ROWS });
    const seen = listen();

    table.toggleSort('name');
    await wait(80);
    table.toggleSort('name');
    await wait(80);
    table.toggleSort('name');
    await wait(80);

    expect(seen).toEqual([
      { sort: [{ column: 'name', direction: 'asc' }] },
      { sort: [{ column: 'name', direction: 'desc' }] },
      { sort: [] },
    ]);
  });

  it('[event] a header click emits sort-change once per interaction', async () => {
    table = await makeTable({ columns: cols(), data: ROWS, attrs: { sortable: true } });
    const seen = listen();

    (table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement).click();
    await wait(80);

    expect(seen).toEqual([{ sort: [{ column: 'name', direction: 'asc' }] }]);
  });

  it('[event] multi-sort reports the whole model, not just the key that changed', async () => {
    table = await makeTable({ columns: cols(), data: ROWS });
    const seen = listen();

    table.toggleSort('grp', true);
    await wait(60);
    table.toggleSort('name', true);
    await wait(80);

    expect(seen[1]).toEqual({
      sort: [
        { column: 'grp', direction: 'asc' },
        { column: 'name', direction: 'asc' },
      ],
    });
  });

  it('[event] assigning currentSort re-sorts without echoing an event back', async () => {
    // Documented emitters are `toggleSort()` and a sortable-header state
    // change; a controlled assignment is the host's own state write, so it
    // applies silently (no event loop back into the host).
    table = await makeTable({ columns: cols(), data: ROWS });
    const seen = listen();

    table.currentSort = [{ column: 'name', direction: 'desc' }];
    await wait(80);

    expect(seen).toEqual([]);
    expect(dataRows(table).map(tr => cellText(tr.querySelector('td[data-key="id"]') as HTMLElement)))
      .toEqual(['2', '3', '1']);
  });
});

describe('sorting x entry point x toolbar sort panel', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  const ids = () =>
    dataRows(table).map(tr => cellText(tr.querySelector('td[data-key="id"]') as HTMLElement));

  // `id` is opted out so the panel's first offered column is the one under test.
  const PANEL_COLS: MatrixColumn[] = [
    { key: 'id', label: 'Id', type: 'text', sortable: false },
    { key: 'name', label: 'Name', type: 'text' },
  ];

  async function openSortPanel() {
    table.setToolbar({ showSort: true });
    await wait(60);
    (table.shadowRoot.querySelector('.toolbar-sort') as HTMLElement).click();
    await wait(60);
    return table.shadowRoot.querySelector('.tt-sort-panel') as HTMLElement;
  }

  it('[order] adding a sort in the toolbar panel sorts the local rows and emits sort-change', async () => {
    table = await makeTable({ columns: PANEL_COLS, data: ROWS, attrs: { sortable: true } });
    const seen: any[] = [];
    table.addEventListener('sort-change', (e: any) => seen.push(JSON.parse(JSON.stringify(e.detail))));

    const panel = await openSortPanel();
    expect(panel.hidden).toBe(false);
    expect(panel.querySelector('.tt-filter-empty')?.textContent).toBe('No sorting applied');

    (panel.querySelector('.tt-filter-add') as HTMLElement).click();
    await wait(80);

    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
    expect(ids()).toEqual(['1', '3', '2']);
    expect(seen).toEqual([{ sort: [{ column: 'name', direction: 'asc' }] }]);
  });

  it('[order] switching the panel direction to descending re-sorts', async () => {
    table = await makeTable({ columns: PANEL_COLS, data: ROWS, attrs: { sortable: true } });
    const panel = await openSortPanel();
    (panel.querySelector('.tt-filter-add') as HTMLElement).click();
    await wait(80);

    const direction = panel.querySelectorAll('snice-select')[1] as any;
    expect(direction.value).toBe('asc');
    direction.value = 'desc';
    direction.dispatchEvent(new Event('change'));
    await wait(80);

    expect(table.currentSort).toEqual([{ column: 'name', direction: 'desc' }]);
    expect(ids()).toEqual(['2', '3', '1']);
  });

  it('[order] clearing the panel restores the delivery order', async () => {
    table = await makeTable({ columns: PANEL_COLS, data: ROWS, attrs: { sortable: true } });
    const panel = await openSortPanel();
    (panel.querySelector('.tt-filter-add') as HTMLElement).click();
    await wait(80);
    expect(ids()).toEqual(['1', '3', '2']);

    (panel.querySelector('.tt-filter-clear') as HTMLElement).click();
    await wait(80);

    expect(table.currentSort).toEqual([]);
    expect(ids()).toEqual(['1', '2', '3']);
  });
});

describe('sorting x entry point x remote mode', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  const ids = () =>
    dataRows(table).map(tr => cellText(tr.querySelector('td[data-key="id"]') as HTMLElement));

  /** Answer every data request with `rows`, recording the payloads. */
  function serve(rows: any[]) {
    const payloads: any[] = [];
    table.addEventListener('@request/table/data', (e: any) => {
      payloads.push(JSON.parse(JSON.stringify(e.detail.payload)));
      e.detail.discovery.resolve();
      e.detail.data.resolve({ data: rows });
    });
    return payloads;
  }

  it('[remote] a header click issues exactly one sorted re-request and renders the answer', async () => {
    table = await makeTable({ columns: cols(), remote: true, attrs: { sortable: true } });
    await deliver(table, ROWS);

    const sorted = [ROWS[0], ROWS[2], ROWS[1]];
    const payloads = serve(sorted);
    const seen: any[] = [];
    table.addEventListener('sort-change', (e: any) => seen.push(JSON.parse(JSON.stringify(e.detail))));

    (table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement).click();
    await wait(300);

    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([{ column: 'name', direction: 'asc' }]);
    expect(seen).toEqual([{ sort: [{ column: 'name', direction: 'asc' }] }]);
    expect(table.shadowRoot.querySelector('th[data-key="name"]')?.getAttribute('aria-sort'))
      .toBe('ascending');
    expect(ids()).toEqual(['1', '3', '2']);
  });

  it('[remote] the toolbar sort panel re-requests with the new sort', async () => {
    table = await makeTable({
      columns: [
        { key: 'id', label: 'Id', type: 'text', sortable: false },
        { key: 'name', label: 'Name', type: 'text' },
      ],
      remote: true,
      attrs: { sortable: true },
    });
    await deliver(table, ROWS);

    const sorted = [ROWS[0], ROWS[2], ROWS[1]];
    const payloads = serve(sorted);

    table.setToolbar({ showSort: true });
    await wait(60);
    (table.shadowRoot.querySelector('.toolbar-sort') as HTMLElement).click();
    await wait(60);
    const panel = table.shadowRoot.querySelector('.tt-sort-panel') as HTMLElement;
    (panel.querySelector('.tt-filter-add') as HTMLElement).click();
    await wait(300);

    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([{ column: 'name', direction: 'asc' }]);
    expect(ids()).toEqual(['1', '3', '2']);
  });
});
