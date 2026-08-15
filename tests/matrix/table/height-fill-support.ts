// Shared fixtures for the height-fill slice of the table feature matrix.
//
// The fill row is a pure layout artifact: `updateFillRow()` compares the
// frame's client box against the rendered <table>'s offset box and appends an
// inert filler when the frame is taller. happy-dom performs no layout, so both
// boxes read 0 and the fill can never appear on its own. `stubLayout` supplies
// exactly those two measurements — nothing else about the component is touched
// — so the documented rule (leftover > 1px => fill) becomes observable in a
// unit environment.
//
// SIMULATION BOUNDARY (be honest about it): "an explicit host height" is
// modelled, never measured. Nothing here derives leftover from a real layout,
// so these tests pin the RULE (which box comparison produces which filler) and
// not the browser's box arithmetic. The real host-height path is covered by
// tests/live/components/table/table-fill.spec.ts under Playwright. To keep the
// simulation from lying in a second way, `stubLayout` also rewrites the host's
// declared style height to the frame height it pins, so a reader can never be
// misled by a `height: '600px'` host that is actually being measured at 101px.
import { expect } from 'vitest';
import type { MatrixColumn } from './matrix-utils';
import { cellText, dataRows, expectedCellText } from './matrix-utils';

export const FILL_SELECTOR = 'tbody tr.table-fill-row';

/** Pin the two boxes `updateFillRow()` measures. Idempotent; re-apply freely. */
export function stubLayout(table: any, frameHeight: number, tableHeight: number) {
  const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement | null;
  const tableEl = frame?.querySelector('table') as HTMLElement | null;
  if (!frame || !tableEl) throw new Error('table frame not rendered yet');
  Object.defineProperty(frame, 'clientHeight', { get: () => frameHeight, configurable: true });
  Object.defineProperty(tableEl, 'offsetHeight', { get: () => tableHeight, configurable: true });
  // The declared host height must agree with the box the test pins, or it is
  // decoration that misleads the next reader.
  table.style.height = `${frameHeight}px`;
}

/** A frame comfortably taller than its rows: 600px box around a 100px table. */
export const TALL = { frame: 600, table: 100, leftover: 500 };
/** A frame the rows already fill exactly. */
export const EXACT = { frame: 100, table: 100 };
/** A frame the rows overflow. */
export const OVERFLOW = { frame: 80, table: 200 };

export function fillRow(table: any): HTMLElement | null {
  return table.shadowRoot.querySelector(FILL_SELECTOR);
}

export function fillRows(table: any): HTMLElement[] {
  return [...table.shadowRoot.querySelectorAll(FILL_SELECTOR)] as HTMLElement[];
}

export function tbodyOf(table: any): HTMLElement {
  return table.shadowRoot.querySelector('tbody') as HTMLElement;
}

export function headerCellCount(table: any): number {
  const headerRow = table.shadowRoot.querySelector('thead tr.column-header-row')
    ?? table.shadowRoot.querySelector('thead tr:not(.column-group-row):not(.header-filter-row)');
  return headerRow ? headerRow.querySelectorAll('th').length : 0;
}

// The documented filler contract, in the docs' own words:
//
//   "When a sized host is taller than its rows, the table appends an inert
//    filler row so the column grid reaches the bottom edge of the frame (this
//    happens on the virtualized path too). The filler is not data: it carries
//    no row identity, no ARIA, no selection state, and no `row`/`cell` part"
//   (docs/components/table.md, CSS Parts; docs/ai/components/table.md:129)
//
// "carries no row identity, no ARIA, no selection state, no part" is a
// SUBTRACTION rule, so assert it by subtraction: everything a real body row
// wears is row identity, and the filler may keep only the three things it owns
// as a layout artifact. Enumerating the attributes `updateFillRow()` happens to
// strip today would just re-state the implementation — and would silently pass
// the day the component starts emitting a new row attribute that the strip
// list has not caught up with. These two allow-lists cannot drift that way.

/** All the filler may wear: its marker class, the height it exists to add, and
 *  the aria-hidden that removes it from the a11y tree. */
const FILL_ROW_ALLOWED_ATTRS = new Set(['class', 'style', 'aria-hidden']);
/** Same for its cells. Column identity may stay — `data-key` and the inline
 *  width are what make the column grid continue, which is the filler's entire
 *  purpose — but nothing row-flavoured or a11y-flavoured may. */
const FILL_CELL_ALLOWED_ATTRS = new Set(['class', 'style', 'data-key']);

/**
 * Every documented property of a present fill row, asserted at once:
 * - exactly one filler, appended last so the column grid reaches the frame's
 *   bottom edge;
 * - height equals the leftover space;
 * - it is NOT a data row: no attribute a real body row carries survives the
 *   clone (derived by subtraction from the last real data row, so the oracle
 *   tracks whatever identity the component actually emits);
 * - it is inert: aria-hidden, pointer-events none;
 * - its cells are empty but structurally complete (one per header cell) so
 *   column separators continue;
 * - it carries the borderless, zero-padding last-row treatment.
 */
export function expectFillRowContract(table: any, expectedLeftover: number) {
  const problems: string[] = [];
  const fills = fillRows(table);

  if (fills.length !== 1) {
    problems.push(`fill row count ${fills.length}, expected 1`);
    expect(problems).toEqual([]);
    return;
  }
  const fill = fills[0];
  const tbody = tbodyOf(table);

  if (tbody.lastElementChild !== fill) {
    problems.push(`fill is not the last tbody child (last is ${(tbody.lastElementChild as HTMLElement)?.className || 'data row'})`);
  }
  if (fill.style.height !== `${expectedLeftover}px`) {
    problems.push(`fill height "${fill.style.height}", expected "${expectedLeftover}px"`);
  }
  if (fill.getAttribute('aria-hidden') !== 'true') {
    problems.push(`aria-hidden "${fill.getAttribute('aria-hidden')}", expected "true"`);
  }
  if (fill.className !== 'table-fill-row') {
    problems.push(`fill className "${fill.className}", expected "table-fill-row"`);
  }
  if (getComputedStyle(fill).pointerEvents !== 'none') {
    problems.push(`fill pointer-events "${getComputedStyle(fill).pointerEvents}", expected "none"`);
  }

  // Subtraction rule, row level.
  for (const attr of fill.getAttributeNames()) {
    if (!FILL_ROW_ALLOWED_ATTRS.has(attr)) {
      problems.push(`fill kept ${attr}="${fill.getAttribute(attr)}" — the filler carries no row identity`);
    }
  }

  // Guard the rule's discriminating power: if a real body row wore nothing but
  // the same three attributes, the loop above could not fail for any
  // implementation. A data row must carry identity (part/data-index/role/…)
  // for "the filler carries none of it" to mean anything.
  const reference = realDataRows(table).at(-1);
  if (reference) {
    const identity = reference.getAttributeNames().filter(a => !FILL_ROW_ALLOWED_ATTRS.has(a));
    if (identity.length === 0) {
      problems.push('vacuous oracle: a real data row carries no identity attributes to be stripped');
    }
    // Docs: part `row` is "each native body row"; the filler is explicitly not
    // one ("…is neither and exposes no part").
    if (reference.getAttribute('part') !== 'row') {
      problems.push(`data row part "${reference.getAttribute('part')}", expected "row"`);
    }
  }

  const tds = [...fill.querySelectorAll('td')] as HTMLElement[];
  const ths = headerCellCount(table);
  if (tds.length !== ths) problems.push(`fill has ${tds.length} cells, header has ${ths}`);
  tds.forEach((td, i) => {
    if (td.childNodes.length !== 0) problems.push(`fill cell ${i} is not empty (${td.innerHTML})`);
    if (cellText(td) !== '') problems.push(`fill cell ${i} text "${cellText(td)}", expected ""`);
    for (const attr of td.getAttributeNames()) {
      if (!FILL_CELL_ALLOWED_ATTRS.has(attr)) {
        problems.push(`fill cell ${i} kept ${attr}="${td.getAttribute(attr)}"`);
      }
    }
    const cs = getComputedStyle(td);
    if (!cs.borderBottom.startsWith('none')) problems.push(`fill cell ${i} border-bottom "${cs.borderBottom}", expected none`);
    if (cs.padding !== '0px') problems.push(`fill cell ${i} padding "${cs.padding}", expected "0px"`);
  });

  expect(problems).toEqual([]);
}

/** The filler's cells are empty — compared against the header's cell count, so
 *  a filler that lost its cells entirely cannot pass by having nothing to
 *  compare (`texts.map(() => '')` always agrees with `texts`). */
export function expectFillerCellsEmpty(table: any) {
  const fill = fillRow(table);
  expect(fill, 'expected a fill row to be present').not.toBeNull();
  const tds = [...fill!.querySelectorAll('td')] as HTMLElement[];
  expect(tds.map(td => (td.textContent ?? '').trim()))
    .toEqual(new Array(headerCellCount(table)).fill(''));
}

/**
 * The shared `dataRows()` oracle selects `tbody tr[data-index]`, and PINNED
 * rows are built by `createRow(row, -1)` (snice-table.ts) so they carry
 * `data-index="-1"` and are counted as data by it. That is a hole in the shared
 * helper, not in the component: a pinned row is a copy of a row, not an extra
 * one. This slice needs the true data set, so drop the sentinel index here
 * rather than reaching into matrix-utils.ts, which twelve other slices share.
 */
export function realDataRows(table: any): HTMLElement[] {
  return dataRows(table).filter(tr => Number(tr.getAttribute('data-index')) >= 0);
}

/** Rows that legitimately share the tbody without being data: they may sit
 *  after the last data row without the filler being involved. */
const STRUCTURAL_ROW_CLASSES = ['pinned-row', 'group-aggregate-row', 'detail-row', 'virtual-spacer'];

function isStructuralRow(el: Element | null): boolean {
  return !!el && STRUCTURAL_ROW_CLASSES.some(c => el.classList.contains(c));
}

/**
 * The fill row must never be mistaken for data: the true data rows must be
 * exactly the expected ones, and the last of them must not be the tbody's last
 * child while a filler is present — that is what keeps the last data row's
 * bottom border drawn instead of being stripped by
 * `tbody tr:last-child td { border-bottom: none }`.
 */
export function expectFillNotCountedAsData(table: any, expectedRowCount: number) {
  const problems: string[] = [];
  const rows = realDataRows(table);
  if (rows.length !== expectedRowCount) {
    problems.push(`data row count ${rows.length}, expected ${expectedRowCount}`);
  }
  for (const tr of dataRows(table)) {
    if (tr.classList.contains('table-fill-row')) problems.push('a fill row carries data-index');
  }
  const tbody = tbodyOf(table);
  const fill = fillRow(table);
  const last = rows[rows.length - 1];
  if (fill && rows.length > 0 && tbody.lastElementChild === last) {
    problems.push('last data row is still tbody:last-child while a fill row exists');
  }
  if (!fill && rows.length > 0 && tbody.lastElementChild !== last
      && !isStructuralRow(tbody.lastElementChild)) {
    problems.push('without a fill row the last data row must be tbody:last-child');
  }
  expect(problems).toEqual([]);
}

/**
 * Docs: `updateRowSelectionState()` syncs rows "keyed by each row's data index,
 * so group/aggregate/spacer/filler rows are never marked selected"
 * (docs/ai/components/table.md:92). Nothing in the body except a real data row
 * may carry selection state, and the rows that do must be exactly the ones the
 * selection covers on the current page.
 */
export function expectSelectionStateOnDataRowsOnly(table: any, expectedSelectedIndices: number[]) {
  const problems: string[] = [];
  const tbody = tbodyOf(table);
  for (const tr of [...tbody.querySelectorAll('tr')] as HTMLElement[]) {
    const index = Number(tr.getAttribute('data-index'));
    const isData = tr.hasAttribute('data-index') && index >= 0;
    if (isData) continue;
    for (const attr of ['data-selected', 'aria-selected']) {
      if (tr.hasAttribute(attr)) {
        problems.push(`non-data row "${tr.className || tr.tagName}" kept ${attr}="${tr.getAttribute(attr)}"`);
      }
    }
  }
  const painted = [...tbody.querySelectorAll('tr[data-selected="true"]')]
    .map(tr => Number(tr.getAttribute('data-index')))
    .sort((a, b) => a - b);
  expect(painted).toEqual([...expectedSelectedIndices].sort((a, b) => a - b));
  expect(problems).toEqual([]);
}

// ── Displayed text ───────────────────────────────────────────────────────────
//
// `cellText()` reads the runtime cell element's `value` ATTRIBUTE, which is now
// the DISPLAY value on every pipeline (a column declaring a formatter renders
// through `snice-cell-text` and the attribute carries the formatter output).
// `displayText()` still prefers the cell's rendered shadow content and only
// falls back to `cellText()`, so the assertion stays strictly stronger — it
// compares the pixels-on-screen string, not an internal attribute, and the two
// oracles disagreeing is itself a defect.

/** The documented display string for one column/row pair (the matrix oracle). */
export const expectedDisplay = expectedCellText;

export function displayText(td: HTMLElement): string {
  const cell = td.querySelector('[value]') as any;
  const content = cell?.shadowRoot?.querySelector('.cell-content');
  if (content) return (content.textContent ?? '').trim();
  return cellText(td);
}

/**
 * `expectCellsMatch`, but against on-screen text rather than the value attr.
 * `renderedRows` overrides which <tr>s are compared, for bodies where the
 * shared `dataRows()` selector over-collects (pinned rows carry
 * `data-index="-1"` — see `realDataRows`).
 */
export function expectDisplayedCellsMatch(
  table: any,
  expectedRowsInOrder: any[],
  columns?: MatrixColumn[],
  renderedRows?: HTMLElement[],
) {
  const cols = (columns ?? table.columns) as MatrixColumn[];
  const rows = renderedRows ?? dataRows(table);
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
      if (actual !== expected) problems.push(`row ${i} col ${col.key}: "${actual}" != "${expected}"`);
    }
  });
  expect(problems).toEqual([]);
}

/**
 * `expectDisplayedCellsMatch` assumes every delivered row is rendered, which a
 * virtualized body does not do. This is the same oracle addressed by
 * `data-index`: whichever rows the window happens to contain must show the
 * documented display text for the row that index names, in ascending order and
 * without duplicates. It cannot pass on an empty window.
 */
export function expectWindowedCellsMatch(table: any, allRows: any[], columns?: MatrixColumn[]) {
  const cols = (columns ?? table.columns) as MatrixColumn[];
  const rows = realDataRows(table);
  const problems: string[] = [];

  if (rows.length === 0) problems.push('no data rows rendered');
  let previous = -1;
  for (const tr of rows) {
    const index = Number(tr.getAttribute('data-index'));
    const row = allRows[index];
    if (!row) { problems.push(`data-index ${index} names no delivered row`); continue; }
    if (index <= previous) problems.push(`data-index ${index} follows ${previous} — window out of order`);
    previous = index;
    for (const col of cols) {
      const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
      if (!td) { problems.push(`row ${index}: missing td[${col.key}]`); continue; }
      const actual = displayText(td);
      const expected = expectedCellText(col, row);
      if (actual !== expected) problems.push(`row ${index} col ${col.key}: "${actual}" != "${expected}"`);
    }
  }
  expect(problems).toEqual([]);
}

// ── Pipeline dimension ───────────────────────────────────────────────────────
// Row shape: `a` is a real field, `src` backs the getter columns, `gk` is
// deliberately absent so a valueGetter column's key is NOT a row field.

export interface PipelineVariant {
  name: string;
  column: MatrixColumn;
}

export const pipelines: PipelineVariant[] = [
  {
    name: 'no pipeline',
    column: { key: 'a', label: 'A', type: 'text', sortable: true },
  },
  {
    name: 'valueGetter',
    column: { key: 'gk', label: 'A', type: 'text', sortable: true, valueGetter: (_v: any, row: any) => row.src },
  },
  {
    name: 'valueFormatter',
    column: { key: 'a', label: 'A', type: 'text', sortable: true, valueFormatter: (v: any) => `vf<${v}>` },
  },
  {
    name: 'valueGetter+valueFormatter',
    column: {
      key: 'gk', label: 'A', type: 'text', sortable: true,
      valueGetter: (_v: any, row: any) => row.src,
      valueFormatter: (v: any) => `vf<${v}>`,
    },
  },
  {
    name: 'formatter',
    column: { key: 'a', label: 'A', type: 'text', sortable: true, formatter: (v: any) => `f<${v}>` },
  },
  {
    name: 'valueGetter+formatter',
    column: {
      key: 'gk', label: 'A', type: 'text', sortable: true,
      valueGetter: (_v: any, row: any) => row.src,
      formatter: (v: any) => `f<${v}>`,
    },
  },
];

/** The trailing column, constant across pipelines, so the fill spans >1 cell. */
export const tailColumn: MatrixColumn = { key: 'n', label: 'N', type: 'text', sortable: true };

export function columnsFor(p: PipelineVariant): MatrixColumn[] {
  return [p.column, tailColumn];
}

export function makeRows(): any[] {
  return [
    { id: 1, a: 'Bravo', src: 'Bravo', n: 'n1', g: 'G1' },
    { id: 2, a: 'Alpha', src: 'Alpha', n: 'n2', g: 'G1' },
    { id: 3, a: 'Charlie', src: 'Charlie', n: 'n3', g: 'G2' },
  ];
}

/** Mutate row objects in place so re-delivery keeps identity (DOM recycles). */
export function mutateInPlace(rows: any[]): any[] {
  rows.forEach((r, i) => {
    r.a = `${r.a}-m${i}`;
    r.src = `${r.src}-m${i}`;
    r.n = `${r.n}-m${i}`;
  });
  return rows;
}

/** Push rows into a local-mode table the way the component's own setters do. */
export function setLocalData(table: any, rows: any[]) {
  table.data = rows;
  table.unsortedData = [...rows];
}

export const deliveries: Array<'local' | 'remote'> = ['local', 'remote'];
