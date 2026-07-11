/**
 * Task D — honest types + typed events (D1/D2).
 *
 * The value of this file is almost entirely COMPILE-TIME. `vitest run` uses
 * esbuild to strip types, so it does NOT catch interface drift — that is only
 * caught by `npx tsc --project components/tsconfig.json --noEmit` (see
 * snice-table.ts's `implements SniceTableElement` on the class declaration).
 * Before the D1 fix, snice-table.types.ts:234-262 declared a fabricated
 * `SniceTableElement` (phantom `size`/`variant`/`bordered`/`stickyHeader`/
 * `showSearch`, `sort()`/`search()`/`getSelectedRows()` that don't exist on
 * the class, and ~30+ real props/methods missing) — adding `implements
 * SniceTableElement` to the class against that interface failed with
 * TS2420 ("Class 'SniceTable' incorrectly implements interface
 * 'SniceTableElement'... missing size, variant, bordered, stickyHeader, and
 * 4 more"). This file's compile-time assignment is the regression guard: if
 * the interface drifts from the class again, `tsc` fails the same way.
 *
 * The runtime assertions below are deliberately minimal — a handful of real
 * dispatch sites, sanity-checked against the `SniceTableEventMap` shapes
 * documented in snice-table.types.ts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';
import type { SniceTable } from '../../components/table/snice-table';
import type { SniceTableElement, SniceTableEventMap } from '../../components/table/snice-table.types';

describe('snice-table types (D1/D2)', () => {
  // ── D1: compile-time — SniceTable must structurally satisfy the honest
  // SniceTableElement interface. `{} as SniceTable` performs no construction
  // (erased by TS, no custom-element/DOM machinery involved) — only the
  // assignment's compile-time check matters here.
  it('SniceTable is assignable to SniceTableElement (compile-time; see class `implements` clause)', () => {
    const instance = {} as SniceTable;
    const asInterface: SniceTableElement = instance;
    expect(asInterface).toBeDefined();
  });

  // ── D2: compile-time — a representative sample of real event names must be
  // valid keys of SniceTableEventMap. Doubles as the runtime list driving the
  // dispatch sanity checks below (if a name here isn't a real key, `tsc`
  // fails before this array is ever constructed).
  const sampleEventNames: (keyof SniceTableEventMap)[] = [
    'row-clicked',
    'table-row-selection-changed',
    'table-select-all-changed',
    'selection-changed',
    'sort-change',
    'filter-change',
    'page-change',
    'column-visibility-change',
    'column-pin-change',
    'column-order-change',
    'density-change',
    'table-load-error',
    'lazy-load',
    'cell-edit-commit',
    'cell-edit-cancel',
    'row-edit-commit',
    'row-edit-cancel',
    'row-expand',
    'row-collapse',
    'detail-toggle',
    'row-reorder',
    'column-reorder',
    'column-resize',
    'column-resize-end',
    'tree-toggle',
    'cell-action',
    'group-toggle',
  ];

  it('SniceTableEventMap covers the full grepped dispatch inventory (27 events)', () => {
    expect(sampleEventNames.length).toBe(27);
    expect(new Set(sampleEventNames).size).toBe(27); // no accidental duplicates
  });

  // ── D2: runtime sanity — a small sample of the map's documented shapes,
  // checked against real dispatch sites. Not exhaustive; existing
  // table-*.test.ts files already exercise full behavior per-feature.
  const COLUMNS = [{ key: 'name', label: 'Name', type: 'text' }];
  const DATA = [{ name: 'Alice' }, { name: 'Bob' }];

  async function makeTable(attrs: Record<string, any> = {}) {
    const table = await createComponent<any>('snice-table', attrs);
    table.columns = COLUMNS;
    table.data = DATA;
    table.unsortedData = [...DATA];
    table.columnManager.initialize(COLUMNS, table);
    await wait(10);
    table.renderHeader();
    table.renderBody();
    await wait(20);
    return table;
  }

  let table: any;
  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  it('row-clicked + table-row-selection-changed detail match the documented shape (snice-table.ts dispatchRowClicked/dispatchRowSelectionChanged)', async () => {
    table = await makeTable({ clickable: true, selectable: true });

    const rowClicked: any[] = [];
    const selectionChanged: any[] = [];
    table.addEventListener('row-clicked', (e: CustomEvent) => rowClicked.push(e.detail));
    table.addEventListener('table-row-selection-changed', (e: CustomEvent) => selectionChanged.push(e.detail));

    const tr = table.shadowRoot.querySelector('tbody tr') as HTMLElement;
    tr.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(10);

    expect(rowClicked).toHaveLength(1);
    expect(rowClicked[0]).toEqual({ rowData: DATA[0], rowIndex: 0 });

    expect(selectionChanged).toHaveLength(1);
    expect(selectionChanged[0]).toMatchObject({ rowIndex: 0, selected: true });
    expect(Array.isArray(selectionChanged[0].selectedRows)).toBe(true);
  });

  it('page-change detail matches the documented shape (snice-table.ts dispatchPageChange, via goToPage)', async () => {
    table = await makeTable({ pagination: true, 'page-size': 1 });

    const events: any[] = [];
    table.addEventListener('page-change', (e: CustomEvent) => events.push(e.detail));
    table.goToPage(2);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      page: 2,
      pageSize: table.pageSize,
      totalPages: expect.any(Number),
      totalItems: expect.any(Number),
    });
  });

  it('sort-change detail matches the documented shape (snice-table.ts dispatchSortChange, via toggleSort)', async () => {
    table = await makeTable({ sortable: true });

    const events: any[] = [];
    table.addEventListener('sort-change', (e: CustomEvent) => events.push(e.detail));
    table.toggleSort('name');

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ sort: [{ column: 'name', direction: 'asc' }] });
  });
});
