// Shared fixtures for the tree-data / master-detail slice of the table feature
// matrix. Everything here builds on matrix-utils' oracle (expectedCellText):
// valueGetter derives the working value, then formatter (row-aware) or
// valueFormatter produce the display text.
//
// One addition over matrix-utils' `cellText`: `renderedText`. matrix-utils
// reads the `value` ATTRIBUTE of a typed cell element, which is the pre-format
// working value; the text a user actually sees for a built-in cell lives in the
// cell's shadow `[part~="content"]`. Asserting the attribute would report a
// formatter as "not applied" even when the rendered text is correct, so the
// assertions below compare the real rendered text. For cells with no typed
// element (tree group cells, renderCell output) it falls back to `cellText`.
import { expect } from 'vitest';
import { cellText, dataRows, deliver, expectedCellText, wait, type MatrixColumn } from './matrix-utils';

export type Mode = 'local' | 'remote';
export type Pipeline =
  | 'no pipeline'
  | 'valueGetter'
  | 'valueFormatter'
  | 'valueGetter+valueFormatter'
  | 'formatter';
export type Phase = 'initial delivery' | 're-delivery' | 'mutated re-delivery';

export const PIPELINES: Pipeline[] = [
  'no pipeline',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];
export const MODES: Mode[] = ['local', 'remote'];
export const PHASES: Phase[] = ['initial delivery', 're-delivery', 'mutated re-delivery'];

/** Pipelines whose display text differs from the raw/getter working value. */
export const FORMATTING_PIPELINES: Pipeline[] = [
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];

/**
 * A column carrying exactly one pipeline shape.
 * `plainKey` is a real row field; `getterKey` is deliberately NOT a row field,
 * so valueGetter columns exercise the "key is a server sort token" shape.
 */
export function pipelineColumn(
  pipeline: Pipeline,
  opts: { plainKey: string; getterKey: string; source: string; label: string; extra?: Partial<MatrixColumn> },
): MatrixColumn {
  const base = { label: opts.label, type: 'text', ...(opts.extra ?? {}) } as MatrixColumn;
  const getter = (_v: any, row: any) => row[opts.source];
  const vf = (v: any) => `[${v}]`;
  const fmt = (v: any) => `F(${v})`;
  switch (pipeline) {
    case 'no pipeline':
      return { ...base, key: opts.plainKey };
    case 'valueGetter':
      return { ...base, key: opts.getterKey, valueGetter: getter };
    case 'valueFormatter':
      return { ...base, key: opts.plainKey, valueFormatter: vf };
    case 'valueGetter+valueFormatter':
      return { ...base, key: opts.getterKey, valueGetter: getter, valueFormatter: vf };
    case 'formatter':
      return { ...base, key: opts.plainKey, formatter: fmt };
  }
}

/** The text a user actually sees in a rendered data cell. */
export function renderedText(td: HTMLElement): string {
  const host = td.querySelector('[value]') as any;
  const content = host?.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
  if (content) return content.textContent?.trim() ?? '';
  return cellText(td);
}

/**
 * Same contract as matrix-utils' expectCellsMatch — every rendered data cell
 * equals the oracle for the row it claims to display, in the expected order —
 * but compares the visible text rather than the working-value attribute.
 */
export function expectRenderedCellsMatch(
  table: any,
  expectedRowsInOrder: any[],
  columns?: MatrixColumn[],
) {
  const cols = (columns ?? table.columns) as MatrixColumn[];
  const rows = dataRows(table);
  const problems: string[] = [];

  if (rows.length !== expectedRowsInOrder.length) {
    problems.push(`row count ${rows.length}, expected ${expectedRowsInOrder.length}`
      + ` (rendered: ${JSON.stringify(rows.map(tr => tr.textContent?.trim()))})`);
  }

  rows.forEach((tr, i) => {
    const row = expectedRowsInOrder[i];
    if (!row) return;
    for (const col of cols) {
      const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
      if (!td) { problems.push(`row ${i}: missing td[${col.key}]`); continue; }
      const actual = renderedText(td);
      const expected = expectedCellText(col, row);
      if (actual !== expected) {
        problems.push(`row ${i} col ${col.key}: "${actual}" != "${expected}"`);
      }
    }
  });

  expect(problems).toEqual([]);
}

/** Push rows at a table the way its mode dictates. */
export async function push(table: any, mode: Mode, rows: any[]) {
  if (mode === 'remote') {
    await deliver(table, rows);
  } else {
    table.data = rows;
    await wait(40);
  }
  await wait(20); // let typed cells finish their formatter pass
}

/**
 * Drive a table through the delivery sequence and stop at `phase`.
 * - initial delivery: the first render of `rows`
 * - re-delivery: the SAME row objects again (the reconciler recycles the <tr>s)
 * - mutated re-delivery: fresh row objects at the same positions, new values
 * Returns the rows the table should be displaying (unordered — callers supply
 * the expected order).
 */
export async function runPhases(
  table: any,
  mode: Mode,
  phase: Phase,
  rows: any[],
  mutate: (row: any) => any,
): Promise<any[]> {
  await push(table, mode, rows);
  if (phase === 'initial delivery') return rows;

  await push(table, mode, mode === 'remote' ? rows : [...rows]);
  if (phase === 're-delivery') return rows;

  const mutated = rows.map(mutate);
  await push(table, mode, mutated);
  return mutated;
}
