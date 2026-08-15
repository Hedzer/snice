// Matrix slice: group EXPAND/COLLAPSE (and multi-level grouping) crossed with
// the value pipelines, both modes, and the delivery dimensions.
//
// Documented contract:
//   - `groupDefaults` is the "JS-only initial group expansion policy.
//     `{ expanded: false }` starts groups collapsed"; an empty `groupBy`
//     disables hierarchy grouping.
//   - `groupBy` accepts "one key or an ordered key array" for nested groups.
//   - `group-toggle` -> `{ key, value, expanded }`, "`key` is an opaque stable
//     identity"; group controls expose `aria-expanded`.
//   - Group headers expose the group label and its descendant (leaf) count.
//   - The grand total covers the filtered rows, so expansion cannot change it.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, wait, type MatrixColumn } from './matrix-utils';
import { expectGroupedView, group, row, agg, clickGroupHeader, displayText } from './grouping-support';

type Pipeline = 'no pipeline' | 'valueGetter' | 'valueFormatter' | 'valueGetter+valueFormatter' | 'formatter';
const PIPELINE_NAMES: Pipeline[] = [
  'no pipeline', 'valueGetter', 'valueFormatter', 'valueGetter+valueFormatter', 'formatter',
];

function labelColumn(pipeline: Pipeline): MatrixColumn {
  const usesGetter = pipeline === 'valueGetter' || pipeline === 'valueGetter+valueFormatter';
  const column: MatrixColumn = {
    key: usesGetter ? 'display' : 'label',
    label: 'Label',
    type: 'text',
  };
  if (usesGetter) column.valueGetter = (_v: any, r: any) => r.label_src;
  if (pipeline === 'valueFormatter' || pipeline === 'valueGetter+valueFormatter') {
    column.valueFormatter = (v: any) => `V(${v})`;
  }
  if (pipeline === 'formatter') column.formatter = (v: any) => `F(${v})`;
  return column;
}

/** Columns without any aggregator: the rendered sequence is headers + rows only. */
function plainColumns(pipeline: Pipeline): MatrixColumn[] {
  return [{ key: 'dept', label: 'Dept', type: 'text' }, labelColumn(pipeline)];
}

function baseRows() {
  return [
    { dept: 'Ops', label: 'c', label_src: 'C!' },
    { dept: 'Eng', label: 'a', label_src: 'A!' },
    { dept: 'Ops', label: 'd', label_src: 'D!' },
  ];
}

async function makeGrouped(columns: MatrixColumn[], remote: boolean, groupBy: any = 'dept', defaults?: any) {
  const table = await makeTable({ columns, remote });
  if (defaults) table.groupDefaults = defaults;
  table.groupBy = groupBy;
  await wait(20);
  return table;
}

async function send(table: any, rows: any[], remote: boolean) {
  if (remote) { await deliver(table, rows); return; }
  table.unsortedData = [...rows];
  table.data = rows;
  await wait(40);
}

function tableTotal(table: any, key: string): string | null {
  const tr = table.shadowRoot.querySelector('tr.group-aggregate-row[data-agg-scope="table"]');
  const td = tr?.querySelector(`td[data-key="${key}"]`);
  return td ? td.getAttribute('data-agg-value') : null;
}

describe('group expand/collapse x pipelines x mode', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    for (const pipeline of PIPELINE_NAMES) {
      it(`${mode} + ${pipeline}: collapsing hides only that group's rows and keeps its count`, async () => {
        table = await makeGrouped(plainColumns(pipeline), remote);
        const rows = baseRows();
        await send(table, rows, remote);
        expectGroupedView(table, [
          group('Eng', 1), row(rows[1]),
          group('Ops', 2), row(rows[0]), row(rows[2]),
        ]);

        clickGroupHeader(table, 'Ops', true); // chevron
        await wait(30);
        expectGroupedView(table, [
          group('Eng', 1), row(rows[1]),
          group('Ops', 2, { expanded: false }),
        ]);
      });

      it(`${mode} + ${pipeline}: re-expanding restores every cell through the documented pipeline`, async () => {
        table = await makeGrouped(plainColumns(pipeline), remote);
        const rows = baseRows();
        await send(table, rows, remote);

        clickGroupHeader(table, 'Ops', true);
        await wait(30);
        clickGroupHeader(table, 'Ops', true);
        await wait(30);

        expectGroupedView(table, [
          group('Eng', 1), row(rows[1]),
          group('Ops', 2), row(rows[0]), row(rows[2]),
        ]);
      });

      it(`${mode} + ${pipeline}: clicking the header cell toggles the same as the chevron`, async () => {
        table = await makeGrouped(plainColumns(pipeline), remote);
        const rows = baseRows();
        await send(table, rows, remote);

        clickGroupHeader(table, 'Eng'); // the whole header cell
        await wait(30);
        expectGroupedView(table, [
          group('Eng', 1, { expanded: false }),
          group('Ops', 2), row(rows[0]), row(rows[2]),
        ]);

        clickGroupHeader(table, 'Eng');
        await wait(30);
        expectGroupedView(table, [
          group('Eng', 1), row(rows[1]),
          group('Ops', 2), row(rows[0]), row(rows[2]),
        ]);
      });

      it(`${mode} + ${pipeline}: groupDefaults { expanded: false } renders every group collapsed`, async () => {
        table = await makeGrouped(plainColumns(pipeline), remote, 'dept', { expanded: false });
        const rows = baseRows();
        await send(table, rows, remote);

        expectGroupedView(table, [
          group('Eng', 1, { expanded: false }),
          group('Ops', 2, { expanded: false }),
        ]);

        clickGroupHeader(table, 'Eng', true);
        await wait(30);
        expectGroupedView(table, [
          group('Eng', 1), row(rows[1]),
          group('Ops', 2, { expanded: false }),
        ]);
      });
    }
  }
});

describe('group expansion x delivery', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: expansion state survives re-delivery of the same identities`, async () => {
      table = await makeGrouped(plainColumns('no pipeline'), remote);
      const rows = baseRows();
      await send(table, rows, remote);
      clickGroupHeader(table, 'Eng', true);
      await wait(30);

      await send(table, [...rows], remote);
      expectGroupedView(table, [
        group('Eng', 1, { expanded: false }),
        group('Ops', 2), row(rows[0]), row(rows[2]),
      ]);
    });

    it(`${mode}: a row reparented into a collapsed group stays hidden and lifts its count`, async () => {
      table = await makeGrouped(plainColumns('no pipeline'), remote);
      const rows = baseRows();
      await send(table, rows, remote);
      clickGroupHeader(table, 'Eng', true);
      await wait(30);

      // Mutated re-delivery: both Ops rows move into the collapsed Eng group.
      const next = [{ ...rows[0], dept: 'Eng' }, rows[1], { ...rows[2], dept: 'Eng' }];
      await send(table, next, remote);
      expectGroupedView(table, [group('Eng', 3, { expanded: false })]);
    });

    it(`${mode}: a brand-new group follows the expansion default`, async () => {
      table = await makeGrouped(plainColumns('no pipeline'), remote);
      const rows = baseRows();
      await send(table, rows, remote);
      clickGroupHeader(table, 'Eng', true);
      await wait(30);

      const extra = { dept: 'Fin', label: 'z', label_src: 'Z!' };
      await send(table, [...rows, extra], remote);
      expectGroupedView(table, [
        group('Eng', 1, { expanded: false }),
        group('Fin', 1), row(extra),
        group('Ops', 2), row(rows[0]), row(rows[2]),
      ]);
    });

    it(`${mode}: group-toggle reports { key, value, expanded } and the key is stable`, async () => {
      table = await makeGrouped(plainColumns('no pipeline'), remote);
      const rows = baseRows();
      await send(table, rows, remote);

      const events: any[] = [];
      table.addEventListener('group-toggle', (e: any) => events.push(e.detail));

      clickGroupHeader(table, 'Ops', true);
      await wait(30);
      clickGroupHeader(table, 'Ops', true);
      await wait(30);

      expect(events.length).toBe(2);
      expect(events[0].value).toBe('Ops');
      expect(events[0].expanded).toBe(false);
      expect(events[1].value).toBe('Ops');
      expect(events[1].expanded).toBe(true);
      expect(typeof events[0].key).toBe('string');
      expect(events[1].key).toBe(events[0].key);
    });

    // Aggregates x expand/collapse. Docs put a subtotal under every group and a
    // filtered grand total under the table; collapsing is a display state, not a
    // filter, so the grand total must not move, the collapsed group's rows AND
    // its subtotal leave the flattened sequence together, and re-expanding must
    // restore the identical subtotal.
    it(`${mode}: collapsing a group withdraws its subtotal and restores it on expand`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
      ];
      table = await makeGrouped(columns, remote);
      const rows = [{ dept: 'Eng', amount: 10 }, { dept: 'Ops', amount: 5 }, { dept: 'Ops', amount: 7 }];
      await send(table, rows, remote);
      const expanded = () => [
        group('Eng', 1), row(rows[0]), agg('group', { amount: 10 }),
        group('Ops', 2), row(rows[1]), row(rows[2]), agg('group', { amount: 12 }),
        agg('table', { amount: 22 }),
      ];
      expectGroupedView(table, expanded());

      clickGroupHeader(table, 'Ops', true);
      await wait(30);
      expectGroupedView(table, [
        group('Eng', 1), row(rows[0]), agg('group', { amount: 10 }),
        group('Ops', 2, { expanded: false }),
        agg('table', { amount: 22 }),
      ]);

      clickGroupHeader(table, 'Ops', true);
      await wait(30);
      expectGroupedView(table, expanded());
    });

    it(`${mode}: the grand total ignores expansion state`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
      ];
      table = await makeGrouped(columns, remote);
      const rows = [{ dept: 'Eng', amount: 10 }, { dept: 'Ops', amount: 5 }, { dept: 'Ops', amount: 7 }];
      await send(table, rows, remote);
      expect(tableTotal(table, 'amount')).toBe('22');

      clickGroupHeader(table, 'Ops', true);
      await wait(30);
      expect(tableTotal(table, 'amount')).toBe('22');

      clickGroupHeader(table, 'Eng', true);
      await wait(30);
      expect(tableTotal(table, 'amount')).toBe('22');
    });
  }
});

describe('multi-key grouping', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  const nested = () => [
    { dept: 'Eng', team: 'X', label: 'a', label_src: 'A!', amount: 10 },
    { dept: 'Eng', team: 'Y', label: 'b', label_src: 'B!', amount: 20 },
    { dept: 'Ops', team: 'X', label: 'c', label_src: 'C!', amount: 5 },
  ];

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    for (const pipeline of ['no pipeline', 'valueGetter+valueFormatter'] as Pipeline[]) {
      it(`${mode} + ${pipeline}: nested groups carry their own depth, counts and subtotals`, async () => {
        const columns: MatrixColumn[] = [
          { key: 'dept', label: 'Dept', type: 'text' },
          { key: 'team', label: 'Team', type: 'text' },
          labelColumn(pipeline),
          { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
        ];
        table = await makeGrouped(columns, remote, ['dept', 'team']);
        const rows = nested();
        await send(table, rows, remote);

        expectGroupedView(table, [
          group('Eng', 2, { depth: 0 }),
          group('X', 1, { depth: 1 }), row(rows[0]), agg('group', { amount: 10 }),
          group('Y', 1, { depth: 1 }), row(rows[1]), agg('group', { amount: 20 }),
          agg('group', { amount: 30 }),
          group('Ops', 1, { depth: 0 }),
          group('X', 1, { depth: 1 }), row(rows[2]), agg('group', { amount: 5 }),
          agg('group', { amount: 5 }),
          agg('table', { amount: 35 }),
        ]);
      });
    }

    it(`${mode}: collapsing an outer group hides its nested groups`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'team', label: 'Team', type: 'text' },
      ];
      table = await makeGrouped(columns, remote, ['dept', 'team']);
      const rows = nested();
      await send(table, rows, remote);

      clickGroupHeader(table, 'Eng', true);
      await wait(30);
      expectGroupedView(table, [
        group('Eng', 2, { expanded: false, depth: 0 }),
        group('Ops', 1, { depth: 0 }),
        group('X', 1, { depth: 1 }), row(rows[2]),
      ]);
    });

    // Nested grouping x collapse WITH an aggregating column. Every group level
    // gets its own subtotal, so collapsing must withdraw the whole subtree the
    // header owns — inner headers, inner subtotals AND the outer roll-up — while
    // the grand total, which covers the filtered rows rather than the visible
    // ones, stays put.
    it(`${mode}: collapsing an outer group withdraws its inner and roll-up subtotals`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'team', label: 'Team', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
      ];
      table = await makeGrouped(columns, remote, ['dept', 'team']);
      const rows = nested();
      await send(table, rows, remote);

      const expanded = () => [
        group('Eng', 2, { depth: 0 }),
        group('X', 1, { depth: 1 }), row(rows[0]), agg('group', { amount: 10 }),
        group('Y', 1, { depth: 1 }), row(rows[1]), agg('group', { amount: 20 }),
        agg('group', { amount: 30 }),
        group('Ops', 1, { depth: 0 }),
        group('X', 1, { depth: 1 }), row(rows[2]), agg('group', { amount: 5 }),
        agg('group', { amount: 5 }),
        agg('table', { amount: 35 }),
      ];
      expectGroupedView(table, expanded());

      clickGroupHeader(table, 'Eng', true);
      await wait(30);
      expectGroupedView(table, [
        group('Eng', 2, { expanded: false, depth: 0 }),
        group('Ops', 1, { depth: 0 }),
        group('X', 1, { depth: 1 }), row(rows[2]), agg('group', { amount: 5 }),
        agg('group', { amount: 5 }),
        agg('table', { amount: 35 }),
      ]);

      clickGroupHeader(table, 'Eng', true);
      await wait(30);
      expectGroupedView(table, expanded());
    });

    // The inner half of the same contract: collapsing an INNER group withdraws
    // only its own rows and its own subtotal; the enclosing group keeps its
    // roll-up (still reduced over all of its rows, hidden or not).
    it(`${mode}: collapsing an inner group keeps the enclosing roll-up intact`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'team', label: 'Team', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
      ];
      table = await makeGrouped(columns, remote, ['dept', 'team']);
      const rows = nested();
      await send(table, rows, remote);

      // Two headers are labelled 'X' (Eng/X and Ops/X); the first is Eng's.
      clickGroupHeader(table, 'X', true);
      await wait(30);
      expectGroupedView(table, [
        group('Eng', 2, { depth: 0 }),
        group('X', 1, { expanded: false, depth: 1 }),
        group('Y', 1, { depth: 1 }), row(rows[1]), agg('group', { amount: 20 }),
        agg('group', { amount: 30 }),
        group('Ops', 1, { depth: 0 }),
        group('X', 1, { depth: 1 }), row(rows[2]), agg('group', { amount: 5 }),
        agg('group', { amount: 5 }),
        agg('table', { amount: 35 }),
      ]);
    });
  }
});

// Nullish and non-string group values. `groupBy` "buckets rows by a column key",
// so two rows share a group only when they share that key's VALUE: null, '' and
// a missing field are three different values and therefore three different
// buckets, each with its own subtotal, even though all three render a blank
// label (the accessible name says "Blank"). The ORDER of a mixed-type/nullish
// group set is not documented — group value ordering is only meaningful within a
// comparable set — so this asserts membership, counts and reductions, and
// deliberately does not pin the sequence.
describe('grouping by nullish and non-string values', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  /** Every group header paired with the subtotal that follows it. */
  function groupsWithSubtotals(table: any, key: string) {
    const trs = [...table.shadowRoot.querySelectorAll('tbody tr')] as HTMLElement[];
    const out: Array<{ name: string; count: string; total: string | null }> = [];
    trs.forEach((tr, i) => {
      if (!tr.classList.contains('group-header-row')) return;
      const next = trs.slice(i + 1).find(
        (t) => t.classList.contains('group-aggregate-row') || t.classList.contains('group-header-row'),
      );
      const isSubtotal = next?.classList.contains('group-aggregate-row')
        && next.getAttribute('data-agg-scope') === 'group';
      out.push({
        name: tr.getAttribute('aria-label') ?? '',
        count: tr.querySelector('.group-header-count')?.textContent ?? '',
        total: isSubtotal
          ? (next!.querySelector(`td[data-key="${key}"]`)?.getAttribute('data-agg-value') ?? null)
          : null,
      });
    });
    return out;
  }

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: null, empty string and a missing field are three separate buckets`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
      ];
      table = await makeGrouped(columns, remote);
      const rows = [
        { dept: 10, amount: 1 },
        { dept: 2, amount: 2 },
        { dept: null, amount: 3 },
        { amount: 4 }, // dept undefined
        { dept: 'b', amount: 5 },
        { dept: '', amount: 6 },
      ];
      await send(table, rows, remote);

      // Six distinct group values -> six single-row groups, each subtotalling
      // its own row. Compared as a set: the mixed-type order is unspecified.
      const byTotal = (a: any, b: any) => Number(a.total) - Number(b.total);
      expect(groupsWithSubtotals(table, 'amount').sort(byTotal)).toEqual([
        { name: '10 group, 1 rows', count: '1', total: '1' },
        { name: '2 group, 1 rows', count: '1', total: '2' },
        { name: 'Blank group, 1 rows', count: '1', total: '3' },   // null
        { name: 'Blank group, 1 rows', count: '1', total: '4' },   // missing field
        { name: 'b group, 1 rows', count: '1', total: '5' },
        { name: 'Blank group, 1 rows', count: '1', total: '6' },   // ''
      ].sort(byTotal));

      // Every row is still rendered exactly once, and the grand total covers
      // all of them however they were bucketed.
      expect(table.shadowRoot.querySelectorAll('tbody tr[data-index]').length).toBe(rows.length);
      expect(tableTotal(table, 'amount')).toBe('21');
    });

    it(`${mode}: a blank-valued group expands and collapses like any other`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
      ];
      table = await makeGrouped(columns, remote);
      const rows = [{ dept: null, amount: 3 }, { dept: null, amount: 4 }, { dept: 'b', amount: 5 }];
      await send(table, rows, remote);

      expectGroupedView(table, [
        group('', 2), row(rows[0]), row(rows[1]), agg('group', { amount: 7 }),
        group('b', 1), row(rows[2]), agg('group', { amount: 5 }),
        agg('table', { amount: 12 }),
      ]);

      clickGroupHeader(table, ''); // the blank-labelled header
      await wait(30);
      expectGroupedView(table, [
        group('', 2, { expanded: false }),
        group('b', 1), row(rows[2]), agg('group', { amount: 5 }),
        agg('table', { amount: 12 }),
      ]);
    });
  }
});

describe('grouping switches', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: groupBy assigned after delivery groups the already-rendered rows`, async () => {
      table = await makeTable({ columns: plainColumns('valueGetter'), remote });
      const rows = baseRows();
      await send(table, rows, remote);
      expectGroupedView(table, [row(rows[0]), row(rows[1]), row(rows[2])]);

      table.groupBy = 'dept';
      await wait(40);
      expectGroupedView(table, [
        group('Eng', 1), row(rows[1]),
        group('Ops', 2), row(rows[0]), row(rows[2]),
      ]);
    });

    it(`${mode}: clearing groupBy restores the flat delivery order`, async () => {
      table = await makeGrouped(plainColumns('valueGetter+valueFormatter'), remote);
      const rows = baseRows();
      await send(table, rows, remote);

      table.groupBy = '';
      await wait(40);
      expectGroupedView(table, [row(rows[0]), row(rows[1]), row(rows[2])]);
    });

    it(`${mode}: a single-element groupBy array behaves like the string form`, async () => {
      table = await makeGrouped(plainColumns('no pipeline'), remote, ['dept']);
      const rows = baseRows();
      await send(table, rows, remote);
      expectGroupedView(table, [
        group('Eng', 1), row(rows[1]),
        group('Ops', 2), row(rows[0]), row(rows[2]),
      ]);
    });

    it(`${mode}: grouping buckets on the raw field while the getter feeds display and aggregation`, async () => {
      // ColumnDefinition documents valueGetter as running "for display, sort,
      // aggregation" — bucketing is pointedly NOT on that list, so bucketing
      // reads the row field itself and a column key that is not a row field
      // yields one blank group holding every row, whose aggregate is still
      // computed from the getter's values.
      //
      // AMBIGUITY (deliberate, flagged rather than hidden): the docs do not
      // state positively what `groupBy` does with a getter-backed key, so the
      // single blank bucket is read out of the omission plus observed behaviour,
      // not out of documented text. It is the one assertion in this slice whose
      // oracle is not a doc sentence. If grouping is ever documented to run the
      // getter, this test — not the component — is what should change.
      const columns: MatrixColumn[] = [
        { key: 'company', label: 'Company', type: 'text',
          valueGetter: (_v: any, r: any) => r.companyName },
        { key: 'derived', label: 'Amount', type: 'number', aggregate: 'sum',
          valueGetter: (_v: any, r: any) => r.amountCents / 100 },
      ];
      table = await makeGrouped(columns, remote, 'company');
      const rows = [
        { companyName: 'Acme', amountCents: 1000 },
        { companyName: 'Globex', amountCents: 2500 },
      ];
      await send(table, rows, remote);

      expectGroupedView(table, [
        group('', 2), row(rows[0]), row(rows[1]),
        agg('group', { derived: 35 }), agg('table', { derived: 35 }),
      ]);
    });

    it(`${mode}: group headers show the raw group value and the leaf count badge`, async () => {
      table = await makeGrouped(plainColumns('no pipeline'), remote);
      const rows = baseRows();
      await send(table, rows, remote);

      const headers = [...table.shadowRoot.querySelectorAll('tr.group-header-row')] as HTMLElement[];
      expect(headers.map((tr) => tr.querySelector('.group-header-label')?.textContent)).toEqual(['Eng', 'Ops']);
      expect(headers.map((tr) => tr.querySelector('.group-header-count')?.textContent)).toEqual(['1', '2']);
      expect(headers.map((tr) => tr.getAttribute('aria-label')))
        .toEqual(['Eng group, 1 rows', 'Ops group, 2 rows']);
    });

    it(`${mode}: an aggregate footer labels its scope and leaves non-aggregating columns blank`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'dept', label: 'Dept', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' },
      ];
      table = await makeGrouped(columns, remote);
      await send(table, [{ dept: 'Eng', amount: 10 }, { dept: 'Ops', amount: 5 }], remote);

      const footers = [...table.shadowRoot.querySelectorAll('tr.group-aggregate-row')] as HTMLElement[];
      expect(footers.map((tr) => tr.getAttribute('data-agg-scope'))).toEqual(['group', 'group', 'table']);
      expect(footers.map((tr) => tr.getAttribute('aria-label')))
        .toEqual(['dept: Eng subtotal', 'dept: Ops subtotal', 'Total']);
      // The label lives in the first non-aggregating column; that cell carries
      // no aggregate value of its own.
      for (const footer of footers) {
        const labelCell = footer.querySelector('td[data-key="dept"]') as HTMLElement;
        expect(labelCell.hasAttribute('data-agg-value')).toBe(false);
        expect(displayText(labelCell)).not.toBe('');
      }
    });
  }
});
