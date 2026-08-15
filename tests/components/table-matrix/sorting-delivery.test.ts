// Matrix slice: SORTING x delivery stage (local mode).
//
// This file crosses the sort state against WHEN the rows arrive:
//   - sort applied BEFORE any data exists, then the first delivery;
//   - sort applied, then a re-delivery of the SAME row identities;
//   - sort applied, then a MUTATED re-delivery (new row objects, new values);
//   - sort applied, then a `setData()` + `renderBody()` bulk load;
//   - a fresh sort issued AFTER a mutated re-delivery.
//
// Documented contract (docs/ai/components/table.md):
//   - `currentSort` is the table's sort state, and local sorting is client-side
//     over `data`; `table.data =` rerenders, `setData()` is non-eager so the
//     caller pairs it with `renderBody()`.
//   - Therefore, with a non-empty `currentSort`, the rendered view of `data`
//     must be the sorted view — the delivery that produced `data` cannot matter.
//
// Divergences pinned by this slice, now fixed:
//   MATRIX-sorting-1  a local `data` assignment / `setData()` used to render raw
//                     delivered order even though `currentSort` is still set.
//   MATRIX-1          the rendered cell value now carries valueFormatter output.
//   MATRIX-sorting-3  the rendered cell value now carries formatter output.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, expectCellsMatch, wait, type MatrixColumn } from './matrix-utils';

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

// Delivery order is distinct from every asserted sort order.
const BASE: Array<[string, string]> = [['1', 'Alice'], ['2', 'Charlie'], ['3', 'Bob']];
const MUTATED: Array<[string, string]> = [['1', 'Zoe'], ['2', 'Bob'], ['3', 'Charlie']];
const pick = (rows: any[], order: number[]) => order.map(i => rows[i]);

describe.each(PIPELINES)('sorting x delivery stage x $key', (p: Pipeline) => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  const columnsFor = (): MatrixColumn[] => ([
    { key: 'id', label: 'Id', type: 'text', sortable: true },
    p.decorate({ key: 'name', label: 'Name', type: 'text', sortable: true }),
  ]);

  const mkRows = (spec: Array<[string, string]>) =>
    spec.map(([id, name]) => ({ id, [p.field]: name }));

  async function sortedTable(data: any[]) {
    const columns = columnsFor();
    table = await makeTable({ columns, data });
    table.toggleSort('name');
    await wait(60);
    return columns;
  }

  // ── combo 1: sort applied before ANY data, then the first delivery ────────
  it(`[order] first delivery after a pre-data sort is sorted`, async () => {
    const columns = columnsFor();
    table = await makeTable({ columns, data: [] });
    table.toggleSort('name');
    await wait(60);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);

    const rows = mkRows(BASE);
    table.data = rows;
    await wait(60);
    // Alice(1), Bob(3), Charlie(2)
    expectCellsMatch(table, pick(rows, [0, 2, 1]), ORDER_COLS);
  });

  it(`[cells] first delivery after a pre-data sort renders sorted pipeline values`, async () => {
    const columns = columnsFor();
    table = await makeTable({ columns, data: [] });
    table.toggleSort('name');
    await wait(60);
    const rows = mkRows(BASE);
    table.data = rows;
    await wait(60);
    expectCellsMatch(table, pick(rows, [0, 2, 1]), columns);
  });

  // The sort STATE survives the delivery — only the rendered order is wrong,
  // which is what makes the table look right in its header and wrong in its body.
  it(`[state] currentSort survives a delivery that follows a pre-data sort`, async () => {
    const columns = columnsFor();
    table = await makeTable({ columns, data: [] });
    table.toggleSort('name');
    await wait(60);
    table.data = mkRows(BASE);
    await wait(60);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  // ── combo 2: re-delivery of the SAME row identities ──────────────────────
  it(`[order] re-delivering the same identities keeps the sorted order`, async () => {
    const rows = mkRows(BASE);
    await sortedTable(rows);
    expectCellsMatch(table, pick(rows, [0, 2, 1]), ORDER_COLS); // sorted before re-delivery

    table.data = [...rows]; // same row objects — the reconciler recycles every <tr>
    await wait(60);
    expectCellsMatch(table, pick(rows, [0, 2, 1]), ORDER_COLS);
  });

  it(`[cells] re-delivered identities render sorted pipeline values`, async () => {
    const rows = mkRows(BASE);
    const columns = await sortedTable(rows);
    table.data = [...rows];
    await wait(60);
    expectCellsMatch(table, pick(rows, [0, 2, 1]), columns);
  });

  // ── combo 3: MUTATED re-delivery (new objects, new sort values) ──────────
  it(`[order] mutated re-delivery is re-sorted by the new values`, async () => {
    await sortedTable(mkRows(BASE));
    const mutated = mkRows(MUTATED);
    table.data = mutated;
    await wait(60);
    // Bob(2), Charlie(3), Zoe(1)
    expectCellsMatch(table, pick(mutated, [1, 2, 0]), ORDER_COLS);
  });

  it(`[cells] mutated re-delivery renders sorted pipeline values`, async () => {
    const columns = await sortedTable(mkRows(BASE));
    const mutated = mkRows(MUTATED);
    table.data = mutated;
    await wait(60);
    expectCellsMatch(table, pick(mutated, [1, 2, 0]), columns);
  });

  // ── combo 4: setData() + renderBody() bulk load under an active sort ─────
  it(`[order] setData under an active sort renders sorted`, async () => {
    await sortedTable(mkRows(BASE));
    const mutated = mkRows(MUTATED);
    table.setData(mutated);
    table.renderBody();
    await wait(60);
    expectCellsMatch(table, pick(mutated, [1, 2, 0]), ORDER_COLS);
  });

  it(`[cells] setData under an active sort renders sorted pipeline values`, async () => {
    const columns = await sortedTable(mkRows(BASE));
    const mutated = mkRows(MUTATED);
    table.setData(mutated);
    table.renderBody();
    await wait(60);
    expectCellsMatch(table, pick(mutated, [1, 2, 0]), columns);
  });

  // ── combo 5: a NEW sort issued after a mutated re-delivery ───────────────
  // This is the "until interaction" half of MATRIX-sorting-1: the next
  // toggleSort does sort the freshly delivered rows correctly.
  it(`[order] sorting after a mutated re-delivery sorts the new values`, async () => {
    await sortedTable(mkRows(BASE)); // currentSort = name asc
    const mutated = mkRows(MUTATED);
    table.data = mutated;
    await wait(60);

    table.toggleSort('name'); // asc -> desc
    await wait(60);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'desc' }]);
    // Zoe(1), Charlie(3), Bob(2)
    expectCellsMatch(table, pick(mutated, [0, 2, 1]), ORDER_COLS);
  });

  it(`[cells] post-delivery re-sort renders pipeline values`, async () => {
    const columns = await sortedTable(mkRows(BASE));
    const mutated = mkRows(MUTATED);
    table.data = mutated;
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    expectCellsMatch(table, pick(mutated, [0, 2, 1]), columns);
  });

  // ── combo 6: controlled currentSort re-assignment after a delivery ───────
  // Re-assigning the same sort model is a distinct entry point from toggleSort
  // and must produce the sorted view of the newly delivered rows.
  it(`[order] re-assigning currentSort after a delivery sorts the new rows`, async () => {
    await sortedTable(mkRows(BASE));
    const mutated = mkRows(MUTATED);
    table.data = mutated;
    await wait(60);

    table.currentSort = [{ column: 'name', direction: 'asc' }];
    await wait(60);
    expectCellsMatch(table, pick(mutated, [1, 2, 0]), ORDER_COLS);
  });

  it(`[cells] re-assigned currentSort renders sorted pipeline values`, async () => {
    const columns = await sortedTable(mkRows(BASE));
    const mutated = mkRows(MUTATED);
    table.data = mutated;
    await wait(60);
    table.currentSort = [{ column: 'name', direction: 'asc' }];
    await wait(60);
    expectCellsMatch(table, pick(mutated, [1, 2, 0]), columns);
  });

  // ── combo 7: a custom comparator crossed with the delivery stages ─────────
  // A comparator is standing table state. Whatever brings rows in afterwards —
  // an assignment, a setData() bulk load, a controlled re-sort — must order
  // them through that comparator, not the default collation.
  // Every asserted comparator order below differs from both the delivery order
  // and the default collation order, so neither a no-op nor a fallback passes.
  const lengthComparator = (a: any, b: any, direction: 'asc' | 'desc') => {
    const c = String(a).length - String(b).length;
    return direction === 'asc' ? c : -c;
  };

  async function comparatorTable() {
    const columns = columnsFor();
    table = await makeTable({ columns, data: mkRows(BASE) });
    table.setSortComparator('name', lengthComparator);
    table.toggleSort('name');
    await wait(60);
    return columns;
  }

  it(`[order] a mutated re-delivery is ordered by the standing comparator`, async () => {
    await comparatorTable();
    // 1:Wilhelmina(10), 2:Zoe(3), 3:Ed(2) -> by length Ed, Zoe, Wilhelmina;
    // by collation it would be Ed, Wilhelmina, Zoe.
    const mutated = mkRows([['1', 'Wilhelmina'], ['2', 'Zoe'], ['3', 'Ed']]);
    table.data = mutated;
    await wait(60);
    expectCellsMatch(table, pick(mutated, [2, 1, 0]), ORDER_COLS);
  });

  it(`[order] setData under a standing comparator renders comparator order`, async () => {
    await comparatorTable();
    // Ed(2) < Zoe(3) < Wilhelmina(10): the reverse of collation order.
    const next = mkRows([['7', 'Zoe'], ['8', 'Wilhelmina'], ['9', 'Ed']]);
    table.setData(next);
    table.renderBody();
    await wait(60);
    expectCellsMatch(table, pick(next, [2, 0, 1]), ORDER_COLS);
  });

  it(`[cells] comparator-ordered delivered rows render pipeline values`, async () => {
    const columns = await comparatorTable();
    const next = mkRows([['7', 'Zoe'], ['8', 'Wilhelmina'], ['9', 'Ed']]);
    table.data = next;
    await wait(60);
    expectCellsMatch(table, pick(next, [2, 0, 1]), columns);
  });

  it(`[order] a controlled re-sort after delivery still uses the comparator`, async () => {
    await comparatorTable();
    const next = mkRows([['7', 'Zoe'], ['8', 'Wilhelmina'], ['9', 'Ed']]);
    table.data = next;
    await wait(60);
    table.currentSort = [{ column: 'name', direction: 'desc' }];
    await wait(60);
    // desc by length: Wilhelmina(10), Zoe(3), Ed(2)
    expectCellsMatch(table, pick(next, [1, 0, 2]), ORDER_COLS);
  });
});
