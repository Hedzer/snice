// Shared fixtures + DOM-level oracles for the virtualization slice of the
// table feature matrix.
//
// Everything here asserts DOM structure only — happy-dom performs no layout, so
// there is no real scrolling. The virtual window is read back from the rendered
// `tr[data-index]` elements and the two spacer rows the virtualizer inserts.
import { expect } from 'vitest';
import type { MatrixColumn } from './matrix-utils';
import {
  cellText,
  dataRows,
  deliver,
  expectCellsMatch,
  expectedCellText,
  wait,
} from './matrix-utils';

// ── Pipeline dimension ──────────────────────────────────────────────────────

export type PipelineName =
  | 'no pipeline'
  | 'valueGetter'
  | 'valueFormatter'
  | 'valueGetter+valueFormatter'
  | 'formatter';

export const PIPELINES: PipelineName[] = [
  'no pipeline',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];

/**
 * The column under test for each pipeline. The valueGetter variants use a key
 * that is deliberately NOT a field on the row (the remote sort-whitelist shape
 * from the field report), so a missing getter renders blank rather than the
 * right text by accident.
 */
export function pipelineColumn(name: PipelineName): MatrixColumn {
  switch (name) {
    case 'no pipeline':
      return { key: 'plain', label: 'Plain', type: 'text' };
    case 'valueGetter':
      return { key: 'company', label: 'Company', type: 'text', valueGetter: (_v, row) => row.companyName };
    case 'valueFormatter':
      return { key: 'plain', label: 'Plain', type: 'text', valueFormatter: (v) => `«${v}»` };
    case 'valueGetter+valueFormatter':
      return {
        key: 'company', label: 'Company', type: 'text',
        valueGetter: (_v, row) => row.companyName,
        valueFormatter: (v) => `«${v}»`,
      };
    case 'formatter':
      return { key: 'plain', label: 'Plain', type: 'text', formatter: (v) => `<${v}>` };
  }
}

/** A plain column that never goes through the pipeline — the blank-cell canary. */
export const CONTROL_COLUMN: MatrixColumn = { key: 'label', label: 'Label', type: 'text' };

export function columnsFor(name: PipelineName): MatrixColumn[] {
  return [CONTROL_COLUMN, pipelineColumn(name)];
}

export function makeRows(count: number, tag = ''): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    plain: `plain-${i}${tag}`,
    companyName: `Co-${i}${tag}`,
    label: `L${i}${tag}`,
  }));
}

// ── Delivery dimension ──────────────────────────────────────────────────────

/**
 * Deliver a row set the way the mode under test does it: a server response for
 * remote tables, a `data` assignment for local ones. Re-delivering the SAME row
 * objects exercises the reconciler's recycle path; delivering fresh objects
 * exercises the rebuild path.
 */
export async function deliverRows(table: any, rows: any[], remote: boolean) {
  if (remote) {
    await deliver(table, rows);
    return;
  }
  // A fresh array reference, mirroring what a remote response hands over: the
  // row OBJECTS are whatever the caller passed (identity drives recycling), but
  // the container is new so the assignment is a real change.
  table.unsortedData = [...rows];
  table.data = [...rows];
  await wait(50);
}

// ── Virtual window readback ─────────────────────────────────────────────────

export interface VirtualWindow {
  rows: HTMLElement[];
  indices: number[];
  start: number;
  end: number;          // exclusive
  topPx: number;
  bottomPx: number;
  topSpacer: HTMLElement | null;
  bottomSpacer: HTMLElement | null;
  tbody: HTMLElement;
}

function heightPx(el: HTMLElement | null): number {
  if (!el) return 0;
  const raw = el.style.height;
  return raw ? parseFloat(raw) : 0;
}

export function readWindow(table: any): VirtualWindow {
  const tbody = table.shadowRoot.querySelector('.table-frame tbody')
    ?? table.shadowRoot.querySelector('tbody');
  const rows = dataRows(table);
  const indices = rows.map(tr => Number(tr.getAttribute('data-index')));
  const topSpacer = table.shadowRoot.querySelector('tbody tr.virtual-spacer--top') as HTMLElement | null;
  const bottomSpacer = table.shadowRoot.querySelector('tbody tr.virtual-spacer--bottom') as HTMLElement | null;
  const start = indices.length ? indices[0] : 0;
  return {
    rows,
    indices,
    start,
    end: start + rows.length,
    topPx: heightPx(topSpacer),
    bottomPx: heightPx(bottomSpacer),
    topSpacer,
    bottomSpacer,
    tbody,
  };
}

/**
 * Full structural oracle for a virtualized body:
 *  - the rendered rows are a contiguous, ascending, in-range window;
 *  - the two spacers reserve exactly the height of the rows outside the window,
 *    so top + window + bottom always equals the full scroll height;
 *  - each spacer's inner cell carries the same height as its row and spans the
 *    whole grid;
 *  - tbody child order is [top spacer?] window rows [bottom spacer?];
 *  - a spacer is present exactly when it needs a non-zero height.
 */
export function expectVirtualWindow(table: any, allRows: any[], columnCount: number) {
  const rowHeight = table.rowHeight;
  const total = allRows.length;
  const w = readWindow(table);
  const problems: string[] = [];

  if (total === 0) {
    if (w.rows.length !== 0) problems.push(`expected no data rows for an empty dataset, found ${w.rows.length}`);
    if (w.topSpacer) problems.push('top spacer rendered for an empty dataset');
    if (w.bottomSpacer) problems.push('bottom spacer rendered for an empty dataset');
    expect(problems).toEqual([]);
    return w;
  }

  if (w.rows.length === 0) problems.push(`no rows rendered for a ${total}-row dataset`);
  if (w.rows.length > total) problems.push(`rendered ${w.rows.length} rows for a ${total}-row dataset`);

  w.indices.forEach((index, i) => {
    if (index !== w.start + i) problems.push(`window not contiguous at slot ${i}: data-index ${index}, expected ${w.start + i}`);
  });
  if (w.start < 0) problems.push(`window starts at ${w.start}`);
  if (w.end > total) problems.push(`window ends at ${w.end}, past the ${total}-row dataset`);

  const expectedTop = w.start * rowHeight;
  const expectedBottom = (total - w.end) * rowHeight;
  if (w.topPx !== expectedTop) problems.push(`top spacer ${w.topPx}px, expected ${expectedTop}px`);
  if (w.bottomPx !== expectedBottom) problems.push(`bottom spacer ${w.bottomPx}px, expected ${expectedBottom}px`);

  const reserved = w.topPx + w.rows.length * rowHeight + w.bottomPx;
  if (reserved !== total * rowHeight) {
    problems.push(`scroll height ${reserved}px, expected ${total * rowHeight}px`);
  }

  if (expectedTop > 0 && !w.topSpacer) problems.push('top spacer missing while rows sit above the window');
  if (expectedTop === 0 && w.topSpacer) problems.push('top spacer present with nothing above the window');
  if (expectedBottom > 0 && !w.bottomSpacer) problems.push('bottom spacer missing while rows sit below the window');
  if (expectedBottom === 0 && w.bottomSpacer) problems.push('bottom spacer present with nothing below the window');

  for (const [name, spacer] of [['top', w.topSpacer], ['bottom', w.bottomSpacer]] as const) {
    if (!spacer) continue;
    if (spacer.hasAttribute('data-index')) problems.push(`${name} spacer carries data-index (counts as a data row)`);
    const cells = [...spacer.querySelectorAll('td')] as HTMLTableCellElement[];
    if (cells.length !== 1) {
      problems.push(`${name} spacer has ${cells.length} cells, expected 1`);
      continue;
    }
    if (heightPx(cells[0]) !== heightPx(spacer)) {
      problems.push(`${name} spacer cell ${heightPx(cells[0])}px != row ${heightPx(spacer)}px`);
    }
    if (cells[0].colSpan < columnCount) {
      problems.push(`${name} spacer cell spans ${cells[0].colSpan} columns, expected at least ${columnCount}`);
    }
  }

  const expectedOrder = [
    ...(w.topSpacer ? [w.topSpacer] : []),
    ...w.rows,
    ...(w.bottomSpacer ? [w.bottomSpacer] : []),
  ];
  const actualOrder = ([...w.tbody.children] as HTMLElement[])
    .filter(el => !el.classList.contains('table-fill-row'));
  if (actualOrder.length !== expectedOrder.length
      || expectedOrder.some((el, i) => el !== actualOrder[i])) {
    problems.push(
      `tbody order ${actualOrder.map(describeRow).join(' ')} != ${expectedOrder.map(describeRow).join(' ')}`,
    );
  }

  expect(problems).toEqual([]);
  return w;
}

function describeRow(el: HTMLElement): string {
  if (el.classList.contains('virtual-spacer--top')) return '[top]';
  if (el.classList.contains('virtual-spacer--bottom')) return '[bottom]';
  const index = el.getAttribute('data-index');
  return index === null ? `<${el.className || 'tr'}>` : `#${index}`;
}

/**
 * A windowed body that rendered NO rows satisfies every per-row oracle
 * vacuously, so each of them starts here: a non-empty dataset owes the user
 * at least one rendered row.
 */
function expectWindowNotVacuous(w: VirtualWindow, allRows: any[]) {
  if (allRows.length === 0) return;
  expect(
    w.rows.length,
    `the window rendered no rows for a ${allRows.length}-row dataset, so the cell oracle would pass vacuously`,
  ).toBeGreaterThan(0);
}

/** Every rendered control cell holds the exact label of the row it claims. */
export function expectControlCells(table: any, allRows: any[]) {
  const w = readWindow(table);
  expectWindowNotVacuous(w, allRows);
  const problems: string[] = [];
  w.rows.forEach((tr, i) => {
    const row = allRows[w.indices[i]];
    const td = tr.querySelector(`td[data-key="${CONTROL_COLUMN.key}"]`) as HTMLElement | null;
    if (!td) { problems.push(`slot ${i}: missing control cell`); return; }
    const actual = cellText(td);
    if (actual === '') problems.push(`slot ${i} (data-index ${w.indices[i]}): control cell is blank`);
    if (!row) { problems.push(`slot ${i}: data-index ${w.indices[i]} is outside the dataset`); return; }
    if (actual !== row.label) problems.push(`slot ${i}: control cell "${actual}" != "${row.label}"`);
  });
  expect(problems).toEqual([]);
}

/**
 * The matrix oracle applied to the rendered window: each visible cell must
 * equal the documented pipeline result for the row it claims to display.
 */
export function expectWindowCells(table: any, allRows: any[], columns: MatrixColumn[]) {
  const w = readWindow(table);
  expectWindowNotVacuous(w, allRows);
  expectCellsMatch(table, allRows.slice(w.start, w.end), columns);
  expectVisibleWindowCells(table, allRows, columns);
}

const NO_CONTENT = '<no rendered content>';

/**
 * The text a user actually SEES in a cell. `expectedCellText` is asserted twice
 * over: once against the cell's `value` (docs: "the cell's `value`
 * property/attribute IS the display value") and once against the rendered
 * `part="content"` node inside the cell element's shadow root. Reading only the
 * attribute would keep passing if the pipeline result never reached the screen.
 */
export function visibleCellText(td: HTMLElement): string {
  const host = td.querySelector('[value]') as HTMLElement | null;
  if (!host) return td.textContent?.trim() ?? '';
  const content = host.shadowRoot?.querySelector('[part~="content"]');
  if (!content) return NO_CONTENT;
  return content.textContent?.trim() ?? '';
}

/** On-screen text of every windowed cell equals the documented pipeline result. */
export function expectVisibleWindowCells(table: any, allRows: any[], columns: MatrixColumn[]) {
  const w = readWindow(table);
  expectWindowNotVacuous(w, allRows);
  const problems: string[] = [];
  w.rows.forEach((tr, i) => {
    const index = w.indices[i];
    const row = allRows[index];
    if (!row) { problems.push(`slot ${i}: data-index ${index} is outside the dataset`); return; }
    for (const col of columns) {
      const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
      if (!td) { problems.push(`data-index ${index}: missing td[${col.key}]`); continue; }
      const shown = visibleCellText(td);
      const expected = expectedCellText(col, row);
      if (shown !== expected) {
        problems.push(`data-index ${index} col ${col.key}: on screen "${shown}" != "${expected}"`);
      }
    }
  });
  expect(problems).toEqual([]);
}

/**
 * Spacer oracle for `setRowHeightCallback(fn)` (docs: "set rendered/virtual
 * height"): with per-row heights the fixed-`rowHeight` arithmetic in
 * expectVirtualWindow no longer applies, so the spacers are measured against the
 * summed heights of the rows outside the window.
 */
export function expectVariableHeightWindow(
  table: any,
  allRows: any[],
  heightOf: (row: any, index: number) => number,
) {
  const w = readWindow(table);
  const problems: string[] = [];
  const heights = allRows.map((row, i) => heightOf(row, i));
  const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

  expectWindowNotVacuous(w, allRows);
  w.indices.forEach((index, i) => {
    if (index !== w.start + i) problems.push(`window not contiguous at slot ${i}: data-index ${index}`);
  });
  if (w.end > allRows.length) problems.push(`window ends at ${w.end}, past the ${allRows.length}-row dataset`);

  const expectedTop = sum(heights.slice(0, w.start));
  const windowPx = sum(heights.slice(w.start, w.end));
  const expectedBottom = sum(heights) - expectedTop - windowPx;
  if (w.topPx !== expectedTop) problems.push(`top spacer ${w.topPx}px, expected ${expectedTop}px`);
  if (w.bottomPx !== expectedBottom) problems.push(`bottom spacer ${w.bottomPx}px, expected ${expectedBottom}px`);
  if (w.topPx + windowPx + w.bottomPx !== sum(heights)) {
    problems.push(`scroll height ${w.topPx + windowPx + w.bottomPx}px, expected ${sum(heights)}px`);
  }

  expect(problems).toEqual([]);
  return w;
}

/**
 * The single message row a zero-row body owes the user (docs: `virtualize`
 * "keeps every zero-row state: loading spinner, ⚠️ load error, and the
 * `empty-state` slot clone (or the default 'No data' placeholder)").
 */
export function zeroRowMessageCell(table: any): HTMLElement | null {
  return table.shadowRoot.querySelector('tbody td.no-data') as HTMLElement | null;
}
