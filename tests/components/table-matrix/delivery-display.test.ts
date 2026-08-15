// Matrix slice: DELIVERY x rendering pipeline, asserted against the text the
// cell actually PAINTS.
//
// delivery-remote / delivery-local assert through matrix-utils' `cellText()`,
// which reads a cell's `value` attribute. This file asserts the same
// `expectedCellText()` oracle against the cell's rendered `[part~="content"]`
// text, so a delivery sequence that leaves a formatted cell blank or stale is
// caught on the painted output too (MATRIX-1, MATRIX-delivery-1: both fixed).
//
// X21 (MATRIX-delivery-2, same-array-reference reassignment) — the painted
// counterpart of delivery-local L8 — is also fixed: `data` opts out of the core
// identity dirty-check locally, so no expected failure remains in this file.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, wait, dataRows } from './matrix-utils';
import {
  PIPELINE_NAMES, pipelineColumn, expectDisplayedCellsMatch,
  makeRow, mutateInPlace, collectPending, type DeliveryRow,
} from './delivery-support';

type Mode = 'local' | 'remote';

/** Push a payload into the table the way the mode delivers data. */
type Apply = (rows: DeliveryRow[]) => Promise<void>;

interface Scenario {
  id: string;
  title: string;
  run: (apply: Apply, table: any) => Promise<DeliveryRow[]>;
  deliveryBug?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'X1',
    title: 'initial delivery paints every cell',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')];
      await apply(rows);
      return rows;
    },
  },
  {
    id: 'X2',
    title: 're-delivery of the identical row objects repaints the same text',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b')];
      await apply(rows);
      await apply([...rows]);
      return rows;
    },
  },
  {
    id: 'X3',
    title: 're-delivery of the same identities plus an appended row',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b')];
      await apply(rows);
      const grown = [...rows, makeRow('c')];
      await apply(grown);
      return grown;
    },
  },
  {
    id: 'X4',
    title: 'mutated re-delivery with fresh row objects repaints the new text',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b')];
      await apply(rows);
      const next = [makeRow('a2'), makeRow('b2')];
      await apply(next);
      return next;
    },
  },
  {
    id: 'X5',
    title: 'mutated re-delivery of the SAME row identity repaints the new text',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b')];
      await apply(rows);
      mutateInPlace(rows[0], 'a2');
      await apply([...rows]);
      return rows;
    },
  },
  {
    id: 'X6',
    title: 'in-place mutation of every delivered row repaints every cell',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')];
      await apply(rows);
      rows.forEach((row, i) => mutateInPlace(row, `m${i}`));
      await apply([...rows]);
      return rows;
    },
  },
  {
    id: 'X7',
    title: 'empty -> rows -> empty -> the same identities repaints every cell',
    run: async (apply, table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await apply([]);
      await apply(rows);
      await apply([]);
      if (dataRows(table).length !== 0) throw new Error('empty payload left rows on screen');
      await apply([...rows]);
      return rows;
    },
  },
  {
    id: 'X8',
    title: 'truncated then permuted re-delivery paints the delivered order',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b'), makeRow('c')];
      await apply(rows);
      const next = [rows[2], rows[0]];
      await apply(next);
      return next;
    },
  },
  {
    id: 'X9',
    // Sequential, not a burst: each `apply` awaits its render. The genuine
    // one-tick cases live in X16 (remote) and X19 (local).
    title: 'a full-replacement payload of a different size paints only the new rows',
    run: async (apply) => {
      const first = [makeRow('a')];
      const last = [makeRow('z1'), makeRow('z2')];
      await apply(first);
      await apply(last);
      return last;
    },
  },
  {
    id: 'X13',
    title: 'an empty payload between deliveries still repaints a mutated identity',
    run: async (apply) => {
      const rows = [makeRow('a'), makeRow('b')];
      await apply(rows);
      await apply([]);
      mutateInPlace(rows[0], 'a2');
      await apply([...rows]);
      return rows;
    },
  },
];

/** Remote-only delivery timings, asserted on painted text. */
const REMOTE_ONLY: Scenario[] = [
  {
    id: 'X10',
    title: 'delayed async response paints once it resolves',
    run: async (_apply, table) => {
      const rows = [makeRow('a'), makeRow('b')];
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        setTimeout(() => e.detail.data.resolve({ data: rows }), 120);
      }, { once: true });
      table.getTableData();
      await wait(30);
      if (dataRows(table).length !== 0) throw new Error('rows painted before the response resolved');
      await wait(220);
      return rows;
    },
  },
  {
    id: 'X11',
    title: 'out-of-order guard: a stale response must not repaint the cells',
    run: async (_apply, table) => {
      const pending = collectPending(table);
      const fresh = [makeRow('fresh1'), makeRow('fresh2')];
      table.getTableData(); await wait(5);
      table.getTableData(); await wait(5);
      if (pending.length !== 2) throw new Error(`expected 2 in-flight requests, got ${pending.length}`);
      pending[1].resolve({ data: fresh });
      await wait(40);
      pending[0].resolve({ data: [makeRow('stale')] });
      await wait(40);
      return fresh;
    },
  },
  {
    id: 'X12',
    title: 'failed reload keeps the painted rows, then a good delivery repaints',
    run: async (_apply, table) => {
      const rows = [makeRow('a')];
      await deliver(table, rows);
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        e.detail.data.reject(new Error('delivery failure'));
      }, { once: true });
      table.getTableData();
      await wait(60);
      if (dataRows(table).length !== 1) throw new Error('failed reload dropped the painted rows');
      const recovered = [makeRow('r1'), makeRow('r2')];
      await deliver(table, recovered);
      return recovered;
    },
  },
  {
    id: 'X14',
    title: 'delayed empty response then a delayed populated one paints the rows',
    run: async (_apply, table) => {
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        setTimeout(() => e.detail.data.resolve({ data: [] }), 80);
      }, { once: true });
      table.getTableData();
      await wait(160);
      if (dataRows(table).length !== 0) throw new Error('empty response painted rows');
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
    id: 'X15',
    title: 'out-of-order guard across three requests resolved 3, 1, 2 paints the third',
    run: async (_apply, table) => {
      const pending = collectPending(table);
      const fresh = [makeRow('third1'), makeRow('third2')];
      table.getTableData(); await wait(4);
      table.getTableData(); await wait(4);
      table.getTableData(); await wait(4);
      if (pending.length !== 3) throw new Error(`expected 3 in-flight requests, got ${pending.length}`);
      pending[2].resolve({ data: fresh }); await wait(30);
      pending[0].resolve({ data: [makeRow('first')] }); await wait(30);
      pending[1].resolve({ data: [makeRow('second')] }); await wait(30);
      return fresh;
    },
  },
  {
    id: 'X16',
    title: 'two getTableData calls in one tick, resolved in issue order, paint the later payload',
    run: async (_apply, table) => {
      const pending = collectPending(table);
      const second = [makeRow('s1'), makeRow('s2')];
      table.getTableData();
      table.getTableData();
      await wait(20);
      if (pending.length !== 2) throw new Error(`expected 2 in-flight requests, got ${pending.length}`);
      pending[0].resolve({ data: [makeRow('f1')] }); await wait(40);
      pending[1].resolve({ data: second }); await wait(40);
      return second;
    },
  },
  {
    id: 'X17',
    title: 'a response carrying totalItems paints every delivered row',
    run: async (_apply, table) => {
      const rows = [makeRow('a'), makeRow('b')];
      await deliver(table, rows, { totalItems: 200 });
      return rows;
    },
  },
];

/** Local-only delivery paths, asserted on painted text. */
const LOCAL_ONLY: Scenario[] = [
  {
    id: 'X18',
    title: 'setData() followed by renderBody() paints the new rows',
    run: async (apply, table) => {
      await apply([makeRow('a')]);
      const next = [makeRow('x'), makeRow('y')];
      table.setData(next);
      table.renderBody();
      await wait(30);
      return next;
    },
  },
  {
    id: 'X19',
    title: 'a burst of reassignments in one tick paints the last payload',
    run: async (apply, table) => {
      await apply([makeRow('a')]);
      const last = [makeRow('l1'), makeRow('l2')];
      table.data = [makeRow('b')];
      table.data = [makeRow('c'), makeRow('d')];
      table.data = last;
      await wait(40);
      return last;
    },
  },
  {
    id: 'X20',
    title: 'switching a painted local table to remote mode repaints the delivered rows',
    run: async (apply, table) => {
      await apply([makeRow('a')]);
      const delivered = [makeRow('r1'), makeRow('r2')];
      table.mode = 'remote';
      await deliver(table, delivered);
      return delivered;
    },
  },
  {
    id: 'X21',
    title: 'reassigning the SAME array reference after mutating its contents repaints [MATRIX-delivery-2]',
    run: async (apply, table) => {
      const rows = [makeRow('a')];
      await apply(rows);
      rows.push(makeRow('b'));
      table.data = rows;
      await wait(30);
      return rows;
    },
  },
];

describe('table matrix / delivery slice / painted cell text', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = undefined; } });

  for (const mode of ['local', 'remote'] as Mode[]) {
    for (const pipeline of PIPELINE_NAMES) {
      describe(`${mode} + ${pipeline}`, () => {
        const scenarios = mode === 'remote'
          ? [...SCENARIOS, ...REMOTE_ONLY]
          : [...SCENARIOS, ...LOCAL_ONLY];

        for (const sc of scenarios) {
          const runner = sc.deliveryBug ? it.fails : it;
          const tag = sc.deliveryBug ? ` [${sc.deliveryBug}]` : '';

          runner(`${sc.id} ${sc.title}${tag}`, async () => {
            const column = pipelineColumn(pipeline);
            table = await makeTable({
              columns: [column],
              data: mode === 'local' ? [] : undefined,
              remote: mode === 'remote',
            });
            const apply: Apply = mode === 'remote'
              ? async (rows) => { await deliver(table, rows); }
              : async (rows) => { table.data = rows; await wait(30); };
            const expected = await sc.run(apply, table);
            expectDisplayedCellsMatch(table, expected, [column]);
          });
        }
      });
    }
  }
});
