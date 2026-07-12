/**
 * Phase 0 · Task 1 — cell editing must render an editor.
 *
 * These tests exercise the END-TO-END editing UI, not the TableEditor state
 * machine in isolation (that lives in table.test.ts). They prove that:
 *   - startEdit puts a real editor element in the cell's <td>
 *   - the editor type follows the column TYPE (not the column key)
 *   - Enter commits (data + display update, cell-edit-commit fires)
 *   - Escape cancels (original value restored, cell-edit-cancel fires)
 *   - editMode='row' renders an editor in every editable cell of the row
 *   - editable:false columns never render an editor
 *
 * happy-dom note: constructing the `snice-cell-number` / display cells is
 * order-sensitive in happy-dom (the `prefix`-property landmine documented in
 * the parent spec). So the number/boolean *editor-type* check is done in
 * row-edit mode rendered ONLY while editing — those cells are always <input>
 * editors, never display cells. Every other test uses text columns, whose
 * display cells render safely (the same approach table.test.ts uses).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';

// Text-only columns — display cells render safely in happy-dom.
const TEXT_COLUMNS = [
  { key: 'id', label: 'ID', type: 'text', editable: false },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
];
const TEXT_DATA = [
  { id: '1', name: 'Alice', email: 'alice@x.com' },
  { id: '2', name: 'Bob', email: 'bob@y.com' },
];

async function makeTable(opts: {
  columns?: any[];
  data?: any[];
  attrs?: Record<string, any>;
  render?: boolean;
} = {}): Promise<any> {
  const table = await createComponent<any>('snice-table', { editable: true, ...(opts.attrs || {}) });
  table.columns = (opts.columns || TEXT_COLUMNS).map((c: any) => ({ ...c }));
  table.data = (opts.data || TEXT_DATA).map((r: any) => ({ ...r }));
  table.unsortedData = [...table.data];
  (table as any).columnManager.initialize(table.columns, table);
  await wait(10);
  if (opts.render !== false) {
    table.renderHeader();
    table.renderBody();
    await wait(20);
  }
  return table;
}

function cellTd(table: any, rowIndex: number, key: string): HTMLElement | null {
  return table.shadowRoot.querySelector(
    `tbody tr[data-index="${rowIndex}"] td[data-key="${key}"]`
  );
}

function displayValue(td: HTMLElement | null): string | null {
  return td?.querySelector('[in-table]')?.getAttribute('value') ?? null;
}

describe('snice-table cell editing UI', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  it('renders an input editor in the cell when startEdit is called', async () => {
    table = await makeTable();
    table.startEdit(0, 'name');
    await wait(10);

    const td = cellTd(table, 0, 'name');
    const input = td?.querySelector('input') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    expect(input!.value).toBe('Alice');
    // editor receives focus
    expect(table.shadowRoot.activeElement).toBe(input);
  });

  it('editor type follows the column TYPE, not the column key', async () => {
    // Row-edit mode, single row, rendered only while editing — the number and
    // boolean cells are always <input> editors, never display cells.
    table = await makeTable({
      attrs: { 'edit-mode': 'row' },
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'age', label: 'Age', type: 'number' },
        { key: 'active', label: 'Active', type: 'boolean' },
      ],
      data: [{ name: 'Alice', age: 30, active: true }],
      render: false,
    });

    table.startEdit(0, 'age');
    await wait(10);

    const numInput = cellTd(table, 0, 'age')?.querySelector('input') as HTMLInputElement | null;
    expect(numInput).toBeTruthy();
    expect(numInput!.type).toBe('number');

    const boolInput = cellTd(table, 0, 'active')?.querySelector('input') as HTMLInputElement | null;
    expect(boolInput).toBeTruthy();
    expect(boolInput!.type).toBe('checkbox');
  });

  it('editorType overrides the type-derived editor in cell mode', async () => {
    table = await makeTable({
      columns: [{
        key: 'role',
        label: 'Role',
        type: 'text',
        editorType: 'select',
        selectOptions: [
          { value: 'Engineer', label: 'Engineer' },
          { value: 'Designer', label: 'Designer' },
        ],
      }],
      data: [{ role: 'Engineer' }],
    });

    table.startEdit(0, 'role');
    await wait(10);

    const select = cellTd(table, 0, 'role')?.querySelector('select') as HTMLSelectElement | null;
    expect(select).toBeTruthy();
    expect(select!.value).toBe('Engineer');
    expect(Array.from(select!.options).map(option => option.value)).toEqual(['Engineer', 'Designer']);
  });

  it('commits on Enter: new value rendered and cell-edit-commit fires', async () => {
    table = await makeTable();
    const commits: any[] = [];
    table.addEventListener('cell-edit-commit', (e: CustomEvent) => commits.push(e.detail));

    table.startEdit(0, 'name');
    await wait(10);
    const input = cellTd(table, 0, 'name')?.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();

    input.value = 'Alicia';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait(30);

    expect(commits.length).toBe(1);
    expect(commits[0].rowIndex).toBe(0);
    expect(commits[0].columnKey).toBe('name');
    expect(commits[0].newValue).toBe('Alicia');

    const td = cellTd(table, 0, 'name');
    expect(td?.querySelector('input')).toBeFalsy();
    expect(displayValue(td)).toBe('Alicia');
  });

  it('passes the source row through parser and setter callbacks', async () => {
    const parserRows: any[] = [];
    const setterRows: any[] = [];
    table = await makeTable({
      columns: [{
        key: 'name',
        label: 'Name',
        type: 'text',
        valueParser: (value: string, row: any) => {
          parserRows.push(row);
          return `${value.trim()} ${row.suffix}`;
        },
        valueSetter: (value: string, row: any) => {
          setterRows.push(row);
          return { ...row, name: value, edited: true };
        },
      }],
      data: [{ name: 'Alice', suffix: 'Jr.', edited: false }],
    });

    table.startEdit(0, 'name');
    await wait(10);
    const input = cellTd(table, 0, 'name')?.querySelector('input') as HTMLInputElement;
    input.value = '  Alicia  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait(30);

    expect(parserRows).toEqual([table.data[0]]);
    expect(setterRows).toEqual([table.data[0]]);
    expect(table.data[0]).toMatchObject({ name: 'Alicia Jr.', suffix: 'Jr.', edited: true });
  });

  it('applies value parsers when committing a full row', async () => {
    table = await makeTable({
      attrs: { 'edit-mode': 'row' },
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        // Keep the display cell text-only for happy-dom; the parser result is
        // still numeric and proves row-mode pipelines run on commit.
        { key: 'age', label: 'Age', type: 'text', valueParser: (value: string) => Number(value) },
      ],
      data: [{ name: 'Alice', age: 30 }],
      render: false,
    });

    table.startEdit(0, 'name');
    await wait(10);
    const age = cellTd(table, 0, 'age')?.querySelector('input') as HTMLInputElement;
    age.value = '41';
    age.dispatchEvent(new Event('input', { bubbles: true }));
    await table.commitEdit();
    await wait(20);

    expect(table.data[0].age).toBe(41);
    expect(typeof table.data[0].age).toBe('number');
  });

  it('cancels on Escape: original value restored and cell-edit-cancel fires', async () => {
    table = await makeTable();
    const cancels: any[] = [];
    table.addEventListener('cell-edit-cancel', (e: CustomEvent) => cancels.push(e.detail));

    table.startEdit(0, 'name');
    await wait(10);
    const input = cellTd(table, 0, 'name')?.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();

    input.value = 'Changed';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(30);

    expect(cancels.length).toBe(1);
    expect(cancels[0].columnKey).toBe('name');

    const td = cellTd(table, 0, 'name');
    expect(td?.querySelector('input')).toBeFalsy();
    expect(displayValue(td)).toBe('Alice');
  });

  it("editMode='row' renders an editor in every editable cell of the row", async () => {
    table = await makeTable({ attrs: { 'edit-mode': 'row' } });
    expect(table.editMode).toBe('row');

    table.startEdit(0, 'name');
    await wait(10);

    // editable columns get editors
    expect(cellTd(table, 0, 'name')?.querySelector('input')).toBeTruthy();
    expect(cellTd(table, 0, 'email')?.querySelector('input')).toBeTruthy();

    // the non-editable column does NOT
    expect(cellTd(table, 0, 'id')?.querySelector('input')).toBeFalsy();

    // a DIFFERENT row is untouched
    expect(cellTd(table, 1, 'name')?.querySelector('input')).toBeFalsy();
  });

  it('never renders an editor for a column with editable:false', async () => {
    table = await makeTable();

    // Control: an editable column DOES render an editor.
    table.startEdit(0, 'name');
    await wait(10);
    expect(cellTd(table, 0, 'name')?.querySelector('input')).toBeTruthy();
    table.cancelEdit();
    await wait(10);

    // The non-editable column does not.
    table.startEdit(0, 'id');
    await wait(10);
    expect(cellTd(table, 0, 'id')?.querySelector('input')).toBeFalsy();
  });
});
