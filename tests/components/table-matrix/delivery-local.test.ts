// Matrix slice: DELIVERY (local mode) x rendering pipeline.
//
// The local-mode counterpart of delivery-remote: instead of a server payload,
// rows arrive through `table.data = ...` / `setData()`. Same oracle
// (`expectCellsMatch` over matrix-utils' `expectedCellText`), same two marked
// divergences:
//
//   MATRIX-1          - FIXED: the cell's `value` attribute carries the display
//                       text; see delivery-display for the painted text.
//   MATRIX-delivery-1 - FIXED: reassigning data whose row objects were mutated
//                       IN PLACE repaints the recycled <tr>.
//   MATRIX-delivery-2 - FIXED: assigning the SAME array reference after
//                       mutating its contents rerenders. `data` opts out of the
//                       core identity dirty-check with `hasChanged: () => true`
//                       so an in-place mutation published by re-assignment is
//                       honoured (see snice-table.ts).
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, expectCellsMatch, wait, dataRows } from './matrix-utils';
import {
  PIPELINE_NAMES, pipelineColumn,
  makeRow, mutateInPlace, expectEmptyState, noDataCell,
  type DeliveryRow,
} from './delivery-support';

interface Scenario {
  id: string;
  title: string;
  /** Seed rows handed to makeTable (local tables render at construction). */
  seed: () => DeliveryRow[];
  run: (table: any, seeded: DeliveryRow[]) => Promise<DeliveryRow[]>;
  /**
   * Extra assertion on the zero-row message the final body shows (table.md:
   * the `empty-state` slot clone or the default "No data" placeholder), so a
   * scenario that ends with no rows asserts more than "no data rows".
   */
  finalState?: (table: any) => void;
  deliveryBug?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'L1',
    title: 'initial local data renders every row',
    seed: () => [makeRow('a'), makeRow('b'), makeRow('c')],
    run: async (_table, seeded) => seeded,
  },
  {
    id: 'L2',
    title: 'reassigning a new array of the SAME row objects keeps the values',
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table, seeded) => {
      table.data = [...seeded];
      await wait(30);
      return seeded;
    },
  },
  {
    id: 'L3',
    title: 'reassigning the same identities plus an appended row',
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table, seeded) => {
      const grown = [...seeded, makeRow('c')];
      table.data = grown;
      await wait(30);
      return grown;
    },
  },
  {
    id: 'L4',
    title: 'reassigning entirely fresh row objects replaces the values',
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table) => {
      const next = [makeRow('x'), makeRow('y'), makeRow('z')];
      table.data = next;
      await wait(30);
      return next;
    },
  },
  {
    id: 'L5',
    title: 'reassigning after mutating a row IN PLACE shows the new values',
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table, seeded) => {
      mutateInPlace(seeded[0], 'a2');
      table.data = [...seeded];
      await wait(30);
      return seeded;
    },
  },
  {
    id: 'L6',
    title: 'in-place mutation of every row, reassigned as a new array',
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table, seeded) => {
      seeded.forEach((row, i) => mutateInPlace(row, `m${i}`));
      table.data = [...seeded];
      await wait(30);
      return seeded;
    },
  },
  {
    id: 'L7',
    title: 'in-place mutation plus an appended row',
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table, seeded) => {
      mutateInPlace(seeded[1], 'b2');
      const grown = [...seeded, makeRow('c')];
      table.data = grown;
      await wait(30);
      return grown;
    },
  },
  {
    id: 'L8',
    title: 'reassigning the SAME array reference after mutating its contents rerenders [MATRIX-delivery-2]',
    seed: () => [makeRow('a')],
    run: async (table, seeded) => {
      seeded.push(makeRow('b'));
      table.data = seeded;
      await wait(30);
      return seeded;
    },
  },
  {
    id: 'L9',
    title: 'rows -> empty falls back to the empty state',
    finalState: expectEmptyState,
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table) => {
      table.data = [];
      await wait(30);
      return [];
    },
  },
  {
    id: 'L10',
    title: 'empty -> rows -> empty falls back to the empty state',
    finalState: expectEmptyState,
    seed: () => [],
    run: async (table) => {
      expectEmptyState(table);
      table.data = [makeRow('a')];
      await wait(30);
      if (dataRows(table).length !== 1) throw new Error('populated assignment did not render');
      expect(noDataCell(table)).toBeNull();
      table.data = [];
      await wait(30);
      return [];
    },
  },
  {
    id: 'L11',
    title: 'empty -> rows -> empty -> the same identities again',
    seed: () => [],
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      table.data = rows;
      await wait(30);
      table.data = [];
      await wait(30);
      table.data = [...rows];
      await wait(30);
      return rows;
    },
  },
  {
    id: 'L12',
    title: 'empty -> rows -> empty -> the same identities mutated in place',
    seed: () => [],
    run: async (table) => {
      const rows = [makeRow('a'), makeRow('b')];
      table.data = rows;
      await wait(30);
      table.data = [];
      await wait(30);
      mutateInPlace(rows[0], 'a2');
      table.data = [...rows];
      await wait(30);
      return rows;
    },
  },
  {
    id: 'L13',
    title: 'setData() followed by renderBody() renders the new rows',
    seed: () => [makeRow('a')],
    run: async (table) => {
      const next = [makeRow('x'), makeRow('y')];
      table.setData(next);
      table.renderBody();
      await wait(30);
      return next;
    },
  },
  {
    id: 'L14',
    title: 'setData() with the same identities mutated in place, then renderBody()',
    seed: () => [makeRow('a'), makeRow('b')],
    run: async (table, seeded) => {
      mutateInPlace(seeded[0], 'a2');
      table.setData([...seeded]);
      table.renderBody();
      await wait(30);
      return seeded;
    },
  },
  {
    id: 'L15',
    title: 'a burst of reassignments in one tick renders the last payload',
    seed: () => [makeRow('a')],
    run: async (table) => {
      const last = [makeRow('l1'), makeRow('l2')];
      table.data = [makeRow('b')];
      table.data = [makeRow('c'), makeRow('d')];
      table.data = last;
      await wait(40);
      return last;
    },
  },
  {
    id: 'L16',
    title: 'reassignment to a permuted array of the same identities',
    seed: () => [makeRow('a'), makeRow('b'), makeRow('c')],
    run: async (table, seeded) => {
      const permuted = [seeded[2], seeded[0], seeded[1]];
      table.data = permuted;
      await wait(30);
      return permuted;
    },
  },
  {
    id: 'L17',
    title: 'reassignment to a truncated subset of the same identities',
    seed: () => [makeRow('a'), makeRow('b'), makeRow('c')],
    run: async (table, seeded) => {
      const kept = [seeded[0], seeded[2]];
      table.data = kept;
      await wait(30);
      return kept;
    },
  },
  {
    id: 'L18',
    title: 'switching a rendered local table to remote mode and delivering rows',
    seed: () => [makeRow('a')],
    run: async (table) => {
      const delivered = [makeRow('r1'), makeRow('r2')];
      table.mode = 'remote';
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        e.detail.data.resolve({ data: delivered });
      }, { once: true });
      table.getTableData();
      await wait(60);
      return delivered;
    },
  },
];

describe('table matrix / delivery slice / local mode', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = undefined; } });

  for (const pipeline of PIPELINE_NAMES) {
    describe(`pipeline: ${pipeline}`, () => {

      for (const sc of SCENARIOS) {
        const runner = sc.deliveryBug ? it.fails : it;
        const tag = sc.deliveryBug ? ` [${sc.deliveryBug}]` : '';

        runner(`${sc.id} ${sc.title}${tag}`, async () => {
          const column = pipelineColumn(pipeline);
          const seeded = sc.seed();
          table = await makeTable({ columns: [column], data: seeded });
          const expected = await sc.run(table, seeded);
          expectCellsMatch(table, expected, [column]);
          sc.finalState?.(table);
        });
      }

      // table.md: the empty state is "cloned into the shadow body on EACH
      // zero-row render", so emptying a second time must not reuse the node
      // left over from the first.
      it('L19 every zero-row render builds a fresh empty state', async () => {
        const column = pipelineColumn(pipeline);
        table = await makeTable({ columns: [column], data: [makeRow('a')] });
        table.data = [];
        await wait(30);
        expectEmptyState(table);
        const first = noDataCell(table)!.querySelector('snice-empty-state');

        table.data = [makeRow('b')];
        await wait(30);
        expect(dataRows(table)).toHaveLength(1);

        table.data = [];
        await wait(30);
        expectEmptyState(table);
        const second = noDataCell(table)!.querySelector('snice-empty-state');
        expect(second).not.toBe(first);
      });

      // table.md: a slotted `empty-state` is only a template — the zero-row
      // body shows a clone of it instead of the default "No data" placeholder.
      it('L20 a slotted empty-state template is cloned instead of the default placeholder', async () => {
        const column = pipelineColumn(pipeline);
        table = await makeTable({ columns: [column], data: [makeRow('a')] });
        const slotted = document.createElement('div');
        slotted.setAttribute('slot', 'empty-state');
        slotted.className = 'custom-empty';
        slotted.textContent = 'Nothing delivered yet';
        table.appendChild(slotted);

        table.data = [];
        await wait(30);

        expect(dataRows(table)).toHaveLength(0);
        const clone = noDataCell(table)!.querySelector('.custom-empty') as HTMLElement | null;
        expect(clone, 'slotted empty-state was not cloned into the body').not.toBeNull();
        expect(clone!.textContent).toBe('Nothing delivered yet');
        expect(clone).not.toBe(slotted);
        expect(noDataCell(table)!.querySelector('snice-empty-state')).toBeNull();
      });
    });
  }
});
