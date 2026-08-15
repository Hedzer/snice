// Matrix slice: SORTING x remote mode x { no pipeline, valueGetter, valueFormatter,
// valueGetter+valueFormatter, formatter, valueGetter+formatter }
//                x { initial delivery, re-delivery (recycled DOM), mutated re-delivery }.
//
// Documented contract exercised here (docs/ai/components/table.md):
//   - remote "re-requests only on currentPage/currentSort/pageSize" with a 150ms debounce.
//   - request payload is `{search,sort,filter,selector,page?,pageSize?}`; response `{data,totalItems?}`.
//   - `toggleSort(key,multi?)` cycles asc -> desc -> unsorted; multi appends.
//   - in remote mode the server owns the ordering: whatever `data` comes back is
//     what must be rendered, in that order, through the column's display pipeline.
//   - `valueGetter` runs for display (remote column keys routinely name the
//     server's sort field rather than a row field).
//
// Divergences pinned by this slice, now fixed:
//   MATRIX-1          the rendered cell value carries valueFormatter output.
//   MATRIX-sorting-3  the rendered cell value carries formatter output.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, respondWith, expectCellsMatch, wait, type MatrixColumn } from './matrix-utils';

interface Pipeline {
  key: string;
  field: string;
  decorate(base: MatrixColumn): MatrixColumn;
}

const VFMT = (v: any) => `<${v}>`;
const FMT = (v: any) => `[${v}]`;

const PIPELINES: Pipeline[] = [
  { key: 'no-pipeline', field: 'name',
    decorate: b => ({ ...b }) },
  { key: 'valueGetter', field: 'nameSrc',
    decorate: b => ({ ...b, valueGetter: (_v: any, r: any) => r.nameSrc }) },
  { key: 'valueFormatter', field: 'name',
    decorate: b => ({ ...b, valueFormatter: VFMT }) },
  { key: 'valueGetter+valueFormatter', field: 'nameSrc',
    decorate: b => ({ ...b, valueGetter: (_v: any, r: any) => r.nameSrc, valueFormatter: VFMT }) },
  { key: 'formatter', field: 'name',
    decorate: b => ({ ...b, formatter: FMT }) },
  { key: 'valueGetter+formatter', field: 'nameSrc',
    decorate: b => ({ ...b, valueGetter: (_v: any, r: any) => r.nameSrc, formatter: FMT }) },
];

const ORDER_COLS: MatrixColumn[] = [{ key: 'id' }];

/** Delivery order differs from every asserted sort order. */
const BASE: Array<[string, string]> = [['1', 'Alice'], ['2', 'Charlie'], ['3', 'Bob']];
const pick = (rows: any[], order: number[]) => order.map(i => rows[i]);

/** Debounce (150ms) + request/response + rAF render. */
const SORT_WAIT = 300;

describe.each(PIPELINES)('sorting x remote mode x $key', (p: Pipeline) => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  function columnsFor(withGroup = false): MatrixColumn[] {
    const id: MatrixColumn = { key: 'id', label: 'Id', type: 'text', sortable: true };
    const name = p.decorate({ key: 'name', label: 'Name', type: 'text', sortable: true });
    if (!withGroup) return [id, name];
    return [id, { key: 'grp', label: 'Grp', type: 'text', sortable: true }, name];
  }

  function mkRows(spec = BASE): any[] {
    return spec.map(([id, name]) => ({ id, [p.field]: name }));
  }

  async function remoteTable(withGroup = false) {
    const columns = columnsFor(withGroup);
    table = await makeTable({ columns, remote: true });
    return columns;
  }

  /**
   * Run `act` (which must mutate sort state), capture every table/data request
   * it produces, and let the single debounced request resolve with `rows`.
   */
  async function sortAndServe(act: () => void, rows: any[]) {
    const payloads: any[] = [];
    const spy = (e: any) => payloads.push(JSON.parse(JSON.stringify(e.detail.payload)));
    table.addEventListener('@request/table/data', spy);
    respondWith(table, rows);
    act();
    await wait(SORT_WAIT);
    table.removeEventListener('@request/table/data', spy);
    return payloads;
  }

  // ── combo 1: initial delivery, no sort ────────────────────────────────────
  it(`[order] initial delivery renders the server order`, async () => {
    await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    expectCellsMatch(table, rows, ORDER_COLS);
  });

  it(`[cells] initial delivery renders pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    expectCellsMatch(table, rows, columns);
  });

  // ── combo 2: toggleSort asc re-requests and renders the server's asc order ─
  it(`[order] toggleSort issues one request carrying sort asc and renders the response`, async () => {
    await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    const payloads = await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));

    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([{ column: 'name', direction: 'asc' }]);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
    expectCellsMatch(table, pick(rows, [0, 2, 1]), ORDER_COLS);
  });

  it(`[cells] sort-asc response renders pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    expectCellsMatch(table, pick(rows, [0, 2, 1]), columns);
  });

  // ── combo 3: second toggle -> desc ────────────────────────────────────────
  it(`[order] second toggleSort re-requests with sort desc`, async () => {
    await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    const payloads = await sortAndServe(() => table.toggleSort('name'), pick(rows, [1, 2, 0]));

    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([{ column: 'name', direction: 'desc' }]);
    expectCellsMatch(table, pick(rows, [1, 2, 0]), ORDER_COLS);
  });

  it(`[cells] sort-desc response renders pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [1, 2, 0]));
    expectCellsMatch(table, pick(rows, [1, 2, 0]), columns);
  });

  // ── combo 4: third toggle -> cleared sort ─────────────────────────────────
  it(`[order] third toggleSort re-requests with an empty sort`, async () => {
    await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [1, 2, 0]));
    const payloads = await sortAndServe(() => table.toggleSort('name'), rows);

    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([]);
    expect(table.currentSort).toEqual([]);
    expectCellsMatch(table, rows, ORDER_COLS);
  });

  it(`[cells] cleared-sort response renders pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [1, 2, 0]));
    await sortAndServe(() => table.toggleSort('name'), rows);
    expectCellsMatch(table, rows, columns);
  });

  // ── combo 5: sorting BEFORE any data has arrived ──────────────────────────
  it(`[order] sorting before the first delivery renders the first response`, async () => {
    await remoteTable();
    const rows = mkRows();
    const payloads = await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));

    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([{ column: 'name', direction: 'asc' }]);
    expectCellsMatch(table, pick(rows, [0, 2, 1]), ORDER_COLS);
  });

  it(`[cells] first delivery after a pre-data sort renders pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    expectCellsMatch(table, pick(rows, [0, 2, 1]), columns);
  });

  // ── combo 6: multi-sort coalesces into one request carrying both keys ─────
  it(`[order] multi-sort sends one request with both sort keys`, async () => {
    await remoteTable(true);
    const rows = [
      { id: '1', grp: 'b', [p.field]: 'Charlie' },
      { id: '2', grp: 'a', [p.field]: 'Alice' },
      { id: '3', grp: 'b', [p.field]: 'Alpha' },
      { id: '4', grp: 'a', [p.field]: 'Zed' },
    ];
    await deliver(table, rows);
    const served = pick(rows, [1, 3, 2, 0]); // grp asc, name asc
    const payloads = await sortAndServe(() => {
      table.toggleSort('grp', true);
      table.toggleSort('name', true);
    }, served);

    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([
      { column: 'grp', direction: 'asc' },
      { column: 'name', direction: 'asc' },
    ]);
    expectCellsMatch(table, served, ORDER_COLS);
  });

  it(`[cells] multi-sort response renders pipeline values`, async () => {
    const columns = await remoteTable(true);
    const rows = [
      { id: '1', grp: 'b', [p.field]: 'Charlie' },
      { id: '2', grp: 'a', [p.field]: 'Alice' },
      { id: '3', grp: 'b', [p.field]: 'Alpha' },
      { id: '4', grp: 'a', [p.field]: 'Zed' },
    ];
    await deliver(table, rows);
    const served = pick(rows, [1, 3, 2, 0]);
    await sortAndServe(() => {
      table.toggleSort('grp', true);
      table.toggleSort('name', true);
    }, served);
    expectCellsMatch(table, served, columns);
  });

  // ── combo 7: sorted, then re-delivery of the SAME identities (recycled DOM) ─
  it(`[order] re-delivering the sorted rows keeps the order`, async () => {
    await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    const sorted = pick(rows, [0, 2, 1]);
    await sortAndServe(() => table.toggleSort('name'), sorted);
    // Same row objects again — the reconciler recycles every <tr>.
    await deliver(table, sorted);
    expectCellsMatch(table, sorted, ORDER_COLS);
  });

  it(`[cells] recycled rows still render pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    const sorted = pick(rows, [0, 2, 1]);
    await sortAndServe(() => table.toggleSort('name'), sorted);
    await deliver(table, sorted);
    expectCellsMatch(table, sorted, columns);
  });

  // ── combo 8: sorted, then MUTATED re-delivery ─────────────────────────────
  it(`[order] mutated re-delivery after a sort renders the new server order`, async () => {
    await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));

    // Same ids, changed sort field, new server order (Aaron, Bob, Charlie).
    const mutated = [
      { id: '1', [p.field]: 'Aaron' },
      { id: '3', [p.field]: 'Bob' },
      { id: '2', [p.field]: 'Charlie' },
    ];
    await deliver(table, mutated);
    expectCellsMatch(table, mutated, ORDER_COLS);
  });

  it(`[cells] mutated re-delivery renders the new pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    const mutated = [
      { id: '1', [p.field]: 'Aaron' },
      { id: '3', [p.field]: 'Bob' },
      { id: '2', [p.field]: 'Charlie' },
    ];
    await deliver(table, mutated);
    expectCellsMatch(table, mutated, columns);
  });

  // ── combo 8b: sorting again AFTER a mutated re-delivery ───────────────────
  it(`[order] sorting after a mutated re-delivery re-requests with the next direction`, async () => {
    await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    const mutated = [
      { id: '1', [p.field]: 'Aaron' },
      { id: '3', [p.field]: 'Bob' },
      { id: '2', [p.field]: 'Charlie' },
    ];
    await deliver(table, mutated);

    const desc = [mutated[2], mutated[1], mutated[0]];
    const payloads = await sortAndServe(() => table.toggleSort('name'), desc);
    expect(payloads.length).toBe(1);
    expect(payloads[0].sort).toEqual([{ column: 'name', direction: 'desc' }]);
    expectCellsMatch(table, desc, ORDER_COLS);
  });

  it(`[cells] post-mutation re-sort renders pipeline values`, async () => {
    const columns = await remoteTable();
    const rows = mkRows();
    await deliver(table, rows);
    await sortAndServe(() => table.toggleSort('name'), pick(rows, [0, 2, 1]));
    const mutated = [
      { id: '1', [p.field]: 'Aaron' },
      { id: '3', [p.field]: 'Bob' },
      { id: '2', [p.field]: 'Charlie' },
    ];
    await deliver(table, mutated);
    const desc = [mutated[2], mutated[1], mutated[0]];
    await sortAndServe(() => table.toggleSort('name'), desc);
    expectCellsMatch(table, desc, columns);
  });

  // ── combo 9: a comparator must not take over the server's ordering ────────
  // The server owns ordering in remote mode, so an installed comparator is
  // inert here: it neither reorders the response nor changes the payload,
  // which stays the documented `{search,sort,filter,selector}`.
  const lengthComparator = (a: any, b: any, direction: 'asc' | 'desc') => {
    const c = String(a).length - String(b).length;
    return direction === 'asc' ? c : -c;
  };

  it(`[order] setSortComparator leaves the server order and payload untouched`, async () => {
    await remoteTable();
    table.setSortComparator('name', lengthComparator);
    const rows = mkRows();
    await deliver(table, rows);
    // Served ascending by name; a length comparator would have put Bob first.
    const served = pick(rows, [0, 2, 1]);
    const payloads = await sortAndServe(() => table.toggleSort('name'), served);

    expect(payloads.length).toBe(1);
    expect(Object.keys(payloads[0]).sort()).toEqual(['filter', 'search', 'selector', 'sort']);
    expect(payloads[0].sort).toEqual([{ column: 'name', direction: 'asc' }]);
    expectCellsMatch(table, served, ORDER_COLS);
  });

  it(`[order] a declarative sortComparator is inert in remote mode too`, async () => {
    const columns = columnsFor();
    (columns[1] as any).sortComparator = lengthComparator;
    table = await makeTable({ columns, remote: true });
    const rows = mkRows();
    await deliver(table, rows);
    const served = pick(rows, [0, 2, 1]);
    await sortAndServe(() => table.toggleSort('name'), served);
    expectCellsMatch(table, served, ORDER_COLS);
    expectCellsMatch(table, served, columns);
  });
});
