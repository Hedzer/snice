// Filtering slice: the filter targets the PIPELINE column itself.
//
// Here the pipeline column's key ('city') IS a row field, and the filter term
// ('paris') appears in both the raw value ('Paris HQ') and the getter-derived
// value ('Paris Office'). The expected row set is therefore the same whether or
// not filtering consults valueGetter — the docs only promise that valueGetter
// runs for "cell display, local sorting, and aggregation" — so these tests pin
// the RENDER of a filtered getter/formatter column without depending on
// undocumented filter/getter interaction.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, wait } from './matrix-utils';
import {
  PIPELINES, PipelineName, OracleName, filterRemote, oracleFor, placeColumn,
  placeColumnsFor, places, setLocalData,
} from './filtering-fixtures';

type Check = (expected: any[]) => Promise<void>;

interface Scenario {
  name: string;
  knownFail?: string;
  run: (table: any, check: Check, key: string) => Promise<void>;
}

const LOCAL_SCENARIOS: Scenario[] = [
  {
    name: 'contains on the pipeline column',
    run: async (table, check, key) => {
      const rows = table.data;
      table.setColumnFilter(key, 'contains', 'paris');
      await check([rows[0], rows[2]]);
    },
  },
  {
    name: 'startsWith on the pipeline column',
    run: async (table, check, key) => {
      const rows = table.data;
      table.setColumnFilter(key, 'startsWith', 'paris');
      await check([rows[0], rows[2]]);
    },
  },
  {
    name: 'notContains on the pipeline column',
    run: async (table, check, key) => {
      const rows = table.data;
      table.setColumnFilter(key, 'notContains', 'denver');
      await check([rows[0], rows[1], rows[2]]);
    },
  },
  {
    name: 'isNotEmpty on the pipeline column keeps every row',
    run: async (table, check, key) => {
      const rows = table.data;
      table.setColumnFilter(key, 'isNotEmpty', null);
      await check(rows);
    },
  },
  {
    name: 'quick filter matching the pipeline column',
    run: async (table, check) => {
      const rows = table.data;
      table.setQuickFilter('paris');
      await check([rows[0], rows[2]]);
    },
  },
  {
    name: 'pipeline-column filter combined with a plain-column filter',
    run: async (table, check, key) => {
      const rows = table.data;
      table.setFilterModel({
        filters: [
          { column: 'region', operator: 'equals', value: 'emea' },
          { column: key, operator: 'contains', value: 'lisbon' },
        ],
        logic: 'and',
      });
      await check([rows[1]]);
    },
  },
  {
    name: 'clearAllFilters restores every row',
    run: async (table, check, key) => {
      const rows = table.data;
      table.setColumnFilter(key, 'contains', 'paris');
      await check([rows[0], rows[2]]);
      table.clearAllFilters();
      await check(rows);
    },
  },
  {
    name: 'removeColumnFilter on the pipeline column restores every row',
    run: async (table, check, key) => {
      const rows = table.data;
      table.setColumnFilter(key, 'contains', 'paris');
      await check([rows[0], rows[2]]);
      table.removeColumnFilter(key);
      await check(rows);
    },
  },
  {
    name: 're-delivery under a pipeline-column filter (same identities + a new row)',
    run: async (table, check, key) => {
      const rows = [...table.data];
      table.setColumnFilter(key, 'contains', 'paris');
      await check([rows[0], rows[2]]);
      const extra = { id: 9, city: 'Paris Lab', cityLabel: 'Paris Lab Office', region: 'emea' };
      await setLocalData(table, [...rows, extra]);
      await check([rows[0], rows[2], extra]);
    },
  },
  {
    name: 'mutated re-delivery under a pipeline-column filter',
    run: async (table, check, key) => {
      const rows = [...table.data];
      table.setColumnFilter(key, 'contains', 'paris');
      await check([rows[0], rows[2]]);
      const mutated = rows.map(r =>
        r.id === 1 ? { ...r, city: 'Paris Tower', cityLabel: 'Paris Tower Office' } : r);
      await setLocalData(table, mutated);
      await check([mutated[0], mutated[2]]);
    },
  },
];

describe('filtering matrix — filter on the pipeline column (local)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      // MATRIX-1 / MATRIX-filtering-1 (the runtime cell's `value` attribute
      // keeping the pre-format value) are fixed: the attribute carries the
      // display value, so both oracles agree for every pipeline — no block-wide
      // it.fails remains here.
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        const columns = placeColumnsFor(pipeline as PipelineName);
        const key = placeColumn(pipeline as PipelineName).key;

        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columns);
        };

        for (const scenario of LOCAL_SCENARIOS) {
          const runner = scenario.knownFail ? it.fails : it;
          runner(scenario.name, async () => {
            table = await makeTable({ columns, data: places() });
            await scenario.run(table, check, key);
          });
        }
      });
    }
  }
});

describe('filtering matrix — filter on the pipeline column (remote)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        const columns = placeColumnsFor(pipeline as PipelineName);
        const key = placeColumn(pipeline as PipelineName).key;

        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columns);
        };

        const mk = async () => {
          table = await makeTable({ columns, remote: true });
          return table;
        };

        const runner = it;

        runner('server-filtered delivery for a pipeline-column filter', async () => {
          await mk();
          const rows = places();
          await deliver(table, rows);
          await check(rows);
          await filterRemote(
            table,
            () => table.setColumnFilter(key, 'contains', 'paris'),
            [rows[0], rows[2]],
          );
          await check([rows[0], rows[2]]);
        });

        runner('quick filter, then re-delivery with the same identities', async () => {
          await mk();
          const rows = places();
          await filterRemote(table, () => table.setQuickFilter('paris'), [rows[0], rows[2]]);
          await check([rows[0], rows[2]]);
          await deliver(table, [rows[0], rows[2]]);
          await check([rows[0], rows[2]]);
        });

        runner('mutated re-delivery under a server-side pipeline-column filter', async () => {
          await mk();
          const rows = places();
          await filterRemote(
            table,
            () => table.setColumnFilter(key, 'contains', 'paris'),
            [rows[0], rows[2]],
          );
          const mutated = [
            { ...rows[0], city: 'Paris Tower', cityLabel: 'Paris Tower Office' },
            rows[2],
          ];
          await deliver(table, mutated);
          await check(mutated);
        });

        runner('clearing a pipeline-column filter re-requests the full server set', async () => {
          await mk();
          const rows = places();
          await filterRemote(
            table,
            () => table.setColumnFilter(key, 'contains', 'paris'),
            [rows[0], rows[2]],
          );
          await check([rows[0], rows[2]]);
          await filterRemote(table, () => table.clearAllFilters(), rows);
          await check(rows);
        });

        // MATRIX-filtering-3: the server matched a field the table never
        // received (row 2 has no 'paris' anywhere in its delivered columns), so
        // the client-side re-filter discards it. Scoped to this ONE scenario —
        // the rest of the block runs as ordinary `it`, and the guard below
        // covers the parts of the same sequence that are not the known defect.
        it.fails('server result wider than the client predicate keeps every delivered row', async () => {
          await mk();
          const rows = places();
          await filterRemote(
            table,
            () => table.setQuickFilter('paris'),
            [rows[0], rows[1], rows[2]],
          );
          await check([rows[0], rows[1], rows[2]]);
        });

        it('MATRIX-filtering-3 guard: the rows the predicate does accept still render', async () => {
          await mk();
          const rows = places();
          await filterRemote(
            table,
            () => table.setQuickFilter('paris'),
            [rows[0], rows[1], rows[2]],
          );
          // Only rows[1] ('Lisbon HQ') is dropped by the client re-filter; the
          // two matching rows must still be complete and in order.
          await check([rows[0], rows[2]]);
          // And clearing recovers the full server set.
          await filterRemote(table, () => table.clearAllFilters(), rows);
          await check(rows);
        });
      });
    }
  }
});
