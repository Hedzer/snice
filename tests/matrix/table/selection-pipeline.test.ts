/**
 * Selection slice × value pipeline × delivery.
 *
 * Every combination of
 *   { local, remote } × { selectable+striped, selectable+single+hoverable,
 *                         selectable+none+clickable, selectable+all-of-them,
 *                         selectable+multiple(explicit)+hoverable=false,
 *                         not-selectable+striped+hoverable+clickable }
 *                     × { no pipeline, valueGetter (key is not a row field),
 *                         valueFormatter, valueGetter+valueFormatter,
 *                         formatter, formatter+valueFormatter }
 *                     × { initial delivery, re-delivery (same row identities,
 *                         so the reconciler recycles the row DOM),
 *                         mutated re-delivery }
 * is asserted twice:
 *   1. through the shared matrix oracle (matrix-utils expectCellsMatch), and
 *   2. against the rendered display text of each cell plus the structural
 *      selection invariants (tool column, cell counts, checkbox state) and the
 *      presentational CSS hooks the variant declares.
 *
 * MATRIX-1 / MATRIX-selection-1 (the cell value the oracle reads keeping the
 * pre-format value) and MATRIX-selection-2 (`valueFormatter` overriding the
 * documented `formatter`) are fixed, so every combination asserts directly
 * through the shared oracle — no combination is exempt.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeTable, deliver, expectCellsMatch, wait, type MatrixColumn,
} from './matrix-utils';
import {
  ID_COLUMN, PIPELINES, PIPELINE_KEYS, SELECTION_VARIANTS,
  rows as freshRows, expectedDisplayText, renderedCellText,
  expectSelectionDomConsistent, expectNoBlankCells, expectPresentationHooks,
  dataRowsCount, selectAllCheckbox,
} from './selection-helpers';

type Stage = 'initial' | 're-delivery' | 'mutated re-delivery';
const STAGES: Stage[] = ['initial', 're-delivery', 'mutated re-delivery'];

/** Push rows into the table the way its mode delivers them. */
async function deliverStage(table: any, remote: boolean, rowsIn: any[]) {
  if (remote) {
    await deliver(table, rowsIn);
  } else {
    table.data = rowsIn;
    table.unsortedData = [...rowsIn];
    await wait(40);
  }
}

/** Mutated re-delivery: same row order, new row objects, changed field values
 *  (both the plain field and the getter-sourced field). */
function mutate(rowsIn: any[]): any[] {
  return rowsIn.map((r, i) =>
    i === 0 ? { ...r, name: `${r.name}-2`, companyName: `${r.companyName}-2` } : r);
}

async function buildAndDeliver(pipelineKey: string, variantIndex: number, remote: boolean, stage: Stage) {
  const column = PIPELINES[pipelineKey];
  const variant = SELECTION_VARIANTS[variantIndex];
  const columns: MatrixColumn[] = [ID_COLUMN, column];
  let current = freshRows();

  const table = await makeTable({
    columns,
    data: remote ? undefined : current,
    attrs: { ...variant.attrs },
    remote,
  });
  if (remote) await deliverStage(table, true, current);

  if (stage !== 'initial') {
    // Same identities → the reconciler recycles the existing <tr>s.
    await deliverStage(table, remote, current);
  }
  if (stage === 'mutated re-delivery') {
    current = mutate(current);
    await deliverStage(table, remote, current);
  }

  return { table, columns, column, current, variant };
}

describe('selection × pipeline × delivery — matrix oracle (cell text)', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const remote of [false, true]) {
    const modeName = remote ? 'remote' : 'local';
    for (let v = 0; v < SELECTION_VARIANTS.length; v++) {
      const variant = SELECTION_VARIANTS[v];
      for (const pipelineKey of PIPELINE_KEYS) {
        for (const stage of STAGES) {
          it(`${modeName} | ${variant.name} | ${pipelineKey} | ${stage}`, async () => {
            const built = await buildAndDeliver(pipelineKey, v, remote, stage);
            table = built.table;
            expectCellsMatch(table, built.current, built.columns);
          });
        }
      }
    }
  }
});

describe('selection × pipeline × delivery — rendered display text + selection DOM', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  for (const remote of [false, true]) {
    const modeName = remote ? 'remote' : 'local';
    for (let v = 0; v < SELECTION_VARIANTS.length; v++) {
      const variant = SELECTION_VARIANTS[v];
      for (const pipelineKey of PIPELINE_KEYS) {
        for (const stage of STAGES) {
          it(`${modeName} | ${variant.name} | ${pipelineKey} | ${stage}`, async () => {
            const built = await buildAndDeliver(pipelineKey, v, remote, stage);
            table = built.table;
            const label = `${modeName}/${variant.name}/${pipelineKey}/${stage}`;

            expect(dataRowsCount(table), 'rendered row count').toBe(built.current.length);
            expectSelectionDomConsistent(table, label);
            expectNoBlankCells(table, built.columns, label);
            expectPresentationHooks(table, variant.flags, label);

            // The variant's declared structural consequences, including the
            // non-selectable baseline: presentational attributes alone grow no
            // tool column and no select-all control.
            expect(!!table.shadowRoot.querySelector('thead th.select-column'), 'select column')
              .toBe(variant.hasSelectionColumn);
            expect(!!selectAllCheckbox(table), 'select-all control').toBe(variant.hasSelectAll);
            expect(table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length, 'row checkboxes')
              .toBe(variant.hasSelectionColumn ? built.current.length : 0);

            const seen = built.current.map((_r, i) => renderedCellText(table, i, built.column.key));
            const want = built.current.map(r => expectedDisplayText(built.column, r));
            expect(seen, `${built.column.key} display text`).toEqual(want);

            const ids = built.current.map((_r, i) => renderedCellText(table, i, 'id'));
            expect(ids, 'id column display text').toEqual(built.current.map(r => r.id));
          });
        }
      }
    }
  }
});
