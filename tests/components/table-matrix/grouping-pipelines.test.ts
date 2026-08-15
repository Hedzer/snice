// Matrix slice: row GROUPING crossed with the value pipelines
// ({no pipeline, valueGetter with a key that is not a row field, valueFormatter,
// valueGetter+valueFormatter, formatter}) x {local, remote} x {initial delivery,
// re-delivery with the same row identities (the reconciler recycles the <tr>s),
// mutated re-delivery (new identities, one row reparented into another group)}.
//
// Documented contract (docs/ai/components/table.md, docs/components/table.md
// "Row Grouping and Aggregation"):
//   - `groupBy` buckets rows by a column key; groups are ordered by group value
//     and each header shows the group value plus its leaf count.
//   - `valueGetter` "runs for display, sort, aggregation"; `formatter` /
//     `valueFormatter` produce the display text (formatter first).
//   - Columns with `aggregate` get a per-group subtotal plus a filtered grand
//     total; in remote mode aggregates cover the currently loaded `data`.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import {
  makeTable, deliver, expectCellsMatch, wait, type MatrixColumn,
} from './matrix-utils';
import { expectGroupedView, group, row, agg } from './grouping-support';

type Pipeline = 'no pipeline' | 'valueGetter' | 'valueFormatter' | 'valueGetter+valueFormatter' | 'formatter';

const PIPELINES: Record<Pipeline, () => MatrixColumn> = {
  // key IS a row field, no pipeline
  'no pipeline': () => ({ key: 'label', label: 'Label', type: 'text' }),
  // key is NOT a row field — the getter bridges the display (remote whitelist shape)
  'valueGetter': () => ({
    key: 'display', label: 'Label', type: 'text',
    valueGetter: (_v: any, r: any) => r.label_src,
  }),
  'valueFormatter': () => ({
    key: 'label', label: 'Label', type: 'text',
    valueFormatter: (v: any) => `V(${v})`,
  }),
  'valueGetter+valueFormatter': () => ({
    key: 'display', label: 'Label', type: 'text',
    valueGetter: (_v: any, r: any) => r.label_src,
    valueFormatter: (v: any) => `V(${v})`,
  }),
  'formatter': () => ({
    key: 'label', label: 'Label', type: 'text',
    formatter: (v: any) => `F(${v})`,
  }),
};

function columnsFor(pipeline: Pipeline): MatrixColumn[] {
  return [
    { key: 'dept', label: 'Dept', type: 'text' },
    PIPELINES[pipeline](),
    { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
  ];
}

function baseRows() {
  return [
    { dept: 'Ops', label: 'c', label_src: 'C!', amount: 5 },
    { dept: 'Eng', label: 'a', label_src: 'A!', amount: 10 },
    { dept: 'Ops', label: 'd', label_src: 'D!', amount: 7 },
  ];
}

/** Groups are ordered by group value: Eng before Ops; rows keep delivery order. */
function baseView(rows: any[]) {
  return [
    group('Eng', 1), row(rows[1]), agg('group', { amount: 10 }),
    group('Ops', 2), row(rows[0]), row(rows[2]), agg('group', { amount: 12 }),
    agg('table', { amount: 22 }),
  ];
}

/** Visible data rows, in rendered order, for the attribute-level oracle. */
function baseVisibleRows(rows: any[]) {
  return [rows[1], rows[0], rows[2]];
}

/** New identities: row 0 changes value, row 1 is reparented Eng -> Ops. */
function mutate(rows: any[]) {
  return [
    { ...rows[0], label: 'c2', label_src: 'C2!', amount: 50 },
    { ...rows[1], dept: 'Ops' },
    rows[2],
  ];
}

function mutatedView(next: any[]) {
  return [
    group('Ops', 3), row(next[0]), row(next[1]), row(next[2]),
    agg('group', { amount: 67 }), agg('table', { amount: 67 }),
  ];
}

async function makeGrouped(pipeline: Pipeline, remote: boolean) {
  const table = await makeTable({ columns: columnsFor(pipeline), remote });
  table.groupBy = 'dept';
  await wait(20);
  return table;
}

/** Deliver rows the way the mode delivers them, then let the render settle. */
async function send(table: any, rows: any[], remote: boolean) {
  if (remote) { await deliver(table, rows); return; }
  table.unsortedData = [...rows];
  table.data = rows;
  await wait(40);
}

describe('grouping x pipelines x delivery — rendered group view', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    for (const pipeline of Object.keys(PIPELINES) as Pipeline[]) {
      it(`${mode} + ${pipeline}: initial delivery renders every group, row and subtotal`, async () => {
        table = await makeGrouped(pipeline, remote);
        const rows = baseRows();
        await send(table, rows, remote);
        expectGroupedView(table, baseView(rows));
      });

      it(`${mode} + ${pipeline}: re-delivery of the same row identities keeps the group view`, async () => {
        table = await makeGrouped(pipeline, remote);
        const rows = baseRows();
        await send(table, rows, remote);
        expectGroupedView(table, baseView(rows));

        // Same objects again — the reconciler recycles their <tr>s.
        await send(table, [...rows], remote);
        expectGroupedView(table, baseView(rows));
      });

      it(`${mode} + ${pipeline}: mutated re-delivery reparents a row and re-reduces`, async () => {
        table = await makeGrouped(pipeline, remote);
        const rows = baseRows();
        await send(table, rows, remote);
        const next = mutate(rows);
        await send(table, next, remote);
        expectGroupedView(table, mutatedView(next));
      });
    }
  }
});

describe('grouping x pipelines — local sort runs inside each group', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  // "Sorting runs within groups" (docs/components/table.md, Row Grouping and
  // Aggregation). valueGetter also "runs for ... sort", so a getter-backed
  // column sorts on its derived value.
  const sortRows = () => [
    { dept: 'Ops', label: 'd', label_src: 'D!', amount: 1 },
    { dept: 'Eng', label: 'z', label_src: 'Z!', amount: 2 },
    { dept: 'Eng', label: 'a', label_src: 'A!', amount: 3 },
    { dept: 'Ops', label: 'b', label_src: 'B!', amount: 4 },
  ];

  for (const pipeline of Object.keys(PIPELINES) as Pipeline[]) {
    it(`local + ${pipeline}: ascending sort reorders rows within their group only`, async () => {
      const columns = columnsFor(pipeline);
      const rows = sortRows();
      table = await makeTable({ columns, data: rows, attrs: { sortable: true } });
      table.groupBy = 'dept';
      await wait(30);

      table.toggleSort(columns[1].key);
      await wait(40);

      expectGroupedView(table, [
        group('Eng', 2), row(rows[2]), row(rows[1]), agg('group', { amount: 5 }),
        group('Ops', 2), row(rows[3]), row(rows[0]), agg('group', { amount: 5 }),
        agg('table', { amount: 10 }),
      ]);
    });
  }
});

// The SHARED matrix oracle (matrix-utils.expectCellsMatch / cellText), run over
// the same grid: every grouped data cell must carry the documented display text
// on the cell element itself, not only in the rendered shadow content that
// grouping-support.displayText reads. MATRIX-1 (the cell element's `value`
// attribute carried the raw pre-format value, so the shared oracle disagreed
// with what the user could read) is fixed — both observations now agree in every
// combination.
describe('grouping x pipelines x delivery — shared cell oracle', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    for (const pipeline of Object.keys(PIPELINES) as Pipeline[]) {
      it(`${mode} + ${pipeline}: grouped data cells match the documented pipeline (initial)`, async () => {
        table = await makeGrouped(pipeline, remote);
        const rows = baseRows();
        await send(table, rows, remote);
        expectCellsMatch(table, baseVisibleRows(rows));
      });

      it(`${mode} + ${pipeline}: grouped data cells match after re-delivery (recycled DOM)`, async () => {
        table = await makeGrouped(pipeline, remote);
        const rows = baseRows();
        await send(table, rows, remote);
        await send(table, [...rows], remote);
        expectCellsMatch(table, baseVisibleRows(rows));
      });

      it(`${mode} + ${pipeline}: grouped data cells match after mutated re-delivery`, async () => {
        table = await makeGrouped(pipeline, remote);
        const rows = baseRows();
        await send(table, rows, remote);
        const next = mutate(rows);
        await send(table, next, remote);
        expectCellsMatch(table, next);
      });
    }
  }
});
