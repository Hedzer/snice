// MATRIX / editing slice — row editing (`edit-mode="row"`) crossed with
// { local, remote } x the five display pipelines.
//
// Documented contract (docs/ai/components/table.md):
//   • `editMode:'cell'|'row'` (attr `edit-mode`); `startEdit(row,key)` starts a
//     "cell/row edit"; `commitEdit()` validates/commits; `cancelEdit()` cancels.
//   • `editable?:boolean` on a column definition controls whether that column
//     takes part in editing — a non-editable column keeps rendering its display
//     value while the rest of its row is in edit state.
//   • Committing a row edit must leave every rendered cell showing the display
//     text derived from the committed row (valueGetter → formatter /
//     valueFormatter).
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import {
  MODES, PIPES, spec, makeRows, build, wait,
  editorFor, typeInto,
  expectCellsMatchExcept, expectEditorValue, expectNoEditor,
} from './editing-common';

const ROW_ATTRS = { 'edit-mode': 'row' };

describe('matrix/editing — row edit mode', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  for (const mode of MODES) {
    for (const pipe of PIPES) {
      const label = `${mode} + ${pipe}`;
      const backing = pipe.startsWith('valueGetter') ? 'companyName' : 'name';

      // ── begin, every column editable ────────────────────────────────────
      // The edited row becomes all editors; every OTHER row must be untouched.
      const beginAllBody = async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);

        expectEditorValue(table, 0, s.targetKey, rows[0][s.targetKey] ?? '');
        expectEditorValue(table, 0, s.controlKey, rows[0].dept);
        expectNoEditor(table, 1, s.targetKey);
        expectNoEditor(table, 1, s.controlKey);

        expectCellsMatchExcept(table, rows, s.columns, [
          { rowIndex: 0, key: s.targetKey },
          { rowIndex: 0, key: s.controlKey },
        ]);
      };
      it(`begin (all columns editable): ${label}`, beginAllBody);

      // ── begin with a non-editable column in the edited row ──────────────
      // `editable:false` keeps the control column as a DISPLAY cell inside the
      // row currently being edited — the strongest place for a stale/blank cell
      // to hide.
      const beginMixedBody = async () => {
        const rows = makeRows();
        const s = spec(pipe, {}, { editable: false });
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);

        expectEditorValue(table, 0, s.targetKey, rows[0][s.targetKey] ?? '');
        expectNoEditor(table, 0, s.controlKey);
        expectCellsMatchExcept(table, rows, s.columns, [{ rowIndex: 0, key: s.targetKey }]);
      };
      it(`begin (control column editable:false): ${label}`, beginMixedBody);

      // ── cancel ──────────────────────────────────────────────────────────
      const cancelBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);
        const input = editorFor(table, 0, s.targetKey)!;
        typeInto(input, 'Discarded');
        table.cancelEdit();
        await wait(20);

        expectNoEditor(table, 0, s.targetKey);
        expectNoEditor(table, 0, s.controlKey);
        expectCellsMatchExcept(table, before, s.columns);
        expect(table.data[0]).toEqual(before[0]);
      };
      it(`cancel: ${label}`, cancelBody);

      // ── commit, editing only the target column ──────────────────────────
      // Untouched fields of the row must survive the commit unchanged.
      const commitTargetBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'Zed');
        await table.commitEdit();
        await wait(20);

        const expected = [{ ...before[0], [s.targetKey]: 'Zed' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
        // A row commit writes the whole row: the edited field changed and every
        // untouched field of that row survived.
        expect(table.data[0]).toEqual(expected[0]);
        expect(table.data[1]).toEqual(before[1]);
      };
      it(`commit (target column only): ${label}`, commitTargetBody);

      // ── commit, editing both columns of the row ─────────────────────────
      const commitBothBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'Zed');
        typeInto(editorFor(table, 0, s.controlKey)!, 'Legal');
        await table.commitEdit();
        await wait(20);

        const expected = [{ ...before[0], [s.targetKey]: 'Zed', dept: 'Legal' }, before[1]];
        expectCellsMatchExcept(table, expected, s.columns);
        expect(table.data[0]).toEqual(expected[0]);
      };
      it(`commit (both columns): ${label}`, commitBothBody);

      // ── commit with valueSetter (row convention) ────────────────────────
      // The setter writes the display-backing field, so the committed row must
      // render the transformed value.
      const commitSetterBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, {
          valueSetter: (v: any) => ({ [backing]: String(v).toUpperCase() }),
        });
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'zed');
        await table.commitEdit();
        await wait(20);

        const expected = [{ ...before[0], [backing]: 'ZED' }, before[1]];
        expectCellsMatchExcept(table, expected, s.columns);
        // The setter's write reaches the real row; untouched fields survive.
        // A row commit rebuilds the row from the edited fields, so for the
        // valueGetter pipelines the edited key (not a row field) may also be
        // recorded — undocumented either way, so not asserted.
        expect(table.data[0][backing]).toBe('ZED');
        expect(table.data[0].dept).toBe(before[0].dept);
        expect(table.data[1]).toEqual(before[1]);
      };
      it(`commit with valueSetter: ${label}`, commitSetterBody);

      // ── commit with valueParser ─────────────────────────────────────────
      const commitParserBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, { valueParser: (v: string) => v.trim().toUpperCase() });
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, '  zed  ');
        await table.commitEdit();
        await wait(20);

        const expected = [{ ...before[0], [s.targetKey]: 'ZED' }, before[1]];
        expectCellsMatchExcept(table, expected, s.columns);
        expect(table.data[0][s.targetKey]).toBe('ZED');
        expect(table.data[0]).toEqual(expected[0]);
      };
      it(`commit with valueParser: ${label}`, commitParserBody);

      // ── switching the edited row without committing ─────────────────────
      const switchBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows, ROW_ATTRS);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'Discarded');
        table.startEdit(1, s.targetKey);
        await wait(20);

        expectNoEditor(table, 0, s.targetKey);
        expectNoEditor(table, 0, s.controlKey);
        expectEditorValue(table, 1, s.targetKey, rows[1][s.targetKey] ?? '');
        expectCellsMatchExcept(table, before, s.columns, [
          { rowIndex: 1, key: s.targetKey },
          { rowIndex: 1, key: s.controlKey },
        ]);
      };
      it(`abandon row 0 for row 1: ${label}`, switchBody);
    }
  }
});
