// Smoke slice of the table feature-combination matrix — the everyday-loop tier.
//
// `tests/matrix/table` (52 files, ~100s) is excluded from the default
// Vitest include in vitest.config.ts; it runs only when asked for, via
// `npm run test:matrix`. This file is the standing cost the everyday loop DOES
// pay, and it deliberately lives at `smoke.test.ts` so it stays collected.
//
// What it covers, and why that is the right subset:
//
//  * ONE combo per slice family — columns, delivery, editing, filtering,
//    grouping, height-fill, pagination, selection, sorting, tree-detail,
//    typed-cells, virtualization — with the combos ROTATED across
//    {local, remote} x {valueGetter, formatter} so all four cells are exercised
//    three times over (see `comboFor`, and the rotation-coverage test that
//    holds it to that). Those two pipelines are the load-bearing ones:
//    `valueGetter` is the only shape whose column key is NOT a row field (so a
//    dropped getter renders blank rather than accidentally correct), and
//    `formatter` is the display override that wins over `valueFormatter`. The
//    pipelines omitted here (`none`, `valueFormatter`,
//    `valueGetter+valueFormatter`) are interpolations between those two ends.
//  * The marquee regressions the matrix was built to pin, each asserted
//    outright rather than sampled, and across both delivery modes where the
//    contract has two: in-place mutation repaint, same-reference re-render,
//    sort-on-delivery, the empty/loading states, and the virtualizer's paint
//    commit.
//
// It is emphatically NOT a replacement for the matrix: it samples one cell per
// family where the matrix enumerates the full cross (5 pipelines x 2 modes x
// 3 delivery phases x every feature interaction). A change to table rendering
// still owes `npm run test:matrix` before it is called done.
//
// BUDGET: this file is in the loop every developer runs, so it is kept under
// ~5s. Adding a combo here is a real tax on everyone; add it to the matrix
// instead unless it is a regression that has actually shipped twice.
//
// Every assertion routes through the matrix's own oracles — `expectCellsMatch`
// (matrix-utils) and the per-slice support helpers — so this file cannot drift
// into asserting something weaker than the suite it stands in for.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeTable, deliver, expectCellsMatch, dataRows, wait,
  type MatrixColumn,
} from './matrix-utils';
import { expectEmptyState, expectLoadingState } from './delivery-support';
import { stubLayout, fillRow, TALL } from './height-fill-support';
import { displayText } from './typed-cells-support';
import { expectVirtualWindow, expectWindowCells } from './virtualization-support';

// ── Axes ────────────────────────────────────────────────────────────────────

type Mode = 'local' | 'remote';
type Pipe = 'valueGetter' | 'formatter';

interface Combo { mode: Mode; pipe: Pipe }

/** The four cells of {local, remote} x {valueGetter, formatter}. */
const CELLS: Combo[] = [
  { mode: 'local', pipe: 'valueGetter' },
  { mode: 'remote', pipe: 'valueGetter' },
  { mode: 'local', pipe: 'formatter' },
  { mode: 'remote', pipe: 'formatter' },
];

/** The slice families of tests/matrix/table, in file-prefix order. */
const FAMILIES = [
  'columns', 'delivery', 'editing', 'filtering', 'grouping', 'height-fill',
  'pagination', 'selection', 'sorting', 'tree-detail', 'typed-cells',
  'virtualization',
] as const;
type Family = typeof FAMILIES[number];

/**
 * Family i takes cell i % 4. Twelve families over four cells means each cell
 * runs three times, so no mode and no pipeline can break without this file
 * noticing — at a quarter of the cost of running every family four times.
 * The assignment is positional, so inserting a family reshuffles the rotation;
 * that is fine, and the coverage test below is what keeps it honest.
 */
const comboFor = (family: Family): Combo => CELLS[FAMILIES.indexOf(family) % CELLS.length];

/**
 * The column under test. The valueGetter variant keys on `company`, which is
 * deliberately NOT a row field (the remote "column key is the server's sort
 * token" shape), so a getter that never runs renders blank instead of the right
 * text by accident.
 */
function pipeColumn(pipe: Pipe, extra: Partial<MatrixColumn> = {}): MatrixColumn {
  return pipe === 'valueGetter'
    ? {
      key: 'company', label: 'Company', type: 'text', sortable: true,
      valueGetter: (_v: any, row: any) => row.src,
      ...extra,
    }
    : {
      key: 'name', label: 'Name', type: 'text', sortable: true,
      formatter: (v: any) => `f<${v}>`,
      ...extra,
    };
}

/** A plain pass-through column: the blank-cell canary, and the filter/group key. */
const CONTROL: MatrixColumn = {
  key: 'dept', label: 'Dept', type: 'text', sortable: true, filterable: true,
};

const columnsFor = (pipe: Pipe): MatrixColumn[] => [pipeColumn(pipe), CONTROL];

interface SmokeRow { id: string; name: string; src: string; dept: string; score: number }

/**
 * Delivery order is distinct from every asserted order, and `name` and `src`
 * sort to the SAME permutation ([1, 2, 0]) so one expectation covers both
 * pipelines. `dept` splits 2/1 so a filter and a grouping both bite.
 */
function people(): SmokeRow[] {
  return [
    { id: '1', name: 'Zoe', src: 'Zeta', dept: 'eng', score: 30 },
    { id: '2', name: 'Ann', src: 'Acme', dept: 'ops', score: 10 },
    { id: '3', name: 'Mid', src: 'Mid', dept: 'eng', score: 20 },
  ];
}

const pick = <T,>(rows: T[], order: number[]) => order.map(i => rows[i]);

/** Build a table in the requested mode and get `rows` on screen. */
async function build(
  mode: Mode,
  pipe: Pipe,
  rows: any[],
  attrs: Record<string, any> = {},
  columns: MatrixColumn[] = columnsFor(pipe),
) {
  const table = await makeTable({
    columns,
    data: mode === 'local' ? rows : undefined,
    remote: mode === 'remote',
    attrs,
  });
  if (mode === 'remote') await deliver(table, rows);
  await wait(20);
  return { table, columns };
}

/** Re-deliver a row set the way the mode under test delivers data. */
async function push(table: any, mode: Mode, rows: any[]) {
  if (mode === 'remote') {
    await deliver(table, rows);
  } else {
    table.unsortedData = [...rows];
    table.data = [...rows];
    await wait(40);
  }
}

let table: any;
afterEach(() => { if (table) { removeComponent(table); table = null; } });

// ── One combo per slice family ──────────────────────────────────────────────

describe('table matrix smoke: slice families', () => {
  it('the family rotation covers every {mode} x {pipeline} cell', () => {
    const covered = FAMILIES.map(f => `${comboFor(f).mode}/${comboFor(f).pipe}`);
    for (const cell of CELLS) {
      expect(covered, `no family runs ${cell.mode}/${cell.pipe}`)
        .toContain(`${cell.mode}/${cell.pipe}`);
    }
  });

  describe('columns', () => {
    const { mode, pipe } = comboFor('columns');
    it(`${mode} / ${pipe}: hiding a column leaves the pipeline column intact`, async () => {
      const rows = people();
      ({ table } = await build(mode, pipe, rows));
      table.setColumnVisible(CONTROL.key, false);
      await wait(30);
      expect(table.shadowRoot.querySelectorAll(`tbody td[data-key="${CONTROL.key}"]`))
        .toHaveLength(0);
      expectCellsMatch(table, rows, [pipeColumn(pipe)]);
    });
  });

  describe('delivery', () => {
    const { mode, pipe } = comboFor('delivery');
    it(`${mode} / ${pipe}: re-delivering the same identities keeps every value`, async () => {
      const rows = people();
      const built = await build(mode, pipe, rows);
      table = built.table;
      await push(table, mode, rows);
      expectCellsMatch(table, rows, built.columns);
    });
  });

  describe('editing', () => {
    const { mode, pipe } = comboFor('editing');
    it(`${mode} / ${pipe}: an open editor cancels back to the delivered values`, async () => {
      const rows = people();
      const built = await build(mode, pipe, rows, { editable: true });
      table = built.table;

      table.startEdit(0, CONTROL.key);
      await wait(30);
      const editor = dataRows(table)[0]
        ?.querySelector(`td[data-key="${CONTROL.key}"] .table-editor-input`);
      expect(editor, 'startEdit rendered no editor').not.toBeNull();

      table.cancelEdit();
      await wait(30);
      expectCellsMatch(table, rows, built.columns);
    });
  });

  describe('filtering', () => {
    const { mode, pipe } = comboFor('filtering');
    it(`${mode} / ${pipe}: a column filter leaves exactly the matching rows`, async () => {
      const rows = people();
      const built = await build(mode, pipe, rows);
      table = built.table;
      const matching = [rows[0], rows[2]]; // dept === 'eng'

      table.setColumnFilter(CONTROL.key, 'equals', 'eng');
      // Local mode filters `data` client-side; in remote mode the SERVER owns
      // the row set, so the filter is a request and the response is the answer.
      if (mode === 'remote') await deliver(table, matching);
      await wait(40);

      expectCellsMatch(table, matching, built.columns);
    });
  });

  describe('grouping', () => {
    const { mode, pipe } = comboFor('grouping');
    it(`${mode} / ${pipe}: groupBy renders one header per group, rows unchanged`, async () => {
      const rows = people();
      const built = await build(mode, pipe, rows);
      table = built.table;

      table.groupBy = CONTROL.key;
      await wait(50);

      expect(table.shadowRoot.querySelectorAll('tr.group-header-row'),
        'one header per distinct dept').toHaveLength(2);
      // Grouped order is eng (rows 0, 2) then ops (row 1).
      expectCellsMatch(table, pick(rows, [0, 2, 1]), built.columns);
    });
  });

  describe('height-fill', () => {
    const { mode, pipe } = comboFor('height-fill');
    it(`${mode} / ${pipe}: a frame taller than its rows grows a filler row`, async () => {
      const rows = people();
      const columns = columnsFor(pipe);
      table = await makeTable({
        columns,
        data: mode === 'local' ? rows : undefined,
        remote: mode === 'remote',
        height: '600px',
      });
      // happy-dom performs no layout; stubLayout pins the two boxes
      // updateFillRow() compares, which is the whole documented rule.
      stubLayout(table, TALL.frame, TALL.table);
      await push(table, mode, rows);

      expect(fillRow(table), 'no filler for a 500px leftover').not.toBeNull();
      expectCellsMatch(table, rows, columns);
    });
  });

  describe('pagination', () => {
    const { mode, pipe } = comboFor('pagination');
    it(`${mode} / ${pipe}: each page renders exactly its slice`, async () => {
      const rows = people();
      const built = await build(mode, pipe, rows, { pagination: true, 'page-size': 2 });
      table = built.table;

      expectCellsMatch(table, rows.slice(0, 2), built.columns);
      table.goToPage(2);
      await wait(40);
      expectCellsMatch(table, rows.slice(2), built.columns);
    });
  });

  describe('selection', () => {
    const { mode, pipe } = comboFor('selection');
    it(`${mode} / ${pipe}: a selected row is marked and still renders its values`, async () => {
      const rows = people();
      const built = await build(mode, pipe, rows, { selectable: true });
      table = built.table;

      table.selectedRows = [1];
      await wait(40);

      expect(dataRows(table).map(tr => tr.getAttribute('data-selected')))
        .toEqual(['false', 'true', 'false']);
      expectCellsMatch(table, rows, built.columns);
    });
  });

  describe('sorting', () => {
    const { mode, pipe } = comboFor('sorting');
    it(`${mode} / ${pipe}: sorting the pipeline column orders by its derived value`, async () => {
      const rows = people();
      const column = pipeColumn(pipe);
      const built = await build(mode, pipe, rows);
      table = built.table;
      const ascending = pick(rows, [1, 2, 0]);

      table.toggleSort(column.key);
      // Remote sorting is the server's job: the sort is a request, and the
      // response is the ordering the table must render.
      if (mode === 'remote') await deliver(table, ascending);
      await wait(60);

      expect(table.currentSort).toEqual([{ column: column.key, direction: 'asc' }]);
      expectCellsMatch(table, ascending, built.columns);
    });
  });

  describe('tree-detail', () => {
    const { mode, pipe } = comboFor('tree-detail');
    it(`${mode} / ${pipe}: a tree flattens to its expanded nodes with pipeline values`, async () => {
      // Every node of the hierarchy is a real row (a path with no row behind it
      // renders a synthetic parent with no values), listed here in the order the
      // tree flattens to: roots sort alphabetically, children by full path key.
      const nodes = [
        { name: 'Eng', src: 'EngCo', dept: 'eng', path: ['eng'] },
        { name: 'Mid', src: 'Mid', dept: 'eng', path: ['eng', 'Mid'] },
        { name: 'Zoe', src: 'Zeta', dept: 'eng', path: ['eng', 'Zoe'] },
        { name: 'Ops', src: 'OpsCo', dept: 'ops', path: ['ops'] },
        { name: 'Ann', src: 'Acme', dept: 'ops', path: ['ops', 'Ann'] },
      ];
      const columns = columnsFor(pipe);
      table = await makeTable({ columns, remote: mode === 'remote', data: [] });
      // The pipeline column stays an ordinary column; `dept` carries the
      // indent/chevron, so this asserts the pipeline on a NON-group column.
      table.setTreeData({
        getPath: (row: any) => row.path,
        groupColumn: CONTROL.key,
        defaultExpansionDepth: 2,
      });
      await push(table, mode, nodes);

      expectCellsMatch(table, nodes, [pipeColumn(pipe)]);
    });
  });

  describe('typed-cells', () => {
    const { mode, pipe } = comboFor('typed-cells');
    it(`${mode} / ${pipe}: a number cell paints its pipeline result`, async () => {
      const rows = people();
      // The pipeline moved onto a typed (number) column: the documented rule is
      // that a column declaring a formatter renders through snice-cell-text and
      // its `value` IS the display value.
      const numeric: MatrixColumn = pipe === 'valueGetter'
        ? { key: 'total', label: 'Total', type: 'number', valueGetter: (_v: any, r: any) => r.score }
        : { key: 'score', label: 'Score', type: 'number', formatter: (v: any) => `$${v}` };
      const columns = [numeric, CONTROL];
      const built = await build(mode, pipe, rows, {}, columns);
      table = built.table;

      expectCellsMatch(table, rows, columns);
      // …and the same oracle against the text a user actually sees.
      const painted = dataRows(table).map(tr =>
        displayText(tr.querySelector(`td[data-key="${numeric.key}"]`) as HTMLElement));
      expect(painted).toEqual(
        rows.map(r => pipe === 'valueGetter' ? String(r.score) : `$${r.score}`));
    });
  });

  describe('virtualization', () => {
    const { mode, pipe } = comboFor('virtualization');
    it(`${mode} / ${pipe}: the virtual window is contiguous and its spacers reserve the rest`, async () => {
      const rows = Array.from({ length: 30 }, (_, i) => ({
        id: `v${i}`, name: `Name-${i}`, src: `Src-${i}`, dept: 'eng', score: i,
      }));
      const columns = columnsFor(pipe);
      table = await makeTable({
        columns,
        data: mode === 'local' ? [] : undefined,
        remote: mode === 'remote',
        attrs: { virtualize: true },
      });
      await push(table, mode, rows);

      expectVirtualWindow(table, rows, columns.length);
      expectWindowCells(table, rows, [pipeColumn(pipe)]);
    });
  });
});

// ── Marquee regressions ─────────────────────────────────────────────────────
//
// The defects the matrix was built to pin. These are asserted outright rather
// than sampled: each one is a bug that shipped, and none of them is implied by
// the family scenarios above.

describe('table matrix smoke: marquee regressions', () => {
  // MATRIX-delivery-1: a row object mutated IN PLACE keeps its identity, so the
  // reconciler recycles its <tr>. The recycled row must still repaint.
  for (const mode of ['local', 'remote'] as Mode[]) {
    it(`${mode}: an in-place row mutation repaints the recycled row`, async () => {
      const rows = people();
      const built = await build(mode, 'formatter', rows);
      table = built.table;

      rows[0].name = 'Mutated';
      rows[0].src = 'MutatedSrc';
      await push(table, mode, rows);

      expectCellsMatch(table, rows, built.columns);
      expect(displayText(dataRows(table)[0]
        .querySelector('td[data-key="name"]') as HTMLElement)).toBe('f<Mutated>');
    });
  }

  // MATRIX-delivery-2: `data` opts out of the core identity dirty-check
  // (`hasChanged: () => true`), so re-assigning the SAME array reference after
  // mutating its contents still rerenders. Local-only: it is a contract about
  // the `data` property, which remote tables never assign.
  it('local: re-assigning the same array reference after a mutation rerenders', async () => {
    const rows = people();
    const built = await build('local', 'formatter', rows);
    table = built.table;

    rows[1].name = 'Rewritten';
    table.data = rows; // same reference, mutated contents
    await wait(50);

    expectCellsMatch(table, rows, built.columns);
  });

  // MATRIX-sorting-1: with a non-empty `currentSort`, a local `data` assignment
  // must render the SORTED view — the delivery that produced `data` cannot
  // decide the order.
  it('local: data delivered under an active sort renders sorted, not raw', async () => {
    const rows = people();
    const built = await build('local', 'formatter', []);
    table = built.table;

    table.currentSort = [{ column: 'name', direction: 'asc' }];
    await push(table, 'local', rows);

    expectCellsMatch(table, pick(rows, [1, 2, 0]), built.columns);
  });

  // The documented zero-row states: a loading spinner while a remote request is
  // in flight, and the empty-state placeholder once it resolves with no rows.
  it('remote: an in-flight load shows the spinner, an empty result the placeholder', async () => {
    table = await makeTable({ columns: columnsFor('formatter'), remote: true });

    const pending: Array<{ resolve: (v: any) => void }> = [];
    table.addEventListener('@request/table/data', (e: any) => {
      e.detail.discovery.resolve();
      pending.push(e.detail.data);
    });
    table.getTableData();
    await wait(30);
    expectLoadingState(table);

    pending[pending.length - 1].resolve({ data: [] });
    await wait(50);
    expectEmptyState(table);
  });

  it('local: clearing the rows falls back to the empty-state placeholder', async () => {
    const built = await build('local', 'formatter', people());
    table = built.table;
    await push(table, 'local', []);
    expectEmptyState(table);
  });

  // The virtualizer's paint commit: a windowed row is not done when its <tr>
  // exists — the cell element inside it has to have rendered its `content`
  // part. Asserting the window structure alone would pass on a blank body.
  for (const mode of ['local', 'remote'] as Mode[]) {
    it(`${mode}: every windowed cell commits painted text, not just a row`, async () => {
      const rows = Array.from({ length: 30 }, (_, i) => ({
        id: `v${i}`, name: `Name-${i}`, src: `Src-${i}`, dept: 'eng', score: i,
      }));
      const columns = columnsFor('formatter');
      table = await makeTable({
        columns,
        data: mode === 'local' ? [] : undefined,
        remote: mode === 'remote',
        attrs: { virtualize: true },
      });
      await push(table, mode, rows);

      const window_ = expectVirtualWindow(table, rows, columns.length);
      expect(window_.rows.length, 'window rendered no rows').toBeGreaterThan(0);

      const painted = window_.rows.map((tr, i) => ({
        index: window_.indices[i],
        text: displayText(tr.querySelector('td[data-key="name"]') as HTMLElement),
      }));
      expect(painted.map(p => p.text)).toEqual(painted.map(p => `f<Name-${p.index}>`));
    });
  }
});
