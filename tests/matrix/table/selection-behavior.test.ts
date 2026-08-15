/**
 * Selection behaviour crossed with delivery mode and the value pipeline.
 *
 * These tests assert the selection MODEL and its DOM reflection (the rendered
 * pipeline display text is selection-pipeline.test.ts's job), so every pipeline
 * shape can be crossed in here.
 *
 * Documented contract exercised here (docs/ai/components/table.md):
 *  - `selectable`, `selection-mode: none|single|multiple`, `selectedRows` are
 *    raw-data indices, reactive from JS, `getSelectedData()` resolves them,
 *    `updateRowSelectionState()` / `updateSelectAllState()` resync the DOM.
 *  - `setSelectabilityCheck(fn)` installs a row predicate.
 *  - selection is anchored to the ROW: a local sort, or a re-delivery of the
 *    same row objects in another order, re-resolves `selectedRows`.
 *  - `aria-selected="true"` is written with `data-selected` on every path.
 *  - events: `selection-changed {selectedRows,rows}`,
 *    `table-row-selection-changed {selectedRows,rowIndex,selected}`,
 *    `table-select-all-changed {selectedRows,allSelected}`, `row-clicked {rowData,rowIndex}`.
 *  - keyboard: Space/Shift+Space toggle selection, Ctrl/Cmd+A selects the
 *    filtered SELECTABLE rows.
 *  - the presentational attributes (`striped`, `hoverable`, `clickable`) are
 *    observed as the CSS hooks they are — see `expectPresentationHooks`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeTable, deliver, respondWith, dataRows, expectCellsMatch, wait, type MatrixColumn,
} from './matrix-utils';
import {
  ID_COLUMN, PIPELINES, PIPELINE_KEYS, ATTRIBUTE_COMBOS, rows as freshRows,
  selectAllCheckbox, rowCheckbox, trFor, toggleCheckbox, clickRow, renderedCellText,
  expectSelectionDomConsistent, expectPresentationHooks, expectNoBlankCells,
} from './selection-helpers';

async function build(opts: {
  pipeline: string;
  remote: boolean;
  attrs?: Record<string, any>;
  data?: any[];
}) {
  const column = PIPELINES[opts.pipeline];
  const columns: MatrixColumn[] = [ID_COLUMN, column];
  const data = opts.data ?? freshRows();
  const table = await makeTable({
    columns,
    data: opts.remote ? undefined : data,
    attrs: { selectable: true, ...(opts.attrs ?? {}) },
    remote: opts.remote,
  });
  if (opts.remote) await deliver(table, data);
  return { table, data, columns, column };
}

function events(table: any, type: string): any[] {
  const seen: any[] = [];
  table.addEventListener(type, (e: any) => seen.push(e.detail));
  return seen;
}

function selectedIds(table: any): string[] {
  return (table.getSelectedData() as any[]).map(r => r.id);
}

function selectedTrIds(table: any, data: any[]): string[] {
  return dataRows(table)
    .filter(tr => tr.getAttribute('data-selected') === 'true')
    .map(tr => data[Number(tr.getAttribute('data-index'))].id);
}

const MODES: Array<{ remote: boolean; name: string }> = [
  { remote: false, name: 'local' },
  { remote: true, name: 'remote' },
];

// ── select-all (multiple mode) ────────────────────────────────────────────
describe('select-all × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      it(`${name} | ${pipeline} | header select-all selects then clears every row`, async () => {
        const built = await build({ pipeline, remote, attrs: { striped: true } });
        table = built.table;

        const selectionChanged = events(table, 'selection-changed');
        const selectAllChanged = events(table, 'table-select-all-changed');

        const cb = selectAllCheckbox(table);
        expect(cb, 'select-all checkbox in multiple mode').toBeTruthy();
        expect(!!cb.checked, 'select-all starts unchecked').toBe(false);

        toggleCheckbox(cb, true);
        await wait(20);

        expect([...table.selectedRows].sort()).toEqual([0, 1, 2]);
        expect(selectedIds(table)).toEqual(['r0', 'r1', 'r2']);
        expect(selectedTrIds(table, built.data)).toEqual(['r0', 'r1', 'r2']);
        expectSelectionDomConsistent(table, `${name}/${pipeline} after select-all`);
        expect(selectAllChanged.at(-1)).toEqual({ selectedRows: [0, 1, 2], allSelected: true });
        expect(selectionChanged.at(-1).rows).toEqual(built.data);

        toggleCheckbox(cb, false);
        await wait(20);

        expect(table.selectedRows).toEqual([]);
        expect(selectedTrIds(table, built.data)).toEqual([]);
        expectSelectionDomConsistent(table, `${name}/${pipeline} after clear`);
        expect(selectAllChanged.at(-1)).toEqual({ selectedRows: [], allSelected: false });
        expect(selectionChanged.at(-1).rows).toEqual([]);
      });

      it(`${name} | ${pipeline} | select-all checkbox tracks partial selection`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        toggleCheckbox(rowCheckbox(table, 1), true);
        await wait(20);
        const cb = selectAllCheckbox(table);
        expect(!!cb.checked, 'partial selection is not "all"').toBe(false);
        expect(!!cb.indeterminate, 'partial selection is indeterminate').toBe(true);

        toggleCheckbox(rowCheckbox(table, 0), true);
        toggleCheckbox(rowCheckbox(table, 2), true);
        await wait(20);
        expect(!!cb.checked, 'every row selected → checked').toBe(true);
        expect(!!cb.indeterminate).toBe(false);
      });
    }
  }
});

// ── per-row selection ─────────────────────────────────────────────────────
describe('per-row selection × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      it(`${name} | ${pipeline} | row checkbox toggles exactly its own row`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;
        const rowSel = events(table, 'table-row-selection-changed');

        toggleCheckbox(rowCheckbox(table, 1), true);
        await wait(20);
        expect(table.selectedRows).toEqual([1]);
        expect(selectedIds(table)).toEqual(['r1']);
        expect(selectedTrIds(table, built.data)).toEqual(['r1']);
        expect(rowSel.at(-1)).toEqual({ selectedRows: [1], rowIndex: 1, selected: true });
        expectSelectionDomConsistent(table, `${name}/${pipeline} row1 selected`);

        toggleCheckbox(rowCheckbox(table, 1), false);
        await wait(20);
        expect(table.selectedRows).toEqual([]);
        expect(rowSel.at(-1)).toEqual({ selectedRows: [], rowIndex: 1, selected: false });
        expectSelectionDomConsistent(table, `${name}/${pipeline} row1 deselected`);
      });

      it(`${name} | ${pipeline} | plain click toggles, ctrl-click adds, shift-click ranges`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        clickRow(table, 0);
        await wait(20);
        expect(table.selectedRows).toEqual([0]);

        clickRow(table, 2, { ctrlKey: true });
        await wait(20);
        expect([...table.selectedRows].sort()).toEqual([0, 2]);
        expect(selectedIds(table).sort()).toEqual(['r0', 'r2']);

        // Shift extends from the anchor (row 2) back to row 0 → the whole range.
        clickRow(table, 0, { shiftKey: true });
        await wait(20);
        expect([...table.selectedRows].sort()).toEqual([0, 1, 2]);
        expectSelectionDomConsistent(table, `${name}/${pipeline} range`);
      });
    }
  }
});

// ── selection-mode ────────────────────────────────────────────────────────
describe('selection-mode × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      it(`${name} | ${pipeline} | single keeps at most one row selected and has no select-all`, async () => {
        const built = await build({ pipeline, remote, attrs: { 'selection-mode': 'single', hoverable: true } });
        table = built.table;

        expect(selectAllCheckbox(table), 'no select-all control in single mode').toBeNull();
        expect(table.shadowRoot.querySelector('thead th.select-column'), 'select column header').toBeTruthy();

        clickRow(table, 1);
        await wait(20);
        expect(table.selectedRows).toEqual([1]);

        clickRow(table, 2);
        await wait(20);
        expect(table.selectedRows, 'single mode collapses to the last row').toEqual([2]);
        expect(selectedIds(table)).toEqual(['r2']);
        expectSelectionDomConsistent(table, `${name}/${pipeline} single`);

        // Ctrl-click must not accumulate either.
        clickRow(table, 0, { ctrlKey: true });
        await wait(20);
        expect(table.selectedRows).toEqual([0]);
      });

      it(`${name} | ${pipeline} | none renders no selection column and never selects`, async () => {
        const built = await build({ pipeline, remote, attrs: { 'selection-mode': 'none', clickable: true } });
        table = built.table;
        const clicks = events(table, 'row-clicked');

        expect(table.shadowRoot.querySelector('thead th.select-column')).toBeNull();
        expect(table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length).toBe(0);
        expectSelectionDomConsistent(table, `${name}/${pipeline} none`);

        clickRow(table, 1);
        await wait(20);
        expect(table.selectedRows, 'selection-mode="none" never selects').toEqual([]);
        expect(selectedTrIds(table, built.data)).toEqual([]);
        // clickable still reports the row.
        expect(clicks.at(-1)).toEqual({ rowData: built.data[1], rowIndex: 1 });
      });
    }
  }
});

// ── clickable / striped / hoverable coexistence ───────────────────────────
describe('clickable + selectable × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      it(`${name} | ${pipeline} | one click both selects and emits row-clicked`, async () => {
        const built = await build({
          pipeline, remote,
          attrs: { clickable: true, striped: true, hoverable: true },
        });
        table = built.table;
        const clicks = events(table, 'row-clicked');
        const selection = events(table, 'selection-changed');

        clickRow(table, 2);
        await wait(20);

        expect(clicks.length, 'exactly one row-clicked').toBe(1);
        expect(clicks[0].rowIndex).toBe(2);
        expect(clicks[0].rowData, 'row-clicked carries the delivered row object').toBe(built.data[2]);
        expect(selection.at(-1)).toEqual({ selectedRows: [2], rows: [built.data[2]] });
        expectSelectionDomConsistent(table, `${name}/${pipeline} clickable`);
        // striped/hoverable/clickable are CSS hooks: assert each one's rule is
        // shipped, intact and guarded by a host the attribute actually reached.
        expectPresentationHooks(table,
          { striped: true, hoverable: true, clickable: true },
          `${name}/${pipeline} clickable`);
      });
    }
  }
});

// ── selectability predicate ───────────────────────────────────────────────
describe('setSelectabilityCheck × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      it(`${name} | ${pipeline} | unselectable rows are disabled, unclickable and skipped by select-all`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        table.setSelectabilityCheck((row: any) => row.id !== 'r1');
        await wait(50);

        expect(!!rowCheckbox(table, 0).disabled).toBe(false);
        expect(!!rowCheckbox(table, 1).disabled, 'r1 checkbox disabled').toBe(true);
        expect(!!rowCheckbox(table, 2).disabled).toBe(false);
        expectSelectionDomConsistent(table, `${name}/${pipeline} predicate installed`);

        // select-all covers only the selectable rows, and reads as "all".
        const cb = selectAllCheckbox(table);
        toggleCheckbox(cb, true);
        await wait(20);
        expect([...table.selectedRows].sort()).toEqual([0, 2]);
        expect(selectedIds(table)).toEqual(['r0', 'r2']);
        expect(!!cb.checked).toBe(true);
        expect(!!cb.indeterminate).toBe(false);
        expectSelectionDomConsistent(table, `${name}/${pipeline} select-all with predicate`);

        // Clicking the blocked row changes nothing.
        clickRow(table, 1);
        await wait(20);
        expect([...table.selectedRows].sort()).toEqual([0, 2]);

        // Its checkbox refuses too.
        toggleCheckbox(rowCheckbox(table, 1), true);
        await wait(20);
        expect([...table.selectedRows].sort()).toEqual([0, 2]);
        expect(!!rowCheckbox(table, 1).checked, 'blocked checkbox snaps back').toBe(false);
      });

      it(`${name} | ${pipeline} | installing a predicate drops rows it no longer allows`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        toggleCheckbox(selectAllCheckbox(table), true);
        await wait(20);
        expect([...table.selectedRows].sort()).toEqual([0, 1, 2]);

        table.setSelectabilityCheck((row: any) => row.id === 'r2');
        await wait(50);

        expect(table.selectedRows, 'selection filtered by the new predicate').toEqual([2]);
        expect(selectedIds(table)).toEqual(['r2']);
        expect(selectedTrIds(table, built.data)).toEqual(['r2']);
        expectSelectionDomConsistent(table, `${name}/${pipeline} predicate narrowed`);
      });
    }
  }
});

// ── keyboard ──────────────────────────────────────────────────────────────
describe('keyboard selection × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  function key(table: any, k: string, init: Partial<KeyboardEventInit> = {}) {
    const el = table.shadowRoot.querySelector('table') as HTMLElement;
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, ...init }));
  }

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      it(`${name} | ${pipeline} | Space toggles the focused row, Ctrl+A selects all`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        key(table, 'ArrowDown'); // header → row 0
        key(table, 'ArrowDown'); // row 0 → row 1
        key(table, ' ');
        await wait(20);
        expect(table.selectedRows, 'Space selects the focused row').toEqual([1]);
        expect(selectedIds(table)).toEqual(['r1']);
        expectSelectionDomConsistent(table, `${name}/${pipeline} space`);

        key(table, ' ');
        await wait(20);
        expect(table.selectedRows, 'Space toggles back off').toEqual([]);

        key(table, 'a', { ctrlKey: true });
        await wait(20);
        expect([...table.selectedRows].sort()).toEqual([0, 1, 2]);
        expectSelectionDomConsistent(table, `${name}/${pipeline} ctrl+a`);
      });

      it(`${name} | ${pipeline} | Shift+Space toggles the focused row and keeps the earlier ones`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        key(table, 'ArrowDown'); // header → row 0
        key(table, 'ArrowDown'); // row 0 → row 1
        key(table, ' ', { shiftKey: true });
        await wait(20);
        expect(table.selectedRows, 'Shift+Space selects the focused row').toEqual([1]);
        expect(selectedIds(table)).toEqual(['r1']);

        key(table, 'ArrowDown'); // row 1 → row 2
        key(table, ' ', { shiftKey: true });
        await wait(20);
        expect([...table.selectedRows].sort(), 'Shift+Space extends the selection').toEqual([1, 2]);
        expect(selectedIds(table).sort()).toEqual(['r1', 'r2']);
        expectSelectionDomConsistent(table, `${name}/${pipeline} shift+space`);

        key(table, ' ', { shiftKey: true });
        await wait(20);
        expect(table.selectedRows, 'Shift+Space on a selected row toggles it back off').toEqual([1]);
        expectSelectionDomConsistent(table, `${name}/${pipeline} shift+space off`);
      });

      it(`${name} | ${pipeline} | Cmd+A selects all, like Ctrl+A`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        key(table, 'a', { metaKey: true });
        await wait(20);
        expect([...table.selectedRows].sort(), 'docs say Ctrl/Cmd+A').toEqual([0, 1, 2]);
        expect(selectedIds(table)).toEqual(['r0', 'r1', 'r2']);
        expectSelectionDomConsistent(table, `${name}/${pipeline} cmd+a`);
      });

      it(`${name} | ${pipeline} | Ctrl+A selects only the SELECTABLE rows`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        table.setSelectabilityCheck((row: any) => row.id !== 'r1');
        await wait(50);

        key(table, 'a', { ctrlKey: true });
        await wait(20);
        expect([...table.selectedRows].sort(), 'the predicate excludes r1').toEqual([0, 2]);
        expect(selectedIds(table)).toEqual(['r0', 'r2']);
        expectSelectionDomConsistent(table, `${name}/${pipeline} ctrl+a with predicate`);
      });
    }
  }
});

// ── delivery: re-delivery and mutated re-delivery ─────────────────────────
describe('selection across delivery × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const pipeline of PIPELINE_KEYS) {
    it(`remote | ${pipeline} | selection DOM stays consistent through re-delivery`, async () => {
      const built = await build({ pipeline, remote: true });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 1), true);
      await wait(20);
      expect(table.selectedRows).toEqual([1]);

      // Same row identities → recycled <tr>s.
      await deliver(table, built.data);
      expectSelectionDomConsistent(table, `remote/${pipeline} after re-delivery`);
      expect(dataRows(table).length).toBe(3);

      // Mutated re-delivery (new row objects, same order).
      const mutated = built.data.map((r, i) => (i === 0 ? { ...r, name: 'Alicia', companyName: 'Zulu' } : r));
      await deliver(table, mutated);
      expectSelectionDomConsistent(table, `remote/${pipeline} after mutated re-delivery`);
      expect(dataRows(table).length).toBe(3);

      // A shorter delivery must not leave a stale selected row behind.
      await deliver(table, mutated.slice(0, 2));
      expectSelectionDomConsistent(table, `remote/${pipeline} after shrink`);
      expect(dataRows(table).length).toBe(2);
    });

    it(`local | ${pipeline} | selection survives a same-identity data re-assignment`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 1), true);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r1']);

      // Re-deliver the very same rows in the very same order.
      table.data = [...built.data];
      table.unsortedData = [...built.data];
      await wait(40);

      expect(selectedIds(table), 'same rows, same order → same selection').toEqual(['r1']);
      expect(selectedTrIds(table, built.data)).toEqual(['r1']);
      expectSelectionDomConsistent(table, `local/${pipeline} after re-assignment`);
    });

    it(`remote | ${pipeline} | select-all after re-delivery covers the new rows`, async () => {
      const built = await build({ pipeline, remote: true });
      table = built.table;

      const extra = [...built.data, { id: 'r3', name: 'Dave', companyName: 'Omega' }];
      await deliver(table, extra);
      toggleCheckbox(selectAllCheckbox(table), true);
      await wait(20);

      expect([...table.selectedRows].sort()).toEqual([0, 1, 2, 3]);
      expect(selectedIds(table)).toEqual(['r0', 'r1', 'r2', 'r3']);
      expect(selectedTrIds(table, extra)).toEqual(['r0', 'r1', 'r2', 'r3']);
      expectSelectionDomConsistent(table, `remote/${pipeline} select-all after re-delivery`);
    });
  }
});

// ── the tool column must not displace data cells ──────────────────────────
describe('selection tool column geometry × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      for (const selectionMode of ['multiple', 'single', 'none']) {
        it(`${name} | ${pipeline} | ${selectionMode} | header and body columns line up`, async () => {
          const built = await build({ pipeline, remote, attrs: { 'selection-mode': selectionMode } });
          table = built.table;

          const toolColumns = selectionMode === 'none' ? 0 : 1;
          const expectGeometry = (label: string) => {
            const ths = [...table.shadowRoot.querySelectorAll('thead th')];
            expect(ths.length, `${label}: header column count`).toBe(built.columns.length + toolColumns);

            for (const tr of dataRows(table)) {
              const tds = [...tr.querySelectorAll('td')];
              expect(tds.length, `${label}: row ${tr.getAttribute('data-index')} cell count`)
                .toBe(built.columns.length + toolColumns);
              // Data cells keep their key regardless of the tool column.
              const keys = tds.map(td => td.getAttribute('data-key')).filter(Boolean);
              expect(keys, `${label}: data-key order`).toEqual(built.columns.map(c => c.key));
            }
          };

          expectGeometry('initial');

          // A sort rebuilds the body: the tool column must survive the rebuild
          // without displacing a data cell, and the oracle must still read the
          // sorted rows through their column definitions.
          if (!remote) {
            const sortValue = (r: any) =>
              built.column.valueGetter ? built.column.valueGetter(r[built.column.key], r) : r[built.column.key];
            const ascending = [...built.data]
              .sort((a, b) => String(sortValue(a)).localeCompare(String(sortValue(b))));
            const descending = [...ascending].reverse();

            table.toggleSort(built.column.key);
            await wait(80);
            expectGeometry('after sort asc');
            expectCellsMatch(table, ascending, built.columns);

            table.toggleSort(built.column.key);
            await wait(80);
            expectGeometry('after sort desc');
            expectCellsMatch(table, descending, built.columns);
          }
        });
      }
    }
  }
});

// ── the COMPLETE attribute cross ──────────────────────────────────────────
//
// `selectable` × the three `selection-mode` values × all eight subsets of
// striped/hoverable/clickable (24), plus the eight non-selectable subsets that
// prove the presentational attributes alone never grow a tool column (32), each
// asserted through the shared matrix oracle as well as the structure.
describe('attribute cross × delivery mode — structure, presentation hooks, oracle', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const combo of ATTRIBUTE_COMBOS) {
      it(`${name} | ${combo.name} | renders the documented selection surface`, async () => {
        const data = freshRows();
        const columns: MatrixColumn[] = [ID_COLUMN, PIPELINES.valueGetter];
        table = await makeTable({
          columns,
          data: remote ? undefined : data,
          attrs: combo.attrs,
          remote,
        });
        if (remote) await deliver(table, data);
        const label = `${name}/${combo.name}`;

        // The attribute cross must never disturb the cell values.
        expectCellsMatch(table, data, columns);
        expectNoBlankCells(table, columns, label);
        expectPresentationHooks(table, combo.flags, label);

        expect(table.selectable, 'selectable property').toBe(combo.selectable);
        expect(!!table.shadowRoot.querySelector('thead th.select-column'), `${label}: select column`)
          .toBe(combo.hasSelectionColumn);
        expect(!!selectAllCheckbox(table), `${label}: select-all control`).toBe(combo.hasSelectAll);
        expect(table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length, `${label}: row checkboxes`)
          .toBe(combo.hasSelectionColumn ? data.length : 0);
        expectSelectionDomConsistent(table, label);

        // A row click selects exactly when a selection surface exists.
        clickRow(table, 1);
        await wait(20);
        expect(table.selectedRows, `${label}: click selects only where selection is enabled`)
          .toEqual(combo.hasSelectionColumn ? [1] : []);
        expectSelectionDomConsistent(table, `${label} after click`);
      });
    }
  }
});

// ── selection through sorts ───────────────────────────────────────────────
//
// docs: "Selection is anchored to the row, not the position: a local sort or a
// re-delivery of the same row objects in another order re-resolves
// `selectedRows`, so `getSelectedData()` and the highlight stay on the same
// rows." Each case sorts on the column its pipeline displays; `name` is already
// ascending, so those cases cycle to descending to force a real reorder.
describe('selection survives sorts × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  /** Row ids in the order they are rendered. */
  const renderedIds = (t: any) => dataRows(t).map((_tr, i) => renderedCellText(t, i, 'id'));
  /** Row ids whose rendered <tr> is marked selected. */
  const highlightedIds = (t: any) =>
    dataRows(t)
      .filter(tr => tr.getAttribute('data-selected') === 'true')
      .map(tr => renderedCellText(t, Number(tr.getAttribute('data-index')), 'id'));

  /** toggleSort calls needed to reach a genuinely different row order. */
  const SORTS: Record<string, { toggles: number; order: string[] }> = {
    none: { toggles: 2, order: ['r2', 'r1', 'r0'] },
    valueFormatter: { toggles: 2, order: ['r2', 'r1', 'r0'] },
    formatter: { toggles: 2, order: ['r2', 'r1', 'r0'] },
    'formatter+valueFormatter': { toggles: 2, order: ['r2', 'r1', 'r0'] },
    valueGetter: { toggles: 1, order: ['r1', 'r2', 'r0'] },
    'valueGetter+valueFormatter': { toggles: 1, order: ['r1', 'r2', 'r0'] },
  };

  async function sortLocal(t: any, pipeline: string, key: string) {
    for (let i = 0; i < SORTS[pipeline].toggles; i++) {
      t.toggleSort(key);
      await wait(80);
    }
    expect(renderedIds(t), `${pipeline}: sorted display order`).toEqual(SORTS[pipeline].order);
  }

  for (const pipeline of PIPELINE_KEYS) {
    it(`local | ${pipeline} | multiple: a per-row selection stays on its own row`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 0), true);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r0']);

      await sortLocal(table, pipeline, built.column.key);

      expect(selectedIds(table), 'the sort must not move the selection').toEqual(['r0']);
      expect(highlightedIds(table), 'the highlight rides with r0').toEqual(['r0']);
      expectSelectionDomConsistent(table, `local/${pipeline} after sort`);
    });

    it(`local | ${pipeline} | single: the one selected row keeps its identity across a sort`, async () => {
      const built = await build({ pipeline, remote: false, attrs: { 'selection-mode': 'single' } });
      table = built.table;

      clickRow(table, 0);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r0']);

      await sortLocal(table, pipeline, built.column.key);

      expect(table.selectedRows.length, 'single mode still holds exactly one row').toBe(1);
      expect(selectedIds(table)).toEqual(['r0']);
      expect(highlightedIds(table)).toEqual(['r0']);
      expectSelectionDomConsistent(table, `local/${pipeline} single after sort`);
    });

    it(`local | ${pipeline} | select-all then sort keeps every row selected and "all" checked`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      toggleCheckbox(selectAllCheckbox(table), true);
      await wait(20);
      expect(selectedIds(table).sort()).toEqual(['r0', 'r1', 'r2']);

      await sortLocal(table, pipeline, built.column.key);

      expect(selectedIds(table).sort()).toEqual(['r0', 'r1', 'r2']);
      expect(highlightedIds(table).sort()).toEqual(['r0', 'r1', 'r2']);
      const cb = selectAllCheckbox(table);
      expect(!!cb.checked, 'every row still selected → still "all"').toBe(true);
      expect(!!cb.indeterminate).toBe(false);
      expectSelectionDomConsistent(table, `local/${pipeline} select-all after sort`);
    });

    it(`local | ${pipeline} | a sort keeps the selectability predicate on its own rows`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      table.setSelectabilityCheck((row: any) => row.id !== 'r1');
      await wait(50);
      toggleCheckbox(rowCheckbox(table, 2), true);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r2']);

      await sortLocal(table, pipeline, built.column.key);

      expect(selectedIds(table), 'the selection follows r2 through the sort').toEqual(['r2']);
      expect(highlightedIds(table)).toEqual(['r2']);

      // The disabled checkbox must ride with r1, not with r1's old position.
      const blocked = dataRows(table)
        .filter(tr => (tr.querySelector('snice-checkbox.row-select') as any)?.disabled)
        .map(tr => renderedCellText(table, Number(tr.getAttribute('data-index')), 'id'));
      expect(blocked, 'only r1 is unselectable after the sort').toEqual(['r1']);
      expectSelectionDomConsistent(table, `local/${pipeline} predicate after sort`);
    });

    it(`local | ${pipeline} | a reordered re-delivery of the same rows keeps the selection`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 0), true);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r0']);

      const reordered = [built.data[2], built.data[1], built.data[0]];
      table.data = reordered;
      table.unsortedData = [...reordered];
      await wait(60);

      expect(renderedIds(table)).toEqual(['r2', 'r1', 'r0']);
      expect(selectedIds(table), 'same rows, new order → same selection').toEqual(['r0']);
      expect(highlightedIds(table)).toEqual(['r0']);
      expectSelectionDomConsistent(table, `local/${pipeline} after reordered re-delivery`);
    });

    it(`remote | ${pipeline} | a server sort re-loads the page and leaves no stale highlight`, async () => {
      const built = await build({ pipeline, remote: true });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 0), true);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r0']);

      // The server owns the order in remote mode; `getTableData()` starts the
      // fresh page with an empty selection, so what must hold is that nothing
      // is left highlighted that `selectedRows` does not claim.
      const serverOrder = [built.data[1], built.data[2], built.data[0]];
      respondWith(table, serverOrder);
      table.toggleSort(built.column.key);
      await wait(400);

      expect(renderedIds(table), 'the server order is what renders').toEqual(['r1', 'r2', 'r0']);
      expect(table.selectedRows, 'a remote reload starts from an empty selection').toEqual([]);
      expect(highlightedIds(table), 'no stale highlight survives the reload').toEqual([]);
      expect(dataRows(table).map(tr => tr.getAttribute('aria-selected'))).toEqual([null, null, null]);
      expectSelectionDomConsistent(table, `remote/${pipeline} after server sort`);
    });
  }
});

// ── the documented selection API, driven directly ─────────────────────────
describe('selection API × mode × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const { remote, name } of MODES) {
    for (const pipeline of PIPELINE_KEYS) {
      it(`${name} | ${pipeline} | assigning selectedRows drives the DOM both ways`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        // `selectedRows` is a documented reactive JS property (raw-data
        // indices); assigning it must repaint the rows. The `selection-changed`
        // event is documented as a user-interaction event and is asserted in
        // the interaction suites above, not here.
        table.selectedRows = [0, 2];
        await wait(40);

        expect(selectedIds(table)).toEqual(['r0', 'r2']);
        expect(selectedTrIds(table, built.data)).toEqual(['r0', 'r2']);
        expect(dataRows(table).map(tr => tr.getAttribute('aria-selected'))).toEqual(['true', null, 'true']);
        expect(!!rowCheckbox(table, 0).checked && !!rowCheckbox(table, 2).checked,
          'both row checkboxes follow the assignment').toBe(true);
        expect(!!rowCheckbox(table, 1).checked, 'the unselected row stays unchecked').toBe(false);
        const cb = selectAllCheckbox(table);
        expect(!!cb.checked, '2 of 3 is not "all"').toBe(false);
        expect(!!cb.indeterminate, '2 of 3 is indeterminate').toBe(true);
        expectSelectionDomConsistent(table, `${name}/${pipeline} programmatic select`);

        table.selectedRows = [];
        await wait(40);

        expect(selectedIds(table)).toEqual([]);
        expect(selectedTrIds(table, built.data)).toEqual([]);
        expect(dataRows(table).map(tr => tr.getAttribute('aria-selected'))).toEqual([null, null, null]);
        expect(!!selectAllCheckbox(table).indeterminate).toBe(false);
        expectSelectionDomConsistent(table, `${name}/${pipeline} programmatic clear`);
      });

      it(`${name} | ${pipeline} | updateRowSelectionState()/updateSelectAllState() resync the DOM`, async () => {
        const built = await build({ pipeline, remote });
        table = built.table;

        // Mutate the array in place: no reactive watcher fires, so the DOM is
        // stale until the two documented sync methods are called by hand.
        table.selectedRows.push(1);
        expect(selectedTrIds(table, built.data), 'in-place mutation alone does not paint').toEqual([]);

        table.updateRowSelectionState();
        table.updateSelectAllState();
        await wait(20);

        expect(selectedTrIds(table, built.data)).toEqual(['r1']);
        expect(trFor(table, 1)!.getAttribute('aria-selected')).toBe('true');
        expect(!!rowCheckbox(table, 1).checked).toBe(true);
        const cb = selectAllCheckbox(table);
        expect(!!cb.checked, '1 of 3 is not "all"').toBe(false);
        expect(!!cb.indeterminate, '1 of 3 is indeterminate').toBe(true);
        expectSelectionDomConsistent(table, `${name}/${pipeline} after manual resync`);
      });
    }
  }
});

// ── local delivery changing the row set under a live selection ────────────
describe('local row-set changes × pipeline', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const pipeline of PIPELINE_KEYS) {
    it(`local | ${pipeline} | a shorter re-delivery leaves no selected row behind`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 2), true);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r2']);

      const shorter = built.data.slice(0, 2);
      table.data = shorter;
      table.unsortedData = [...shorter];
      await wait(60);

      expect(dataRows(table).length, 'the shorter set renders').toBe(2);
      expect(selectedIds(table), 'the dropped row resolves to nothing').toEqual([]);
      expect(selectedTrIds(table, shorter), 'no surviving row is marked selected').toEqual([]);
      expect(dataRows(table).map(tr => tr.getAttribute('aria-selected'))).toEqual([null, null]);
      expect(!!selectAllCheckbox(table).checked, 'nothing resolvable is selected').toBe(false);
      expectSelectionDomConsistent(table, `local/${pipeline} after shrink`);
    });

    it(`local | ${pipeline} | a longer re-delivery keeps the selection on its row`, async () => {
      const built = await build({ pipeline, remote: false });
      table = built.table;

      toggleCheckbox(rowCheckbox(table, 0), true);
      await wait(20);
      expect(selectedIds(table)).toEqual(['r0']);

      const grown = [...built.data, { id: 'r3', name: 'Dave', companyName: 'Omega' }];
      table.data = grown;
      table.unsortedData = [...grown];
      await wait(60);

      expect(dataRows(table).length).toBe(4);
      expect(selectedIds(table)).toEqual(['r0']);
      expect(selectedTrIds(table, grown)).toEqual(['r0']);
      const cb = selectAllCheckbox(table);
      expect(!!cb.checked, '1 of 4 is not "all"').toBe(false);
      expect(!!cb.indeterminate, '1 of 4 is indeterminate').toBe(true);
      expectSelectionDomConsistent(table, `local/${pipeline} after growth`);
    });
  }
});
