// Shared scaffolding for the pagination slice of the table feature matrix.
//
// Two oracles are used side by side, and they are NOT interchangeable:
//
//  * `expectCellsMatch` (matrix-utils) reads each cell through `cellText`,
//    which prefers the cell element's `value` ATTRIBUTE — the DISPLAY value.
//  * `expectDisplayMatch` (here) reads the text a user actually sees — the
//    `part="content"` node inside the cell element's shadow root.
//
// Both must agree with `expectedCellText` for the pipeline to be correct
// (MATRIX-1 / MATRIX-pagination-1, the attribute keeping the pre-format value,
// are fixed), and the second still guards that pagination itself renders the
// right rows in the right order.
import { expect } from 'vitest';
import type { MatrixColumn } from './matrix-utils';
import { expectedCellText, dataRows } from './matrix-utils';

export type PipeName =
  | 'none'
  | 'valueGetter'
  | 'valueFormatter'
  | 'valueGetter+valueFormatter'
  | 'formatter';

export const PIPELINES: PipeName[] = [
  'none',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];

/** Pipelines whose display text is produced by a formatter function. */
export const FORMATTED_PIPELINES: PipeName[] = [
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];

export function isFormatted(pipe: PipeName): boolean {
  return FORMATTED_PIPELINES.includes(pipe);
}

/**
 * Column set for a pipeline. `id` is always a plain pass-through column so a
 * blank/stale render is caught even when the interesting column is formatted.
 * The valueGetter variants deliberately use a key that is NOT a row field
 * (`derived`), mirroring the remote-mode "key is the server sort token" shape.
 */
export function pipelineColumns(pipe: PipeName): MatrixColumn[] {
  const id: MatrixColumn = { key: 'id', label: 'ID', type: 'text' };
  switch (pipe) {
    case 'none':
      return [id, { key: 'label', label: 'Label', type: 'text' }];
    case 'valueGetter':
      return [id, {
        key: 'derived', label: 'Label', type: 'text',
        valueGetter: (_v: any, row: any) => row.label,
      }];
    case 'valueFormatter':
      return [id, {
        key: 'label', label: 'Label', type: 'text',
        valueFormatter: (v: any) => `[${v}]`,
      }];
    case 'valueGetter+valueFormatter':
      return [id, {
        key: 'derived', label: 'Label', type: 'text',
        valueGetter: (_v: any, row: any) => row.label,
        valueFormatter: (v: any) => `[${v}]`,
      }];
    case 'formatter':
      return [id, {
        key: 'label', label: 'Label', type: 'text',
        formatter: (v: any, row?: any) => `<${v}#${row?.id}>`,
      }];
  }
}

/** n rows: { id: 1..n, label: `${tag}1`... }. */
export function makeRows(n: number, tag = 'r', startId = 1): any[] {
  return Array.from({ length: n }, (_, i) => ({ id: startId + i, label: `${tag}${startId + i}` }));
}

/** The text a user sees in a rendered td (cell shadow content when present). */
export function displayText(td: HTMLElement): string {
  const host = td.querySelector('*') as any;
  const content = host?.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
  if (content) return content.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  return td.textContent?.trim() ?? '';
}

/**
 * Same contract as `expectCellsMatch`, asserted against the visible text rather
 * than the cell's `value` attribute. Reports every mismatch at once.
 */
export function expectDisplayMatch(table: any, expectedRowsInOrder: any[], columns?: MatrixColumn[]) {
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
      const actual = displayText(td);
      const expected = expectedCellText(col, row);
      if (actual !== expected) {
        problems.push(`row ${i} col ${col.key}: "${actual}" != "${expected}"`);
      }
    }
  });

  expect(problems).toEqual([]);
}

/** The rendered "Showing a–b of n" summary, or '' when no pager is rendered. */
export function paginationInfo(table: any): string {
  const el = table.shadowRoot?.querySelector('.pagination__info') as HTMLElement | null;
  return el?.textContent?.trim() ?? '';
}

/** Resolve the pager button for a page number / control class. */
export function pagerButton(table: any, selector: string): HTMLButtonElement | null {
  return table.shadowRoot?.querySelector(selector) as HTMLButtonElement | null;
}
