// Height-fill slice × delivery × value pipeline × delivery phase.
//
// A table with an explicit host height taller than its rows grows an inert
// filler row (`tr.table-fill-row`, see `updateFillRow()` in snice-table.ts).
// This file asserts that the filler never changes what the DATA rows show and
// never becomes one of them, across every combination of:
//   delivery : local | remote
//   pipeline : none | valueGetter (key is NOT a row field) | valueFormatter
//              | valueGetter+valueFormatter | formatter | valueGetter+formatter
//   phase    : initial delivery
//              | re-delivery, same row identities (reconciler recycles the <tr>s)
//              | mutated re-delivery, same identities + changed field values
//              | mutated re-delivery, fresh identities (what a real server sends)
//
// MATRIX-1 (valueFormatter, the documented fallback display formatter, not
// reaching the rendered cell value) and MATRIX-height-fill-1 (in-place mutated
// rows keeping their pre-mutation text) are both fixed, so every combination
// asserts as an ordinary test.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, expectCellsMatch, wait } from './matrix-utils';
import type { MatrixColumn } from './matrix-utils';
import {
  TALL, stubLayout, columnsFor, makeRows, mutateInPlace, setLocalData,
  pipelines, deliveries, expectFillRowContract, expectFillNotCountedAsData,
  expectDisplayedCellsMatch,
} from './height-fill-support';

type Mode = 'local' | 'remote';
type Phase =
  | 'initial delivery'
  | 're-delivery (same identities)'
  | 'mutated re-delivery (same identities)'
  | 'mutated re-delivery (fresh identities)';

const phases: Phase[] = [
  'initial delivery',
  're-delivery (same identities)',
  'mutated re-delivery (same identities)',
  'mutated re-delivery (fresh identities)',
];

// MATRIX-height-fill-1 (fixed): an in-place value change on already-rendered
// rows used to go unpainted — the render-path reconciler's row signature
// carried no cell values, so the recycled <tr> kept its stale text even though
// renderBody() ran. Documented contract: "`table.columns =`/`table.data =`
// rerender; setData() is non-eager, so call renderBody() when unpaired"
// (docs/ai/components/table.md). This phase does both, so the repaint is
// required and every cell below is asserted as an ordinary `it`.
//
// NOTE ON SCOPE: this phase re-assigns `table.data` AND calls renderBody(), so
// it does not isolate the same-reference question (MATRIX-delivery-2: whether a
// bare same-reference `table.data =` re-renders on its own). That is now settled
// — it does — and is covered in delivery-local L8 / delivery-display X21.
const MUTATED_SAME_IDENTITY: Phase = 'mutated re-delivery (same identities)';

let table: any;
afterEach(() => { if (table) { removeComponent(table); table = undefined; } });

/** Build a tall-host table, deliver rows, then advance it to `phase`. */
async function arrange(mode: Mode, columns: MatrixColumn[], phase: Phase) {
  let rows = makeRows();
  table = mode === 'remote'
    ? await makeTable({ columns, remote: true, height: '600px' })
    : await makeTable({ columns, data: rows, height: '600px' });

  stubLayout(table, TALL.frame, TALL.table);

  const render = async (next: any[]) => {
    if (mode === 'remote') await deliver(table, next);
    else { setLocalData(table, next); table.renderBody(); await wait(20); }
  };

  await render(rows);
  if (phase === 're-delivery (same identities)') {
    await render(rows);
  } else if (phase === MUTATED_SAME_IDENTITY) {
    await render(rows);
    mutateInPlace(rows);
    await render(rows);
  } else if (phase === 'mutated re-delivery (fresh identities)') {
    await render(rows);
    rows = mutateInPlace(makeRows().map((r, i) => ({ ...rows[i], ...r })));
    await render(rows);
  }
  return rows;
}

for (const mode of deliveries) {
  for (const pipeline of pipelines) {
    for (const phase of phases) {
      describe(`height fill · ${mode} · ${pipeline.name} · ${phase}`, () => {
        // Two oracles over the same combo, and they are not redundant: the
        // display test reads the painted text out of the cell's shadow root,
        // the attribute test reads the `value` attribute the table stamps on
        // the cell element. They agreed on every pipeline when this was last
        // probed; a divergence would mean the DOM and the paint disagree.
        const displayTest = it;
        const attrTest = it;

        displayTest('rendered cell text equals the documented display value', async () => {
          const rows = await arrange(mode, columnsFor(pipeline), phase);
          expectDisplayedCellsMatch(table, rows);
        });

        attrTest('the cell value attribute agrees with the documented value', async () => {
          const rows = await arrange(mode, columnsFor(pipeline), phase);
          expectCellsMatch(table, rows);
        });

        it('a fill row is appended and satisfies the filler contract', async () => {
          await arrange(mode, columnsFor(pipeline), phase);
          expectFillRowContract(table, TALL.leftover);
        });

        it('the fill row is never counted as a data row', async () => {
          const rows = await arrange(mode, columnsFor(pipeline), phase);
          expectFillNotCountedAsData(table, rows.length);
        });
      });
    }
  }
}
