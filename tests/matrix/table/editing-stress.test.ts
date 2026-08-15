// MATRIX / editing slice — edge phases of the edit lifecycle crossed with
// { local, remote } x the five display pipelines: editing before any delivery,
// blank/null commits, re-renders that land while an editor is open, and
// row-edit → cell-edit hand-offs (where the row OBJECT was replaced).
//
// Documented contract (docs/ai/components/table.md):
//   • `startEdit(row,key)` starts a cell/row edit; there is no row to edit
//     before data has been delivered.
//   • `renderBody()` - "render display model" — a bare re-render is not an edit
//     operation, so it may neither commit, cancel, nor drop an open editor.
//   • Cell display value: `valueGetter` → `formatter`/`valueFormatter`, and a
//     null/undefined value renders as empty text.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  MODES, PIPES, spec, makeRows, build, redeliver, wait,
  editorFor, typeInto,
  expectCellsMatchExcept, expectEditorValue, expectNoEditor, typeAndCommit,
} from './editing-common';

describe('matrix/editing — lifecycle edges', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  for (const mode of MODES) {
    for (const pipe of PIPES) {
      const label = `${mode} + ${pipe}`;
      const backing = pipe.startsWith('valueGetter') ? 'companyName' : 'name';

      // ── startEdit before any row exists ─────────────────────────────────
      const beforeDeliveryBody = async () => {
        const s = spec(pipe);
        const table2 = await build(mode, s, []);
        table = table2;

        table.startEdit(0, s.targetKey);
        await wait(20);

        const rows = makeRows();
        await redeliver(table, mode, rows);

        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, rows.map(r => ({ ...r })), s.columns);
      };
      it(`startEdit before delivery is a no-op: ${label}`, beforeDeliveryBody);

      // ── committing an EMPTY string ──────────────────────────────────────
      // The blank-cell path: an empty commit must render empty text (or, for a
      // valueGetter column whose key is not the display source, leave the
      // getter-derived text alone).
      const blankBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, '');

        const expected = [{ ...before[0], [s.targetKey]: '' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`commit an empty string: ${label}`, blankBody);

      // ── committing null through a valueSetter ───────────────────────────
      const nullBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, { valueSetter: () => ({ [backing]: null }) });
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'ignored');

        const expected = [{ ...before[0], [backing]: null }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`valueSetter writing null renders empty: ${label}`, nullBody);

      // ── a bare renderBody() while a CELL editor is open ─────────────────
      const rerenderCellBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        const seen: string[] = [];
        for (const t of ['cell-edit-commit', 'cell-edit-cancel']) {
          table.addEventListener(t, () => seen.push(t));
        }

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'InProgress');

        table.renderBody();
        await wait(20);

        // The editor survives, still carrying the uncommitted text, and the
        // re-render committed/cancelled nothing.
        expectEditorValue(table, 0, s.targetKey, 'InProgress');
        expect(seen).toEqual([]);
        expectCellsMatchExcept(table, before, s.columns, [{ rowIndex: 0, key: s.targetKey }]);
      };
      it(`renderBody() during a cell edit: ${label}`, rerenderCellBody);

      // ── a bare renderBody() while a ROW editor is open ──────────────────
      const rerenderRowBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, {}, { editable: false });
        table = await build(mode, s, rows, { 'edit-mode': 'row' });

        const seen: string[] = [];
        for (const t of ['row-edit-commit', 'row-edit-cancel']) {
          table.addEventListener(t, () => seen.push(t));
        }

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'InProgress');

        table.renderBody();
        await wait(20);

        expectEditorValue(table, 0, s.targetKey, 'InProgress');
        expect(seen).toEqual([]);
        expectCellsMatchExcept(table, before, s.columns, [{ rowIndex: 0, key: s.targetKey }]);
      };
      it(`renderBody() during a row edit: ${label}`, rerenderRowBody);

      // ── row-edit commit (replaces the row object) → cell edit at the same
      //    index. The second edit must read the REPLACEMENT row.
      const rowThenCellBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows, { 'edit-mode': 'row' });

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'FromRowEdit');
        await table.commitEdit();
        await wait(20);

        table.editMode = 'cell';
        await wait(20);
        table.startEdit(0, s.targetKey);
        await wait(20);
        expectEditorValue(table, 0, s.targetKey, 'FromRowEdit');
        await typeAndCommit(table, 0, s.targetKey, 'FromCellEdit');

        const expected = [{ ...before[0], [s.targetKey]: 'FromCellEdit' }, before[1]];
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`row edit then cell edit at the same index: ${label}`, rowThenCellBody);

      // ── two consecutive row-edit commits on the same index ──────────────
      const rowTwiceBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows, { 'edit-mode': 'row' });

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'First');
        await table.commitEdit();
        await wait(20);

        table.startEdit(0, s.targetKey);
        await wait(20);
        expectEditorValue(table, 0, s.targetKey, 'First');
        typeInto(editorFor(table, 0, s.targetKey)!, 'Second');
        await table.commitEdit();
        await wait(20);

        const expected = [{ ...before[0], [s.targetKey]: 'Second' }, before[1]];
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`row edit twice at the same index: ${label}`, rowTwiceBody);

      // ── a re-delivery that SHRINKS the list after a commit ──────────────
      const shrinkBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(1, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 1, s.targetKey, 'Zed');

        await redeliver(table, mode, [rows[0]]);

        expectCellsMatchExcept(table, [before[0]], s.columns);

        // The dropped index is no longer editable.
        table.startEdit(1, s.targetKey);
        await wait(20);
        expect(editorFor(table, 1, s.targetKey)).toBeNull();
        expectCellsMatchExcept(table, [before[0]], s.columns);
      };
      it(`commit → re-delivery drops the edited row: ${label}`, shrinkBody);
    }
  }
});
