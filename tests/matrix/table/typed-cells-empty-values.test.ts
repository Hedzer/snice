// typed-cells slice, axis 3: falsy and absent working values.
//
// This is where the customer symptom ("rows render blank") is most likely to
// hide: a typed cell whose value is 0 / false / null / a field the server never
// sent. Crossed with the value pipeline and local/remote delivery.
//
// Doc basis (docs/ai/components/table.md):
//   :35  standalone cell value/alignment semantics — "Value: false boolean, 0
//        rating/progress/duration/filesize, null JSON, '' otherwise", i.e.
//        `false` and `0` are legitimate values for these typed cells, not
//        emptiness
//   :55  formatter / valueGetter / valueFormatter
//   :65-67 NumberFormat / BooleanFormat / ProgressFormat
//   :81  the Table-path contract this axis turns on: "a column declaring either
//        formatter renders through `snice-cell-text` ... and the cell's `value`
//        property/attribute IS the display value. An empty row value (null, or
//        a field the row never carried) falls back to the typed cell's own
//        empty value — `false` boolean, `0` rating/progress/duration/filesize,
//        `null` JSON, `''` otherwise — so an absent boolean never reads as
//        `true` and an absent progress never reads as `{}`."
//   :107 remote delivery is a data source, not a different render model
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, dataRows, cellText, expectedCellText, expectCellsMatch, wait } from './matrix-utils';
import {
  TYPE_SPECS, PIPELINES, buildColumn, assertTypedCell, assertEmptyCell, tdFor,
  displayText, contentMarkup, cellHost, type Pipeline, type TypeSpec,
} from './typed-cells-support';

const MODES = ['local', 'remote'] as const;

function specOf(type: string): TypeSpec {
  const spec = TYPE_SPECS.find(s => s.type === type)!;
  expect(spec, `no spec for ${type}`).toBeTruthy();
  return spec;
}

async function mount(column: any, rows: any[], mode: 'local' | 'remote') {
  if (mode === 'local') return makeTable({ columns: [column], data: rows });
  const t = await makeTable({ columns: [column], remote: true });
  await deliver(t, rows);
  return t;
}

describe('typed-cells: zero and false are values, not blanks', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  // table.md:35/:81 name `false` (boolean) and `0` (rating/progress) as the
  // typed cells' own value semantics, and NumberFormat/CurrencyFormat
  // (table.md:65, :73) format 0 like any other number. None of these may render
  // as blank — under ANY pipeline, so the full pipeline list is crossed here
  // (the audit found this axis running only three of them).
  const ZERO_CASES: Array<{ type: string; zero: any }> = [
    { type: 'number', zero: 0 },
    { type: 'currency', zero: 0 },
    { type: 'boolean', zero: false },
    { type: 'progress', zero: 0 },
    { type: 'rating', zero: 0 },
  ];

  for (const { type, zero } of ZERO_CASES) {
    for (const pipeline of PIPELINES) {
      for (const mode of MODES) {
        it(`${type} / ${pipeline} / ${mode}: renders the falsy value ${String(zero)}`, async () => {
          const spec = specOf(type);
          const column = buildColumn(spec, pipeline);
          const row = { id: 1, [spec.field]: zero };
          table = await mount(column, [row], mode);

          expect(dataRows(table)).toHaveLength(1);
          const td = tdFor(table, 0, column.key);
          assertTypedCell(td, spec, pipeline, zero);
          expect(contentMarkup(td), 'a falsy value must not render an empty cell').not.toBe('');
          // The shared matrix oracle must read the same cell the same way.
          expectCellsMatch(table, [row], [column]);
        });
      }
    }
  }
});

// MATRIX-typed-cells-3 (fixed) was one id covering two unrelated causes, so it
// is asserted here as two:
//
//   (a) number/currency/date rendered a completely BLANK cell for a null value
//       even though the column declared a formatter — the formatter never ran.
//   (b) the other six types DID run the formatter, but on a value the cell had
//       already coerced, so the output was `F[]` (status/tag/link), `F[true]`
//       (boolean), `F[0]` (rating) or `F[[object Object]]` (progress) instead
//       of the formatter's own rendering of the row's null.
//
// Both groups assert the same documented contract — table.md:81 gives the
// declared formatter the cell's display value with no exemption for empty
// values, and the shared oracle `expectedCellText` encodes exactly that — but
// splitting them keeps a failure legible: a blank cell and a formatter fed the
// wrong input are different defects with different customer impact.
const FORMATTER_PIPELINES: Pipeline[] = [
  'formatter', 'valueGetter+formatter', 'valueFormatter', 'valueGetter+valueFormatter',
];
const BLANKED_TYPES = ['number', 'currency', 'date'];

describe('typed-cells: a declared formatter renders a null value instead of a blank cell', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  for (const type of BLANKED_TYPES) {
    for (const pipeline of FORMATTER_PIPELINES) {
      for (const mode of MODES) {
        it(`${type} / ${pipeline} / ${mode}: null renders the formatter's own text`, async () => {
          const spec = specOf(type);
          const column = buildColumn(spec, pipeline);
          const row = { id: 1, [spec.field]: null };
          table = await mount(column, [row], mode);

          const td = tdFor(table, 0, column.key);
          // The customer symptom this group exists for: the cell is NOT blank.
          expect(contentMarkup(td), 'a column with a formatter must not render a blank cell').not.toBe('');
          // table.md:81 — the formatter renders through `snice-cell-text`, and
          // the value property/attribute IS its output.
          expect(cellHost(td).tagName.toLowerCase()).toBe('snice-cell-text');
          expect(displayText(td)).toBe(expectedCellText(column, row));
          expect(cellText(td)).toBe(expectedCellText(column, row));
          expectCellsMatch(table, [row], [column]);
        });
      }
    }
  }
});

describe('typed-cells: an empty value reaches the declared formatter unchanged', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  const COERCED_TYPES = TYPE_SPECS.map(s => s.type).filter(t => !BLANKED_TYPES.includes(t));

  for (const type of COERCED_TYPES) {
    for (const pipeline of FORMATTER_PIPELINES) {
      for (const mode of MODES) {
        it(`${type} / ${pipeline} / ${mode}: the formatter sees the row value, not a cell default`, async () => {
          const spec = specOf(type);
          const column = buildColumn(spec, pipeline);
          const row = { id: 1, [spec.field]: null };
          table = await mount(column, [row], mode);

          const td = tdFor(table, 0, column.key);
          // table.md:55 declares `formatter?:(value,row?)=>string` over the
          // column's value; nothing substitutes the typed cell's own default
          // before it runs, so a placeholder formatter (`v => v ?? '—'`) can do
          // its job. Previously read `F[]` / `F[true]` / `F[0]` /
          // `F[[object Object]]` depending on the type.
          expect(displayText(td)).toBe(expectedCellText(column, row));
          expect(cellText(td)).toBe(expectedCellText(column, row));
          expect(contentMarkup(td)).not.toBe('');
          expectCellsMatch(table, [row], [column]);
        });
      }
    }
  }
});

describe('typed-cells: an empty row value falls back to the documented cell value', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  // table.md:81 pins what a Table-path typed cell holds when the row value is
  // empty: "An empty row value (null, or a field the row never carried) falls
  // back to the typed cell's own empty value — `false` boolean, `0`
  // rating/progress/duration/filesize, `null` JSON, `''` otherwise" (the same
  // per-type list table.md:35 gives the standalone cells).
  //
  // MATRIX-typed-cells-4 (boolean) / MATRIX-typed-cells-5 (progress), fixed:
  // an empty value used to be stringified to '' and re-read by the cell's typed
  // attribute converter as `true` / `{}`.
  //
  // `assertEmptyCell` deliberately checks the cell ELEMENT, its `value`
  // PROPERTY by identity and the rendered `content` part — asserting only
  // `cellText(td) === ''` would be satisfied by any nullish value and by a cell
  // that never rendered at all, which is what this describe used to do.
  const EMPTY_ROWS: Array<{ name: string; row: (spec: TypeSpec) => any }> = [
    { name: 'null field', row: spec => ({ id: 1, [spec.field]: null }) },
    { name: 'field absent from the row', row: () => ({ id: 1 }) },
  ];

  for (const spec of TYPE_SPECS) {
    for (const shape of EMPTY_ROWS) {
      for (const mode of MODES) {
        for (const pipeline of ['no-pipeline', 'valueGetter'] as Pipeline[]) {
          it(`${spec.type} / ${pipeline} / ${shape.name} / ${mode}: cell holds the documented empty value`, async () => {
            const column = buildColumn(spec, pipeline);
            table = await mount(column, [shape.row(spec)], mode);

            expect(dataRows(table)).toHaveLength(1);
            assertEmptyCell(tdFor(table, 0, column.key), spec);
          });
        }
      }
    }
  }
});

describe('typed-cells: absent and null values render identically in both modes', () => {
  let local: any;
  let remote: any;
  afterEach(() => {
    if (local) removeComponent(local);
    if (remote) removeComponent(remote);
    local = remote = undefined;
  });

  // table.md:107 documents remote delivery as a data source; nothing makes an
  // empty typed cell render differently because the row came from a server.
  const EMPTY_SHAPES: Array<{ name: string; row: (spec: TypeSpec) => any }> = [
    { name: 'null field', row: spec => ({ id: 1, [spec.field]: null }) },
    { name: 'field absent from the row', row: () => ({ id: 1 }) },
  ];

  for (const spec of TYPE_SPECS) {
    for (const shape of EMPTY_SHAPES) {
      for (const pipeline of ['no-pipeline', 'valueGetter'] as Pipeline[]) {
        it(`${spec.type} / ${pipeline} / ${shape.name}: remote matches local`, async () => {
          const column = buildColumn(spec, pipeline);
          const row = shape.row(spec);

          local = await makeTable({ columns: [column], data: [row] });
          remote = await makeTable({ columns: [column], remote: true });
          await deliver(remote, [row]);

          // The row itself must exist with its cell — an empty value must not
          // cost the table a row or a td (table.md:90, renderBody renders the
          // display model for every delivered row).
          expect(dataRows(local)).toHaveLength(1);
          expect(dataRows(remote)).toHaveLength(1);
          const localTd = tdFor(local, 0, column.key);
          const remoteTd = tdFor(remote, 0, column.key);

          // Both sides must be right, not merely equal: two identically wrong
          // cells would satisfy a comparison on its own.
          assertEmptyCell(localTd, spec);
          assertEmptyCell(remoteTd, spec);
          expect(cellHost(remoteTd)?.tagName).toBe(cellHost(localTd)?.tagName);
          expect(cellHost(remoteTd)?.getAttribute('value'))
            .toBe(cellHost(localTd)?.getAttribute('value'));
          expect(contentMarkup(remoteTd)).toBe(contentMarkup(localTd));
        });
      }
    }
  }
});

describe('typed-cells: an empty cell that is refilled by re-delivery renders the new value', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  // A row delivered empty and then re-delivered with content is the exact
  // "blank until interaction" shape. New row objects, so the reconciler must
  // rebuild them (table.md:89 applies the current rows).
  for (const spec of TYPE_SPECS) {
    for (const pipeline of PIPELINES) {
      for (const mode of MODES) {
        it(`${spec.type} / ${pipeline} / ${mode}: empty row then filled row`, async () => {
          const column = buildColumn(spec, pipeline);
          table = await mount(column, [{ id: 1, [spec.field]: null }], mode);
          expect(dataRows(table)).toHaveLength(1);

          const filled = [{ id: 1, [spec.field]: spec.value }];
          if (mode === 'remote') {
            await deliver(table, filled);
          } else {
            table.unsortedData = [...filled];
            table.data = filled;
            table.renderBody();
            await wait(30);
          }

          expect(dataRows(table)).toHaveLength(1);
          assertTypedCell(tdFor(table, 0, column.key), spec, pipeline, spec.value);
          expectCellsMatch(table, filled, [column]);
        });
      }
    }
  }
});

describe('typed-cells: the empty values outside TYPE_SPECS', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  // table.md:81 names four types whose empty value is NOT '': `json` -> null and
  // `duration`/`filesize` -> 0 (rating and progress are covered above through
  // TYPE_SPECS). They are pinned here because they take the same
  // `emptyCellValue` fallback in `createCellElement`, and json is the one type
  // that carries NO `value` attribute when empty — `null` cannot be spelled as
  // an attribute, and stringifying it to '' is exactly the coercion this axis
  // exists to prevent (an Object-typed converter re-reads '' as `{}`).
  const SHAPES: Array<{ name: string; row: () => any }> = [
    { name: 'null field', row: () => ({ id: 1, f: null }) },
    { name: 'field absent from the row', row: () => ({ id: 1 }) },
  ];

  const OUTLIERS: Array<{ type: string; tag: string; empty: any; attr: string | null }> = [
    { type: 'json', tag: 'snice-cell-json', empty: null, attr: null },
    { type: 'duration', tag: 'snice-cell-duration', empty: 0, attr: '0' },
    { type: 'filesize', tag: 'snice-cell-filesize', empty: 0, attr: '0' },
  ];

  for (const outlier of OUTLIERS) {
    for (const shape of SHAPES) {
      for (const mode of MODES) {
        it(`${outlier.type} / ${shape.name} / ${mode}: cell holds the documented empty value`, async () => {
          const column = { key: 'f', label: 'F', type: outlier.type };
          table = await mount(column, [shape.row()], mode);

          expect(dataRows(table)).toHaveLength(1);
          const host = tdFor(table, 0, 'f').firstElementChild as any;
          expect(host, `no rendered cell element for empty ${outlier.type}`).toBeTruthy();
          expect(host.tagName.toLowerCase()).toBe(outlier.tag);
          expect(host.value, `value property for empty ${outlier.type}`).toBe(outlier.empty);
          expect(host.getAttribute('value'), `value attribute for empty ${outlier.type}`)
            .toBe(outlier.attr);
          // The cell still renders: an empty value costs no content part.
          expect(host.shadowRoot?.querySelector('[part~="content"]')).toBeTruthy();
        });
      }
    }
  }
});
