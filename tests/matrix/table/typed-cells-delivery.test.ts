// typed-cells slice, axis 2: delivery lifecycle.
//
// Initial delivery vs re-delivery of the SAME row identities (the render-path
// reconciler recycles those rows' DOM) vs mutated re-delivery, crossed with
// local/remote mode and the value pipeline.
//
// 9 types x 6 pipelines x 2 modes x 3 delivery shapes = 324 combinations. The
// audit found this axis running only 3 of the pipelines (formatter and
// valueFormatter-only were dropped), so it now crosses the full pipeline list.
// All 324 are plain `it`, each asserted twice: through this slice's
// `assertTypedCell` and through the shared matrix oracle `expectCellsMatch`.
//
// Doc basis (docs/ai/components/table.md):
//   :79  "`table.columns =`/`table.data =` rerender"; "Rows recycle by identity
//        but repaint when their own field values change, so an in-place patch +
//        re-delivery updates that row"
//   :89  "`getTableData()` - request/apply current rows"
//   :90  "`renderBody()` - render display model"
//   :55  valueGetter "runs for display, sort, aggregation"; valueFormatter
//   :81  the display pipeline and the cell `value` contract
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, dataRows, expectCellsMatch, wait } from './matrix-utils';
import {
  TYPE_SPECS, PIPELINES, buildColumn, assertTypedCell, tdFor,
} from './typed-cells-support';

const MODES = ['local', 'remote'] as const;

describe('typed-cells x delivery lifecycle', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  /** Push rows into an already-mounted table for the given mode. */
  async function push(t: any, rows: any[], mode: 'local' | 'remote') {
    if (mode === 'remote') {
      // table.md:89 — getTableData() requests and applies the current rows.
      await deliver(t, rows);
      return;
    }
    // table.md:79 / :90 — assigning `data` rerenders; renderBody() renders the
    // display model.
    t.unsortedData = [...rows];
    t.data = rows;
    await wait(10);
    t.renderBody();
    await wait(20);
  }

  async function mount(column: any, rows: any[], mode: 'local' | 'remote') {
    if (mode === 'local') return makeTable({ columns: [column], data: rows });
    const t = await makeTable({ columns: [column], remote: true });
    await deliver(t, rows);
    return t;
  }

  for (const spec of TYPE_SPECS) {
    for (const pipeline of PIPELINES) {
      for (const mode of MODES) {
        const label = `${spec.type} / ${pipeline} / ${mode}`;

        it(`${label}: re-delivering the same row identities keeps every cell rendered`, async () => {
          const column = buildColumn(spec, pipeline);
          const first = [
            { id: 1, [spec.field]: spec.value },
            { id: 2, [spec.field]: spec.value2 },
          ];
          table = await mount(column, first, mode);
          assertTypedCell(tdFor(table, 0, column.key), spec, pipeline, spec.value);
          assertTypedCell(tdFor(table, 1, column.key), spec, pipeline, spec.value2);

          // Same row objects again (the reconciler reuses their <tr>s) plus a
          // new one, so recycled and freshly built rows are asserted together.
          const third = { id: 3, [spec.field]: spec.value };
          await push(table, [...first, third], mode);

          expect(dataRows(table)).toHaveLength(3);
          assertTypedCell(tdFor(table, 0, column.key), spec, pipeline, spec.value);
          assertTypedCell(tdFor(table, 1, column.key), spec, pipeline, spec.value2);
          assertTypedCell(tdFor(table, 2, column.key), spec, pipeline, spec.value);
          // Same rows through the shared matrix oracle (matrix-utils).
          expectCellsMatch(table, [...first, third], [column]);
        });

        it(`${label}: mutated re-delivery (new row objects) renders the new values`, async () => {
          const column = buildColumn(spec, pipeline);
          const first = [
            { id: 1, [spec.field]: spec.value },
            { id: 2, [spec.field]: spec.value2 },
          ];
          table = await mount(column, first, mode);
          assertTypedCell(tdFor(table, 0, column.key), spec, pipeline, spec.value);

          // Same logical rows, fresh objects, swapped values.
          const mutated = [
            { ...first[0], [spec.field]: spec.value2 },
            { ...first[1], [spec.field]: spec.value },
          ];
          await push(table, mutated, mode);

          expect(dataRows(table)).toHaveLength(2);
          assertTypedCell(tdFor(table, 0, column.key), spec, pipeline, spec.value2);
          assertTypedCell(tdFor(table, 1, column.key), spec, pipeline, spec.value);
          expectCellsMatch(table, mutated, [column]);
        });

        // MATRIX-typed-cells-1 (fixed): when the delivered rows are the SAME
        // objects that are already on screen and their fields were mutated in
        // place, the render-path reconciler repaints them — in local and remote
        // mode alike, with or without a value pipeline. table.md:79: "Rows
        // recycle by identity but repaint when their own field values change,
        // so an in-place patch + re-delivery updates that row"; table.md:89
        // ("apply current rows") and table.md:90 ("render display model").
        it(`${label}: re-delivery of in-place mutated rows renders the current values`, async () => {
          const column = buildColumn(spec, pipeline);
          const rows = [
            { id: 1, [spec.field]: spec.value },
            { id: 2, [spec.field]: spec.value2 },
          ];
          table = await mount(column, rows, mode);
          assertTypedCell(tdFor(table, 0, column.key), spec, pipeline, spec.value);

          // Row identities survive, their contents do not. table.md:89 says
          // getTableData() applies the CURRENT rows and table.md:90 says
          // renderBody() renders the display model, so the rendered cells must
          // track the values that were just delivered.
          rows[0][spec.field] = spec.value2;
          rows[1][spec.field] = spec.value;
          await push(table, rows, mode);

          expect(dataRows(table)).toHaveLength(2);
          assertTypedCell(tdFor(table, 0, column.key), spec, pipeline, spec.value2);
          assertTypedCell(tdFor(table, 1, column.key), spec, pipeline, spec.value);
          expectCellsMatch(table, rows, [column]);
        });
      }
    }
  }
});
