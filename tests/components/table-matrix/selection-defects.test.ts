/**
 * Documented-behaviour divergences found in the selection slice.
 *
 * Every test here asserts what docs/ai/components/table.md specifies. Each
 * finding was fixed at the source, so these are now permanent regression tests;
 * NOTHING here asserts the buggy output.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, dataRows, wait, type MatrixColumn } from './matrix-utils';
import {
  ID_COLUMN, PIPELINES, rows as freshRows,
  selectAllCheckbox, rowCheckbox, trFor, toggleCheckbox, clickRow,
  renderedCellText, expectedDisplayText,
} from './selection-helpers';

const VG = PIPELINES.valueGetter;

async function build(opts: { pipeline?: string; remote: boolean; attrs?: Record<string, any> }) {
  const column = PIPELINES[opts.pipeline ?? 'valueGetter'];
  const columns: MatrixColumn[] = [ID_COLUMN, column];
  const data = freshRows();
  const table = await makeTable({
    columns,
    data: opts.remote ? undefined : data,
    attrs: { selectable: true, ...(opts.attrs ?? {}) },
    remote: opts.remote,
  });
  if (opts.remote) await deliver(table, data);
  return { table, data, columns, column };
}

/** Which rendered row currently shows a given row id, and is it selected? */
function selectionByRowId(table: any): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const tr of dataRows(table)) {
    const index = Number(tr.getAttribute('data-index'));
    out[renderedCellText(table, index, 'id')] = tr.getAttribute('data-selected') === 'true';
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// MATRIX-selection-1 (FIXED) — a `formatter` column's display text reaches the
// value the shared matrix oracle reads (the typed cell's `value` attribute).
// Docs: `formatter?:(value,row?)=>string` is the column's display formatter.
// ─────────────────────────────────────────────────────────────────────────
describe('MATRIX-selection-1: formatter output reaches the cell value the oracle reads', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const remote of [false, true]) {
    it(`${remote ? 'remote' : 'local'} | selectable+striped | formatter | cell value carries the formatted text`, async () => {
      const built = await build({ pipeline: 'formatter', remote, attrs: { striped: true } });
      table = built.table;
      const cellValues = dataRows(table).map(tr => {
        const td = tr.querySelector('td[data-key="name"]') as HTMLElement;
        return td.querySelector('[value]')!.getAttribute('value');
      });
      expect(cellValues).toEqual(['<Alice>', '<Bob>', '<Carol>']);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// MATRIX-selection-2 (FIXED) — `formatter` is the display formatter and
// `valueFormatter` only its fallback, so the rendered cell shows the formatter
// result when both are declared.
// ─────────────────────────────────────────────────────────────────────────
describe('MATRIX-selection-2: formatter wins over valueFormatter in the rendered cell', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const remote of [false, true]) {
    for (const selectionMode of ['multiple', 'single', 'none']) {
      it(`${remote ? 'remote' : 'local'} | selectable+${selectionMode} | formatter+valueFormatter | formatter wins`, async () => {
        const built = await build({
          pipeline: 'formatter+valueFormatter', remote,
          attrs: { 'selection-mode': selectionMode, striped: true },
        });
        table = built.table;
        const shown = built.data.map((_r, i) => renderedCellText(table, i, 'name'));
        expect(shown).toEqual(built.data.map(r => expectedDisplayText(built.column, r)));
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────
// MATRIX-selection-3 (FIXED) — `selectable` is a reactive property/attribute
// of the table: toggling it post-mount rebuilds the selection tool column in
// the header AND the body, like its `selection-mode` sibling.
// ─────────────────────────────────────────────────────────────────────────
describe('MATRIX-selection-3: post-mount `selectable` toggle rebuilds the selection column', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const remote of [false, true]) {
    const name = remote ? 'remote' : 'local';

    it(`${name} | valueGetter | selectable=false → true adds the checkbox column`, async () => {
      const data = freshRows();
      table = await makeTable({
        columns: [ID_COLUMN, VG],
        data: remote ? undefined : data,
        attrs: { selectable: false },
        remote,
      });
      if (remote) await deliver(table, data);

      table.selectable = true;
      await wait(80);

      expect(table.hasAttribute('selectable'), 'attribute reflects').toBe(true);
      expect(table.shadowRoot.querySelector('thead th.select-column'), 'header select column').toBeTruthy();
      expect(table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length,
        'one row checkbox per row').toBe(3);
    });

    it(`${name} | valueGetter | selectable=true → false removes the checkbox column`, async () => {
      const built = await build({ remote });
      table = built.table;
      expect(table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length).toBe(3);

      table.selectable = false;
      await wait(80);

      expect(table.shadowRoot.querySelector('thead th.select-column'), 'header select column removed').toBeNull();
      expect(table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length,
        'row checkboxes removed').toBe(0);
    });

    it(`${name} | valueGetter | removing the selectable attribute removes the checkbox column`, async () => {
      const built = await build({ remote });
      table = built.table;

      table.removeAttribute('selectable');
      await wait(80);

      expect(table.selectable, 'property follows the attribute').toBe(false);
      expect(table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length).toBe(0);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// MATRIX-selection-4 (FIXED) — docs: selected data rows expose
// `aria-selected="true"`. Interaction-driven selection stamps it on the delta
// path too, not only on the next full body render.
// ─────────────────────────────────────────────────────────────────────────
describe('MATRIX-selection-4: aria-selected follows an interaction-driven selection', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const remote of [false, true]) {
    const name = remote ? 'remote' : 'local';

    it(`${name} | valueGetter | click selection sets aria-selected`, async () => {
      const built = await build({ remote });
      table = built.table;

      clickRow(table, 1);
      await wait(20);

      expect(trFor(table, 1)!.getAttribute('data-selected')).toBe('true');
      expect(trFor(table, 1)!.getAttribute('aria-selected'), 'selected row exposes aria-selected').toBe('true');
    });

    it(`${name} | valueGetter | checkbox selection sets aria-selected`, async () => {
      const built = await build({ remote });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 2), true);
      await wait(20);

      expect(trFor(table, 2)!.getAttribute('aria-selected')).toBe('true');
    });

    it(`${name} | valueGetter | select-all sets aria-selected on every row`, async () => {
      const built = await build({ remote });
      table = built.table;

      toggleCheckbox(selectAllCheckbox(table), true);
      await wait(20);

      expect(dataRows(table).map(tr => tr.getAttribute('aria-selected')))
        .toEqual(['true', 'true', 'true']);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// MATRIX-selection-5 (FIXED) — a local sort (or a reordered re-delivery of the
// same row identities) must not retarget the selection: `selectedRows` is
// re-resolved against the row objects when `data` is reordered underneath, so
// the highlight and `getSelectedData()` stay on the row the user picked.
// ─────────────────────────────────────────────────────────────────────────
describe('MATRIX-selection-5: a reorder keeps the selection on its own row', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  // Each pipeline sorts on its own column; `none` sorts names, which are
  // already ascending, so it cycles to descending to force a real reorder.
  const SORT_CASES = [
    { pipeline: 'none', toggles: 2, order: ['r2', 'r1', 'r0'] },        // Carol, Bob, Alice
    { pipeline: 'valueGetter', toggles: 1, order: ['r1', 'r2', 'r0'] }, // Alpha, Mid, Zeta
  ];

  for (const { pipeline, toggles, order } of SORT_CASES) {
    it(`local | ${pipeline} | selection follows the row across a sort`, async () => {
      const built = await build({ pipeline, remote: false, attrs: { sortable: true } });
      table = built.table;

      clickRow(table, 0); // select r0
      await wait(20);
      expect(table.getSelectedData().map((r: any) => r.id)).toEqual(['r0']);

      for (let i = 0; i < toggles; i++) {
        table.toggleSort(built.column.key);
        await wait(80);
      }
      expect(dataRows(table).map((_tr, i) => renderedCellText(table, i, 'id')),
        'sorted display order').toEqual(order);

      expect(table.getSelectedData().map((r: any) => r.id),
        'the sort must not move the selection to another row').toEqual(['r0']);
      expect(selectionByRowId(table)).toEqual({ r0: true, r1: false, r2: false });
    });
  }

  for (const pipeline of ['none', 'valueGetter']) {
    it(`local | ${pipeline} | selection follows the row across a reordered re-delivery`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 0), true);
      await wait(20);
      expect(table.getSelectedData().map((r: any) => r.id)).toEqual(['r0']);

      // Same identities, new order.
      const reordered = [built.data[2], built.data[1], built.data[0]];
      table.data = reordered;
      table.unsortedData = [...reordered];
      await wait(60);

      expect(table.getSelectedData().map((r: any) => r.id),
        'same rows re-delivered in another order keep their selection').toEqual(['r0']);
      expect(selectionByRowId(table)).toEqual({ r0: true, r1: false, r2: false });
    });
  }

  // The gate, from the other side: only a real permutation is remapped. A new
  // row set of the same length keeps the documented raw-index semantics, even
  // when the outgoing array repeated a row object (which would otherwise pass a
  // naive "same length + every old row still present" permutation test).
  it('local | valueGetter | a different row set of the same length keeps raw-index semantics', async () => {
    const rows = freshRows();
    const duplicated = [rows[0], rows[0], rows[1]];
    table = await makeTable({
      columns: [ID_COLUMN, VG],
      data: duplicated,
      attrs: { selectable: true },
    });

    // Model-level: a body holding the same row object twice cannot offer two
    // distinct row checkboxes, so the selection is assigned directly.
    table.selectedRows = [1];
    await wait(20);

    // Same length, and every outgoing row object still present — but this is a
    // NEW data set, not a reorder of the old one.
    const replaced = [rows[0], rows[1], rows[2]];
    table.data = replaced;
    table.unsortedData = [...replaced];
    await wait(60);

    expect(table.selectedRows, 'raw index is preserved for a new row set').toEqual([1]);
    expect(table.getSelectedData().map((r: any) => r.id)).toEqual(['r1']);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// MATRIX-selection-6 (FIXED) — the header select-all control tracks the row
// set, not just `selectedRows`: a delivery or a cleared filter that changes the
// denominator re-derives its checked/indeterminate state.
// ─────────────────────────────────────────────────────────────────────────
describe('MATRIX-selection-6: select-all state follows the row set', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  it('local | valueGetter | select-all becomes indeterminate when a new row arrives', async () => {
    const built = await build({ remote: false });
    table = built.table;

    toggleCheckbox(selectAllCheckbox(table), true);
    await wait(20);
    expect([...table.selectedRows].sort()).toEqual([0, 1, 2]);

    const grown = [...built.data, { id: 'r3', name: 'Dave', companyName: 'Omega' }];
    table.data = grown;
    table.unsortedData = [...grown];
    await wait(60);

    expect(dataRows(table).length).toBe(4);
    const cb = selectAllCheckbox(table);
    expect(!!cb.checked, '3 of 4 rows selected is not "all selected"').toBe(false);
    expect(!!cb.indeterminate, '3 of 4 rows selected is indeterminate').toBe(true);
  });

  it('local | valueGetter | select-all becomes indeterminate when a filter is cleared', async () => {
    const built = await build({ remote: false, attrs: { 'quick-filter': true } });
    table = built.table;

    table.setQuickFilter('r1');
    await wait(40);
    expect(dataRows(table).length).toBe(1);

    toggleCheckbox(selectAllCheckbox(table), true);
    await wait(20);
    expect(table.selectedRows).toEqual([1]);

    table.setQuickFilter('');
    await wait(60);
    expect(dataRows(table).length).toBe(3);

    const cb = selectAllCheckbox(table);
    expect(!!cb.checked, '1 of 3 rows selected is not "all selected"').toBe(false);
    expect(!!cb.indeterminate, '1 of 3 rows selected is indeterminate').toBe(true);
  });
});
