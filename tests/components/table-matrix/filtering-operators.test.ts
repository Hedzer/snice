// Filtering slice × the NON-TEXT filter operators × delivery pipelines × oracles.
//
// docs/ai/components/table.md documents 22 filter operators:
//   text    contains/notContains/equals/notEquals/startsWith/endsWith/isEmpty/isNotEmpty
//   number  eq/neq/gt/gte/lt/lte/isEmpty/isNotEmpty
//   date    is/isNot/before/onOrBefore/after/onOrAfter/isEmpty/isNotEmpty
//   boolean isTrue/isFalse
// The text eight are exercised by filtering-local/filtering-pipeline-column;
// this file covers the remaining fourteen (plus isEmpty/isNotEmpty on a number
// and a date column, whose emptiness semantics differ from a text column's).
//
// Membership is decided on the TYPED column, exactly as the rest of the slice
// decides it on a plain text column. The oracle reads the PIPELINE column only,
// so the expected display text is the documented valueGetter → formatter /
// valueFormatter chain and never depends on typed-cell rendering.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, wait, MatrixColumn } from './matrix-utils';
import {
  Asset, BOOLEAN_FILTER_COLUMN, DATE_FILTER_COLUMN, NUMBER_FILTER_COLUMN,
  OracleName, PIPELINES, PipelineName, assets, assetsWithGaps, oracleFor,
  pipelineColumn, typedColumnsFor,
} from './filtering-fixtures';

type Check = (expected: any[]) => Promise<void>;

interface OperatorScenario {
  name: string;
  column: MatrixColumn;
  rows: () => Asset[];
  /** Applied to the table; returns the indices (into rows()) that must render. */
  operator: string;
  value: any;
  expected: number[];
}

const SCENARIOS: OperatorScenario[] = [
  // ── number ───────────────────────────────────────────────────────────────
  { name: 'number eq', column: NUMBER_FILTER_COLUMN, rows: assets, operator: 'eq', value: 20, expected: [1, 3] },
  { name: 'number neq', column: NUMBER_FILTER_COLUMN, rows: assets, operator: 'neq', value: 20, expected: [0, 2] },
  { name: 'number gt', column: NUMBER_FILTER_COLUMN, rows: assets, operator: 'gt', value: 20, expected: [2] },
  { name: 'number gte', column: NUMBER_FILTER_COLUMN, rows: assets, operator: 'gte', value: 20, expected: [1, 2, 3] },
  { name: 'number lt', column: NUMBER_FILTER_COLUMN, rows: assets, operator: 'lt', value: 20, expected: [0] },
  { name: 'number lte', column: NUMBER_FILTER_COLUMN, rows: assets, operator: 'lte', value: 20, expected: [0, 1, 3] },
  {
    name: 'number isEmpty', column: NUMBER_FILTER_COLUMN, rows: assetsWithGaps,
    operator: 'isEmpty', value: null, expected: [1, 3],
  },
  {
    name: 'number isNotEmpty', column: NUMBER_FILTER_COLUMN, rows: assetsWithGaps,
    operator: 'isNotEmpty', value: null, expected: [0, 2],
  },

  // ── date ─────────────────────────────────────────────────────────────────
  { name: 'date is', column: DATE_FILTER_COLUMN, rows: assets, operator: 'is', value: '2021-06-01', expected: [1, 3] },
  { name: 'date isNot', column: DATE_FILTER_COLUMN, rows: assets, operator: 'isNot', value: '2021-06-01', expected: [0, 2] },
  { name: 'date before', column: DATE_FILTER_COLUMN, rows: assets, operator: 'before', value: '2021-06-01', expected: [0] },
  {
    name: 'date onOrBefore', column: DATE_FILTER_COLUMN, rows: assets,
    operator: 'onOrBefore', value: '2021-06-01', expected: [0, 1, 3],
  },
  { name: 'date after', column: DATE_FILTER_COLUMN, rows: assets, operator: 'after', value: '2021-06-01', expected: [2] },
  {
    name: 'date onOrAfter', column: DATE_FILTER_COLUMN, rows: assets,
    operator: 'onOrAfter', value: '2021-06-01', expected: [1, 2, 3],
  },
  {
    name: 'date isEmpty', column: DATE_FILTER_COLUMN, rows: assetsWithGaps,
    operator: 'isEmpty', value: null, expected: [1, 3],
  },
  {
    name: 'date isNotEmpty', column: DATE_FILTER_COLUMN, rows: assetsWithGaps,
    operator: 'isNotEmpty', value: null, expected: [0, 2],
  },

  // ── boolean ──────────────────────────────────────────────────────────────
  { name: 'boolean isTrue', column: BOOLEAN_FILTER_COLUMN, rows: assets, operator: 'isTrue', value: null, expected: [0, 2] },
  { name: 'boolean isFalse', column: BOOLEAN_FILTER_COLUMN, rows: assets, operator: 'isFalse', value: null, expected: [1, 3] },
];

describe('filtering matrix — non-text filter operators (local mode)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        // Only the pipeline column is asserted: it carries the documented
        // display pipeline, while the typed column exists to decide membership.
        const asserted = [pipelineColumn(pipeline as PipelineName)];

        const check: Check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, asserted);
        };

        for (const scenario of SCENARIOS) {
          it(`${scenario.name} filters and renders the surviving rows`, async () => {
            const rows = scenario.rows();
            table = await makeTable({
              columns: typedColumnsFor(scenario.column, pipeline as PipelineName),
              data: rows,
            });
            // Unfiltered control first: a scenario that never rendered anything
            // would otherwise "pass" its post-filter checkpoint by accident.
            await check(rows);
            table.setColumnFilter(scenario.column.key, scenario.operator, scenario.value);
            await check(scenario.expected.map(i => rows[i]));
            // And the filter is reversible — clearing restores every row.
            table.clearAllFilters();
            await check(rows);
          });
        }
      });
    }
  }
});
