/**
 * Phase 2 · Task C1 — reactive `columns` / `data` assignment.
 *
 * Before this task, `columns` and `data` were plain fields: assigning them did
 * nothing until a caller manually invoked `renderHeader()` / `renderBody()`.
 * They are now `@property({ attribute: false })` with `@watch(..., { immediate:
 * false })` handlers that:
 *   - resync the internal model (columnManager, rowIndexMap, unsortedData snapshot)
 *   - re-render through a microtask-coalesced queue (a burst of assignments in
 *     one tick renders once; DOM construction never happens synchronously inside
 *     the property-setter stack — the happy-dom cell-construction landmine).
 *
 * `setData` / `setColumns` remain as thin aliases over the assignments.
 * The internal sort path (`sortLocalData` reassigning `this.data`) must NOT
 * refresh the `unsortedData` snapshot, so a sort after a plain data assignment
 * keeps the original (unsorted) snapshot intact.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const COLS = [
  { key: 'id', label: 'ID', type: 'text' as const },
  { key: 'name', label: 'Name', type: 'text' as const },
];

const makeRows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `id-${i}`, name: `name-${i}` }));

// Display cells hold their value in a `value` attribute on the `[in-table]`
// element (happy-dom leaves textContent empty) — same read as the editing UI tests.
function cellValue(table: any, rowIndex: number, key: string): string | null {
  const td = queryShadow(table, `tbody tr[data-index="${rowIndex}"] td[data-key="${key}"]`);
  return td?.querySelector('[in-table]')?.getAttribute('value') ?? td?.textContent ?? null;
}

describe('snice-table reactive columns/data assignment (C1)', () => {
  let table: any;
  afterEach(() => {
    if (table) { removeComponent(table as HTMLElement); table = null; }
  });

  it('assigning columns renders the header with no manual render call', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    await wait(30);

    const ths = queryShadowAll(table, 'thead th[data-key]');
    expect(ths.length).toBe(2);
    expect(ths[0].getAttribute('data-key')).toBe('id');
    expect(ths[1].getAttribute('data-key')).toBe('name');
  });

  it('assigning data renders the body and refreshes the unsortedData snapshot', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    const rows = makeRows(5);
    table.data = rows;
    await wait(30);

    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(5);
    // snapshot mirrors the assigned data but is a fresh copy, not the same ref
    expect(table.unsortedData.length).toBe(5);
    expect(table.unsortedData).not.toBe(rows);
    expect(table.unsortedData.map((r: any) => r.id)).toEqual(rows.map((r) => r.id));
  });

  it('reassigning data updates the rendered rows', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = makeRows(3);
    await wait(30);
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(3);

    table.data = makeRows(7);
    await wait(30);
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(7);
  });

  it('sorting after a plain data assignment works and does not clobber the snapshot', async () => {
    table = await createComponent<any>('snice-table', { sortable: true });
    table.columns = COLS;
    table.data = [
      { id: 'b', name: 'B' },
      { id: 'a', name: 'A' },
      { id: 'c', name: 'C' },
    ];
    await wait(30);

    // The plain assignment must have rendered + snapshotted the ORIGINAL order.
    expect(table.unsortedData.map((r: any) => r.id)).toEqual(['b', 'a', 'c']);

    table.toggleSort('id'); // ascending
    await wait(30);

    expect(cellValue(table, 0, 'id')).toBe('a');
    // sorting reassigned this.data internally; the snapshot stays UNSORTED.
    expect(table.unsortedData.map((r: any) => r.id)).toEqual(['b', 'a', 'c']);
  });

  it('setColumns and setData aliases still populate the grid', async () => {
    table = await createComponent<any>('snice-table');
    table.setColumns(COLS);
    table.setData(makeRows(4));
    await wait(30);

    expect(queryShadowAll(table, 'thead th[data-key]').length).toBe(2);
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(4);
  });

  it('a burst of N data assignments coalesces to a single renderBody', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    await wait(30);

    const spy = vi.spyOn(table as any, 'renderBody');

    table.data = makeRows(1);
    table.data = makeRows(2);
    table.data = makeRows(3);
    table.data = makeRows(4);

    // deferred: nothing rendered synchronously inside the setter stack
    expect(spy).not.toHaveBeenCalled();

    await wait(30);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(4);
    spy.mockRestore();
  });
});
