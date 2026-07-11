/**
 * Phase 2 · Task E2 — custom cell/editor renderers + per-cell editability.
 *
 * ColumnDefinition gains:
 *   - renderCell(value, row, column) => HTMLElement | string  — when present,
 *     createCellElement uses it instead of the type-based cell. A STRING result
 *     is assigned via textContent, never innerHTML (no HTML parsing / XSS).
 *   - renderEditor(value, row, column, commit, cancel) => HTMLElement — when
 *     present and the cell is editing, maybeCreateCellEditor uses it instead of
 *     the built-in editor; commit(v)/cancel() drive the edit state machine.
 * Plus `setCellEditableCheck(fn)` — public wrapper over
 * TableEditor.setEditabilityCheck — gates editing per (row, column).
 *
 * The renderCell output must PARTICIPATE in the Task B recycling signature:
 * swapping a column's renderCell must re-render reused rows (renderer identity
 * folded into computeStructuralSig).
 *
 * happy-dom note: text columns only, plus the custom-rendered column itself.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';

const DATA = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'user' },
];

async function makeTable(columns: any[], opts: { attrs?: Record<string, any> } = {}): Promise<any> {
  const table = await createComponent<any>('snice-table', opts.attrs || {});
  table.columns = columns.map((c: any) => ({ ...c }));
  table.data = DATA.map(r => ({ ...r }));
  table.unsortedData = [...table.data];
  (table as any).columnManager.initialize(table.columns, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(20);
  return table;
}

function cellTd(table: any, rowIndex: number, key: string): HTMLElement | null {
  return table.shadowRoot.querySelector(
    `tbody tr[data-index="${rowIndex}"] td[data-key="${key}"]`
  );
}

describe('snice-table custom renderers (E2)', () => {
  let table: any;
  afterEach(() => {
    if (table) { removeComponent(table as HTMLElement); table = null; }
  });

  // ── renderCell: HTMLElement ──
  it('renderCell returning an HTMLElement puts that element in the cell', async () => {
    const columns = [
      { key: 'name', label: 'Name', type: 'text' },
      {
        key: 'role', label: 'Role', type: 'text',
        renderCell: (value: any, row: any) => {
          const badge = document.createElement('span');
          badge.className = 'role-badge';
          badge.dataset.role = value;
          badge.textContent = `${row.name}:${value}`;
          return badge;
        },
      },
    ];
    table = await makeTable(columns);

    const td = cellTd(table, 0, 'role');
    const badge = td?.querySelector('span.role-badge') as HTMLElement | null;
    expect(badge).toBeTruthy();
    expect(badge!.dataset.role).toBe('admin');
    expect(badge!.textContent).toBe('Alice:admin');

    // The type-based cell element is bypassed entirely.
    expect(td?.querySelector('snice-cell-text')).toBeFalsy();
  });

  // ── renderCell: string is textContent, never innerHTML (XSS) ──
  it('renderCell returning a string sets textContent and never parses HTML', async () => {
    const payload = '<img src=x onerror="window.__xss=1">';
    const columns = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'text', renderCell: () => payload },
    ];
    table = await makeTable(columns);

    const td = cellTd(table, 0, 'role');
    expect(td).toBeTruthy();
    // The literal string is the text, not a parsed <img>.
    expect(td!.textContent).toBe(payload);
    expect(td!.querySelector('img')).toBeNull();
    expect((window as any).__xss).toBeUndefined();
  });

  // ── renderCell participates in the recycling signature ──
  it('swapping a column\'s renderCell re-renders reused rows', async () => {
    const column: any = { key: 'role', label: 'Role', type: 'text', renderCell: () => 'A' };
    const columns = [{ key: 'name', label: 'Name', type: 'text' }, column];
    table = await makeTable(columns);

    expect(cellTd(table, 0, 'role')?.textContent).toBe('A');

    // Same column object (the one the table holds), NEW renderer function —
    // must invalidate the reused row via the structural signature.
    const storedCol = table.columns.find((c: any) => c.key === 'role');
    storedCol.renderCell = () => 'B';
    table.renderBody();
    await wait(20);

    expect(cellTd(table, 0, 'role')?.textContent).toBe('B');
  });

  // ── renderEditor: commit plumbing ──
  it('renderEditor supplies commit(v) that commits the edit and updates data', async () => {
    let commitFn: ((v: any) => void) | null = null;
    let cancelFn: (() => void) | null = null;
    const columns = [
      {
        key: 'name', label: 'Name', type: 'text',
        renderEditor: (value: any, _row: any, _col: any, commit: (v: any) => void, cancel: () => void) => {
          commitFn = commit;
          cancelFn = cancel;
          const input = document.createElement('input');
          input.className = 'custom-editor';
          input.value = String(value);
          return input;
        },
      },
    ];
    table = await makeTable(columns, { attrs: { editable: true } });

    const commits: any[] = [];
    table.addEventListener('cell-edit-commit', (e: CustomEvent) => commits.push(e.detail));

    table.startEdit(0, 'name');
    await wait(10);

    // Custom editor rendered, built-in editor bypassed.
    expect(cellTd(table, 0, 'name')?.querySelector('input.custom-editor')).toBeTruthy();
    expect(commitFn).toBeTypeOf('function');
    expect(cancelFn).toBeTypeOf('function');

    commitFn!('Alicia');
    await wait(30);

    expect(commits).toHaveLength(1);
    expect(commits[0].newValue).toBe('Alicia');
    expect(table.data[0].name).toBe('Alicia');
    // Editor gone after commit.
    expect(cellTd(table, 0, 'name')?.querySelector('input.custom-editor')).toBeFalsy();
  });

  // ── renderEditor: cancel plumbing ──
  it('renderEditor supplies cancel() that cancels the edit', async () => {
    let cancelFn: (() => void) | null = null;
    const columns = [
      {
        key: 'name', label: 'Name', type: 'text',
        renderEditor: (value: any, _row: any, _col: any, _commit: (v: any) => void, cancel: () => void) => {
          cancelFn = cancel;
          const input = document.createElement('input');
          input.className = 'custom-editor';
          input.value = String(value);
          return input;
        },
      },
    ];
    table = await makeTable(columns, { attrs: { editable: true } });

    const cancels: any[] = [];
    table.addEventListener('cell-edit-cancel', (e: CustomEvent) => cancels.push(e.detail));

    table.startEdit(0, 'name');
    await wait(10);
    expect(cellTd(table, 0, 'name')?.querySelector('input.custom-editor')).toBeTruthy();

    cancelFn!();
    await wait(20);

    expect(cancels).toHaveLength(1);
    expect(table.data[0].name).toBe('Alice');
    expect(cellTd(table, 0, 'name')?.querySelector('input.custom-editor')).toBeFalsy();
  });

  // ── setCellEditableCheck gates editing per cell ──
  it('setCellEditableCheck gates whether a given cell may enter edit mode', async () => {
    const columns = [{ key: 'name', label: 'Name', type: 'text' }];
    table = await makeTable(columns, { attrs: { editable: true } });

    // Only Bob's row is editable.
    table.setCellEditableCheck((row: any) => row.name !== 'Alice');

    table.startEdit(0, 'name'); // Alice — blocked
    await wait(10);
    expect(cellTd(table, 0, 'name')?.querySelector('input')).toBeFalsy();

    table.startEdit(1, 'name'); // Bob — allowed
    await wait(10);
    expect(cellTd(table, 1, 'name')?.querySelector('input')).toBeTruthy();
  });
});
