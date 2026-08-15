// Shared fixtures for the `editing` slice of the table feature-combination
// matrix. Every editing test crosses the same two axes:
//
//   delivery mode : local | remote          (remote rows arrive via deliver())
//   value pipeline: none | valueGetter | valueFormatter
//                   | valueGetter+valueFormatter | formatter
//
// and asserts rendered output through the shared oracle in matrix-utils
// (`expectedCellText`), never against observed output. Display is checked on
// BOTH channels a cell exposes — the painted shadow text and the reflected
// `value` (matrix-utils `cellText`) — so a formatter that reaches only one of
// them is a failure, not a silently tolerated divergence.
//
// The editor dimension (`editorType` / `selectOptions` / `renderEditor`, the
// keyboard begin path) lives in editing-editors.test.ts.
import { expect } from 'vitest';
import {
  makeTable, deliver, dataRows, cellText, expectedCellText, wait,
  type MatrixColumn,
} from './matrix-utils';

export { wait, deliver, dataRows, cellText, expectedCellText };

export type PipeName =
  | 'none'
  | 'valueGetter'
  | 'valueFormatter'
  | 'valueGetter+valueFormatter'
  | 'formatter';

export const PIPES: PipeName[] = [
  'none',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];

export type Mode = 'local' | 'remote';
export const MODES: Mode[] = ['local', 'remote'];

// Every combination in this slice is an ordinary enforced `it`. MATRIX-1 /
// MATRIX-editing-1 (the displayed cell value not carrying `valueFormatter` /
// `formatter` output) are fixed in the component, so no editing combination is
// registered as `it.fails` — an `it.fails` here would be satisfied by ANY
// throw and would silently stop enforcing the rest of its body.

export interface Spec {
  pipe: PipeName;
  /** Column key that is edited. */
  targetKey: string;
  /** Row field the target column's DISPLAY derives from. */
  backingField: string;
  /** Column key that is never edited — collateral-damage detector. */
  controlKey: string;
  columns: MatrixColumn[];
  target: MatrixColumn;
  control: MatrixColumn;
}

/**
 * Build the column set for a pipeline. `extra` is merged into the target
 * column (valueParser / valueSetter / editorType / …); `controlExtra` into the
 * never-edited control column.
 *
 * For the two valueGetter pipelines the target column KEY IS NOT A ROW FIELD —
 * this mirrors the remote-mode contract where column keys match the server's
 * sort whitelist and a valueGetter bridges the display.
 */
export function spec(
  pipe: PipeName,
  extra: Partial<MatrixColumn> = {},
  controlExtra: Partial<MatrixColumn> = {},
): Spec {
  let target: MatrixColumn;
  switch (pipe) {
    case 'none':
      target = { key: 'name', label: 'Name', type: 'text' };
      break;
    case 'valueGetter':
      target = {
        key: 'company', label: 'Company', type: 'text',
        valueGetter: (_v: any, row: any) => row.companyName,
      };
      break;
    case 'valueFormatter':
      target = {
        key: 'name', label: 'Name', type: 'text',
        valueFormatter: (v: any) => `«${v ?? ''}»`,
      };
      break;
    case 'valueGetter+valueFormatter':
      target = {
        key: 'company', label: 'Company', type: 'text',
        valueGetter: (_v: any, row: any) => row.companyName,
        valueFormatter: (v: any) => `«${v ?? ''}»`,
      };
      break;
    case 'formatter':
      target = {
        key: 'name', label: 'Name', type: 'text',
        formatter: (v: any) => `<${v ?? ''}>`,
      };
      break;
  }
  Object.assign(target, extra);
  const control: MatrixColumn = { key: 'dept', label: 'Dept', type: 'text', ...controlExtra };
  return {
    pipe,
    targetKey: target.key,
    backingField: target.valueGetter ? 'companyName' : 'name',
    controlKey: control.key,
    columns: [target, control],
    target,
    control,
  };
}

/**
 * Two rows with distinct `name` and `companyName` so a mix-up is visible.
 * Typed as `any[]`: every case indexes them by the pipeline's column key.
 */
export function makeRows(): any[] {
  return [
    { id: 1, name: 'Ann', companyName: 'Acme', dept: 'Ops' },
    { id: 2, name: 'Bob', companyName: 'Globex', dept: 'Eng' },
  ];
}

/** Create an editable table in the given delivery mode and load `rows`. */
export async function build(
  mode: Mode,
  s: Spec,
  rows: any[],
  attrs: Record<string, any> = {},
): Promise<any> {
  const table = await makeTable({
    columns: s.columns,
    data: mode === 'local' ? rows : undefined,
    remote: mode === 'remote',
    attrs: { editable: true, ...attrs },
  });
  if (mode === 'remote') await deliver(table, rows);
  await wait(20);
  return table;
}

/** Re-deliver rows: remote goes through the server round-trip, local reassigns. */
export async function redeliver(table: any, mode: Mode, rows: any[]) {
  if (mode === 'remote') {
    await deliver(table, rows);
  } else {
    table.data = rows;
    await wait(30);
    table.renderBody();
  }
  await wait(30);
}

/** The editor element rendered inside a cell, or null when it shows a value. */
export function editorFor(table: any, rowIndex: number, key: string): HTMLElement | null {
  const tr = dataRows(table)[rowIndex];
  if (!tr) return null;
  return tr.querySelector(
    `td[data-key="${key}"] .table-editor-input, td[data-key="${key}"] .table-editor-checkbox, td[data-key="${key}"] .table-editor-select`,
  ) as HTMLElement | null;
}

/** Type `text` into a rendered editor and sync it into the edit state. */
export function typeInto(el: HTMLElement, text: string) {
  (el as HTMLInputElement).value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Type into the target cell's editor and commit. */
export async function typeAndCommit(table: any, rowIndex: number, key: string, text: string) {
  const input = editorFor(table, rowIndex, key);
  expect(input, `expected an editor in row ${rowIndex} column ${key}`).not.toBeNull();
  typeInto(input!, text);
  await table.commitEdit();
  await wait(20);
}

/**
 * The text a user actually SEES in a data cell: the specialized cell element
 * paints its display text into its shadow `[part~="content"]` (same probe as
 * delivery-support.ts `displayedCellText`). Falls back to matrix-utils'
 * `cellText()` for cells without a content part (custom renderers).
 */
export function paintedCellText(td: HTMLElement): string {
  const host = td.firstElementChild as any;
  const content = host?.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
  if (content) return (content.textContent ?? '').replace(/\s+/g, ' ').trim();
  return cellText(td);
}

/**
 * Like matrix-utils' `expectCellsMatch`, but skips cells that are legitimately
 * hosting an inline editor (an editor replaces the display cell, so it has no
 * display text to compare). Every other rendered cell must still equal the
 * oracle for the row it claims to display — on BOTH display channels:
 *
 *   • the text the cell paints (`[part~="content"]`) — what the user reads;
 *   • the cell's reflected `value` channel (matrix-utils `cellText()`) — what
 *     the shared matrix oracle reads.
 *
 * Checking both is what makes MATRIX-1 / MATRIX-editing-1 a real regression
 * guard: a formatter that reaches only one of the two channels fails here.
 */
export function expectCellsMatchExcept(
  table: any,
  expectedRowsInOrder: any[],
  columns: MatrixColumn[],
  skip: Array<{ rowIndex: number; key: string }> = [],
) {
  const rows = dataRows(table);
  const problems: string[] = [];

  if (rows.length !== expectedRowsInOrder.length) {
    problems.push(`row count ${rows.length}, expected ${expectedRowsInOrder.length}`);
  }

  rows.forEach((tr, i) => {
    const row = expectedRowsInOrder[i];
    if (!row) return;
    for (const col of columns) {
      if (skip.some(sk => sk.rowIndex === i && sk.key === col.key)) continue;
      const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
      if (!td) { problems.push(`row ${i}: missing td[${col.key}]`); continue; }
      const expected = expectedCellText(col, row);
      const painted = paintedCellText(td);
      const reflected = cellText(td);
      if (painted !== expected) {
        problems.push(`row ${i} col ${col.key} painted: "${painted}" != "${expected}"`);
      }
      if (reflected !== expected) {
        problems.push(`row ${i} col ${col.key} value channel: "${reflected}" != "${expected}"`);
      }
    }
  });

  expect(problems).toEqual([]);
}

/** Assert an editor exists in a cell and carries the given seed value. */
export function expectEditorValue(
  table: any, rowIndex: number, key: string, expected: string,
) {
  const el = editorFor(table, rowIndex, key);
  expect(el, `expected an editor in row ${rowIndex} column ${key}`).not.toBeNull();
  expect((el as HTMLInputElement).value).toBe(expected);
}

/** Assert a cell renders a value (no inline editor present). */
export function expectNoEditor(table: any, rowIndex: number, key: string) {
  expect(editorFor(table, rowIndex, key), `unexpected editor in row ${rowIndex} column ${key}`)
    .toBeNull();
}
