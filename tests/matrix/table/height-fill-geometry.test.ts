// Height-fill slice: presence/absence of the filler against the host box, and
// the exact shape of the filler when present.
//
// Contract (`updateFillRow()` in packages/components/src/table/snice-table.ts):
//   leftover = floor(frame.clientHeight - table.offsetHeight)
//   leftover <= 1  -> no filler at all ("restoring the plain last-row styling")
//   leftover  > 1  -> exactly one `tr.table-fill-row` appended last, `leftover`
//                     px tall, cloned from the last data row with its identity,
//                     selection, focus and ARIA attributes stripped and its
//                     cells emptied, so the column grid runs to the bottom edge.
// happy-dom performs no layout, so `stubLayout` pins those two measurements.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, deliver, dataRows, wait } from './matrix-utils';
import {
  TALL, EXACT, OVERFLOW, stubLayout, fillRow, fillRows, tbodyOf, headerCellCount,
  columnsFor, makeRows, setLocalData, pipelines, deliveries,
  expectFillRowContract, expectFillNotCountedAsData, expectDisplayedCellsMatch,
  expectFillerCellsEmpty, expectSelectionStateOnDataRowsOnly, realDataRows,
} from './height-fill-support';

type Mode = 'local' | 'remote';

let table: any;
afterEach(() => { if (table) { removeComponent(table); table = undefined; } });

async function build(mode: Mode, opts: { columns: any[]; rows: any[]; attrs?: Record<string, any>; frame: number; box: number }) {
  table = mode === 'remote'
    ? await makeTable({ columns: opts.columns, remote: true, height: '600px', attrs: opts.attrs })
    : await makeTable({ columns: opts.columns, data: opts.rows, height: '600px', attrs: opts.attrs });
  stubLayout(table, opts.frame, opts.box);
  if (mode === 'remote') await deliver(table, opts.rows);
  else { setLocalData(table, opts.rows); table.renderBody(); await wait(20); }
  return table;
}

const plain = [
  { key: 'a', label: 'A', type: 'text', sortable: true },
  { key: 'n', label: 'N', type: 'text', sortable: true },
];

// ── The leftover threshold ───────────────────────────────────────────────────

const thresholds: Array<{ label: string; frame: number; box: number; fill: number | null }> = [
  { label: 'rows overflow the frame', frame: OVERFLOW.frame, box: OVERFLOW.table, fill: null },
  { label: 'rows exactly fill the frame', frame: EXACT.frame, box: EXACT.table, fill: null },
  { label: '1px of slack (at the documented <= 1 cutoff)', frame: 101, box: 100, fill: null },
  { label: '2px of slack (first px past the cutoff)', frame: 102, box: 100, fill: 2 },
  { label: 'half a frame of slack', frame: 300, box: 100, fill: 200 },
  { label: 'a very tall host', frame: TALL.frame, box: TALL.table, fill: TALL.leftover },
];

for (const mode of deliveries) {
  for (const t of thresholds) {
    describe(`height fill · ${mode} · ${t.label}`, () => {
      it(t.fill === null ? 'renders no fill row' : `renders one ${t.fill}px fill row`, async () => {
        const rows = makeRows();
        await build(mode as Mode, { columns: plain, rows, frame: t.frame, box: t.box });
        if (t.fill === null) {
          expect(fillRows(table)).toEqual([]);
          // Without a filler the last data row IS tbody:last-child, which is
          // what strips its bottom border ("plain last-row styling").
          expect(tbodyOf(table).lastElementChild).toBe(dataRows(table).at(-1));
        } else {
          expectFillRowContract(table, t.fill);
        }
        expectFillNotCountedAsData(table, rows.length);
        expectDisplayedCellsMatch(table, rows);
      });
    });
  }
}

// ── No data row to clone ─────────────────────────────────────────────────────

for (const mode of deliveries) {
  describe(`height fill · ${mode} · zero rows in a tall host`, () => {
    it('renders the empty state and no fill row', async () => {
      await build(mode as Mode, { columns: plain, rows: [], frame: TALL.frame, box: TALL.table });
      expect(fillRows(table)).toEqual([]);
      expect(dataRows(table)).toEqual([]);
      expect(tbodyOf(table).querySelector('td.no-data')).not.toBeNull();
    });
  });

  describe(`height fill · ${mode} · rows drain to zero`, () => {
    it('removes the fill row along with the rows it filled beneath', async () => {
      const rows = makeRows();
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });
      expectFillRowContract(table, TALL.leftover);

      if (mode === 'remote') await deliver(table, []);
      else { setLocalData(table, []); table.renderBody(); await wait(20); }

      expect(fillRows(table)).toEqual([]);
      expect(dataRows(table)).toEqual([]);
    });
  });

  describe(`height fill · ${mode} · a single data row in a tall host`, () => {
    it('clones that row into an empty filler', async () => {
      const rows = makeRows().slice(0, 1);
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, 1);
      expectDisplayedCellsMatch(table, rows);
    });
  });
}

// ── Last-row border behaviour ────────────────────────────────────────────────
//
// `tbody tr:last-child td { border-bottom: none }` strips the closing rule off
// whichever row ends the body. The filler exists to take that role: while it is
// present the last DATA row keeps its bottom border and the filler's own cells
// carry the borderless, zero-padding treatment; once the filler goes away the
// last data row inherits the plain last-row styling again.

for (const mode of deliveries) {
  describe(`height fill · ${mode} · last-row border ownership`, () => {
    it('the filler owns :last-child while present, and hands it back when it goes', async () => {
      const rows = makeRows();
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });

      const fill = fillRow(table)!;
      const lastData = dataRows(table).at(-1)!;
      expect(fill.matches('tbody tr:last-child')).toBe(true);
      expect(lastData.matches('tbody tr:last-child')).toBe(false);
      for (const td of [...fill.querySelectorAll('td')] as HTMLElement[]) {
        expect(getComputedStyle(td).borderBottom.startsWith('none')).toBe(true);
        expect(getComputedStyle(td).padding).toBe('0px');
      }

      // Shrink the frame until the rows fill it: the filler is "removed
      // entirely… restoring the plain last-row styling".
      stubLayout(table, EXACT.frame, EXACT.table);
      table.renderBody();
      await wait(20);
      expect(fillRows(table)).toEqual([]);
      expect(dataRows(table).at(-1)!.matches('tbody tr:last-child')).toBe(true);
    });
  });
}

// ── Structural columns the filler must reproduce ─────────────────────────────

for (const mode of deliveries) {
  describe(`height fill · ${mode} · selection column`, () => {
    it('the filler spans the checkbox column but carries no checkbox', async () => {
      const rows = makeRows();
      await build(mode as Mode, {
        columns: plain, rows, attrs: { selectable: true },
        frame: TALL.frame, box: TALL.table,
      });
      expectFillRowContract(table, TALL.leftover);
      const fill = fillRow(table)!;
      expect(fill.querySelectorAll('td').length).toBe(headerCellCount(table));
      expect(fill.querySelectorAll('snice-checkbox, input').length).toBe(0);
      expect(fill.querySelector('td.select-column')).not.toBeNull();
      expectFillNotCountedAsData(table, rows.length);
    });

    // MATRIX-height-fill-3 (fixed): `updateRowSelectionState()` walked
    // `tbody.querySelectorAll('tr')` and treated each element's DOM POSITION as
    // a data index, so it stamped `data-selected` back onto the filler that
    // `updateFillRow()` deliberately stripped it from. It now keys off each
    // row's own `data-index`, which non-data rows do not carry.
    it('selecting every row leaves the filler free of row-selection state', async () => {
      const rows = makeRows();
      await build(mode as Mode, {
        columns: plain, rows, attrs: { selectable: true },
        frame: TALL.frame, box: TALL.table,
      });
      table.selectedRows = rows.map((_, i) => i);
      table.updateRowSelectionState();
      await wait(20);
      const fill = fillRow(table)!;
      expect(fill.getAttribute('data-selected')).toBeNull();
      expect(fill.getAttribute('aria-selected')).toBeNull();
      expect(table.getSelectedData().length).toBe(rows.length);
      // Docs: rows are synced "keyed by each row's data index, so
      // group/aggregate/spacer/filler rows are never marked selected" — the
      // real data rows must therefore be exactly the painted ones.
      expectSelectionStateOnDataRowsOnly(table, rows.map((_, i) => i));
      expectFillNotCountedAsData(table, rows.length);
    });

    // Grouping puts two more kinds of non-data row in the body; the same
    // documented keying covers them, so a filler-plus-group body must still
    // paint selection on data rows only.
    it('grouped bodies mark neither the group headers nor the filler selected', async () => {
      const rows = makeRows();
      const columns = [...plain, { key: 'g', label: 'G', type: 'text' }];
      table = mode === 'remote'
        ? await makeTable({ columns, remote: true, height: '600px', attrs: { selectable: true } })
        : await makeTable({ columns, data: rows, height: '600px', attrs: { selectable: true } });
      table.groupBy = 'g';
      stubLayout(table, TALL.frame, TALL.table);
      if (mode === 'remote') await deliver(table, rows);
      else { setLocalData(table, rows); table.renderBody(); await wait(30); }

      expect(tbodyOf(table).querySelectorAll('tr.group-header-row').length).toBe(2);
      table.selectedRows = [0, 2];
      table.updateRowSelectionState();
      await wait(20);
      expectSelectionStateOnDataRowsOnly(table, [0, 2]);
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, rows.length);
    });

    // MATRIX-height-fill-3, visible form: page 1 renders data rows at DOM
    // positions 0-2 with the filler at position 3, so under the old positional
    // walk selecting raw-data row 3 (which lives on page 2) marked the FILLER
    // selected. `tbody tr[data-selected="true"]` paints the selection
    // background, so the user saw a highlighted phantom row below the data and
    // no highlighted row at all among the real ones.
    it('an off-page selection never highlights the filler', async () => {
      const rows = Array.from({ length: 6 }, (_, i) => ({ a: `r${i}`, n: `n${i}` }));
      await build(mode as Mode, {
        columns: plain, rows, attrs: { selectable: true, pagination: true, 'page-size': 3 },
        frame: TALL.frame, box: TALL.table,
      });
      expect(realDataRows(table).length).toBe(3);
      table.selectedRows = [3];
      table.updateRowSelectionState();
      await wait(20);
      // Row 3 lives on page 2, so page 1 paints NOTHING — not the filler, and
      // not some other row that happens to sit at DOM position 3.
      expect(fillRow(table)!.getAttribute('data-selected')).toBeNull();
      expect(fillRow(table)!.getAttribute('aria-selected')).toBeNull();
      expectSelectionStateOnDataRowsOnly(table, []);

      // …and the selection is still there to be painted once its page is shown.
      table.goToPage(2);
      await wait(30);
      expectSelectionStateOnDataRowsOnly(table, [3]);
      expectFillRowContract(table, TALL.leftover);
    });
  });

  describe(`height fill · ${mode} · striped + hoverable`, () => {
    it('the filler is excluded from stripes, hover and pointer events', async () => {
      const rows = makeRows();
      await build(mode as Mode, {
        columns: plain, rows, attrs: { striped: true, hoverable: true },
        frame: TALL.frame, box: TALL.table,
      });
      expectFillRowContract(table, TALL.leftover);
      const fill = fillRow(table)!;
      // `:host([striped]) tbody tr.table-fill-row` and the hoverable rule reset
      // the filler's background; happy-dom cannot resolve those shorthands, so
      // assert the two hooks they key off instead — the filler keeps the class
      // and stays out of the pointer/hover path entirely.
      expect(fill.className).toBe('table-fill-row');
      expect(getComputedStyle(fill).pointerEvents).toBe('none');
      expect(fill.matches('tr[data-selected="true"]')).toBe(false);
    });
  });

  describe(`height fill · ${mode} · list mode with a list renderer`, () => {
    it('renders no fill row (documented exemption in updateFillRow)', async () => {
      const rows = makeRows();
      table = mode === 'remote'
        ? await makeTable({ columns: plain, remote: true, height: '600px', attrs: { list: true } })
        : await makeTable({ columns: plain, data: rows, height: '600px', attrs: { list: true } });
      table.listRenderer = (r: any) => `${r.a}`;
      stubLayout(table, TALL.frame, TALL.table);
      if (mode === 'remote') await deliver(table, rows);
      else { setLocalData(table, rows); table.renderBody(); await wait(20); }
      expect(fillRows(table)).toEqual([]);
    });
  });
}

// ── The filler must be inert for every pipeline, including recycled DOM ──────

for (const mode of deliveries) {
  for (const pipeline of pipelines) {
    describe(`height fill · ${mode} · ${pipeline.name} · filler cells stay empty`, () => {
      it('never echoes the last data row it was cloned from', async () => {
        const rows = makeRows();
        await build(mode as Mode, { columns: columnsFor(pipeline), rows, frame: TALL.frame, box: TALL.table });
        // Compared against the HEADER's cell count, never against the filler's
        // own cells: `texts.map(() => '')` can never disagree with `texts`.
        expectFillerCellsEmpty(table);
        const fill = fillRow(table)!;
        expect(fill.querySelectorAll('*').length).toBe(headerCellCount(table));
        // …and the same after a re-render recycles the data rows underneath it.
        if (mode === 'remote') await deliver(table, rows);
        else { setLocalData(table, rows); table.renderBody(); await wait(20); }
        expectFillerCellsEmpty(table);
        expectFillRowContract(table, TALL.leftover);
        expectDisplayedCellsMatch(table, rows);
      });
    });
  }
}

// ── Non-data rows that can end the body (audit gap fill) ─────────────────────
//
// `updateFillRow()` clones the last `tr[data-index]`, but the tbody can end
// with rows that are NOT data rows: a pinned-bottom row, a group aggregate
// row, or an expanded detail row. Each of them would otherwise inherit
// `tbody tr:last-child td { border-bottom: none }`. The filler must still be
// appended last, sized from the leftover, and stay empty.

for (const mode of deliveries) {
  describe(`height fill · ${mode} · non-data rows at the end of the body`, () => {
    it('a pinned-bottom row still yields one filler last, and does not own :last-child', async () => {
      const rows = makeRows();
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });
      table.pinRowBottom(rows[0]);
      await wait(30);

      const tbody = tbodyOf(table);
      const pinned = tbody.querySelector('tr.pinned-row--bottom') as HTMLElement;
      expect(pinned).not.toBeNull();
      expectFillRowContract(table, TALL.leftover);
      expect(pinned.matches('tbody tr:last-child')).toBe(false);
      expect(fillRow(table)!.classList.contains('pinned-row')).toBe(false);
      // ORACLE NOTE: pinned rows are built by `createRow(row, -1)` and so carry
      // `data-index="-1"`; the shared `dataRows()` helper (tr[data-index])
      // counts them as data. `realDataRows()` drops that sentinel index, which
      // is what lets the slice's central invariant be asserted in full here
      // instead of being skipped for every pinning combo.
      expect(dataRows(table).length).toBe(rows.length + 1);      // the hole, pinned down
      expect(realDataRows(table).length).toBe(rows.length);      // the true data set
      expectFillNotCountedAsData(table, rows.length);
      expectDisplayedCellsMatch(table, rows, undefined, realDataRows(table));
    });

    it('group aggregate rows still yield one filler last', async () => {
      const rows = makeRows();
      const cols = [
        { key: 'a', label: 'A', type: 'text' },
        { key: 'n', label: 'N', type: 'text', aggregate: 'count' },
        { key: 'g', label: 'G', type: 'text' },
      ];
      table = mode === 'remote'
        ? await makeTable({ columns: cols, remote: true, height: '600px' })
        : await makeTable({ columns: cols, data: rows, height: '600px' });
      table.groupBy = 'g';
      stubLayout(table, TALL.frame, TALL.table);
      if (mode === 'remote') await deliver(table, rows);
      else { setLocalData(table, rows); table.renderBody(); await wait(30); }

      const tbody = tbodyOf(table);
      expect(tbody.querySelectorAll('tr.group-aggregate-row').length).toBeGreaterThan(0);
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, rows.length);
      expect(tbody.querySelector('tr.group-aggregate-row:last-child')).toBeNull();
    });

    it('an expanded detail row still yields one filler last', async () => {
      const rows = makeRows();
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });
      table.setDetailPanel({ getDetailContent: () => 'detail!', height: 80 });
      stubLayout(table, TALL.frame, TALL.table);
      table.renderBody();
      await wait(20);
      table.expandRow(rows.length - 1);
      await wait(30);

      const tbody = tbodyOf(table);
      expect(tbody.querySelector('tr.detail-row')).not.toBeNull();
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, rows.length);
      expect((tbody.querySelector('tr.detail-row') as HTMLElement).matches('tbody tr:last-child')).toBe(false);
    });
  });

  // The second call site of `updateFillRow()`: `@observe('resize','.table-frame')
  // handleFrameResize()`. renderBody() is NOT involved, so the filler must be
  // re-sized from the new box on its own.
  describe(`height fill · ${mode} · frame resize re-derives the filler`, () => {
    it('resizes, then removes, the filler without a re-render', async () => {
      const rows = makeRows();
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });
      expectFillRowContract(table, TALL.leftover);

      stubLayout(table, 300, 100);
      table.handleFrameResize();
      await wait(20);
      expectFillRowContract(table, 200);
      expectFillNotCountedAsData(table, rows.length);

      stubLayout(table, EXACT.frame, EXACT.table);
      table.handleFrameResize();
      await wait(20);
      expect(fillRows(table)).toEqual([]);
      expect(dataRows(table).at(-1)!.matches('tbody tr:last-child')).toBe(true);
    });
  });
}

// ── Sort/page transitions that change the cloned row (audit gap fill) ────────

for (const mode of deliveries) {
  describe(`height fill · ${mode} · page size change and the third sort state`, () => {
    it('setPageSize re-derives exactly one filler for the new page length', async () => {
      const rows = Array.from({ length: 7 }, (_, i) => ({ id: i, a: `A${i}`, src: `A${i}`, n: `n${i}` }));
      table = mode === 'remote'
        ? await makeTable({ columns: plain, remote: true, height: '600px', attrs: { pagination: true, 'page-size': 3 } })
        : await makeTable({ columns: plain, data: rows, height: '600px', attrs: { pagination: true, 'page-size': 3 } });
      stubLayout(table, TALL.frame, TALL.table);
      if (mode === 'remote') await deliver(table, rows);
      else { setLocalData(table, rows); table.renderBody(); await wait(20); }

      table.setPageSize(5);
      await wait(30);
      expectFillRowContract(table, TALL.leftover);
      expectDisplayedCellsMatch(table, rows.slice(0, 5));
      expectFillNotCountedAsData(table, 5);
    });

    it('cycling a sort through its third state keeps one filler and the original order', async () => {
      const rows = makeRows();
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });
      for (let i = 0; i < 3; i++) { table.toggleSort('a'); await wait(30); }
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, rows.length);
      expectFillerCellsEmpty(table);
      // The third state is "unsorted", so the original delivery order is back.
      expectDisplayedCellsMatch(table, rows);
    });
  });
}

// ── CSS part identity ────────────────────────────────────────────────────────

for (const mode of deliveries) {
  describe(`height fill · ${mode} · CSS parts on the filler`, () => {
    // MATRIX-height-fill-4 (fixed): the clone strips every ARIA/identity
    // attribute (role, aria-rowindex, id, tabindex, data-index) and the
    // stylesheet neutralises stripe/hover backgrounds, but `part="row"` /
    // `part="cell"` used to survive the clone, so a consumer rule such as
    // `snice-table::part(row){border-bottom:1px solid}` painted a phantom row
    // across the filler — the exact artefact the filler exists to remove.
    // `part` is now stripped with the rest of the row identity, and the docs
    // say so (docs/ai/components/table.md, CSS Parts).
    it('the inert filler does not expose the row/cell parts, but real rows do', async () => {
      const rows = makeRows();
      await build(mode as Mode, { columns: plain, rows, frame: TALL.frame, box: TALL.table });

      // Docs, CSS Parts: `row` is "each native body row", `cell` "each native
      // body cell — the inert filler … is neither and exposes no part". Assert
      // both halves: a rule like `::part(row){border-bottom:1px solid}` must
      // reach every real row and stop before the filler. Without the positive
      // half, a build that exposed NO parts at all would pass.
      const lastData = realDataRows(table).at(-1)!;
      expect(lastData.getAttribute('part')).toBe('row');
      expect([...lastData.querySelectorAll('td[data-key]')].map(td => td.getAttribute('part')))
        .toEqual(['cell', 'cell']);

      const fill = fillRow(table)!;
      expect(fill.getAttribute('part')).toBeNull();
      expect([...fill.querySelectorAll('td')].map(td => td.getAttribute('part')))
        .toEqual(new Array(headerCellCount(table)).fill(null));
    });
  });
}
