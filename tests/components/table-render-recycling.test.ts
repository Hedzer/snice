/**
 * Phase 1 — Task B: render-path recycling.
 *
 * `renderBody()` used to wipe `tbody.innerHTML` and rebuild every `<tr>` plus one
 * custom element per cell on every render; the virtualizer did the same per
 * scroll frame. This is the single root cause of the ~6.6 s sort / ~4 s
 * renderBody costs at 10k rows.
 *
 * The reconciler keys rows by row-object identity: rows whose object and rendered
 * state are unchanged are REUSED (moved when order changes); new objects get
 * fresh rows; departed rows are dropped. These tests assert the algorithmic
 * invariant (element identity / construction counts), not wall-clock time.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/table/snice-table';

const COLS = [
  { key: 'id', label: 'ID', type: 'text' as const },
  { key: 'name', label: 'Name', type: 'text' as const },
  { key: 'sortKey', label: 'Sort', type: 'text' as const },
];

function makeRows(n: number) {
  return Array.from({ length: n }, (_, r) => ({
    id: `id-${r}`,
    name: `name-${r}`,
    // Descending so an ascending sort by sortKey reverses row order.
    sortKey: n - 1 - r,
  }));
}

async function makeTable(opts: { data: any[]; attrs?: Record<string, any> }) {
  const table = await createComponent<any>('snice-table', opts.attrs || {});
  table.columns = COLS;
  table.data = opts.data;
  table.unsortedData = [...opts.data];
  (table as any).columnManager.initialize(COLS, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(30);
  return table;
}

function rowByIndex(table: HTMLElement, idx: number): HTMLElement | null {
  return queryShadow(table, `tbody tr[data-index="${idx}"]`);
}

describe('snice-table render-path recycling (Task B)', () => {
  let table: any;
  afterEach(() => {
    if (table) { removeComponent(table as HTMLElement); table = null; }
  });

  // Test 1 — re-render with identical data reuses every <tr>.
  it('re-rendering identical data preserves every <tr> element (by data-index)', async () => {
    table = await makeTable({ data: makeRows(10) });

    const before = new Map<number, HTMLElement | null>();
    for (let i = 0; i < 10; i++) before.set(i, rowByIndex(table, i));
    expect([...before.values()].every(Boolean)).toBe(true);

    table.renderBody();
    await wait(10);

    for (let i = 0; i < 10; i++) {
      expect(rowByIndex(table, i)).toBe(before.get(i));
    }
  });

  // Test 2 — sort reuses the same <tr> for a data object, moved.
  it('sorting reuses the same <tr> for a data object, moved to its new position', async () => {
    const data = makeRows(100);
    table = await makeTable({ data, attrs: { sortable: true } });

    const obj = data[50];
    const beforeIdx = table.indexOfRow(obj);
    const beforeTr = rowByIndex(table, beforeIdx);
    expect(beforeTr).toBeTruthy();

    table.toggleSort('sortKey'); // ascending → reverses order
    await wait(30);

    const afterIdx = table.indexOfRow(obj);
    const afterTr = rowByIndex(table, afterIdx);

    expect(afterIdx).not.toBe(beforeIdx);   // it actually moved
    expect(afterTr).toBe(beforeTr);          // same element, recycled
  });

  // Test 3 — removing one row keeps the other 99 <tr> identities.
  it('removing one row of 100 preserves the other 99 <tr> elements', async () => {
    const data = makeRows(100);
    table = await makeTable({ data });

    const objToTr = new Map<any, HTMLElement | null>();
    for (let i = 0; i < 100; i++) objToTr.set(data[i], rowByIndex(table, i));

    const removed = data[50];
    const next = data.filter((d) => d !== removed);
    table.setData(next);
    table.renderBody();
    await wait(10);

    for (const obj of next) {
      const idx = table.indexOfRow(obj);
      expect(rowByIndex(table, idx)).toBe(objToTr.get(obj));
    }
    // the departed row is gone from the DOM
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(99);
  });

  // Test 4 — virtualized window shift creates ≤ shift + overscan new rows.
  it('a small virtualized scroll shift constructs only the entering rows', async () => {
    table = await createComponent<any>('snice-table', { virtualize: true, 'row-height': 40 });
    table.columns = COLS;
    table.data = makeRows(1000);
    table.unsortedData = [...table.data];
    (table as any).columnManager.initialize(COLS, table);
    await wait(60); // @ready rAF runs setupVirtualization
    table.renderHeader();
    table.renderBody();
    await wait(60);

    const sc = queryShadow(table, '.table-frame') as HTMLElement;

    // Settle at a mid-list window before measuring so the two windows overlap.
    sc.scrollTop = 2000;
    sc.dispatchEvent(new Event('scroll'));
    await wait(50);

    const createRowSpy = vi.spyOn(table as any, 'createRow');

    // Shift down by 3 rows (120px). Windows overlap heavily → few new rows.
    sc.scrollTop = 2120;
    sc.dispatchEvent(new Event('scroll'));
    await wait(50);

    const windowRows = queryShadowAll(table, 'tbody tr[data-index]').length;
    expect(windowRows).toBeGreaterThan(0);
    // A full-window rebuild would call createRow ~windowRows times; recycling
    // constructs only the handful of entering rows.
    expect(createRowSpy.mock.calls.length).toBeLessThan(windowRows);
    expect(createRowSpy.mock.calls.length).toBeLessThanOrEqual(6);
  });

  // Test 6 — algorithmic gate: unchanged re-render constructs zero cell elements.
  it('re-rendering unchanged rows constructs zero new snice-cell-* elements', async () => {
    table = await makeTable({ data: makeRows(200) });

    const realCreate = document.createElement.bind(document);
    let cellCreations = 0;
    const spy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string, ...rest: any[]) => {
      if (typeof tag === 'string' && /^snice-cell-/.test(tag)) cellCreations++;
      return (realCreate as any)(tag, ...rest);
    }) as any);

    try {
      table.renderBody();
      await wait(10);
    } finally {
      spy.mockRestore();
    }

    expect(cellCreations).toBe(0);
  });

  // Test 5 (behavior lock) — selection re-stamps onto recycled rows.
  it('re-stamps selection state onto recycled rows after a plain re-render', async () => {
    table = await makeTable({ data: makeRows(10), attrs: { selectable: true } });

    table.selectedRows = [3];
    await wait(10);
    const tr3 = rowByIndex(table, 3);
    expect(tr3!.getAttribute('data-selected')).toBe('true');

    table.renderBody();
    await wait(10);

    const tr3b = rowByIndex(table, 3);
    expect(tr3b).toBe(tr3); // recycled, not rebuilt
    expect(tr3b!.getAttribute('data-selected')).toBe('true');
  });

  // Test 5 (behavior lock) — an edit-state row always re-renders fresh.
  it('rebuilds an edited row fresh (edit-state rows never recycle stale DOM)', async () => {
    table = await makeTable({ data: makeRows(10), attrs: { editable: true, 'edit-mode': 'cell' } });

    const before = rowByIndex(table, 2);
    table.startEdit(2, 'name');
    await wait(10);

    const editing = rowByIndex(table, 2);
    // The editing row is a fresh element carrying an editor input.
    expect(editing).not.toBe(before);
    expect(editing!.querySelector('.table-editor-input, .table-editor-select, .table-editor-checkbox')).toBeTruthy();
  });
});
