// Filtering slice × REMOTE mode × delivery pipelines × render oracles.
//
// Documented contract (docs/components/table.md): "In local mode, sorting and
// filtering use `data`. In remote mode, search, filter, sort, and server-page
// changes request `table/data`" and the response `{data,totalItems?}` is what
// the table shows. So in remote mode the SERVER decides the row set: every
// delivered row must render, with the documented display value, whether or not
// it would satisfy the client-side filter predicate.
//
// Axes: pipeline × oracle × { initial delivery, re-delivery (same identities),
// mutated re-delivery, filter-then-deliver, deliver-then-filter, clearing }.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, wait } from './matrix-utils';
import {
  PIPELINES, PipelineName, OracleName, columnsFor, filterRemote, oracleFor,
  people, pipelineColumn,
} from './filtering-fixtures';

type Check = (expected: any[]) => Promise<void>;
type MakeRemote = () => Promise<any>;

interface Scenario {
  name: string;
  /**
   * Divergence from the documented contract for every pipeline/oracle. Set per
   * SCENARIO, never per describe block: a block-wide `it.fails` would absorb an
   * unrelated regression (a dropped row, a blank cell) in every scenario it
   * covers. Each entry below is paired with a plain `it` guard that asserts the
   * parts of the same sequence which do work, so the known defect cannot hide
   * a new one.
   */
  knownFail?: string;
  run: (mk: MakeRemote, check: Check, pipeline: PipelineName) => Promise<void>;
}

const SCENARIOS: Scenario[] = [
  {
    name: 'initial delivery with no filter renders every delivered row',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await deliver(table, rows);
      await check(rows);
    },
  },
  {
    name: 'filter-then-deliver: quick filter set before any data arrives',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      // The server answers the filter request with its own (already filtered)
      // result set; those rows are the display set.
      await filterRemote(table, () => table.setQuickFilter('sales'), [rows[1], rows[4]]);
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'filter-then-deliver: column filter set before any data arrives',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(
        table,
        () => table.setColumnFilter('dept', 'equals', 'eng'),
        [rows[0], rows[2], rows[5]],
      );
      await check([rows[0], rows[2], rows[5]]);
    },
  },
  {
    name: 'deliver-then-filter: quick filter after an unfiltered delivery',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await deliver(table, rows);
      await check(rows);
      await filterRemote(table, () => table.setQuickFilter('sales'), [rows[1], rows[4]]);
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'deliver-then-filter: column filter after an unfiltered delivery',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await deliver(table, rows);
      await filterRemote(
        table,
        () => table.setColumnFilter('dept', 'equals', 'ops'),
        [rows[3]],
      );
      await check([rows[3]]);
    },
  },
  {
    name: 'deliver-then-filter: setFilterModel after an unfiltered delivery',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await deliver(table, rows);
      await filterRemote(
        table,
        () => table.setFilterModel({
          filters: [{ column: 'dept', operator: 'equals', value: 'sales' }],
          logic: 'and',
          quickFilter: 'sales',
          quickFilterLogic: 'and',
        }),
        [rows[1], rows[4]],
      );
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'column filter on the pipeline column itself',
    knownFail: 'MATRIX-filtering-3',
    run: async (mk, check, pipeline) => {
      const table = await mk();
      const rows = people();
      await deliver(table, rows);
      const key = pipelineColumn(pipeline).key;
      // The server resolves the filter against its own schema and returns two
      // rows; both must render.
      await filterRemote(
        table,
        () => table.setColumnFilter(key, 'contains', 'a'),
        [rows[0], rows[3]],
      );
      await check([rows[0], rows[3]]);
    },
  },
  {
    name: 'quick filter whose server result does not satisfy the client predicate',
    knownFail: 'MATRIX-filtering-3',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await deliver(table, rows);
      // A realistic server search matches fields the table never received
      // (employee code, notes, …), so the returned rows contain the term
      // nowhere in the delivered columns. Remote filtering is the server's
      // answer: all three rows must render.
      await filterRemote(
        table,
        () => table.setQuickFilter('q7-code'),
        [rows[0], rows[2], rows[5]],
      );
      await check([rows[0], rows[2], rows[5]]);
    },
  },
  {
    name: 're-delivery with the same row identities under an active filter',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(table, () => table.setQuickFilter('eng'), [rows[0], rows[2]]);
      await check([rows[0], rows[2]]);
      // Same objects again (the reconciler recycles their <tr>s) plus a new one.
      await deliver(table, [rows[0], rows[2], rows[5]]);
      await check([rows[0], rows[2], rows[5]]);
    },
  },
  {
    name: 'mutated re-delivery under an active filter',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(table, () => table.setQuickFilter('eng'), [rows[0], rows[2], rows[5]]);
      await check([rows[0], rows[2], rows[5]]);
      const mutated = [
        { ...rows[0], name: 'Adalyn', companyName: 'Acme Holdings' },
        rows[2],
        { ...rows[5], name: 'Fayette', companyName: 'Vandelay Industries' },
      ];
      await deliver(table, mutated);
      await check(mutated);
    },
  },
  {
    name: 'a second filter change re-requests and renders the new server set',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(table, () => table.setColumnFilter('dept', 'equals', 'eng'),
        [rows[0], rows[2], rows[5]]);
      await check([rows[0], rows[2], rows[5]]);
      await filterRemote(table, () => table.setColumnFilter('dept', 'equals', 'sales'),
        [rows[1], rows[4]]);
      await check([rows[1], rows[4]]);
    },
  },
  {
    name: 'clearAllFilters re-requests and renders the full server set',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(table, () => table.setColumnFilter('dept', 'equals', 'ops'), [rows[3]]);
      await check([rows[3]]);
      await filterRemote(table, () => table.clearAllFilters(), rows);
      await check(rows);
    },
  },
  {
    name: 'removeColumnFilter re-requests and renders the full server set',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(table, () => table.setColumnFilter('dept', 'equals', 'ops'), [rows[3]]);
      await check([rows[3]]);
      await filterRemote(table, () => table.removeColumnFilter('dept'), rows);
      await check(rows);
    },
  },
  {
    name: 'clearing the quick filter re-requests and renders the full server set',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(table, () => table.setQuickFilter('ops'), [rows[3]]);
      await check([rows[3]]);
      await filterRemote(table, () => table.setQuickFilter(''), rows);
      await check(rows);
    },
  },
  {
    name: 'server returns an empty result set for the filter',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await deliver(table, rows);
      // Positive checkpoint first: without it the zero-row assertion below
      // would also hold for a table that never rendered anything at all.
      await check(rows);
      await filterRemote(table, () => table.setQuickFilter('legal'), []);
      await check([]);
      // …and the body comes back, so "empty" was the filter's doing, not a
      // permanently broken render.
      await filterRemote(table, () => table.clearAllFilters(), rows);
      await check(rows);
    },
  },
  {
    name: 'filtered delivery, then the filter is cleared before the rows arrive',
    run: async (mk, check) => {
      const table = await mk();
      const rows = people();
      await filterRemote(table, () => table.setQuickFilter('ops'), [rows[3]]);
      await check([rows[3]]);
      // Clearing re-requests; the server replies with everything.
      await filterRemote(table, () => table.clearAllFilters(), rows);
      await check(rows);
      // And a plain re-delivery of the same identities keeps them rendered.
      await deliver(table, rows);
      await check(rows);
    },
  },
];

describe('filtering matrix — remote mode', () => {
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
      // it.fails remains anywhere in this slice.
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columnsFor(pipeline as PipelineName));
        };

        const mk: MakeRemote = async () => {
          table = await makeTable({ columns: columnsFor(pipeline as PipelineName), remote: true });
          return table;
        };

        for (const scenario of SCENARIOS) {
          // MATRIX-filtering-3: remote mode re-filters the server's response
          // client-side, dropping delivered rows.
          const runner = scenario.knownFail ? it.fails : it;
          runner(scenario.name, async () => {
            await scenario.run(mk, check, pipeline as PipelineName);
          });
        }

        // ── Guards for the two MATRIX-filtering-3 scenarios above ──────────
        // `it.fails` only promises "something threw". These assert everything
        // in the same sequence that is NOT the known defect, so a regression
        // inside those combos surfaces here instead of being absorbed.
        it('MATRIX-filtering-3 guard: the pre-filter delivery renders in full', async () => {
          await mk();
          const rows = people();
          await deliver(table, rows);
          await check(rows);
        });

        it('MATRIX-filtering-3 guard: the filter reaches the request payload', async () => {
          await mk();
          const rows = people();
          await deliver(table, rows);
          const key = pipelineColumn(pipeline as PipelineName).key;

          const payloads: any[] = [];
          table.addEventListener('@request/table/data', (e: any) => {
            payloads.push(e.detail.payload);
            e.detail.discovery.resolve();
            e.detail.data.resolve({ data: [rows[0], rows[3]] });
          }, { once: true });

          table.setColumnFilter(key, 'contains', 'a');
          await wait(300);

          expect(payloads).toHaveLength(1);
          expect(payloads[0].filter.filters).toEqual([
            { column: key, operator: 'contains', value: 'a' },
          ]);
        });

        it('MATRIX-filtering-3 guard: clearing the filter restores the full server set', async () => {
          await mk();
          const rows = people();
          await deliver(table, rows);
          await filterRemote(table, () => table.setQuickFilter('q7-code'),
            [rows[0], rows[2], rows[5]]);
          // The known defect empties the body here; the recovery path is what
          // this guard pins, and it must keep working.
          await filterRemote(table, () => table.clearAllFilters(), rows);
          await check(rows);
        });
      });
    }
  }
});

describe('filtering matrix — remote request payload', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    it(`sends the filter model and search text with the data request (${pipeline})`, async () => {
      table = await makeTable({ columns: columnsFor(pipeline as PipelineName), remote: true });
      const payloads: any[] = [];
      table.addEventListener('@request/table/data', (e: any) => {
        payloads.push(e.detail.payload);
        e.detail.discovery.resolve();
        e.detail.data.resolve({ data: people() });
      });

      // Every documented payload field carries a distinguishable value, so the
      // assertions below cannot pass on presence alone (`search: undefined`,
      // `sort: []`, `selector: ''` would all have satisfied a toHaveProperty).
      table.searchText = 'bob';
      table.selector = 'eng,ops';
      table.currentSort = [{ column: 'dept', direction: 'desc' }];
      await wait(300);

      table.setColumnFilter('dept', 'equals', 'eng');
      await wait(300);
      table.setQuickFilter('acme');
      await wait(300);

      // Each filter mutation re-requests, so the model is not merely readable
      // at the end — it reached the wire.
      expect(payloads.length).toBeGreaterThanOrEqual(3);
      const last = payloads[payloads.length - 1];
      expect(last.filter).toEqual({
        filters: [{ column: 'dept', operator: 'equals', value: 'eng' }],
        logic: 'and',
        quickFilter: 'acme',
      });
      expect(last.search).toBe('bob');
      expect(last.sort).toEqual([{ column: 'dept', direction: 'desc' }]);
      expect(last.selector).toBe('eng,ops');
      // docs/ai:107 — `page`/`pageSize` ride the payload only with pagination on.
      expect(last.page).toBeUndefined();
      expect(last.pageSize).toBeUndefined();

      // The payload tracks the model rather than snapshotting the first request.
      table.clearAllFilters();
      await wait(300);
      expect(payloads[payloads.length - 1].filter).toEqual({
        filters: [], logic: 'and', quickFilter: undefined,
      });
    });
  }
});
