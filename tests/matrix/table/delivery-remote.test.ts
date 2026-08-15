// Matrix slice: DELIVERY (remote mode) x rendering pipeline.
//
// Every test drives one remote delivery sequence and then asserts the whole
// rendered body through matrix-utils' oracle (`expectCellsMatch`), which reads
// each cell's `value` attribute via `cellText()`.
//
// Both documented-behaviour divergences this slice pinned are fixed and now
// assert as ordinary tests:
//
//   MATRIX-1            - the cell's `value` attribute carries the DISPLAY
//                         value, so a formatter/valueFormatter column matches
//                         the oracle (table.md: "Formatter/valueFormatter ...
//                         work across Table/declarative/standalone paths").
//                         delivery-display asserts the painted text of the same
//                         combos.
//   MATRIX-delivery-1   - re-delivering a row object mutated IN PLACE (same
//                         identity, changed fields) repaints the recycled <tr>.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, expectCellsMatch, wait, dataRows } from './matrix-utils';
import {
  PIPELINE_NAMES, pipelineColumn,
  makeRow, mutateInPlace, collectPending,
  expectEmptyState, expectLoadErrorState, expectLoadingState,
  type DeliveryRow,
} from './delivery-support';

interface Scenario {
  id: string;
  title: string;
  /** Drives the delivery sequence; returns the rows the body must show. */
  run: (table: any) => Promise<DeliveryRow[]>;
  /**
   * Extra assertion on the zero-row message the final body shows (table.md:
   * loading spinner / `⚠️` load error / empty-state placeholder). Every
   * scenario that ends with no rows declares one, so "no data rows" is never
   * the whole assertion.
   */
  finalState?: (table: any) => void;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'D1',
    title: 'initial delivery renders every delivered row',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')];
      await deliver(table, rows);
      return rows;
    },
  },
  {
    id: 'D2',
    title: 're-delivery of the identical row objects (pure recycle) keeps values',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      await deliver(table, [...rows]);
      return rows;
    },
  },
  {
    id: 'D3',
    title: 're-delivery of same identities plus an appended row',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      const grown = [...rows, makeRow('c')];
      await deliver(table, grown);
      return grown;
    },
  },
  {
    id: 'D4',
    title: 'mutated re-delivery with fresh row objects replaces the values',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      const next = [makeRow('a2'), rows[1]];
      await deliver(table, next);
      return next;
    },
  },
  {
    id: 'D5',
    title: 'mutated re-delivery of the SAME row identity shows the new values',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      mutateInPlace(rows[0], 'a2');
      await deliver(table, rows);
      return rows;
    },
  },
  {
    id: 'D6',
    title: 'mutated re-delivery of the SAME identity, delivered in a new array',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      mutateInPlace(rows[1], 'b2');
      await deliver(table, [rows[0], rows[1]]);
      return rows;
    },
  },
  {
    id: 'D7',
    title: 'in-place mutation combined with an appended row',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      mutateInPlace(rows[0], 'a2');
      const grown = [...rows, makeRow('c')];
      await deliver(table, grown);
      return grown;
    },
  },
  {
    id: 'D8',
    title: 'delayed async response renders once it resolves',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        setTimeout(() => e.detail.data.resolve({ data: rows }), 120);
      }, { once: true });
      table.getTableData();
      await wait(30);
      expectLoadingState(table);
      await wait(220);
      return rows;
    },
  },
  {
    id: 'D9',
    title: 'delayed empty first delivery then a delayed populated delivery',
    run: async (table) => {
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        setTimeout(() => e.detail.data.resolve({ data: [] }), 80);
      }, { once: true });
      table.getTableData();
      await wait(160);
      expectEmptyState(table);
      const rows = [makeRow('a')];
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        setTimeout(() => e.detail.data.resolve({ data: rows }), 80);
      }, { once: true });
      table.getTableData();
      await wait(160);
      return rows;
    },
  },
  {
    id: 'D10',
    title: 'empty -> rows -> empty falls back to the empty state',
    finalState: expectEmptyState,
    run: async (table) => {
      await deliver(table, []);
      expectEmptyState(table);
      await deliver(table, [makeRow('a'), makeRow('b')]);
      if (dataRows(table).length !== 2) throw new Error('populated delivery did not render 2 rows');
      expect(table.shadowRoot.querySelector('tbody td.no-data')).toBeNull();
      await deliver(table, []);
      return [];
    },
  },
  {
    id: 'D11',
    title: 'empty -> rows -> empty -> the same identities again',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, []);
      await deliver(table, rows);
      await deliver(table, []);
      await deliver(table, rows);
      return rows;
    },
  },
  {
    id: 'D12',
    title: 'empty -> rows -> empty -> the same identities mutated in place',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      await deliver(table, []);
      mutateInPlace(rows[0], 'a2');
      await deliver(table, rows);
      return rows;
    },
  },
  {
    id: 'D13',
    title: 'out-of-order guard: stale response resolving last must not clobber',
    run: async (table) => {
      const pending = collectPending(table);
      const stale = [makeRow('stale1'), makeRow('stale2')];
      const fresh = [makeRow('fresh')];
      table.getTableData();
      await wait(5);
      table.getTableData();
      await wait(5);
      if (pending.length !== 2) throw new Error(`expected 2 in-flight requests, got ${pending.length}`);
      pending[1].resolve({ data: fresh });
      await wait(40);
      pending[0].resolve({ data: stale });
      await wait(40);
      return fresh;
    },
  },
  {
    id: 'D14',
    title: 'out-of-order guard across three requests resolved 3, 1, 2',
    run: async (table) => {
      const pending = collectPending(table);
      const fresh = [makeRow('third')];
      table.getTableData(); await wait(4);
      table.getTableData(); await wait(4);
      table.getTableData(); await wait(4);
      if (pending.length !== 3) throw new Error(`expected 3 in-flight requests, got ${pending.length}`);
      pending[2].resolve({ data: fresh });
      await wait(30);
      pending[0].resolve({ data: [makeRow('first')] });
      await wait(30);
      pending[1].resolve({ data: [makeRow('second')] });
      await wait(30);
      return fresh;
    },
  },
  {
    id: 'D15',
    title: 'out-of-order guard: stale response must not resurrect rows after an empty delivery',
    finalState: expectEmptyState,
    run: async (table) => {
      const pending = collectPending(table);
      table.getTableData(); await wait(5);
      table.getTableData(); await wait(5);
      pending[1].resolve({ data: [] });
      await wait(40);
      pending[0].resolve({ data: [makeRow('stale')] });
      await wait(40);
      return [];
    },
  },
  {
    id: 'D16',
    title: 'truncated re-delivery keeps only the delivered identities',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')];
      await deliver(table, rows);
      const kept = [rows[0], rows[2]];
      await deliver(table, kept);
      return kept;
    },
  },
  {
    id: 'D17',
    title: 'permuted re-delivery renders the delivered order',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')];
      await deliver(table, rows);
      const permuted = [rows[2], rows[0], rows[1]];
      await deliver(table, permuted);
      return permuted;
    },
  },
  {
    id: 'D18',
    title: 'failed reload keeps the rows already on screen, then recovers',
    run: async (table) => {
      const rows = [makeRow('a')];
      await deliver(table, rows);
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        e.detail.data.reject(new Error('delivery failure'));
      }, { once: true });
      table.getTableData();
      await wait(60);
      if (dataRows(table).length !== 1) throw new Error('failed reload dropped the existing rows');
      // table.md: the ⚠️ row and the empty state appear "only with no data".
      expect(table.shadowRoot.querySelector('tbody td.no-data')).toBeNull();
      expect(table.classList.contains('table--error')).toBe(true);
      const recovered = [makeRow('b'), makeRow('c')];
      await deliver(table, recovered);
      return recovered;
    },
  },
  {
    id: 'D19',
    title: 'response carrying totalItems still renders every delivered row',
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows, { totalItems: 200 });
      return rows;
    },
  },
  {
    id: 'D20',
    title: 'two getTableData calls in one tick, resolved in issue order, render the later payload',
    run: async (table) => {
      const pending = collectPending(table);
      const first = [makeRow('a')];
      const second = [makeRow('b'), makeRow('c')];
      table.getTableData();
      table.getTableData();
      await wait(20);
      if (pending.length !== 2) throw new Error(`expected 2 in-flight requests, got ${pending.length}`);
      pending[0].resolve({ data: first });
      await wait(40);
      pending[1].resolve({ data: second });
      await wait(40);
      return second;
    },
  },
  {
    id: 'D21',
    title: 'a rejected FIRST delivery shows the ⚠️ load error instead of the empty state',
    finalState: (table) => expectLoadErrorState(table, 'first delivery failed'),
    run: async (table) => {
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        e.detail.data.reject(new Error('first delivery failed'));
      }, { once: true });
      table.getTableData();
      await wait(80);
      return [];
    },
  },
  {
    id: 'D22',
    title: 'a delivery after a rejected FIRST delivery clears the error and renders',
    run: async (table) => {
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        e.detail.data.reject(new Error('first delivery failed'));
      }, { once: true });
      table.getTableData();
      await wait(80);
      expectLoadErrorState(table, 'first delivery failed');
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows);
      expect(table.shadowRoot.querySelector('.table-error-message')).toBeNull();
      expect(table.classList.contains('table--error')).toBe(false);
      return rows;
    },
  },
  {
    id: 'D23',
    title: 'a delayed response resolving after a local data assignment wins as the last writer',
    run: async (table) => {
      const delivered = [makeRow('srv1'), makeRow('srv2')];
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        setTimeout(() => e.detail.data.resolve({ data: delivered }), 120);
      }, { once: true });
      table.getTableData();
      await wait(30);
      // A local assignment lands mid-flight and renders (table.md: `table.data =`
      // rerenders), then the in-flight response arrives and replaces it.
      table.data = [makeRow('local')];
      await wait(30);
      if (dataRows(table).length !== 1) throw new Error('mid-flight local assignment did not render');
      await wait(220);
      return delivered;
    },
  },
  {
    id: 'D24',
    title: 'a stale response rejecting after a good delivery leaves the rows and the error row alone',
    run: async (table) => {
      const pending = collectPending(table);
      const fresh = [makeRow('fresh1'), makeRow('fresh2')];
      table.getTableData(); await wait(5);
      table.getTableData(); await wait(5);
      if (pending.length !== 2) throw new Error(`expected 2 in-flight requests, got ${pending.length}`);
      pending[1].resolve({ data: fresh });
      await wait(40);
      pending[0].reject(new Error('stale failure'));
      await wait(60);
      expect(table.shadowRoot.querySelector('.table-error-message')).toBeNull();
      expect(table.classList.contains('table--error')).toBe(false);
      return fresh;
    },
  },
];

describe('table matrix / delivery slice / remote mode', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = undefined; } });

  for (const pipeline of PIPELINE_NAMES) {
    describe(`pipeline: ${pipeline}`, () => {

      // Every remote combo is an ordinary expectation: both divergences this
      // slice pinned are fixed, so nothing here is an expected failure.
      for (const sc of SCENARIOS) {
        it(`${sc.id} ${sc.title}`, async () => {
          const column = pipelineColumn(pipeline);
          table = await makeTable({ columns: [column], remote: true });
          const expected = await sc.run(table);
          expectCellsMatch(table, expected, [column]);
          sc.finalState?.(table);
        });
      }

      // Teardown race: an in-flight response that lands after the host is
      // removed must still apply cleanly — no throw, no stuck loading state,
      // and the payload it carries is the one the (detached) body holds.
      it('D25 a response resolving after the table is removed applies without throwing', async () => {
        const column = pipelineColumn(pipeline);
        table = await makeTable({ columns: [column], remote: true });
        const pending = collectPending(table);
        table.getTableData();
        await wait(20);
        expect(pending).toHaveLength(1);

        const late = [makeRow('late1'), makeRow('late2')];
        const detached = table;
        removeComponent(table);
        table = undefined;
        expect(detached.isConnected).toBe(false);

        pending[0].resolve({ data: late });
        await wait(120);

        expect(detached.loading).toBe(false);
        expectCellsMatch(detached, late, [column]);
      });
    });
  }
});
