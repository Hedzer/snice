// Matrix slice: GROUPING + AGGREGATION crossed with the value pipelines and the
// delivery dimensions.
//
// Documented contract (docs/components/table.md "Row Grouping and Aggregation",
// docs/ai/components/table.md `Aggregator`):
//   - Built-in aggregators are sum, avg, min, max and count.
//   - "Numeric reducers accept numeric strings and ignore null, blank, boolean,
//     and non-numeric values. `count` counts rows. Custom reducers receive
//     values after `valueGetter` and their matching raw rows."
//   - Every aggregating column gets a per-group subtotal and a filtered grand
//     total; "In remote mode, aggregates cover only the currently loaded data".
//   - Aggregate cells are formatted through the column's display pipeline
//     (`formatter`, else `valueFormatter`); `valueGetter` runs BEFORE reduction.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, wait, type MatrixColumn } from './matrix-utils';
import { expectGroupedView, group, row, agg } from './grouping-support';

type Pipeline = 'no pipeline' | 'valueGetter' | 'valueFormatter' | 'valueGetter+valueFormatter' | 'formatter';
type AggName = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'custom';

const AGG_NAMES: AggName[] = ['sum', 'avg', 'min', 'max', 'count', 'custom'];
const PIPELINE_NAMES: Pipeline[] = [
  'no pipeline', 'valueGetter', 'valueFormatter', 'valueGetter+valueFormatter', 'formatter',
];

const usesGetter = (p: Pipeline) => p === 'valueGetter' || p === 'valueGetter+valueFormatter';

/** Custom reducer under test: sees post-getter values and the matching rows. */
const customAggregate = (values: any[], rows: any[]) => `${values.join('+')}#${rows.length}`;

/** Independent oracle for the documented reducer semantics. */
function reduce(name: AggName, values: number[], rowCount: number): any {
  switch (name) {
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'avg': return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case 'min': return values.length ? Math.min(...values) : null;
    case 'max': return values.length ? Math.max(...values) : null;
    case 'count': return rowCount;
    case 'custom': return `${values.join('+')}#${rowCount}`;
  }
}

function aggregateColumn(name: AggName, pipeline: Pipeline): MatrixColumn {
  const column: MatrixColumn = {
    key: usesGetter(pipeline) ? 'derived' : 'v',
    label: 'Value',
    type: name === 'custom' ? 'text' : 'number',
    aggregate: name === 'custom' ? customAggregate : name,
  };
  if (usesGetter(pipeline)) column.valueGetter = (_v: any, r: any) => r.v_src;
  if (pipeline === 'valueFormatter' || pipeline === 'valueGetter+valueFormatter') {
    column.valueFormatter = (v: any) => `V[${v}]`;
  }
  if (pipeline === 'formatter') column.formatter = (v: any) => `F[${v}]`;
  return column;
}

function columnsFor(name: AggName, pipeline: Pipeline): MatrixColumn[] {
  return [
    { key: 'dept', label: 'Dept', type: 'text' },
    aggregateColumn(name, pipeline),
  ];
}

/** Ops: 4 + 8, Eng: 12. With a getter every value doubles (v_src = 2 * v). */
function baseRows() {
  return [
    { dept: 'Ops', v: 4, v_src: 8 },
    { dept: 'Eng', v: 12, v_src: 24 },
    { dept: 'Ops', v: 8, v_src: 16 },
  ];
}

async function makeGrouped(columns: MatrixColumn[], remote: boolean) {
  const table = await makeTable({ columns, remote });
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

describe('grouping aggregates x pipelines x mode', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const name of AGG_NAMES) {
    for (const pipeline of PIPELINE_NAMES) {
      for (const remote of [false, true]) {
        const mode = remote ? 'remote' : 'local';

        it(`${mode} + ${name} + ${pipeline}: per-group subtotals and the grand total`, async () => {
          const columns = columnsFor(name, pipeline);
          const key = columns[1].key;
          table = await makeGrouped(columns, remote);
          const rows = baseRows();
          await send(table, rows, remote);

          const scale = usesGetter(pipeline) ? 2 : 1;
          const eng = [12 * scale];
          const ops = [4 * scale, 8 * scale];
          const all = [4 * scale, 12 * scale, 8 * scale];

          expectGroupedView(table, [
            group('Eng', 1), row(rows[1]), agg('group', { [key]: reduce(name, eng, 1) }),
            group('Ops', 2), row(rows[0]), row(rows[2]), agg('group', { [key]: reduce(name, ops, 2) }),
            agg('table', { [key]: reduce(name, all, 3) }),
          ]);
        });
      }
    }
  }
});

describe('grouping aggregates x delivery', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const name of AGG_NAMES) {
    for (const remote of [false, true]) {
      const mode = remote ? 'remote' : 'local';

      it(`${mode} + ${name}: re-delivery of the same identities keeps subtotals stable`, async () => {
        const columns = columnsFor(name, 'no pipeline');
        table = await makeGrouped(columns, remote);
        const rows = baseRows();
        await send(table, rows, remote);
        await send(table, [...rows], remote);

        expectGroupedView(table, [
          group('Eng', 1), row(rows[1]), agg('group', { v: reduce(name, [12], 1) }),
          group('Ops', 2), row(rows[0]), row(rows[2]), agg('group', { v: reduce(name, [4, 8], 2) }),
          agg('table', { v: reduce(name, [4, 12, 8], 3) }),
        ]);
      });

      it(`${mode} + ${name}: mutated re-delivery re-reduces every scope`, async () => {
        const columns = columnsFor(name, 'no pipeline');
        table = await makeGrouped(columns, remote);
        const rows = baseRows();
        await send(table, rows, remote);

        // New identities: Ops row 0 quadruples, the Eng row moves to Ops.
        const next = [{ ...rows[0], v: 16 }, { ...rows[1], dept: 'Ops' }, rows[2]];
        await send(table, next, remote);

        expectGroupedView(table, [
          group('Ops', 3), row(next[0]), row(next[1]), row(next[2]),
          agg('group', { v: reduce(name, [16, 12, 8], 3) }),
          agg('table', { v: reduce(name, [16, 12, 8], 3) }),
        ]);
      });

      it(`${mode} + ${name}: aggregates cover only the currently delivered rows`, async () => {
        const columns = columnsFor(name, 'no pipeline');
        table = await makeGrouped(columns, remote);
        const page1 = [{ dept: 'Eng', v: 3 }, { dept: 'Eng', v: 5 }];
        await send(table, page1, remote);
        expectGroupedView(table, [
          group('Eng', 2), row(page1[0]), row(page1[1]),
          agg('group', { v: reduce(name, [3, 5], 2) }),
          agg('table', { v: reduce(name, [3, 5], 2) }),
        ]);

        const page2 = [{ dept: 'Eng', v: 100 }];
        await send(table, page2, remote);
        expectGroupedView(table, [
          group('Eng', 1), row(page2[0]),
          agg('group', { v: reduce(name, [100], 1) }),
          agg('table', { v: reduce(name, [100], 1) }),
        ]);
      });
    }
  }
});

// "filters remove empty groups, and aggregates use filtered rows" plus the
// "filtered grand total" of the Row Grouping and Aggregation section. Local
// mode only: remote filtering is resolved by the server.
describe('grouping aggregates x local filtering', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  const filterColumns = (): MatrixColumn[] => [
    { key: 'dept', label: 'Dept', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
  ];
  const filterRows = () => [
    { dept: 'Eng', amount: 10 },
    { dept: 'Ops', amount: 5 },
    { dept: 'Ops', amount: 7 },
  ];

  it('a column filter drops the emptied group and re-reduces both scopes', async () => {
    table = await makeGrouped(filterColumns(), false);
    const rows = filterRows();
    await send(table, rows, false);

    table.setColumnFilter('dept', 'equals', 'Ops');
    await wait(60);
    expectGroupedView(table, [
      group('Ops', 2), row(rows[1]), row(rows[2]),
      agg('group', { amount: 12 }), agg('table', { amount: 12 }),
    ]);

    table.clearAllFilters();
    await wait(60);
    expectGroupedView(table, [
      group('Eng', 1), row(rows[0]), agg('group', { amount: 10 }),
      group('Ops', 2), row(rows[1]), row(rows[2]), agg('group', { amount: 12 }),
      agg('table', { amount: 22 }),
    ]);
  });

  it('the quick filter feeds the same filtered reduction', async () => {
    table = await makeGrouped(filterColumns(), false);
    const rows = filterRows();
    await send(table, rows, false);

    table.setQuickFilter('Ops');
    await wait(700); // searchDebounce
    expectGroupedView(table, [
      group('Ops', 2), row(rows[1]), row(rows[2]),
      agg('group', { amount: 12 }), agg('table', { amount: 12 }),
    ]);
  });
});

describe('grouping aggregates — documented value coercion', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: numeric strings are reduced, other values are ignored`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'v', label: 'Sum', type: 'number', aggregate: 'sum' },
        { key: 'v2', label: 'Count', type: 'number', aggregate: 'count' },
      ];
      table = await makeGrouped(columns, remote);
      // Numeric strings count; null, blank string, boolean and non-numeric do not.
      const rows = [
        { dept: 'Mix', v: '10', v2: 1 },
        { dept: 'Mix', v: 5, v2: 2 },
        { dept: 'Mix', v: null, v2: 3 },
        { dept: 'Mix', v: '', v2: 4 },
        { dept: 'Mix', v: true, v2: 5 },
        { dept: 'Mix', v: 'abc', v2: 6 },
      ];
      await send(table, rows, remote);

      expectGroupedView(table, [
        group('Mix', 6),
        ...rows.map((r) => row(r)),
        agg('group', { v: 15, v2: 6 }),
        agg('table', { v: 15, v2: 6 }),
      ]);
    });

    it(`${mode}: a group with no numeric values reduces to 0 / null`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'total', label: 'Sum', type: 'number', aggregate: 'sum' },
        { key: 'mean', label: 'Avg', type: 'number', aggregate: 'avg' },
        { key: 'low', label: 'Min', type: 'number', aggregate: 'min' },
        { key: 'high', label: 'Max', type: 'number', aggregate: 'max' },
      ];
      table = await makeGrouped(columns, remote);
      const rows = [
        { dept: 'Empty', total: null, mean: null, low: null, high: null },
        { dept: 'Empty', total: 'x', mean: 'x', low: 'x', high: 'x' },
      ];
      await send(table, rows, remote);

      // Documented empty-input results: sum/avg -> 0, min/max -> null (blank cell).
      const empty = { total: 0, mean: 0, low: null, high: null };
      expectGroupedView(table, [
        group('Empty', 2), row(rows[0]), row(rows[1]),
        agg('group', empty), agg('table', empty),
      ]);
    });

    it(`${mode}: custom reducers receive post-valueGetter values and their raw rows`, async () => {
      const seen: Array<{ values: any[]; rows: any[] }> = [];
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        {
          key: 'derived', label: 'Derived', type: 'text',
          valueGetter: (_v: any, r: any) => `${r.tag}!`,
          aggregate: (values: any[], rows: any[]) => {
            seen.push({ values, rows });
            return values.join(',');
          },
        },
      ];
      table = await makeGrouped(columns, remote);
      const rows = [
        { dept: 'Eng', tag: 'a' },
        { dept: 'Ops', tag: 'b' },
        { dept: 'Eng', tag: 'c' },
      ];
      await send(table, rows, remote);

      expectGroupedView(table, [
        group('Eng', 2), row(rows[0]), row(rows[2]), agg('group', { derived: 'a!,c!' }),
        group('Ops', 1), row(rows[1]), agg('group', { derived: 'b!' }),
        agg('table', { derived: 'a!,b!,c!' }),
      ]);

      // The reducer must have been handed the raw row objects alongside them.
      const engCall = seen.find((call) => call.values.join(',') === 'a!,c!');
      if (!engCall) throw new Error('custom reducer never ran for the Eng group');
      if (engCall.rows[0] !== rows[0] || engCall.rows[1] !== rows[2]) {
        throw new Error('custom reducer received the wrong raw rows');
      }
    });
  }
});
