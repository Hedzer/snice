// MATRIX / editing slice — the EDITOR dimension: which editor a column opens
// (`editorType` / `selectOptions` / `renderEditor`), what `valueParser` does to
// the typed text on the way back into the data, and the documented
// keyboard begin path — crossed with { local, remote } x { plain display,
// valueFormatter display }.
//
// Documented contract (docs/ai/components/table.md):
//   • `editorType?:'text'|'number'|'date'|'boolean'|'select'` and
//     `selectOptions?:{value,label}[]` on a column definition.
//   • `renderEditor?:(value,row,column,commit,cancel)=>HTMLElement` — a custom
//     editor owning its own begin/commit/cancel wiring.
//   • `valueParser?:(value:string,row:any)=>any` — "Parse edited input back to
//     data type"; parsers/setters receive the real row.
//   • `commitEdit()` - "validate/commit"; `cancelEdit()` - cancel.
//   • Keyboard: "Enter edits" on the focused grid cell.
//   • After the commit each cell renders the display text derived from the
//     updated row (valueGetter → formatter/valueFormatter).
//
// Not covered on purpose: a REJECTED commit (validator says no). The table
// exposes no documented way to install one — `TableEditor.setValidation()` is
// internal and `snice-table` never calls it — so the only reachable
// "commit that must not happen" cases are the documented gates, which live in
// editing-events (`editable:false`, `setCellEditableCheck`) and the no-op
// commit below.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, getShadowRoot } from '../test-utils';
import type { MatrixColumn } from './matrix-utils';
import {
  MODES, type Mode, build, wait,
  editorFor, expectCellsMatchExcept, expectNoEditor,
} from './editing-common';

/** Display axis for this file: the plain pipeline and the formatted one. */
type DisplayPipe = 'none' | 'valueFormatter';
const DISPLAY_PIPES: DisplayPipe[] = ['none', 'valueFormatter'];

/** Apply the display pipeline of the current axis position to a column. */
function display(col: MatrixColumn, pipe: DisplayPipe): MatrixColumn {
  return pipe === 'none'
    ? col
    : { ...col, valueFormatter: (v: any) => `«${v ?? ''}»` };
}

const CONTROL: MatrixColumn = { key: 'dept', label: 'Dept', type: 'text' };

/** Rows carrying one field per editor kind, distinct per row. */
function editorRows() {
  return [
    { id: 1, name: 'Ann', score: 10, joined: '2024-01-05', active: true, role: 'ops', dept: 'Ops' },
    { id: 2, name: 'Bob', score: 20, joined: '2024-02-06', active: false, role: 'eng', dept: 'Eng' },
  ];
}

/** Build an editable table from a bare column list (build() only reads columns). */
async function buildWith(
  mode: Mode, columns: MatrixColumn[], rows: any[], attrs: Record<string, any> = {},
) {
  return build(mode, { columns } as any, rows, attrs);
}

/** The raw editor element in a cell, whatever kind it is (incl. custom ones). */
function anyEditor(table: any, rowIndex: number, key: string): HTMLElement | null {
  const tr = table.shadowRoot.querySelectorAll('tbody tr[data-index]')[rowIndex] as HTMLElement;
  if (!tr) return null;
  const td = tr.querySelector(`td[data-key="${key}"]`) as HTMLElement | null;
  return (td?.querySelector('input, select, textarea, [data-custom-editor]') ?? null) as HTMLElement | null;
}

describe('matrix/editing — editor kinds, parsers and the keyboard begin path', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  for (const mode of MODES) {
    for (const pipe of DISPLAY_PIPES) {
      const label = `${mode} + ${pipe}`;

      // ── editorType: 'number' ─────────────────────────────────────────────
      // The documented point of `valueParser` is putting the edited STRING back
      // into the data type, so the committed cell must hold a real number.
      it(`editorType number + valueParser coerces to a number: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        const target = display({
          key: 'score', label: 'Score', type: 'text',
          editorType: 'number',
          valueParser: (v: string) => Number(v),
        }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        table.startEdit(0, 'score');
        await wait(20);

        const input = editorFor(table, 0, 'score') as HTMLInputElement;
        expect(input, 'editorType:number must open an editor').not.toBeNull();
        expect(input.tagName).toBe('INPUT');
        expect(input.type).toBe('number');
        expect(input.value).toBe('10');

        input.value = '42';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await table.commitEdit();
        await wait(20);

        expect(table.data[0].score).toBe(42);
        expect(typeof table.data[0].score).toBe('number');
        expectNoEditor(table, 0, 'score');
        expectCellsMatchExcept(table, [{ ...before[0], score: 42 }, before[1]], columns);
      });

      // ── editorType: 'date' ───────────────────────────────────────────────
      // Same contract, non-string target type: the parser hands back a Date.
      it(`editorType date + valueParser coerces to a Date: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        const target = display({
          key: 'joined', label: 'Joined', type: 'text',
          editorType: 'date',
          valueParser: (v: string) => new Date(`${v}T00:00:00.000Z`),
        }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        table.startEdit(0, 'joined');
        await wait(20);

        const input = editorFor(table, 0, 'joined') as HTMLInputElement;
        expect(input, 'editorType:date must open an editor').not.toBeNull();
        expect(input.type).toBe('date');
        expect(input.value).toBe('2024-01-05');

        input.value = '2024-03-09';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await table.commitEdit();
        await wait(20);

        const committed = table.data[0].joined;
        expect(committed instanceof Date, 'valueParser must land a Date in the row').toBe(true);
        expect((committed as Date).toISOString()).toBe('2024-03-09T00:00:00.000Z');
        expectNoEditor(table, 0, 'joined');
        expectCellsMatchExcept(table, [{ ...before[0], joined: committed }, before[1]], columns);
      });

      // ── editorType: 'boolean' ────────────────────────────────────────────
      // The checkbox editor reports `checked`, so the row keeps a real boolean.
      it(`editorType boolean commits a boolean: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        const target = display({
          key: 'active', label: 'Active', type: 'text', editorType: 'boolean',
        }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        table.startEdit(0, 'active');
        await wait(20);

        const box = editorFor(table, 0, 'active') as HTMLInputElement;
        expect(box, 'editorType:boolean must open an editor').not.toBeNull();
        expect(box.type).toBe('checkbox');
        expect(box.checked, 'the checkbox seeds from the row value').toBe(true);

        box.checked = false;
        box.dispatchEvent(new Event('change', { bubbles: true }));
        await table.commitEdit();
        await wait(20);

        expect(table.data[0].active).toBe(false);
        expect(typeof table.data[0].active).toBe('boolean');
        expectNoEditor(table, 0, 'active');
        expectCellsMatchExcept(table, [{ ...before[0], active: false }, before[1]], columns);
      });

      // ── editorType: 'select' + selectOptions ─────────────────────────────
      it(`editorType select offers selectOptions and commits one: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        const target = display({
          key: 'role', label: 'Role', type: 'text',
          editorType: 'select',
          selectOptions: [
            { value: 'ops', label: 'Operations' },
            { value: 'eng', label: 'Engineering' },
            { value: 'legal', label: 'Legal' },
          ],
        }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        table.startEdit(0, 'role');
        await wait(20);

        const select = editorFor(table, 0, 'role') as HTMLSelectElement;
        expect(select, 'editorType:select must open an editor').not.toBeNull();
        expect(select.tagName).toBe('SELECT');
        expect([...select.options].map(o => [o.value, o.textContent])).toEqual([
          ['ops', 'Operations'], ['eng', 'Engineering'], ['legal', 'Legal'],
        ]);
        expect(select.value, 'the select seeds from the row value').toBe('ops');

        select.value = 'legal';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await table.commitEdit();
        await wait(20);

        expect(table.data[0].role).toBe('legal');
        expectNoEditor(table, 0, 'role');
        expectCellsMatchExcept(table, [{ ...before[0], role: 'legal' }, before[1]], columns);
      });

      // ── renderEditor: commit through the supplied callback ───────────────
      it(`renderEditor replaces the built-in editor and commit() lands: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        let seen: any = null;
        const target = display({
          key: 'name', label: 'Name', type: 'text',
          renderEditor: (value: any, row: any, column: any,
                         commit: (v: any) => void, cancel: () => void) => {
            seen = { value, row, column, commit, cancel };
            const el = document.createElement('input');
            el.setAttribute('data-custom-editor', '');
            el.value = String(value ?? '');
            return el;
          },
        }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        const commits: any[] = [];
        table.addEventListener('cell-edit-commit', (e: any) => commits.push(e.detail));

        table.startEdit(0, 'name');
        await wait(20);

        // The custom editor is in the cell and the built-in one was not built.
        expect(anyEditor(table, 0, 'name')?.getAttribute('data-custom-editor')).toBe('');
        expectNoEditor(table, 0, 'name');
        // The renderer receives the current value and the REAL row object.
        expect(seen.value).toBe('Ann');
        expect(seen.row).toBe(table.data[0]);
        expect(seen.column.key).toBe('name');

        seen.commit('Zed');
        await wait(30);

        expect(commits.map(c => [c.rowIndex, c.columnKey, c.oldValue, c.newValue]))
          .toEqual([[0, 'name', 'Ann', 'Zed']]);
        expect(table.data[0].name).toBe('Zed');
        expect(anyEditor(table, 0, 'name')).toBeNull();
        expectCellsMatchExcept(table, [{ ...before[0], name: 'Zed' }, before[1]], columns);
      });

      // ── renderEditor: cancel through the supplied callback ───────────────
      it(`renderEditor cancel() aborts without writing: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        let seen: any = null;
        const target = display({
          key: 'name', label: 'Name', type: 'text',
          renderEditor: (value: any, row: any, column: any,
                         commit: (v: any) => void, cancel: () => void) => {
            seen = { value, row, column, commit, cancel };
            const el = document.createElement('input');
            el.setAttribute('data-custom-editor', '');
            return el;
          },
        }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        const events: string[] = [];
        for (const t of ['cell-edit-commit', 'cell-edit-cancel']) {
          table.addEventListener(t, () => events.push(t));
        }

        table.startEdit(0, 'name');
        await wait(20);
        seen.cancel();
        await wait(30);

        expect(events).toEqual(['cell-edit-cancel']);
        expect(table.data[0]).toEqual(before[0]);
        expect(anyEditor(table, 0, 'name')).toBeNull();
        expectCellsMatchExcept(table, before, columns);
      });

      // ── keyboard: "Enter edits" ──────────────────────────────────────────
      // The only documented USER-driven begin path; every other case in the
      // slice begins imperatively through startEdit().
      it(`Enter on the focused grid cell begins the edit: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        const target = display({ key: 'name', label: 'Name', type: 'text' }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        const root = getShadowRoot(table as HTMLElement);
        const key = (k: string) => root.dispatchEvent(
          new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
        );

        key('ArrowDown'); // header → row 0
        await wait(10);
        expect(table.keyboard.getFocus().row).toBe(0);
        expect(table.keyboard.getFocus().col).toBe(0);

        key('Enter');
        await wait(30);

        // Row 0 / column 0 (the target column) is now editing, nothing else is.
        const input = editorFor(table, 0, 'name') as HTMLInputElement;
        expect(input, 'Enter must open the editor on the focused cell').not.toBeNull();
        expect(input.value).toBe('Ann');
        expectNoEditor(table, 1, 'name');
        expectNoEditor(table, 0, 'dept');
        expectCellsMatchExcept(table, before, columns, [{ rowIndex: 0, key: 'name' }]);

        input.value = 'Zed';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await table.commitEdit();
        await wait(20);

        expect(table.data[0].name).toBe('Zed');
        expectCellsMatchExcept(table, [{ ...before[0], name: 'Zed' }, before[1]], columns);
      });

      // ── commitEdit() with nothing open ───────────────────────────────────
      // "validate/commit" has nothing to commit: no event, no write, no editor.
      it(`commitEdit() with no open editor is a no-op: ${label}`, async () => {
        const rows = editorRows();
        const before = rows.map(r => ({ ...r }));
        const target = display({ key: 'name', label: 'Name', type: 'text' }, pipe);
        const columns = [target, CONTROL];
        table = await buildWith(mode, columns, rows);

        const events: string[] = [];
        for (const t of ['cell-edit-commit', 'cell-edit-cancel']) {
          table.addEventListener(t, () => events.push(t));
        }

        await table.commitEdit();
        await wait(20);

        expect(events).toEqual([]);
        expect(table.data[0]).toEqual(before[0]);
        expect(table.data[1]).toEqual(before[1]);
        expectNoEditor(table, 0, 'name');
        expectCellsMatchExcept(table, before, columns);
      });
    }
  }
});
