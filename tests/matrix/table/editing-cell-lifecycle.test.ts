// MATRIX / editing slice — cell-edit lifecycle (begin → cancel | commit)
// crossed with { local, remote } x { none, valueGetter, valueFormatter,
// valueGetter+valueFormatter, formatter }.
//
// Documented contract exercised here (docs/ai/components/table.md):
//   • `startEdit(row,key)` starts a cell edit; `commitEdit()` validates/commits;
//     `cancelEdit()` cancels.
//   • `valueGetter` "runs for display, sort, aggregation" — editing is NOT in
//     that list, so the editor seeds from the real row field `row[key]`.
//   • `formatter` / `valueFormatter` produce the DISPLAY text of every cell that
//     is not currently hosting an editor.
//   • Nothing in the contract lets an edit on one cell disturb any other cell.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  MODES, PIPES, spec, makeRows, build, wait,
  editorFor, expectCellsMatchExcept, expectEditorValue, expectNoEditor,
  typeAndCommit,
} from './editing-common';

describe('matrix/editing — cell edit lifecycle', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  for (const mode of MODES) {
    for (const pipe of PIPES) {
      const label = `${mode} + ${pipe}`;

      // ── begin ────────────────────────────────────────────────────────────
      // MATRIX-1 / MATRIX-editing-1 guard: while row 0 hosts an editor, every
      // untouched cell must still paint its formatted display text — on both
      // the painted and the reflected value channel (see
      // editing-common `expectCellsMatchExcept`).
      const beginBody = async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);

        // The edited cell hosts an editor seeded from the REAL row field.
        expectEditorValue(table, 0, s.targetKey, rows[0][s.targetKey] ?? '');
        // Nothing else may turn into an editor.
        expectNoEditor(table, 0, s.controlKey);
        expectNoEditor(table, 1, s.targetKey);
        expectNoEditor(table, 1, s.controlKey);

        // Every remaining rendered cell still shows its documented display text.
        expectCellsMatchExcept(table, rows, s.columns, [{ rowIndex: 0, key: s.targetKey }]);
      };
      it(`begin: ${label}`, beginBody);

      // ── cancel ───────────────────────────────────────────────────────────
      const cancelBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        table.cancelEdit();
        await wait(20);

        // Editors are gone and every cell is back to its display value.
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, before, s.columns);
        // Cancel must not have written anything into the row.
        expect(rows[0]).toEqual(before[0]);
        expect(rows[1]).toEqual(before[1]);
      };
      it(`cancel restores display: ${label}`, cancelBody);

      // ── cancel after typing ──────────────────────────────────────────────
      const cancelTypedBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        const input = editorFor(table, 0, s.targetKey) as HTMLInputElement;
        expect(input).not.toBeNull();
        input.value = 'Discarded';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        table.cancelEdit();
        await wait(20);

        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, before, s.columns);
        expect(rows[0]).toEqual(before[0]);
      };
      it(`cancel discards typed text: ${label}`, cancelTypedBody);

      // ── commit ───────────────────────────────────────────────────────────
      // With no valueSetter the committed value lands on `row[key]`. For the
      // valueGetter pipelines that key is NOT the display source, so the
      // rendered text legitimately stays derived from `companyName`.
      const commitBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        const expected = [{ ...before[0], [s.targetKey]: 'Zed' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
        // The commit has to reach the DATA, not just the DOM: with no
        // valueSetter the committed value lands on `row[key]` of the real row
        // (the same object the table was given), and no other field moves.
        expect(table.data[0]).toEqual(expected[0]);
        expect(rows[0][s.targetKey]).toBe('Zed');
        expect(table.data[1]).toEqual(before[1]);
      };
      it(`commit writes row[key]: ${label}`, commitBody);

      // ── the valueGetter "silent no-op" edit, stated explicitly ───────────
      // For the two valueGetter pipelines the edited column key is NOT a row
      // field (the getter bridges the display from `companyName`), so per
      // table.md:55 — valueGetter runs for "display, sort, aggregation" — the
      // editor opens BLANK and a commit writes a field nothing displays: the
      // user types and the screen never changes. The rest of this slice bakes
      // that into its oracle; this case says it out loud so a future change of
      // mind (seeding the editor from the DISPLAY value, or routing the commit
      // back through the getter's source field) fails here first.
      if (pipe.startsWith('valueGetter')) {
        it(`valueGetter column: blank editor, commit changes nothing on screen: ${label}`, async () => {
          const rows = makeRows();
          const before = rows.map(r => ({ ...r }));
          const s = spec(pipe);
          table = await build(mode, s, rows);

          table.startEdit(0, s.targetKey);
          await wait(20);
          // Seeded from row[key] — which does not exist — not from the display.
          expectEditorValue(table, 0, s.targetKey, '');
          expect(before[0][s.targetKey]).toBeUndefined();

          await typeAndCommit(table, 0, s.targetKey, 'Zed');

          // The commit landed on the data…
          expect(table.data[0][s.targetKey]).toBe('Zed');
          // …the display source is untouched…
          expect(table.data[0].companyName).toBe(before[0].companyName);
          // …so every rendered cell reads exactly as it did before the edit.
          expectCellsMatchExcept(table, [{ ...before[0], [s.targetKey]: 'Zed' }, before[1]], s.columns);
        });
      }

      // ── two edits in a row ───────────────────────────────────────────────
      const twiceBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'First');

        table.startEdit(0, s.targetKey);
        await wait(20);
        // Re-opening the editor must seed from the value just committed.
        expectEditorValue(table, 0, s.targetKey, 'First');
        await typeAndCommit(table, 0, s.targetKey, 'Second');

        const expected = [{ ...before[0], [s.targetKey]: 'Second' }, before[1]];
        expectCellsMatchExcept(table, expected, s.columns);
        expect(table.data[0]).toEqual(expected[0]);
      };
      it(`commit twice: ${label}`, twiceBody);

      // ── switching the edited cell without committing ─────────────────────
      const switchBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        table.startEdit(1, s.targetKey);
        await wait(20);

        // Only row 1 may host an editor now; row 0 is back to display and
        // still shows its ORIGINAL value (nothing was committed).
        expectNoEditor(table, 0, s.targetKey);
        expectEditorValue(table, 1, s.targetKey, rows[1][s.targetKey] ?? '');
        expectCellsMatchExcept(table, before, s.columns, [{ rowIndex: 1, key: s.targetKey }]);
      };
      it(`abandon row 0 for row 1: ${label}`, switchBody);

      // ── the control column is never editable-by-accident ─────────────────
      const controlBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(1, s.controlKey);
        await wait(20);
        expectEditorValue(table, 1, s.controlKey, before[1].dept);
        await typeAndCommit(table, 1, s.controlKey, 'Legal');

        const expected = [before[0], { ...before[1], dept: 'Legal' }];
        expectCellsMatchExcept(table, expected, s.columns);
        expect(table.data[1].dept).toBe('Legal');
        // Editing the control column may not touch the target column's data.
        expect(table.data[0]).toEqual(before[0]);
      };
      it(`edit control column: ${label}`, controlBody);
    }
  }
});
