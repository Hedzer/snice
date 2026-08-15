// Filtering slice × LOCAL mode × delivery pipelines × render oracles.
//
// Combination axes:
//   pipeline ∈ { none, valueGetter (key not a row field), valueFormatter,
//                valueGetter+valueFormatter, formatter }
//   oracle   ∈ { value-attribute (shared harness expectCellsMatch),
//                display-text  (text the user actually sees) }
//   scenario ∈ filter/clear/re-delivery sequences below
//
// Oracle in every case: the tbody holds exactly the rows satisfying the filter,
// in data order, and every cell shows the documented display value
// (valueGetter → formatter/valueFormatter → raw).
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, wait } from './matrix-utils';
import {
  PIPELINES, PipelineName, OracleName, columnsFor, oracleFor, people,
  setLocalData, setLocalDataDocumented,
} from './filtering-fixtures';

type Check = (expected: any[]) => Promise<void>;
type MakeLocal = (rows: any[]) => Promise<any>;

interface Scenario {
  name: string;
  /** Set when the scenario diverges from the docs for every pipeline/oracle. */
  knownFail?: string;
  run: (mk: MakeLocal, check: Check) => Promise<void>;
}

const SCENARIOS: Scenario[] = [
  {
    name: 'deliver-then-filter: equals',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      await check(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      await check([rows[0], rows[2], rows[5]]);
    },
  },
  {
    name: 'deliver-then-filter: contains',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'contains', 'sal');
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'deliver-then-filter: notEquals',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'notEquals', 'eng');
      await check([rows[1], rows[3], rows[4]]);
    },
  },
  {
    name: 'deliver-then-filter: startsWith',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'startsWith', 'op');
      await check([rows[3]]);
    },
  },
  {
    name: 'deliver-then-filter: endsWith',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'endsWith', 'les');
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'deliver-then-filter: notContains',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'notContains', 'e');
      await check([rows[3]]);
    },
  },
  {
    name: 'filter-then-deliver: column filter set before data arrives',
    run: async (mk, check) => {
      const table = await mk([]);
      await check([]);
      table.setColumnFilter('dept', 'equals', 'eng');
      const rows = people();
      await setLocalData(table, rows);
      await check([rows[0], rows[2], rows[5]]);
    },
  },
  {
    name: 'filter-then-deliver: quick filter set before data arrives',
    run: async (mk, check) => {
      const table = await mk([]);
      table.setQuickFilter('sales');
      const rows = people();
      await setLocalData(table, rows);
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'quick filter: single term',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setQuickFilter('ops');
      await check([rows[3]]);
    },
  },
  {
    name: 'quick filter: multiple AND terms',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setQuickFilter('sa les');
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'quick filter: OR term logic through setFilterModel',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setFilterModel({
        filters: [], logic: 'and', quickFilter: 'ops sal', quickFilterLogic: 'or',
      });
      await check([rows[1], rows[3], rows[4]]);
    },
  },
  {
    name: 'setFilterModel: column filter AND quick filter',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setFilterModel({
        filters: [{ column: 'dept', operator: 'contains', value: 'e' }],
        logic: 'and',
        quickFilter: 'sales',
        quickFilterLogic: 'and',
      });
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'setFilterModel: OR across two column filters',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setFilterModel({
        filters: [
          { column: 'dept', operator: 'equals', value: 'ops' },
          { column: 'dept', operator: 'equals', value: 'eng' },
        ],
        logic: 'or',
      });
      await check([rows[0], rows[2], rows[3], rows[5]]);
    },
  },
  {
    name: 'setFilterModel replaces a previous model',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setFilterModel({
        filters: [{ column: 'dept', operator: 'equals', value: 'ops' }], logic: 'and',
      });
      await check([rows[3]]);
      table.setFilterModel({
        filters: [{ column: 'dept', operator: 'equals', value: 'sales' }], logic: 'and',
      });
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'narrow then widen re-renders newly matching rows',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      await check([rows[0], rows[2], rows[5]]);
      table.setColumnFilter('dept', 'contains', 'e');
      await check([rows[0], rows[1], rows[2], rows[4], rows[5]]);
    },
  },
  {
    name: 'filter down to zero rows, then widen back',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'legal');
      await check([]);
      table.setColumnFilter('dept', 'equals', 'ops');
      await check([rows[3]]);
    },
  },
  {
    name: 'clearAllFilters restores every row',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      table.setQuickFilter('eng');
      await check([rows[0], rows[2], rows[5]]);
      table.clearAllFilters();
      await check(rows);
    },
  },
  {
    name: 'removeColumnFilter restores every row',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'ops');
      await check([rows[3]]);
      table.removeColumnFilter('dept');
      await check(rows);
    },
  },
  {
    name: 'clearing the quick filter with empty text restores every row',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setQuickFilter('sales');
      await check([rows[1], rows[4]]);
      table.setQuickFilter('');
      await check(rows);
    },
  },
  {
    name: 'clearAllFilters after a filter that matched nothing',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setQuickFilter('nothing-matches-this');
      await check([]);
      table.clearAllFilters();
      await check(rows);
    },
  },
  {
    name: 're-delivery with the same row identities keeps the filtered render',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      await check([rows[0], rows[2], rows[5]]);
      const extra = { id: 7, name: 'Gil', companyName: 'Soylent', dept: 'eng' };
      await setLocalData(table, [...rows, extra]);
      await check([rows[0], rows[2], rows[5], extra]);
    },
  },
  {
    name: 'mutated re-delivery updates recycled cells under an active filter',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      const mutated = rows.map(r =>
        r.id === 3 ? { ...r, name: 'Cyrus', companyName: 'Initech Global' } : r);
      await setLocalData(table, mutated);
      await check([mutated[0], mutated[2], mutated[5]]);
    },
  },
  {
    name: 'in-place row mutation + re-delivery under an active filter',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setQuickFilter('eng');
      await check([rows[0], rows[2], rows[5]]);
      // Same identities, fields changed in place, then a documented re-delivery
      // (`table.data =` rerenders). The reconciler recycles every <tr> and must
      // still refresh the cells it reuses.
      rows[0].name = 'Adalyn';
      rows[0].companyName = 'Acme Holdings';
      rows[5].name = 'Fayette';
      rows[5].companyName = 'Vandelay Industries';
      await setLocalData(table, [...rows]);
      await check([rows[0], rows[2], rows[5]]);
    },
  },
  {
    // MATRIX-filtering-2 control: same mutation + re-delivery, no filter ever
    // set, to show whether filtering is what breaks the refresh.
    name: 'in-place row mutation + re-delivery with no filter (control)',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      await check(rows);
      rows[0].name = 'Adalyn';
      rows[0].companyName = 'Acme Holdings';
      await setLocalData(table, [...rows]);
      await check(rows);
    },
  },
  {
    name: 'mutated re-delivery moves a row out of (and another into) the filter',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      await check([rows[0], rows[2], rows[5]]);
      const mutated = rows.map(r => {
        if (r.id === 3) return { ...r, dept: 'ops' };
        if (r.id === 2) return { ...r, dept: 'eng' };
        return r;
      });
      await setLocalData(table, mutated);
      await check([mutated[0], mutated[1], mutated[5]]);
    },
  },
  {
    name: 're-delivery of a disjoint row set under an active filter',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setQuickFilter('eng');
      await check([rows[0], rows[2], rows[5]]);
      const next = [
        { id: 11, name: 'Hal', companyName: 'Cyberdyne', dept: 'eng' },
        { id: 12, name: 'Ivy', companyName: 'Tyrell', dept: 'ops' },
      ];
      await setLocalData(table, next);
      await check([next[0]]);
    },
  },
  {
    name: 'filter matching nothing, then data containing a match arrives',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'legal');
      await check([]);
      const next = [...rows, { id: 8, name: 'Jo', companyName: 'Weyland', dept: 'legal' }];
      await setLocalData(table, next);
      await check([next[6]]);
    },
  },
  {
    name: 'isEmpty / isNotEmpty on the plain column',
    run: async (mk, check) => {
      const rows = people().map(r => (r.id === 4 ? { ...r, dept: '' } : r));
      const table = await mk(rows);
      table.setColumnFilter('dept', 'isEmpty', null);
      await check([rows[3]]);
      table.setColumnFilter('dept', 'isNotEmpty', null);
      await check([rows[0], rows[1], rows[2], rows[4], rows[5]]);
    },
  },
  // ── The DOCUMENTED re-delivery path, on its own ──────────────────────────
  // setLocalData() also assigns `table.unsortedData`, an internal field that
  // appears nowhere in docs/ai/components/table.md. The public contract is
  // `table.data =` (+ `renderBody()` when unpaired), so the same guarantees are
  // re-asserted here through that path alone — no internal state touched.
  {
    name: 'documented re-delivery only (`table.data =`) under an active filter',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      await check([rows[0], rows[2], rows[5]]);
      const extra = { id: 7, name: 'Gil', companyName: 'Soylent', dept: 'eng' };
      await setLocalDataDocumented(table, [...rows, extra]);
      await check([rows[0], rows[2], rows[5], extra]);
    },
  },
  {
    name: 'documented re-delivery only: in-place mutation repaints the recycled row',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setQuickFilter('eng');
      await check([rows[0], rows[2], rows[5]]);
      // docs/ai:79 — "Rows recycle by identity but repaint when their own field
      // values change, so an in-place patch + re-delivery updates that row".
      rows[0].name = 'Adalyn';
      rows[0].companyName = 'Acme Holdings';
      await setLocalDataDocumented(table, [...rows]);
      await check([rows[0], rows[2], rows[5]]);
    },
  },
  {
    name: 'documented re-delivery only: a disjoint row set replaces the filtered body',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      await check([rows[0], rows[2], rows[5]]);
      const next = [
        { id: 11, name: 'Hal', companyName: 'Cyberdyne', dept: 'eng' },
        { id: 12, name: 'Ivy', companyName: 'Tyrell', dept: 'ops' },
      ];
      await setLocalDataDocumented(table, next);
      await check([next[0]]);
    },
  },
  {
    name: 'filter survives a re-delivery that only reorders the same rows',
    run: async (mk, check) => {
      const rows = people();
      const table = await mk(rows);
      table.setColumnFilter('dept', 'equals', 'eng');
      await check([rows[0], rows[2], rows[5]]);
      const reordered = [rows[5], rows[4], rows[3], rows[2], rows[1], rows[0]];
      await setLocalData(table, reordered);
      await check([rows[5], rows[2], rows[0]]);
    },
  },
];

describe('filtering matrix — local mode', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      // MATRIX-1 / MATRIX-filtering-1 (the runtime cell's `value` attribute
      // keeping the pre-format value) are fixed: the attribute carries the
      // display value, so both oracles agree for every pipeline. No block-wide
      // it.fails remains — every local scenario runs as an ordinary `it`.
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        // Cells that were just created still have to run their own render, so
        // every checkpoint lets the frame settle before asserting. A cell that
        // is still blank/stale afterwards is a real defect, not a race.
        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columnsFor(pipeline as PipelineName));
        };

        const mk: MakeLocal = async (rows: any[]) => {
          table = await makeTable({ columns: columnsFor(pipeline as PipelineName), data: rows });
          return table;
        };

        for (const scenario of SCENARIOS) {
          const runner = scenario.knownFail ? it.fails : it;
          runner(scenario.name, async () => {
            await scenario.run(mk, check);
          });
        }
      });
    }
  }
});
