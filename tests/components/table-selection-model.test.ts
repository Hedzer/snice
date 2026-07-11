/**
 * Phase 2 · Task E1 — unified selection model.
 *
 * `selectionMode: 'none' | 'single' | 'multiple'` (default 'multiple' =
 * today's additive-toggle behavior). In multiple mode a plain click toggles,
 * ctrl/meta-click is an additive toggle, and shift-click selects the
 * contiguous range from the last anchor. The anchor tracks the ROW OBJECT, so
 * it survives a sort that moves the row to a different index (via rowIndexMap /
 * the filtered snapshot, not a frozen index). Every user-driven selection
 * change emits ONE unified `selection-changed { selectedRows, rows }` event
 * alongside the two legacy events (table-row-selection-changed /
 * table-select-all-changed).
 *
 * happy-dom note: text columns only — display cells render safely (the
 * `prefix`-property landmine documented in the parent spec bites number cells).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';

const COLUMNS = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Name', type: 'text' },
];
const DATA = [
  { id: 'r0', name: 'Alice' },
  { id: 'r1', name: 'Bob' },
  { id: 'r2', name: 'Carol' },
  { id: 'r3', name: 'Dave' },
  { id: 'r4', name: 'Eve' },
];

// A sortable dataset: `order` scrambled so an ascending sort reorders rows.
const SORT_COLUMNS = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'order', label: 'Order', type: 'text', sortable: true },
];
const SORT_DATA = [
  { id: 'a', order: '3' },
  { id: 'b', order: '1' },
  { id: 'c', order: '4' },
  { id: 'd', order: '2' },
];

async function makeTable(opts: {
  columns?: any[];
  data?: any[];
  attrs?: Record<string, any>;
} = {}): Promise<any> {
  const table = await createComponent<any>('snice-table', { selectable: true, ...(opts.attrs || {}) });
  table.columns = (opts.columns || COLUMNS).map((c: any) => ({ ...c }));
  table.data = (opts.data || DATA).map((r: any) => ({ ...r }));
  table.unsortedData = [...table.data];
  (table as any).columnManager.initialize(table.columns, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(20);
  return table;
}

function trFor(table: any, dataIndex: number): HTMLElement {
  return table.shadowRoot.querySelector(`tbody tr[data-index="${dataIndex}"]`) as HTMLElement;
}

function clickRow(table: any, dataIndex: number, mods: Partial<MouseEventInit> = {}) {
  trFor(table, dataIndex).dispatchEvent(new MouseEvent('click', { bubbles: true, ...mods }));
}

function selectedIds(table: any): string[] {
  return (table.getSelectedData() as any[]).map(r => r.id).sort();
}

describe('snice-table selection model (E1)', () => {
  let table: any;
  afterEach(() => {
    if (table) { removeComponent(table as HTMLElement); table = null; }
  });

  it('defaults selectionMode to "multiple"', async () => {
    table = await makeTable();
    expect(table.selectionMode).toBe('multiple');
  });

  it('reflects the selection-mode attribute onto the property', async () => {
    table = await makeTable({ attrs: { 'selection-mode': 'single' } });
    expect(table.selectionMode).toBe('single');
  });

  // ── mode: none ──
  it('none mode: clicking a row selects nothing', async () => {
    table = await makeTable({ attrs: { 'selection-mode': 'none' } });
    clickRow(table, 1);
    await wait(10);
    expect(table.selectedRows).toEqual([]);
  });

  // ── mode: single ──
  it('single mode: clicking selects exactly one; clicking another replaces', async () => {
    table = await makeTable({ attrs: { 'selection-mode': 'single' } });

    clickRow(table, 0);
    await wait(10);
    expect(table.selectedRows).toEqual([0]);

    clickRow(table, 2);
    await wait(10);
    expect(table.selectedRows).toEqual([2]);
  });

  it('single mode: ctrl-click does NOT accumulate (still exactly one)', async () => {
    table = await makeTable({ attrs: { 'selection-mode': 'single' } });
    clickRow(table, 0);
    await wait(10);
    clickRow(table, 3, { ctrlKey: true });
    await wait(10);
    expect(table.selectedRows).toEqual([3]);
  });

  // ── mode: multiple (default) ──
  it('multiple mode: plain click toggles (today\'s additive behavior)', async () => {
    table = await makeTable();

    clickRow(table, 0);
    await wait(10);
    expect(table.selectedRows).toEqual([0]);

    clickRow(table, 1);
    await wait(10);
    expect([...table.selectedRows].sort()).toEqual([0, 1]);

    clickRow(table, 0); // toggle off
    await wait(10);
    expect(table.selectedRows).toEqual([1]);
  });

  it('multiple mode: ctrl/meta-click is an additive toggle', async () => {
    table = await makeTable();

    clickRow(table, 0);
    await wait(10);
    clickRow(table, 2, { ctrlKey: true });
    await wait(10);
    expect([...table.selectedRows].sort()).toEqual([0, 2]);

    clickRow(table, 0, { metaKey: true }); // additive toggle off
    await wait(10);
    expect(table.selectedRows).toEqual([2]);
  });

  it('multiple mode: shift-click selects the contiguous range from the anchor', async () => {
    table = await makeTable();

    clickRow(table, 1); // anchor
    await wait(10);
    clickRow(table, 3, { shiftKey: true });
    await wait(10);
    expect([...table.selectedRows].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('multiple mode: shift-click with no prior anchor just selects the clicked row', async () => {
    table = await makeTable();
    clickRow(table, 2, { shiftKey: true });
    await wait(10);
    expect(table.selectedRows).toEqual([2]);
  });

  // ── anchor follows the ROW OBJECT across a sort ──
  it('anchor tracks the row object, so a range after sort spans the object\'s new position', async () => {
    table = await makeTable({ columns: SORT_COLUMNS, data: SORT_DATA, attrs: { sortable: true } });

    // Anchor on object 'a' (data-index 0 before sorting).
    const idxA = table.data.findIndex((r: any) => r.id === 'a');
    clickRow(table, idxA);
    await wait(10);

    // Ascending sort by `order` → display order becomes b(1), d(2), a(3), c(4).
    table.toggleSort('order');
    await wait(30);

    // Object 'a' now sits at display position 2; shift-click 'b' at position 0.
    const idxB = table.data.findIndex((r: any) => r.id === 'b');
    clickRow(table, idxB, { shiftKey: true });
    await wait(20);

    // Range spans display positions 0..2 → objects b, d, a. If the anchor were
    // a frozen index (0), the range would collapse to just 'b'.
    expect(selectedIds(table)).toEqual(['a', 'b', 'd']);
  });

  // ── unified event ──
  it('emits selection-changed alongside table-row-selection-changed on a row click', async () => {
    table = await makeTable();
    const unified: any[] = [];
    const legacy: any[] = [];
    table.addEventListener('selection-changed', (e: CustomEvent) => unified.push(e.detail));
    table.addEventListener('table-row-selection-changed', (e: CustomEvent) => legacy.push(e.detail));

    clickRow(table, 0);
    await wait(10);

    expect(legacy).toHaveLength(1);
    expect(unified).toHaveLength(1);
    expect(unified[0].selectedRows).toEqual([0]);
    expect(unified[0].rows).toEqual([DATA[0]]);
  });

  it('emits selection-changed alongside table-select-all-changed on select-all', async () => {
    table = await makeTable();
    const unified: any[] = [];
    const legacy: any[] = [];
    table.addEventListener('selection-changed', (e: CustomEvent) => unified.push(e.detail));
    table.addEventListener('table-select-all-changed', (e: CustomEvent) => legacy.push(e.detail));

    const selectAll = table.shadowRoot.querySelector('snice-checkbox.select-all') as any;
    expect(selectAll).toBeTruthy();
    selectAll.checked = true;
    selectAll.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(10);

    expect(legacy).toHaveLength(1);
    expect(unified).toHaveLength(1);
    expect([...unified[0].selectedRows].sort((a: number, b: number) => a - b)).toEqual([0, 1, 2, 3, 4]);
    expect(unified[0].rows).toHaveLength(5);
  });

  it('unified event carries the current row objects for a multi-select', async () => {
    table = await makeTable();
    const unified: any[] = [];
    table.addEventListener('selection-changed', (e: CustomEvent) => unified.push(e.detail));

    clickRow(table, 0);
    await wait(10);
    clickRow(table, 2, { ctrlKey: true });
    await wait(10);

    const last = unified[unified.length - 1];
    expect([...last.selectedRows].sort((a: number, b: number) => a - b)).toEqual([0, 2]);
    expect(last.rows.map((r: any) => r.name).sort()).toEqual(['Alice', 'Carol']);
  });
});
