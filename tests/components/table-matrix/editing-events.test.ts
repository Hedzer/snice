// MATRIX / editing slice — the documented edit EVENT contract and the
// editability gates, crossed with { local, remote } x the five display
// pipelines. These assertions are independent of the display formatter, so
// every combination must pass outright.
//
// Documented contract (docs/ai/components/table.md):
//   • `cell-edit-commit` → `{rowIndex,columnKey,oldValue,newValue}`
//   • `cell-edit-cancel` → `{rowIndex,columnKey}`
//   • `row-edit-commit`  → `{rowIndex,oldRow,newRow}`
//   • `row-edit-cancel`  → `{rowIndex}`
//   • `editable?:boolean` on a column definition; `setCellEditableCheck(fn)` —
//     "install predicate".
//   • `valueParser` parses the edited input; parsers/setters receive the real row.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import {
  MODES, PIPES, spec, makeRows, build, wait,
  editorFor, typeInto, expectNoEditor, expectEditorValue, typeAndCommit,
} from './editing-common';

/** Record every edit event the table emits. */
function recordEvents(table: any) {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of ['cell-edit-commit', 'cell-edit-cancel', 'row-edit-commit', 'row-edit-cancel']) {
    table.addEventListener(type, (e: any) => seen.push({ type, detail: e.detail }));
  }
  return seen;
}

describe('matrix/editing — event contract and editability gates', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  for (const mode of MODES) {
    for (const pipe of PIPES) {
      const label = `${mode} + ${pipe}`;
      const backing = pipe.startsWith('valueGetter') ? 'companyName' : 'name';

      it(`cell-edit-commit payload: ${label}`, async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);
        const seen = recordEvents(table);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        expect(seen.map(e => e.type)).toEqual(['cell-edit-commit']);
        expect(seen[0].detail).toEqual({
          rowIndex: 0,
          columnKey: s.targetKey,
          oldValue: before[0][s.targetKey],
          newValue: 'Zed',
        });
      });

      it(`cell-edit-commit reports the PARSED value: ${label}`, async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, { valueParser: (v: string) => v.trim().toUpperCase() });
        table = await build(mode, s, rows);
        const seen = recordEvents(table);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, '  zed  ');

        expect(seen.map(e => e.type)).toEqual(['cell-edit-commit']);
        expect(seen[0].detail).toEqual({
          rowIndex: 0,
          columnKey: s.targetKey,
          oldValue: before[0][s.targetKey],
          newValue: 'ZED',
        });
      });

      it(`cell-edit-cancel payload: ${label}`, async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);
        const seen = recordEvents(table);

        table.startEdit(1, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 1, s.targetKey)!, 'Discarded');
        table.cancelEdit();
        await wait(20);

        expect(seen.map(e => e.type)).toEqual(['cell-edit-cancel']);
        expect(seen[0].detail).toEqual({ rowIndex: 1, columnKey: s.targetKey });
      });

      it(`row-edit-commit payload: ${label}`, async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows, { 'edit-mode': 'row' });
        const seen = recordEvents(table);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'Zed');
        await table.commitEdit();
        await wait(20);

        expect(seen.map(e => e.type)).toEqual(['row-edit-commit']);
        expect(seen[0].detail.rowIndex).toBe(0);
        expect(seen[0].detail.oldRow).toEqual(before[0]);
        expect(seen[0].detail.newRow).toEqual({ ...before[0], [s.targetKey]: 'Zed' });
      });

      it(`row-edit-cancel payload: ${label}`, async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows, { 'edit-mode': 'row' });
        const seen = recordEvents(table);

        table.startEdit(1, s.targetKey);
        await wait(20);
        table.cancelEdit();
        await wait(20);

        expect(seen.map(e => e.type)).toEqual(['row-edit-cancel']);
        expect(seen[0].detail).toEqual({ rowIndex: 1 });
      });

      it(`column editable:false blocks the edit: ${label}`, async () => {
        const rows = makeRows();
        const s = spec(pipe, { editable: false });
        table = await build(mode, s, rows);
        const seen = recordEvents(table);

        table.startEdit(0, s.targetKey);
        await wait(20);

        expectNoEditor(table, 0, s.targetKey);
        await table.commitEdit();
        await wait(20);
        expect(seen).toEqual([]);
      });

      it(`setCellEditableCheck gates per row: ${label}`, async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);
        table.setCellEditableCheck((row: any) => row.id !== 1);
        const seen = recordEvents(table);

        table.startEdit(0, s.targetKey);
        await wait(20);
        expectNoEditor(table, 0, s.targetKey);
        expect(seen).toEqual([]);

        table.startEdit(1, s.targetKey);
        await wait(20);
        expectEditorValue(table, 1, s.targetKey, rows[1][s.targetKey] ?? '');
        await typeAndCommit(table, 1, s.targetKey, 'Zed');

        expect(seen.map(e => e.type)).toEqual(['cell-edit-commit']);
        expect(seen[0].detail.rowIndex).toBe(1);
      });

      it(`switching cells emits exactly one cancel then one commit: ${label}`, async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);
        const seen = recordEvents(table);

        table.startEdit(0, s.targetKey);
        await wait(20);
        table.startEdit(1, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 1, s.targetKey, 'Zed');

        expect(seen.map(e => e.type)).toEqual(['cell-edit-cancel', 'cell-edit-commit']);
        expect(seen[0].detail).toEqual({ rowIndex: 0, columnKey: s.targetKey });
        expect(seen[1].detail.rowIndex).toBe(1);
        expect(seen[1].detail.newValue).toBe('Zed');
      });

      it(`commit on a remote/local re-delivered row targets that index: ${label}`, async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);
        const seen = recordEvents(table);

        // Fresh row identities arrive, then an edit starts on the new row 0.
        const fresh = makeRows().map(r => ({ ...r, [backing]: `${r[backing]}-v2` }));
        const snapshot = fresh.map(r => ({ ...r }));
        if (mode === 'remote') {
          const { deliver } = await import('./matrix-utils');
          await deliver(table, fresh);
        } else {
          table.data = fresh;
          await wait(30);
          table.renderBody();
          await wait(20);
        }

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        expect(seen.map(e => e.type)).toEqual(['cell-edit-commit']);
        expect(seen[0].detail).toEqual({
          rowIndex: 0,
          columnKey: s.targetKey,
          oldValue: snapshot[0][s.targetKey],
          newValue: 'Zed',
        });
        expect(table.data[0][s.targetKey]).toBe('Zed');
      });
    }
  }
});
