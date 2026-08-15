// Shared fixtures for the filtering slice of the table feature matrix.
//
// Every filtering test crosses one FILTER operation with one DELIVERY pipeline:
//   pipeline ∈ { none, valueGetter (key not a row field), valueFormatter,
//                valueGetter+valueFormatter, formatter }
//   mode     ∈ { local, remote }
//
// Filter membership is always decided on a PLAIN column ('dept') whose key is a
// real row field, so the expected row set is identical under every pipeline and
// never depends on undocumented getter/filter interaction. The pipeline column
// only has to RENDER correctly for whatever rows survive — that is the property
// under test (rows that render blank/stale after a filter + delivery).
import { expect } from 'vitest';
import type { MatrixColumn } from './matrix-utils';
import { dataRows, expectCellsMatch, expectedCellText, respondWith, wait } from './matrix-utils';

export interface Person {
  id: number;
  name: string;
  companyName: string;
  dept: string;
}

/** Fresh row objects (identity matters for the render reconciler). */
export function people(): Person[] {
  return [
    { id: 1, name: 'Ada', companyName: 'Acme', dept: 'eng' },
    { id: 2, name: 'Bob', companyName: 'Globex', dept: 'sales' },
    { id: 3, name: 'Cy', companyName: 'Initech', dept: 'eng' },
    { id: 4, name: 'Dee', companyName: 'Umbrella', dept: 'ops' },
    { id: 5, name: 'Eve', companyName: 'Hooli', dept: 'sales' },
    { id: 6, name: 'Fay', companyName: 'Vandelay', dept: 'eng' },
  ];
}

export type PipelineName =
  | 'none'
  | 'valueGetter'
  | 'valueFormatter'
  | 'valueGetter+valueFormatter'
  | 'formatter';

export const PIPELINES: PipelineName[] = [
  'none',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
];

/**
 * The pipeline column. For the two valueGetter pipelines the column key
 * ('company') is deliberately NOT a field on the row — the row carries
 * `companyName` and only the getter bridges the two, which is the shape the
 * remote field report describes.
 */
export function pipelineColumn(pipeline: PipelineName): MatrixColumn {
  switch (pipeline) {
    case 'none':
      return { key: 'name', label: 'Name', type: 'text' };
    case 'valueGetter':
      return {
        key: 'company', label: 'Company', type: 'text',
        valueGetter: (_v: any, row: any) => row.companyName,
      };
    case 'valueFormatter':
      return {
        key: 'name', label: 'Name', type: 'text',
        valueFormatter: (v: any) => `[${v}]`,
      };
    case 'valueGetter+valueFormatter':
      return {
        key: 'company', label: 'Company', type: 'text',
        valueGetter: (_v: any, row: any) => row.companyName,
        valueFormatter: (v: any) => `[${v}]`,
      };
    case 'formatter':
      return {
        key: 'name', label: 'Name', type: 'text',
        formatter: (v: any) => `<${v}>`,
      };
  }
}

/** Plain filterable column + the pipeline column under test. */
export function columnsFor(pipeline: PipelineName): MatrixColumn[] {
  return [
    { key: 'dept', label: 'Dept', type: 'text', filterable: true, sortable: true },
    pipelineColumn(pipeline),
  ];
}

/** Pipelines whose display text comes from valueFormatter. */
export function usesValueFormatter(pipeline: PipelineName): boolean {
  return pipeline === 'valueFormatter' || pipeline === 'valueGetter+valueFormatter';
}

// ── Rows whose pipeline column key IS a row field, used when the FILTER itself
// targets the pipeline column. Raw ('Paris HQ') and getter-derived
// ('Paris Office') values both contain the filter term, so the expected row set
// is the same whether or not filtering consults the getter — only the rendered
// text distinguishes a correct render from a broken one.
export interface Place {
  id: number;
  city: string;
  cityLabel: string;
  region: string;
}

export function places(): Place[] {
  return [
    { id: 1, city: 'Paris HQ', cityLabel: 'Paris Office', region: 'emea' },
    { id: 2, city: 'Lisbon HQ', cityLabel: 'Lisbon Office', region: 'emea' },
    { id: 3, city: 'Paris Annex', cityLabel: 'Paris Studio', region: 'emea' },
    { id: 4, city: 'Denver HQ', cityLabel: 'Denver Office', region: 'amer' },
  ];
}

/** Pipeline column keyed on a real row field ('city'), for filter-on-pipeline tests. */
export function placeColumn(pipeline: PipelineName): MatrixColumn {
  switch (pipeline) {
    case 'none':
      return { key: 'city', label: 'City', type: 'text', filterable: true };
    case 'valueGetter':
      return {
        key: 'city', label: 'City', type: 'text', filterable: true,
        valueGetter: (_v: any, row: any) => row.cityLabel,
      };
    case 'valueFormatter':
      return {
        key: 'city', label: 'City', type: 'text', filterable: true,
        valueFormatter: (v: any) => `[${v}]`,
      };
    case 'valueGetter+valueFormatter':
      return {
        key: 'city', label: 'City', type: 'text', filterable: true,
        valueGetter: (_v: any, row: any) => row.cityLabel,
        valueFormatter: (v: any) => `[${v}]`,
      };
    case 'formatter':
      return {
        key: 'city', label: 'City', type: 'text', filterable: true,
        formatter: (v: any) => `<${v}>`,
      };
  }
}

export function placeColumnsFor(pipeline: PipelineName): MatrixColumn[] {
  return [
    { key: 'region', label: 'Region', type: 'text', filterable: true },
    placeColumn(pipeline),
  ];
}

// ── Oracles ────────────────────────────────────────────────────────────────
// matrix-utils' cellText() reads the runtime cell's `value` ATTRIBUTE. The
// formatter/valueFormatter display pipeline writes into the cell's shadow
// `[part~="content"]` instead, so the two oracles disagree for formatted
// columns. Both are asserted: the attribute oracle through
// expectCellsMatch (shared harness) and the on-screen text through
// expectDisplayMatch below. A row that renders blank/stale fails both.

/** On-screen text of one td: the runtime cell's shadow content when present. */
export function displayCellText(td: HTMLElement): string {
  const host = td.firstElementChild as any;
  const content = host?.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
  if (content) return (content.textContent ?? '').trim();
  return td.textContent?.trim() ?? '';
}

/** expectCellsMatch, but comparing the text the user actually sees. */
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
      const actual = displayCellText(td);
      const expected = expectedCellText(col, row);
      if (actual !== expected) {
        problems.push(`row ${i} col ${col.key}: "${actual}" != "${expected}"`);
      }
    }
  });

  expect(problems).toEqual([]);
}

export type OracleName = 'value-attribute' | 'display-text';

export function oracleFor(name: OracleName) {
  return name === 'value-attribute' ? expectCellsMatch : expectDisplayMatch;
}

/** Local-mode (re)delivery: assign rows and render, mirroring makeTable(). */
export async function setLocalData(table: any, rows: any[]) {
  table.data = rows;
  table.unsortedData = [...rows];
  table.renderBody();
  await wait(20);
}

/**
 * Re-delivery through the DOCUMENTED path only. `table.unsortedData` is an
 * internal field that appears nowhere in docs/ai/components/table.md; the docs
 * promise `table.data =` rerenders and that `setData()` is non-eager, so an
 * unpaired assignment plus `renderBody()` is the whole public contract. Every
 * scenario that setLocalData() covers must also hold here.
 */
export async function setLocalDataDocumented(table: any, rows: any[]) {
  table.data = rows;
  table.renderBody();
  await wait(20);
}

// ── Typed rows for the non-text filter operators ───────────────────────────
// docs/ai/components/table.md: number `eq/neq/gt/gte/lt/lte/isEmpty/isNotEmpty`,
// date `is/isNot/before/onOrBefore/after/onOrAfter/isEmpty/isNotEmpty`, boolean
// `isTrue/isFalse`. Membership is decided on the typed column; the pipeline
// column (unchanged from `pipelineColumn()`) is the one the oracle reads, so
// the expected display text stays independent of typed-cell formatting.

export interface Asset {
  id: number;
  name: string;
  companyName: string;
  qty: number | null;
  hired: string;
  active: boolean;
}

/** Complete rows — used by every comparison operator. */
export function assets(): Asset[] {
  return [
    { id: 1, name: 'Ada', companyName: 'Acme', qty: 10, hired: '2020-01-15', active: true },
    { id: 2, name: 'Bob', companyName: 'Globex', qty: 20, hired: '2021-06-01', active: false },
    { id: 3, name: 'Cy', companyName: 'Initech', qty: 30, hired: '2022-03-09', active: true },
    { id: 4, name: 'Dee', companyName: 'Umbrella', qty: 20, hired: '2021-06-01', active: false },
  ];
}

/** Rows with holes — used by isEmpty / isNotEmpty on typed columns. */
export function assetsWithGaps(): Asset[] {
  return [
    { id: 1, name: 'Ada', companyName: 'Acme', qty: 10, hired: '2020-01-15', active: true },
    { id: 2, name: 'Bob', companyName: 'Globex', qty: null, hired: '', active: false },
    { id: 3, name: 'Cy', companyName: 'Initech', qty: 30, hired: '2022-03-09', active: true },
    { id: 4, name: 'Dee', companyName: 'Umbrella', qty: null, hired: '', active: false },
  ];
}

export const NUMBER_FILTER_COLUMN: MatrixColumn =
  { key: 'qty', label: 'Qty', type: 'number', filterable: true };
export const DATE_FILTER_COLUMN: MatrixColumn =
  { key: 'hired', label: 'Hired', type: 'date', filterable: true };
export const BOOLEAN_FILTER_COLUMN: MatrixColumn =
  { key: 'active', label: 'Active', type: 'boolean', filterable: true };

/** Typed filter column + the pipeline column under test. */
export function typedColumnsFor(typed: MatrixColumn, pipeline: PipelineName): MatrixColumn[] {
  return [typed, pipelineColumn(pipeline)];
}

// ── Control-driven filter entry points ─────────────────────────────────────

/**
 * Drive the documented `searchable` control (docs/components/table.md line 39:
 * "Its debounced input applies the local quick filter in local mode and updates
 * `searchText`/requests `table/data` in remote mode"). The debounce is
 * `searchDebounce`, so callers shorten it before typing.
 */
export function typeIntoSearch(table: any, text: string) {
  const input = table.shadowRoot.querySelector('.search-input') as any;
  if (!input) throw new Error('searchable control is not rendered');
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Drive the documented `quickFilter` control (model-backed input). */
export function typeIntoQuickFilter(table: any, text: string) {
  const input = table.shadowRoot.querySelector('.quick-filter-input') as any;
  if (!input) throw new Error('quickFilter control is not rendered');
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Drive a `headerFilters` inline input for one column. */
export function typeIntoHeaderFilter(table: any, key: string, text: string) {
  const input = table.shadowRoot.querySelector(
    `.header-filter-row snice-input[data-column="${key}"]`,
  ) as any;
  if (!input) throw new Error(`header filter input for "${key}" is not rendered`);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Remote-mode filter operation: a filter change requests `table/data`
 * (150 ms debounce), so the server response is armed before the call and the
 * delivered rows are what the table must display.
 */
export async function filterRemote(table: any, apply: () => void, rows: any[], extra: Record<string, any> = {}) {
  respondWith(table, rows, extra);
  apply();
  await wait(300); // 150 ms request debounce + response + render frame
}
