/**
 * Phase 2 · Task C2 — controlled-state props take effect post-mount.
 *
 * Each of these reactive props was previously inert (or only cosmetic) when
 * assigned after mount: `currentSort` merely repainted the sort arrows,
 * `currentPage` / `pageSize` / `density` / `rowHeight` / feature toggles did
 * nothing until an imperative method was called. Task C2 adds
 * `@watch(..., { immediate: false })` handlers that route each assignment to
 * the same effect its imperative setter produces, rendering through the
 * microtask-coalesced queue.
 *
 * One `it` per prop: assign, assert the observable effect.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/table/snice-table';

const COLS = [
  { key: 'id', label: 'ID', type: 'text' as const },
  { key: 'name', label: 'Name', type: 'text' as const },
];
const EDIT_COLS = [
  { key: 'id', label: 'ID', type: 'text' as const, editable: false },
  { key: 'name', label: 'Name', type: 'text' as const },
  { key: 'email', label: 'Email', type: 'text' as const },
];
const makeRows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `id-${i}`, name: `name-${i}` }));

// Display cells hold their value in a `value` attribute on the `[in-table]`
// element (happy-dom leaves textContent empty) — same read as the editing UI tests.
function cellValue(table: any, rowIndex: number, key: string): string | null {
  const td = queryShadow(table, `tbody tr[data-index="${rowIndex}"] td[data-key="${key}"]`);
  return td?.querySelector('[in-table]')?.getAttribute('value') ?? td?.textContent ?? null;
}

async function makeTable(attrs: Record<string, any> = {}, cols = COLS, rows = makeRows(6)): Promise<any> {
  const table = await createComponent<any>('snice-table', attrs);
  table.columns = cols;
  table.data = rows;
  await wait(30);
  return table;
}

describe('snice-table controlled-state props (C2)', () => {
  let table: any;
  afterEach(() => {
    if (table) { removeComponent(table as HTMLElement); table = null; }
  });

  it('currentSort — assigning re-sorts the rows (not just the arrows)', async () => {
    table = await makeTable({ sortable: true }, COLS, [
      { id: 'c', name: 'C' },
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);

    table.currentSort = [{ column: 'id', direction: 'asc' }];
    await wait(30);
    expect(cellValue(table, 0, 'id')).toBe('a');

    table.currentSort = [{ column: 'id', direction: 'desc' }];
    await wait(30);
    expect(cellValue(table, 0, 'id')).toBe('c');
  });

  it('currentPage — assigning slices to that page (client pagination)', async () => {
    table = await makeTable({ pagination: true, 'page-size': 2 }, COLS, makeRows(6));

    table.currentPage = 2;
    await wait(30);

    const rows = queryShadowAll(table, 'tbody tr[data-index]');
    expect(rows.length).toBe(2);
    // page 2 (size 2) shows the 3rd + 4th records (data-index 2 and 3)
    expect(cellValue(table, 2, 'id')).toBe('id-2');
    expect(cellValue(table, 3, 'id')).toBe('id-3');
  });

  it('pageSize — assigning changes the page slice size', async () => {
    table = await makeTable({ pagination: true, 'page-size': 2 }, COLS, makeRows(10));
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(2);

    table.pageSize = 5;
    await wait(30);
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(5);
  });

  it('density — assigning reflects the density and re-renders the body', async () => {
    table = await makeTable();
    const spy = vi.spyOn(table as any, 'renderBody');

    table.density = 'compact';
    await wait(30);

    expect(table.getAttribute('density')).toBe('compact');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('editable — assigning enables editing (schedules a render + editor renders)', async () => {
    table = await makeTable({}, EDIT_COLS, [{ id: '1', name: 'Alice', email: 'a@x.com' }]);
    expect(table.editable).toBe(false);

    const spy = vi.spyOn(table as any, 'renderBody');
    table.editable = true;
    await wait(30);
    expect(spy).toHaveBeenCalled(); // the assignment routed through the render queue
    spy.mockRestore();

    table.startEdit(0, 'name');
    await wait(20);
    const input = queryShadow(table, 'tbody tr[data-index="0"] td[data-key="name"] input');
    expect(input).toBeTruthy();
  });

  it('editMode — assigning row mode edits every editable cell of the row', async () => {
    table = await makeTable({ editable: true }, EDIT_COLS, [{ id: '1', name: 'Alice', email: 'a@x.com' }]);

    const spy = vi.spyOn(table as any, 'renderBody');
    table.editMode = 'row';
    await wait(30);
    expect(table.getAttribute('edit-mode')).toBe('row');
    expect(spy).toHaveBeenCalled(); // the assignment routed through the render queue
    spy.mockRestore();

    table.startEdit(0, 'name');
    await wait(20);
    expect(queryShadow(table, 'tbody tr[data-index="0"] td[data-key="name"] input')).toBeTruthy();
    expect(queryShadow(table, 'tbody tr[data-index="0"] td[data-key="email"] input')).toBeTruthy();
    // the editable:false id column never gets an editor
    expect(queryShadow(table, 'tbody tr[data-index="0"] td[data-key="id"] input')).toBeFalsy();
  });

  it('virtualize — assigning enables windowed rendering', async () => {
    table = await makeTable({ 'row-height': 36 }, COLS, makeRows(500));

    table.virtualize = true;
    await wait(50);

    expect(table.virtualizer.isEnabled()).toBe(true);
    const rows = queryShadowAll(table, 'tbody tr:not(.virtual-spacer):not(.pinned-row)').length;
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(500);
  });

  it('rowHeight — assigning sets the rendered row height', async () => {
    table = await makeTable();

    table.rowHeight = 80;
    await wait(30);

    const tr = queryShadow<HTMLElement>(table, 'tbody tr[data-index="0"]');
    expect(tr?.style.height).toBe('80px');
  });

  it('columnResize — assigning renders resize handles in the header', async () => {
    table = await makeTable();
    expect(queryShadowAll(table, 'thead .resize-handle').length).toBe(0);

    table.columnResize = true;
    await wait(30);
    expect(queryShadowAll(table, 'thead .resize-handle').length).toBeGreaterThan(0);
  });

  it('headerFilters — assigning renders the header filter row', async () => {
    table = await makeTable();
    expect(queryShadow(table, 'thead .header-filter-row')).toBeFalsy();

    table.headerFilters = true;
    await wait(30);
    expect(queryShadow(table, 'thead .header-filter-row')).toBeTruthy();
    expect(queryShadowAll(table, 'thead .header-filter-row snice-input[data-column]').length).toBe(2);
  });

  it('quickFilter — assigning reflects the flag and re-renders', async () => {
    table = await makeTable();
    const spy = vi.spyOn(table as any, 'renderBody');

    table.quickFilter = true;
    await wait(30);

    expect(table.hasAttribute('quick-filter')).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('columnMenu — assigning reflects the flag and re-renders the header', async () => {
    table = await makeTable();
    const spy = vi.spyOn(table as any, 'renderHeader');

    table.columnMenu = true;
    await wait(30);

    expect(table.hasAttribute('column-menu')).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
