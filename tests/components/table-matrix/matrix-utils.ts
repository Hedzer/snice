// Shared harness for the table feature-combination matrix. Every matrix test
// asserts through the same oracle: after any operation sequence, each rendered
// data cell must equal the display value derived from the row + column
// definition, the row count must match the data, and no data cell may be
// unexpectedly blank.
import { expect } from 'vitest';
import { createComponent, wait } from '../test-utils';
import '../../../packages/components/src/table/snice-table';

export { wait };

export interface MatrixColumn {
  key: string;
  label?: string;
  type?: string;
  sortable?: boolean;
  filterable?: boolean;
  valueGetter?: (value: any, row: any) => any;
  valueFormatter?: (value: any, row: any) => string;
  formatter?: (value: any, row?: any) => string;
  renderCell?: (value: any, row: any, column: any) => HTMLElement | string;
  [k: string]: any;
}

/** Create a table; `mode: 'remote'` tables receive data via respondWith(). */
export async function makeTable(opts: {
  columns: MatrixColumn[];
  data?: any[];
  attrs?: Record<string, any>;
  remote?: boolean;
  height?: string;
}) {
  const table = await createComponent<any>('snice-table', opts.attrs ?? {});
  if (opts.height) table.style.height = opts.height;
  if (opts.remote) table.mode = 'remote';
  table.columns = opts.columns;
  if (!opts.remote) {
    table.data = opts.data ?? [];
    table.unsortedData = [...(opts.data ?? [])];
  }
  table.columnManager.initialize(opts.columns, table);
  await wait(10);
  table.renderHeader();
  if (!opts.remote) table.renderBody();
  await wait(20);
  return table;
}

/** Resolve the next table/data request with these rows (server delivery). */
export function respondWith(table: any, rows: any[], extra: Record<string, any> = {}) {
  table.addEventListener('@request/table/data', (e: any) => {
    e.detail.discovery.resolve();
    e.detail.data.resolve({ data: rows, ...extra });
  }, { once: true });
}

/** Deliver rows to a remote table and wait for the render. */
export async function deliver(table: any, rows: any[], extra: Record<string, any> = {}) {
  respondWith(table, rows, extra);
  table.getTableData();
  await wait(50);
}

/**
 * The oracle: expected on-screen text for a data cell, mirroring the
 * documented pipeline — valueGetter derives the working value, then
 * formatter (row-aware) or valueFormatter produce display text; otherwise
 * the value itself. Matrix tests should stick to type:'text' columns unless
 * a dimension is specifically about typed cells.
 */
export function expectedCellText(column: MatrixColumn, row: any): string {
  const raw = row[column.key];
  const value = column.valueGetter ? column.valueGetter(raw, row) : raw;
  if (column.formatter) return String(column.formatter(value, row));
  if (column.valueFormatter) return String(column.valueFormatter(value, row));
  return value == null ? '' : String(value);
}

/** Rendered text of one td, reaching into typed cell elements when present. */
export function cellText(td: HTMLElement): string {
  const valueEl = td.querySelector('[value]');
  if (valueEl) return valueEl.getAttribute('value') ?? '';
  return td.textContent?.trim() ?? '';
}

/** All rendered data rows (excludes spacers, fill, group headers, details). */
export function dataRows(table: any): HTMLElement[] {
  return [...table.shadowRoot.querySelectorAll('tbody tr[data-index]')] as HTMLElement[];
}

/**
 * Core assertion: every rendered data cell matches the oracle for the row it
 * claims to display, in the given expected row order (subset of columns may
 * be passed for typed-cell dimensions). Reports every mismatch at once.
 */
export function expectCellsMatch(table: any, expectedRowsInOrder: any[], columns?: MatrixColumn[]) {
  const cols = (columns ?? table.columns) as MatrixColumn[];
  const rows = dataRows(table);
  const problems: string[] = [];

  if (rows.length !== expectedRowsInOrder.length) {
    problems.push(`row count ${rows.length}, expected ${expectedRowsInOrder.length}`);
  }

  rows.forEach((tr, i) => {
    const row = expectedRowsInOrder[i];
    if (!row) return;
    for (const col of cols) {
      const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
      if (!td) { problems.push(`row ${i}: missing td[${col.key}]`); continue; }
      const actual = cellText(td);
      const expected = expectedCellText(col, row);
      if (actual !== expected) {
        problems.push(`row ${i} col ${col.key}: "${actual}" != "${expected}"`);
      }
    }
  });

  expect(problems).toEqual([]);
}
