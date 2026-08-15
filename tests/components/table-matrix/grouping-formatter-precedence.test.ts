// Matrix slice: GROUPING with a column that declares BOTH display formatters.
//
// Documented contract: `formatter` is the column's display formatter and
// `valueFormatter` is the fallback — the ColumnDefinition lists both, and every
// other documented consumer resolves them as `formatter || valueFormatter`
// (CSV/clipboard export, declarative <snice-row>, and the matrix oracle in
// matrix-utils.expectedCellText). So when both are present the rendered text —
// in grouped data cells AND in the group/table aggregate footers, which are
// documented to format "through the type/formatter pipeline" — must come from
// `formatter`.
//
// MATRIX-grouping-1 (the rendered text came from `valueFormatter`, silently
// overriding `formatter`) is fixed — the precedence now holds in both modes, at
// every delivery stage, in data cells and aggregate footers alike.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, wait, type MatrixColumn } from './matrix-utils';
import { expectGroupedView, group, row, agg } from './grouping-support';

function columns(): MatrixColumn[] {
  return [
    { key: 'dept', label: 'Dept', type: 'text' },
    {
      key: 'label', label: 'Label', type: 'text',
      formatter: (v: any) => `F(${v})`,
      valueFormatter: (v: any) => `V(${v})`,
    },
    {
      key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum',
      formatter: (v: any) => `F${v}`,
      valueFormatter: (v: any) => `V${v}`,
    },
  ];
}

/** Same shape with a getter, to show the divergence survives the full pipeline. */
function getterColumns(): MatrixColumn[] {
  return [
    { key: 'dept', label: 'Dept', type: 'text' },
    {
      key: 'display', label: 'Label', type: 'text',
      valueGetter: (_v: any, r: any) => r.label_src,
      formatter: (v: any) => `F(${v})`,
      valueFormatter: (v: any) => `V(${v})`,
    },
    {
      key: 'derived', label: 'Amount', type: 'number', aggregate: 'sum',
      valueGetter: (_v: any, r: any) => r.amount * 2,
      formatter: (v: any) => `F${v}`,
      valueFormatter: (v: any) => `V${v}`,
    },
  ];
}

const baseRows = () => [
  { dept: 'Eng', label: 'a', label_src: 'A!', amount: 10 },
  { dept: 'Ops', label: 'b', label_src: 'B!', amount: 5 },
];

async function makeGrouped(cols: MatrixColumn[], remote: boolean) {
  const table = await makeTable({ columns: cols, remote });
  table.groupBy = 'dept';
  await wait(20);
  return table;
}

async function send(table: any, rows: any[], remote: boolean) {
  if (remote) { await deliver(table, rows); return; }
  table.unsortedData = [...rows];
  table.data = rows;
  await wait(40);
}

describe('grouping + formatter/valueFormatter precedence', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: formatter wins over valueFormatter in grouped cells and footers (initial)`, async () => {
      table = await makeGrouped(columns(), remote);
      const rows = baseRows();
      await send(table, rows, remote);

      expectGroupedView(table, [
        group('Eng', 1), row(rows[0]), agg('group', { amount: 10 }),
        group('Ops', 1), row(rows[1]), agg('group', { amount: 5 }),
        agg('table', { amount: 15 }),
      ]);
    });

    it(`${mode}: formatter wins after re-delivery of the same identities`, async () => {
      table = await makeGrouped(columns(), remote);
      const rows = baseRows();
      await send(table, rows, remote);
      await send(table, [...rows], remote);

      expectGroupedView(table, [
        group('Eng', 1), row(rows[0]), agg('group', { amount: 10 }),
        group('Ops', 1), row(rows[1]), agg('group', { amount: 5 }),
        agg('table', { amount: 15 }),
      ]);
    });

    it(`${mode}: formatter wins after mutated re-delivery`, async () => {
      table = await makeGrouped(columns(), remote);
      const rows = baseRows();
      await send(table, rows, remote);
      const next = [{ ...rows[0], amount: 40 }, rows[1]];
      await send(table, next, remote);

      expectGroupedView(table, [
        group('Eng', 1), row(next[0]), agg('group', { amount: 40 }),
        group('Ops', 1), row(next[1]), agg('group', { amount: 5 }),
        agg('table', { amount: 45 }),
      ]);
    });

    it(`${mode}: formatter wins with valueGetter in front of it`, async () => {
      table = await makeGrouped(getterColumns(), remote);
      const rows = baseRows();
      await send(table, rows, remote);

      expectGroupedView(table, [
        group('Eng', 1), row(rows[0]), agg('group', { derived: 20 }),
        group('Ops', 1), row(rows[1]), agg('group', { derived: 10 }),
        agg('table', { derived: 30 }),
      ]);
    });
  }
});

// `formatter` is documented as the ROW-AWARE display override, so its second
// argument is part of the contract, not decoration: a grouped data cell must be
// formatted with the row it displays. An aggregate footer displays a reduction
// over many rows and so has no single row to pass — the oracle
// (grouping-support.expectedAggregateText) calls the formatter with no row, and
// these formatters make the difference visible instead of ignoring the argument.
describe('grouping + row-aware formatter', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  const rowAwareColumns = (): MatrixColumn[] => [
    { key: 'dept', label: 'Dept', type: 'text' },
    {
      key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum',
      formatter: (v: any, r?: any) => `${v}@${r ? r.dept : 'NOROW'}`,
    },
  ];

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: grouped data cells are formatted with their own row, footers with none`, async () => {
      table = await makeGrouped(rowAwareColumns(), remote);
      const rows = [
        { dept: 'Eng', amount: 10 },
        { dept: 'Ops', amount: 5 },
        { dept: 'Ops', amount: 7 },
      ];
      await send(table, rows, remote);

      // Data cells render "10@Eng" / "5@Ops" / "7@Ops"; the subtotal and grand
      // total render "12@NOROW" / "22@NOROW" — both sides come straight from
      // the shared oracles, so a row leaking into a footer (or the wrong row
      // reaching a cell after reparenting) fails here.
      expectGroupedView(table, [
        group('Eng', 1), row(rows[0]), agg('group', { amount: 10 }),
        group('Ops', 2), row(rows[1]), row(rows[2]), agg('group', { amount: 12 }),
        agg('table', { amount: 22 }),
      ]);

      // Mutated re-delivery reparents the Eng row into Ops: its cell must be
      // re-formatted with its NEW row, not the recycled one.
      const next = [{ ...rows[0], dept: 'Ops' }, rows[1], rows[2]];
      await send(table, next, remote);
      expectGroupedView(table, [
        group('Ops', 3), row(next[0]), row(next[1]), row(next[2]),
        agg('group', { amount: 22 }), agg('table', { amount: 22 }),
      ]);
    });
  }
});
