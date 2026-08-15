// Shared fixtures for the `delivery` slice of the table feature matrix
// (remote delivery timing x rendering pipeline). Everything here builds on
// matrix-utils' oracle: `expectedCellText()` is the documented display value
// and is never re-derived or relaxed.
import { expect } from 'vitest';
import { expectedCellText, cellText, dataRows, type MatrixColumn } from './matrix-utils';

/** Reads the text of one rendered `<td>`; the only axis this slice varies. */
export type CellTextReader = (td: HTMLElement) => string;

/**
 * A delivery row. `plain` is a real row field; `src` exists only so a
 * valueGetter column can key on something that is NOT a row field (the remote
 * shape from the field report: column keys are the server's sort whitelist).
 */
export interface DeliveryRow { plain: string; src: string; }

export function makeRow(tag: string): DeliveryRow {
  return { plain: `p-${tag}`, src: `s-${tag}` };
}

/** Mutate a delivered row IN PLACE, keeping its object identity. */
export function mutateInPlace(row: DeliveryRow, tag: string): DeliveryRow {
  row.plain = `p-${tag}`;
  row.src = `s-${tag}`;
  return row;
}

export type PipelineName =
  | 'none'
  | 'valueGetter'
  | 'valueFormatter'
  | 'valueGetter+valueFormatter'
  | 'formatter';

export const PIPELINE_NAMES: PipelineName[] = [
  'none',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];

/**
 * Build the single column under test for a pipeline. Fresh object per test —
 * the table's column manager keeps state keyed off these definitions.
 *
 * Per table.md ("the cell's `value` property/attribute IS the display value"),
 * matrix-utils' `cellText()` sees formatter/valueFormatter output for every
 * pipeline, so both oracles below assert the same expected strings.
 */
export function pipelineColumn(name: PipelineName): MatrixColumn {
  switch (name) {
    case 'none':
      return { key: 'plain', label: 'Plain', type: 'text', sortable: true };
    case 'valueGetter':
      // key is deliberately NOT a row field.
      return {
        key: 'company', label: 'Company', type: 'text', sortable: true,
        valueGetter: (_v: any, row: any) => row.src,
      };
    case 'valueFormatter':
      return {
        key: 'plain', label: 'Plain', type: 'text', sortable: true,
        valueFormatter: (v: any) => `vf<${v}>`,
      };
    case 'valueGetter+valueFormatter':
      return {
        key: 'company', label: 'Company', type: 'text', sortable: true,
        valueGetter: (_v: any, row: any) => row.src,
        valueFormatter: (v: any) => `vf<${v}>`,
      };
    case 'formatter':
      return {
        key: 'plain', label: 'Plain', type: 'text', sortable: true,
        formatter: (v: any) => `f<${v}>`,
      };
  }
}

/**
 * The text a user actually sees in a data cell: the specialized cell element
 * renders its display text into its shadow `[part~="content"]`. Falls back to
 * matrix-utils' `cellText()` when a cell has no content part (custom renderers).
 */
export function displayedCellText(td: HTMLElement): string {
  const host = td.firstElementChild as any;
  const content = host?.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
  if (content) return (content.textContent ?? '').replace(/\s+/g, ' ').trim();
  return cellText(td);
}

/**
 * matrix-utils' `expectCellsMatch` with its one hard-wired detail — the reader
 * that turns a `<td>` into text — lifted into a parameter. Same oracle
 * (`expectedCellText`), same row-set (`dataRows`), same row-count and per-cell
 * checks, same report-every-mismatch-at-once behaviour; nothing is relaxed.
 * matrix-utils is shared by ~20 slices and is not edited by this slice, so the
 * parameterized copy lives here and every delivery assertion routes through it.
 */
export function expectCellsMatchWith(
  read: CellTextReader,
  label: string,
  table: any,
  expectedRowsInOrder: any[],
  columns?: MatrixColumn[],
) {
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
      const actual = read(td);
      const expected = expectedCellText(col, row);
      if (actual !== expected) {
        problems.push(`row ${i} col ${col.key}: ${label} "${actual}" != "${expected}"`);
      }
    }
  });

  expect(problems).toEqual([]);
}

/**
 * Same contract as matrix-utils' `expectCellsMatch`, but asserted against the
 * text the cell actually paints rather than its `value` attribute. Expected
 * values still come from matrix-utils' `expectedCellText()` oracle.
 */
export function expectDisplayedCellsMatch(
  table: any,
  expectedRowsInOrder: any[],
  columns?: MatrixColumn[],
) {
  expectCellsMatchWith(displayedCellText, 'displayed', table, expectedRowsInOrder, columns);
}

/** The single zero-row message cell a body renders when it has no data. */
export function noDataCell(table: any): HTMLElement | null {
  return table.shadowRoot?.querySelector('tbody td.no-data') ?? null;
}

/**
 * The documented zero-row empty state (table.md: the `empty-state` slot clone
 * "or the default 'No data' placeholder"), asserted as the ONLY thing a body
 * with no data shows — no data rows, no load-error row.
 */
export function expectEmptyState(table: any) {
  expect(dataRows(table)).toHaveLength(0);
  const cell = noDataCell(table);
  expect(cell, 'zero-row body renders no empty-state cell').not.toBeNull();
  const placeholder = cell!.querySelector('snice-empty-state');
  expect(placeholder, 'empty-state placeholder missing').not.toBeNull();
  expect(placeholder!.getAttribute('title')).toBe('No data');
  expect(cell!.querySelector('.table-error-message')).toBeNull();
}

/**
 * The documented failed-load state (table.md: "⚠️ row + empty-state only with
 * no data") — the error row replaces the empty-state placeholder and no data
 * row survives.
 */
export function expectLoadErrorState(table: any, message: string) {
  expect(dataRows(table)).toHaveLength(0);
  const cell = noDataCell(table);
  expect(cell, 'failed load renders no message cell').not.toBeNull();
  const error = cell!.querySelector('.table-error-message');
  expect(error, 'failed load renders no ⚠️ row').not.toBeNull();
  expect((error!.textContent ?? '').trim()).toBe(`⚠️ ${message}`);
  expect(cell!.querySelector('snice-empty-state')).toBeNull();
}

/** The documented zero-row loading state (table.md: "loading spinner"). */
export function expectLoadingState(table: any) {
  expect(dataRows(table)).toHaveLength(0);
  const cell = noDataCell(table);
  expect(cell, 'in-flight load renders no message cell').not.toBeNull();
  expect(cell!.querySelector('snice-progress'), 'no loading spinner').not.toBeNull();
}

/**
 * Collect in-flight remote data requests without resolving them, so a test can
 * choose the resolution order (out-of-order guard).
 */
export function collectPending(table: any) {
  const pending: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];
  table.addEventListener('@request/table/data', (e: any) => {
    e.detail.discovery.resolve();
    pending.push(e.detail.data);
  });
  return pending;
}
