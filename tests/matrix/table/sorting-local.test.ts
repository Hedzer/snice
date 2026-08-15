// Matrix slice: SORTING x local mode x { no pipeline, valueGetter, valueFormatter,
// valueGetter+valueFormatter, formatter, valueGetter+formatter }.
//
// Documented contract exercised here (docs/ai/components/table.md):
//   - `toggleSort(key,multi?)` cycles asc -> desc -> unsorted.
//   - `currentSort` is controlled state; assigning it must re-sort locally.
//   - `setSortComparator(key,fn)` installs a comparator `(a,b,direction)`, and
//     the same comparator is declarable as the column's `sortComparator` field.
//   - `valueGetter` "runs for display, sort, aggregation" — both sort paths
//     (default collation and custom comparator) see the derived value.
//   - `formatter`/`valueFormatter` produce the displayed text.
//   - local sort is client-side over `data`.
//
// Divergences this slice pinned, all fixed and asserted as ordinary tests:
//   MATRIX-1            the rendered cell value carries valueFormatter output.
//   MATRIX-sorting-2    setSortComparator receives the valueGetter-derived
//                       value, the one the cell displays.
//   MATRIX-sorting-3    the rendered cell value carries formatter output.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, expectCellsMatch, cellText, dataRows, wait, type MatrixColumn } from './matrix-utils';

// ── pipeline dimension ──────────────────────────────────────────────────────
interface Pipeline {
  key: string;
  /** row field the sort/display value lives on (differs when a getter bridges it) */
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

const idCol = (): MatrixColumn => ({ key: 'id', label: 'Id', type: 'text', sortable: true });
const grpCol = (): MatrixColumn => ({ key: 'grp', label: 'Grp', type: 'text', sortable: true });
const nameCol = (p: Pipeline): MatrixColumn =>
  p.decorate({ key: 'name', label: 'Name', type: 'text', sortable: true });

/** Columns that carry no display pipeline — safe to assert row ORDER through. */
const ORDER_COLS: MatrixColumn[] = [{ key: 'id' }];

function columnsFor(p: Pipeline, withGroup = false): MatrixColumn[] {
  return withGroup ? [idCol(), grpCol(), nameCol(p)] : [idCol(), nameCol(p)];
}

function mkRows(p: Pipeline, spec: Array<[string, string]>): any[] {
  return spec.map(([id, name]) => ({ id, [p.field]: name }));
}

function mkGroupRows(p: Pipeline, spec: Array<[string, string, string]>): any[] {
  return spec.map(([id, grp, name]) => ({ id, grp, [p.field]: name }));
}

// Delivery order is deliberately distinct from every asserted sort order, so a
// no-op sort can never accidentally satisfy an expectation.
// name lengths: Alice 5, Charlie 7, Bob 3.
const BASE: Array<[string, string]> = [['1', 'Alice'], ['2', 'Charlie'], ['3', 'Bob']];
const pick = (rows: any[], order: number[]) => order.map(i => rows[i]);

describe.each(PIPELINES)('sorting x local mode x $key', (p: Pipeline) => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  async function localTable(spec = BASE, withGroup = false) {
    const rows = withGroup
      ? mkGroupRows(p, [['1', 'b', 'Charlie'], ['2', 'a', 'Alice'], ['3', 'b', 'Alpha'], ['4', 'a', 'Zed']])
      : mkRows(p, spec);
    const columns = columnsFor(p, withGroup);
    table = await makeTable({ columns, data: rows });
    return { rows, columns };
  }

  // ── combo 1: toggleSort -> ascending ──────────────────────────────────────
  it(`[order] toggleSort sorts ascending`, async () => {
    const { rows } = await localTable();
    table.toggleSort('name');
    await wait(60);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
    // Alice(1), Bob(3), Charlie(2)
    expectCellsMatch(table, pick(rows, [0, 2, 1]), ORDER_COLS);
  });

  it(`[cells] ascending rows render their pipeline values`, async () => {
    const { rows, columns } = await localTable();
    table.toggleSort('name');
    await wait(60);
    expectCellsMatch(table, pick(rows, [0, 2, 1]), columns);
  });

  // ── combo 2: toggleSort -> descending ─────────────────────────────────────
  it(`[order] second toggleSort sorts descending`, async () => {
    const { rows } = await localTable();
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'desc' }]);
    // Charlie(2), Bob(3), Alice(1)
    expectCellsMatch(table, pick(rows, [1, 2, 0]), ORDER_COLS);
  });

  it(`[cells] descending rows render their pipeline values`, async () => {
    const { rows, columns } = await localTable();
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    expectCellsMatch(table, pick(rows, [1, 2, 0]), columns);
  });

  // ── combo 3: toggleSort -> unsorted ───────────────────────────────────────
  it(`[order] third toggleSort clears the sort and restores delivery order`, async () => {
    const { rows } = await localTable();
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    expect(table.currentSort).toEqual([]);
    expectCellsMatch(table, rows, ORDER_COLS);
  });

  it(`[cells] cleared sort renders the original rows`, async () => {
    const { rows, columns } = await localTable();
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    expectCellsMatch(table, rows, columns);
  });

  // ── combo 4: controlled currentSort assignment ────────────────────────────
  it(`[order] assigning currentSort re-sorts locally`, async () => {
    const { rows } = await localTable();
    table.currentSort = [{ column: 'name', direction: 'desc' }];
    await wait(60);
    expectCellsMatch(table, pick(rows, [1, 2, 0]), ORDER_COLS);
  });

  it(`[cells] controlled currentSort renders pipeline values`, async () => {
    const { rows, columns } = await localTable();
    table.currentSort = [{ column: 'name', direction: 'desc' }];
    await wait(60);
    expectCellsMatch(table, pick(rows, [1, 2, 0]), columns);
  });

  // ── combo 5: multi-sort ───────────────────────────────────────────────────
  // grp asc, then name asc: a/Alice(2), a/Zed(4), b/Alpha(3), b/Charlie(1)
  it(`[order] multi-sort orders by grp then name`, async () => {
    const { rows } = await localTable(BASE, true);
    table.toggleSort('grp', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(60);
    expect(table.currentSort).toEqual([
      { column: 'grp', direction: 'asc' },
      { column: 'name', direction: 'asc' },
    ]);
    expectCellsMatch(table, pick(rows, [1, 3, 2, 0]), ORDER_COLS);
  });

  it(`[order] multi-sort flips only the secondary key to desc`, async () => {
    const { rows } = await localTable(BASE, true);
    table.toggleSort('grp', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(60);
    expect(table.currentSort).toEqual([
      { column: 'grp', direction: 'asc' },
      { column: 'name', direction: 'desc' },
    ]);
    // a/Zed(4), a/Alice(2), b/Charlie(1), b/Alpha(3)
    expectCellsMatch(table, pick(rows, [3, 1, 0, 2]), ORDER_COLS);
  });

  it(`[order] multi-sort drops the secondary key on the third toggle`, async () => {
    const { rows } = await localTable(BASE, true);
    table.toggleSort('grp', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(60);
    expect(table.currentSort).toEqual([{ column: 'grp', direction: 'asc' }]);
    // grp asc only, stable within group on delivery order: 2,4 then 1,3
    expectCellsMatch(table, pick(rows, [1, 3, 0, 2]), ORDER_COLS);
  });

  it(`[cells] multi-sorted rows render pipeline values`, async () => {
    const { rows, columns } = await localTable(BASE, true);
    table.toggleSort('grp', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(60);
    expectCellsMatch(table, pick(rows, [1, 3, 2, 0]), columns);
  });

  // ── combo 6: setSortComparator ────────────────────────────────────────────
  // Comparator sorts by value length: Bob(3) < Alice(5) < Charlie(7) — an order
  // no default collation produces, so it proves the comparator actually ran on
  // the column's value. With a valueGetter the documented value IS the
  // getter-derived one ("valueGetter runs for ... sort").
  const lengthComparator = (a: any, b: any, direction: 'asc' | 'desc') => {
    const c = String(a).length - String(b).length;
    return direction === 'asc' ? c : -c;
  };

  it(
    `[order] setSortComparator drives the order`, async () => {
    const { rows } = await localTable();
    table.setSortComparator('name', lengthComparator);
    table.toggleSort('name');
    await wait(60);
    // Bob(3), Alice(1), Charlie(2)
    expectCellsMatch(table, pick(rows, [2, 0, 1]), ORDER_COLS);
  });

  it(
    `[order] setSortComparator receives the direction and reverses`, async () => {
    const { rows } = await localTable();
    table.setSortComparator('name', lengthComparator);
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    // Charlie(2), Alice(1), Bob(3)
    expectCellsMatch(table, pick(rows, [1, 0, 2]), ORDER_COLS);
  });

  it(
    `[cells] comparator-sorted rows render pipeline values`, async () => {
    const { rows, columns } = await localTable();
    table.setSortComparator('name', lengthComparator);
    table.toggleSort('name');
    await wait(60);
    expectCellsMatch(table, pick(rows, [2, 0, 1]), columns);
  });

  // ── combo 7: DECLARATIVE sortComparator on the column definition ──────────
  // Docs list `sortComparator?:(a,b,direction)=>number` as a ColumnDefinition
  // field, so declaring it must be equivalent to installing it imperatively.
  it(`[order] declarative column sortComparator drives the order`, async () => {
    const rows = mkRows(p, BASE);
    const columns = [idCol(), { ...nameCol(p), sortComparator: lengthComparator }];
    table = await makeTable({ columns, data: rows });
    table.toggleSort('name');
    await wait(60);
    // Bob(3), Alice(1), Charlie(2)
    expectCellsMatch(table, pick(rows, [2, 0, 1]), ORDER_COLS);
  });

  it(`[order] declarative sortComparator reverses on the desc toggle`, async () => {
    const rows = mkRows(p, BASE);
    const columns = [idCol(), { ...nameCol(p), sortComparator: lengthComparator }];
    table = await makeTable({ columns, data: rows });
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    // Charlie(2), Alice(1), Bob(3)
    expectCellsMatch(table, pick(rows, [1, 0, 2]), ORDER_COLS);
  });

  it(`[cells] declarative-comparator rows render pipeline values`, async () => {
    const rows = mkRows(p, BASE);
    const columns = [idCol(), { ...nameCol(p), sortComparator: lengthComparator }];
    table = await makeTable({ columns, data: rows });
    table.toggleSort('name');
    await wait(60);
    expectCellsMatch(table, pick(rows, [2, 0, 1]), columns);
  });

  // ── combo 8: comparator x multi-sort ──────────────────────────────────────
  // grp asc (default collation) then name by LENGTH: a/Zed(3), a/Alice(5),
  // b/Alpha(5), b/Charlie(7) — an order neither key produces on its own.
  it(`[order] a comparator applies to its key inside a multi-sort`, async () => {
    const { rows } = await localTable(BASE, true);
    table.setSortComparator('name', lengthComparator);
    table.toggleSort('grp', true);
    await wait(40);
    table.toggleSort('name', true);
    await wait(60);
    expect(table.currentSort).toEqual([
      { column: 'grp', direction: 'asc' },
      { column: 'name', direction: 'asc' },
    ]);
    expectCellsMatch(table, pick(rows, [3, 1, 2, 0]), ORDER_COLS);
  });

  // ── combo 9: comparator x delivery ────────────────────────────────────────
  // An installed comparator is table state, not per-render state: rows that
  // arrive later must land in comparator order under the standing sort.
  it(`[order] a comparator still orders rows delivered after it was installed`, async () => {
    const { rows } = await localTable();
    table.setSortComparator('name', lengthComparator);
    table.toggleSort('name');
    await wait(60);
    expectCellsMatch(table, pick(rows, [2, 0, 1]), ORDER_COLS);

    // By length: Ed(7), Zoe(5), Wilhelmina(6). Collation would give Ed,
    // Wilhelmina, Zoe and a no-op would keep 5,6,7 — all three differ.
    const next = mkRows(p, [['5', 'Zoe'], ['6', 'Wilhelmina'], ['7', 'Ed']]);
    table.data = next;
    await wait(60);
    expectCellsMatch(table, pick(next, [2, 0, 1]), ORDER_COLS);
  });

  it(`[cells] rows delivered under a comparator render pipeline values`, async () => {
    const { columns } = await localTable();
    table.setSortComparator('name', lengthComparator);
    table.toggleSort('name');
    await wait(60);
    const next = mkRows(p, [['5', 'Zoe'], ['6', 'Wilhelmina'], ['7', 'Ed']]);
    table.data = next;
    await wait(60);
    expectCellsMatch(table, pick(next, [2, 0, 1]), columns);
  });
});

// ── sort VALUE semantics ────────────────────────────────────────────────────
// Pipeline-independent: what the DEFAULT collation does with nullish values,
// numeric strings and ties. The comparator-free branch coalesces a nullish
// value to '' and compares with `localeCompare(..., {numeric:true})`, so these
// pin the ordering an application actually depends on.
describe('sorting x local mode x value semantics', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  const VALUE_COLS: MatrixColumn[] = [
    { key: 'id', label: 'Id', type: 'text', sortable: true },
    { key: 'name', label: 'Name', type: 'text', sortable: true },
  ];
  const idsInOrder = () =>
    dataRows(table).map(tr => cellText(tr.querySelector('td[data-key="id"]') as HTMLElement));

  // 10 vs 2 separates numeric-aware collation from lexicographic ('10' < '2').
  // id 3 carries an explicit null, id 4 has no `name` field at all.
  const NULLISH = [
    { id: '1', name: 10 },
    { id: '2', name: 2 },
    { id: '3', name: null },
    { id: '4' },
  ];

  it('[order] ascending puts nullish values first and collates numbers numerically', async () => {
    table = await makeTable({ columns: VALUE_COLS, data: NULLISH });
    table.toggleSort('name');
    await wait(60);
    // null(3), missing(4) — tied at '' and stable — then 2, then 10.
    expect(idsInOrder()).toEqual(['3', '4', '2', '1']);
  });

  it('[order] descending reverses the ranking but keeps the nullish rows tied', async () => {
    table = await makeTable({ columns: VALUE_COLS, data: NULLISH });
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    expect(idsInOrder()).toEqual(['1', '2', '3', '4']);
  });

  it('[cells] a nullish sort value renders as an empty cell, not "null"', async () => {
    table = await makeTable({ columns: VALUE_COLS, data: NULLISH });
    table.toggleSort('name');
    await wait(60);
    const first = dataRows(table)[0];
    expect(cellText(first.querySelector('td[data-key="name"]') as HTMLElement)).toBe('');
    // and the whole grid still matches the oracle in the sorted order
    expectCellsMatch(table, [NULLISH[2], NULLISH[3], NULLISH[1], NULLISH[0]], VALUE_COLS);
  });

  // Equal keys must not be shuffled: a single-key sort keeps delivery order
  // among ties, which is what makes a sort feel stable to a user.
  const TIES = [
    { id: '1', name: 'Same' },
    { id: '2', name: 'Same' },
    { id: '3', name: 'Aaa' },
    { id: '4', name: 'Same' },
  ];

  it('[order] equal keys keep their delivery order ascending', async () => {
    table = await makeTable({ columns: VALUE_COLS, data: TIES });
    table.toggleSort('name');
    await wait(60);
    expect(idsInOrder()).toEqual(['3', '1', '2', '4']);
  });

  it('[order] equal keys keep their delivery order descending too', async () => {
    table = await makeTable({ columns: VALUE_COLS, data: TIES });
    table.toggleSort('name');
    await wait(60);
    table.toggleSort('name');
    await wait(60);
    // The Same group moves ahead of Aaa but does not reorder within itself.
    expect(idsInOrder()).toEqual(['1', '2', '4', '3']);
  });
});
