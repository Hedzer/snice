// typed-cells slice, axis 1: every typed cell type crossed with every
// value-pipeline shape, in both local and remote delivery mode.
//
// 9 types x 6 pipelines x 2 modes = 108 combinations, each asserting the exact
// documented rendering: which cell element the table built, its alignment, the
// `value` property and attribute, and the rendered `content` part (see
// typed-cells-support.ts). Every combination is then re-asserted through the
// SHARED matrix oracle (matrix-utils `expectCellsMatch`), so this slice cannot
// pass under a private reading of the display pipeline. 108 pipeline + 54
// local/remote parity + 108 shared-oracle = 270 combinations, all plain `it`.
//
// Doc basis (docs/ai/components/table.md):
//   :50  ColumnType enumeration (number|currency|date|boolean|status|tag|
//        progress|rating|link are all first-class column types)
//   :55  formatter / valueGetter ("runs for display, sort, aggregation") /
//        valueFormatter
//   :81  "Formatter/valueFormatter ... all declared format aliases ... work
//        across Table/declarative/standalone paths"
//   :107 remote `table/data` response `{data,totalItems?}`; the automatic
//        initial request requires mode="remote"
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, dataRows, expectCellsMatch } from './matrix-utils';
import {
  TYPE_SPECS, PIPELINES, buildColumn, assertTypedCell, rowFor, tdFor,
  displayText, contentMarkup, cellHost,
} from './typed-cells-support';

const MODES = ['local', 'remote'] as const;

/** Mount one row for a column in the requested mode (table.md:107 for remote). */
async function mountRow(column: any, row: any, mode: 'local' | 'remote') {
  if (mode === 'local') return makeTable({ columns: [column], data: [row] });
  const t = await makeTable({ columns: [column], remote: true });
  await deliver(t, [row]);
  return t;
}

describe('typed-cells x pipeline x mode', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  for (const spec of TYPE_SPECS) {
    for (const pipeline of PIPELINES) {
      for (const mode of MODES) {
        it(`${spec.type} / ${pipeline} / ${mode}`, async () => {
          const column = buildColumn(spec, pipeline);
          const row = rowFor(spec);
          table = await mountRow(column, row, mode);

          expect(dataRows(table)).toHaveLength(1);
          const td = tdFor(table, 0, column.key);
          // The working value is the raw field either way: the getter variants
          // resolve the same field through a non-field column key (table.md:55).
          assertTypedCell(td, spec, pipeline, spec.value);
        });
      }
    }
  }
});

describe('typed-cells: local and remote render identically', () => {
  let local: any;
  let remote: any;
  afterEach(() => {
    if (local) removeComponent(local);
    if (remote) removeComponent(remote);
    local = remote = undefined;
  });

  // table.md:107 documents remote delivery as a data-source difference only —
  // the response is `{data,totalItems?}` and feeds the same display model
  // (`renderBody()` renders the display model, table.md:90). Nothing in the
  // docs makes a typed cell render differently because the rows arrived from a
  // server, so the two modes must produce byte-identical cell output.
  for (const spec of TYPE_SPECS) {
    for (const pipeline of PIPELINES) {
      it(`${spec.type} / ${pipeline}: remote output equals local output`, async () => {
        const column = buildColumn(spec, pipeline);
        const row = rowFor(spec);

        local = await makeTable({ columns: [column], data: [row] });
        remote = await makeTable({ columns: [column], remote: true });
        await deliver(remote, [row]);

        const localTd = tdFor(local, 0, column.key);
        const remoteTd = tdFor(remote, 0, column.key);

        expect(cellHost(remoteTd)?.tagName).toBe(cellHost(localTd)?.tagName);
        expect(cellHost(remoteTd)?.getAttribute('value'))
          .toBe(cellHost(localTd)?.getAttribute('value'));
        expect(displayText(remoteTd)).toBe(displayText(localTd));
        // Typed cells such as progress/rating render elements, not text, so
        // compare the rendered markup of the `content` part (table.md:129) and
        // require it to be non-empty — a blank cell is the customer symptom.
        expect(contentMarkup(remoteTd)).toBe(contentMarkup(localTd));
        expect(contentMarkup(remoteTd)).not.toBe('');
      });
    }
  }
});

describe('typed-cells: shared matrix oracle (matrix-utils expectCellsMatch)', () => {
  // The shared harness oracle `expectedCellText` encodes the documented display
  // pipeline — `valueGetter` -> `formatter` (wins) -> `valueFormatter`
  // (table.md:81) — and reads it through `cellText()`, the cell element's
  // `value` attribute, which table.md:81 says IS the display value. This slice
  // therefore has to satisfy the same oracle every other matrix slice uses, on
  // EVERY type and pipeline (previously only type=number was crossed here).
  //
  // MATRIX-1 (valueFormatter, the fallback display formatter) and
  // MATRIX-typed-cells-2 (`formatter`) are fixed: the value channel carries the
  // display text, so the shared oracle reads "VF[1234.5]" / "F[1234.5]".
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  for (const spec of TYPE_SPECS) {
    for (const pipeline of PIPELINES) {
      for (const mode of MODES) {
        it(`${spec.type} / ${pipeline} / ${mode} satisfies the shared oracle`, async () => {
          const column = buildColumn(spec, pipeline);
          const row = rowFor(spec);
          table = await mountRow(column, row, mode);
          expectCellsMatch(table, [row], [column]);
        });
      }
    }
  }
});
