/**
 * List mode with a `listRenderer` paints full-width custom rows that carry no
 * column geometry at all. The columnar header row (Name | Age | Department |
 * Email) that kept rendering above those cards labelled fields that align with
 * nothing — pro directory/card lists paint no columnar header.
 *
 * Contract asserted here (docs/ai/components/table.md documents `list` +
 * `listRenderer` as "full-width custom rows"; it never promises header
 * sorting in list mode):
 *   - list + listRenderer  → no columnar <th> in the thead, no header-filter
 *                            row, no column-group row.
 *   - tool columns survive → the select-all affordance is not collateral.
 *   - leaving list mode, or dropping the renderer, restores the full header.
 *   - list WITHOUT a renderer still renders columnar rows, so it keeps its
 *     header.
 *   - sorting is not silently lost: the toolbar sort control and the
 *     `toggleSort()` / `currentSort` API keep working in list mode.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' as const, sortable: true },
  { key: 'department', label: 'Department', type: 'text' as const, sortable: true },
  { key: 'email', label: 'Email', type: 'email' as const, sortable: true },
];

const DATA = [
  { name: 'Alice Johnson', department: 'Engineering', email: 'alice@example.com' },
  { name: 'Bob Smith', department: 'Marketing', email: 'bob@example.com' },
];

async function createTable(attrs: Record<string, any> = {}): Promise<any> {
  const table = await createComponent<any>('snice-table', attrs);
  table.columns = COLUMNS;
  table.data = DATA.map(r => ({ ...r }));
  await wait(40);
  return table;
}

function cardRenderer(row: any): HTMLElement {
  const card = document.createElement('div');
  card.className = 'directory-card';
  card.innerHTML = `<strong>${row.name}</strong><small>${row.department} · ${row.email}</small>`;
  return card;
}

/** Every header cell that stands for a data column. */
function columnHeaderCells(table: any): Element[] {
  return Array.from(table.shadowRoot.querySelectorAll('thead th[data-key]'));
}

function headerLabels(table: any): string[] {
  return columnHeaderCells(table).map(th => (th.textContent || '').trim());
}

describe('snice-table list mode suppresses the columnar header', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table as HTMLElement);
    table = null;
  });

  it('renders no columnar header cells once a listRenderer is active', async () => {
    table = await createTable({ list: true, sortable: true });
    expect(headerLabels(table)).toEqual(['Name', 'Department', 'Email']);

    table.listRenderer = cardRenderer;
    await wait(40);

    expect(table.shadowRoot.querySelectorAll('tbody .directory-card').length).toBe(DATA.length);
    expect(columnHeaderCells(table)).toHaveLength(0);
    expect(table.shadowRoot.querySelectorAll('thead .column-header-row th')).toHaveLength(0);
  });

  it('paints no header text at all when list mode has no tool columns', async () => {
    table = await createTable({ list: true, sortable: true });
    table.listRenderer = cardRenderer;
    await wait(40);

    const thead = table.shadowRoot.querySelector('thead') as HTMLElement;
    expect((thead.textContent || '').trim()).toBe('');
    expect(thead.querySelectorAll('tr')).toHaveLength(0);
  });

  it('counts no phantom header row in the grid ARIA when the thead is empty', async () => {
    table = await createTable({ list: true, sortable: true });
    table.listRenderer = cardRenderer;
    await wait(40);

    const grid = table.shadowRoot.querySelector('table') as HTMLElement;
    expect(grid.querySelectorAll('thead tr')).toHaveLength(0);
    // No header row exists, so it must not be counted, and the body must start
    // at row 1 rather than leaving aria-rowindex 1 pointing at nothing.
    expect(grid.getAttribute('aria-rowcount')).toBe(String(DATA.length));
    const rows = Array.from(grid.querySelectorAll('tbody tr[data-index]')) as HTMLElement[];
    expect(rows.map(r => r.getAttribute('aria-rowindex'))).toEqual(['1', '2']);
  });

  it('suppresses the header-filter row and column-group row in list mode', async () => {
    table = await createTable({ list: true, sortable: true, headerFilters: true });
    table.setColumnGroups([{ label: 'Person', children: ['name', 'department'] }]);
    await wait(40);
    expect(table.shadowRoot.querySelectorAll('thead .header-filter-row').length).toBe(1);

    table.listRenderer = cardRenderer;
    await wait(40);

    expect(table.shadowRoot.querySelectorAll('thead .header-filter-row')).toHaveLength(0);
    expect(table.shadowRoot.querySelectorAll('thead .column-group-row')).toHaveLength(0);
  });

  it('keeps the select-all tool header so selection is not collateral damage', async () => {
    table = await createTable({ list: true, selectable: true });
    table.listRenderer = cardRenderer;
    await wait(40);

    expect(columnHeaderCells(table)).toHaveLength(0);
    expect(table.shadowRoot.querySelector('thead th.select-column')).toBeTruthy();
    expect(table.shadowRoot.querySelector('thead snice-checkbox.select-all')).toBeTruthy();
    // …and every body row still carries its own row checkbox.
    expect(table.shadowRoot.querySelectorAll('tbody td.select-column').length).toBe(DATA.length);
  });

  it('restores the columnar header when the table leaves list mode', async () => {
    table = await createTable({ list: true, sortable: true });
    table.listRenderer = cardRenderer;
    await wait(40);
    expect(columnHeaderCells(table)).toHaveLength(0);

    table.list = false;
    await wait(40);

    expect(headerLabels(table)).toEqual(['Name', 'Department', 'Email']);
    expect(table.shadowRoot.querySelectorAll('tbody .directory-card')).toHaveLength(0);
  });

  it('restores the columnar header when the listRenderer is dropped', async () => {
    table = await createTable({ list: true, sortable: true });
    table.listRenderer = cardRenderer;
    await wait(40);
    expect(columnHeaderCells(table)).toHaveLength(0);

    table.listRenderer = null;
    await wait(40);

    expect(headerLabels(table)).toEqual(['Name', 'Department', 'Email']);
  });

  it('keeps the columnar header for bare list mode (no renderer, columnar rows)', async () => {
    table = await createTable({ list: true, sortable: true });
    await wait(20);

    expect(headerLabels(table)).toEqual(['Name', 'Department', 'Email']);
    expect(table.shadowRoot.querySelectorAll('tbody td[data-key]').length).toBe(DATA.length * COLUMNS.length);
  });

  it('does not silently lose sorting: toolbar control and sort API stay live', async () => {
    table = await createTable({ list: true, sortable: true });
    table.listRenderer = cardRenderer;
    table.setToolbar({ showSort: true });
    await wait(40);

    // Documented list-mode affordance: the toolbar sort control, not the header.
    expect(table.shadowRoot.querySelector('.toolbar-sort')).toBeTruthy();

    table.toggleSort('name', false);
    await wait(40);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
    // Header stays suppressed, but the rows really did re-order.
    expect(columnHeaderCells(table)).toHaveLength(0);
    const cards = table.shadowRoot.querySelectorAll('tbody .directory-card');
    expect(cards[0].textContent).toContain('Alice Johnson');

    table.toggleSort('name', false);
    await wait(40);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'desc' }]);
    const resorted = table.shadowRoot.querySelectorAll('tbody .directory-card');
    expect(resorted[0].textContent).toContain('Bob Smith');
  });
});
