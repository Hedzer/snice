/**
 * Phase 0 — Task 2: keyboard bounds + virtualized navigation.
 *
 * Two bugs under test:
 *   a. Keyboard bounds are captured once at @ready (totalRows/totalColumns as
 *      numbers) and never refreshed → async-loaded / filtered / re-columned
 *      tables navigate as if the dataset had 0 rows / 0 columns.
 *   b. Focus resolves the row by DOM position, so under virtualization only the
 *      rendered window is reachable — ArrowDown/PageDown/Ctrl+End die past the
 *      first window.
 *
 * Fix: bounds come from live getter callbacks; focus resolves rows by
 * data-index and, under virtualization, scrolls the row's range into the
 * window before focusing it.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/table/snice-table';

// ── Helpers ──

function makeCols(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    key: `c${i}`,
    label: `Col ${i}`,
    type: 'text' as const,
  }));
}

function makeRows(n: number, cols = makeCols(3)) {
  return Array.from({ length: n }, (_, r) =>
    Object.fromEntries(cols.map((c) => [c.key, `${c.key}-${r}`])),
  );
}

const CATEGORY_COLUMNS = [
  { key: 'id', label: 'ID', type: 'text' as const },
  { key: 'category', label: 'Category', type: 'text' as const },
];

function makeCategoryRows(total: number, matching: number, cat = 'A') {
  return Array.from({ length: total }, (_, r) => ({
    id: `id-${r}`,
    category: r < matching ? cat : 'B',
  }));
}

async function createKbTable(opts: {
  columns?: any[];
  data?: any[];
  attrs?: Record<string, any>;
} = {}) {
  const table = await createComponent<any>('snice-table', opts.attrs || {});
  const columns = opts.columns ?? makeCols(3);
  const data = opts.data ?? [];
  table.columns = columns;
  table.data = data;
  table.unsortedData = [...data];
  (table as any).columnManager.initialize(columns, table);
  await wait(60);
  table.renderHeader();
  table.renderBody();
  await wait(60);
  return table;
}

function pressKey(table: any, key: string, opts: Partial<KeyboardEventInit> = {}) {
  const tableEl = queryShadow(table as HTMLElement, 'table')!;
  tableEl.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }),
  );
}

function kbOf(table: any) {
  return (table as any).keyboard;
}

describe('snice-table keyboard bounds + virtualized nav (Task 2)', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  it('async setData updates keyboard row bounds', async () => {
    table = await createKbTable({ data: [] });
    table.setData(makeRows(50));
    table.renderBody();
    await wait(30);

    pressKey(table, 'ArrowDown'); // -1 (header) -> 0
    pressKey(table, 'ArrowDown'); // 0 -> 1

    expect(kbOf(table).getFocus().row).toBe(1);
  });

  it('setColumns after ready updates column bounds', async () => {
    table = await createKbTable({ data: makeRows(3) });
    table.setColumns(makeCols(5));
    table.renderBody();
    await wait(30);

    for (let i = 0; i < 8; i++) pressKey(table, 'ArrowRight');

    // 5 columns -> last reachable index is 4, not clamped to a stale bound
    expect(kbOf(table).getFocus().col).toBe(4);
  });

  it('Ctrl+End clamps to filtered count, not raw count', async () => {
    const data = makeCategoryRows(20, 5);
    table = await createKbTable({ columns: CATEGORY_COLUMNS, data });
    table.setColumnFilter('category', 'equals', 'A');
    await wait(30);

    pressKey(table, 'End', { ctrlKey: true });

    // 5 filtered rows -> last logical index is 4 (filtered), not 19 (raw) or -1 (stale 0)
    expect(kbOf(table).getFocus().row).toBe(4);
  });

  it('virtualized Ctrl+End scrolls to and focuses the logical last row', async () => {
    table = await createKbTable({
      columns: makeCols(3),
      data: makeRows(1000),
      attrs: { virtualize: true, 'row-height': 40 },
    });

    pressKey(table, 'End', { ctrlKey: true });
    await wait(30);

    expect(kbOf(table).getFocus().row).toBe(999);
    const lastRow = queryShadow(table as HTMLElement, 'tbody tr[data-index="999"]');
    expect(lastRow).toBeTruthy();
  });

  it('virtualized PageDown lands on and renders a row outside the initial window', async () => {
    table = await createKbTable({
      columns: makeCols(3),
      data: makeRows(1000),
      attrs: { virtualize: true, 'row-height': 40 },
    });

    kbOf(table).setFocus(0, 0);
    pressKey(table, 'PageDown'); // 0 -> 10

    await wait(30);

    expect(kbOf(table).getFocus().row).toBe(10);
    const row = queryShadow(table as HTMLElement, 'tbody tr[data-index="10"]');
    expect(row).toBeTruthy();
  });
});
