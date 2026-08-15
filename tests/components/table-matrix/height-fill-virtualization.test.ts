// Height-fill slice × virtualization.
//
// Documented filler contract (`updateFillRow()` in snice-table.ts): "When the
// host is taller than its rows, append an inert filler row so the column grid
// runs to the bottom edge of the frame… Removed entirely when content fills
// (or overflows) the frame". The only exemption spelled out in the code is
// list mode with a list renderer. Virtualization is not exempt — the frame /
// rendered-table comparison is the whole rule, and a virtualized table whose
// window is shorter than its frame has the same open-bottom grid a plain one
// would.
//
// MATRIX-height-fill-2 (fixed): `renderBody()` returns from the virtualized
// branch before it reaches `this.updateFillRow()` at the end of the method, so
// the virtualizer's own `afterRender` hook now re-evaluates the filler after
// every window it inserts — including the scroll-driven ones, which rebuild the
// tbody without going through renderBody() at all.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, deliver, dataRows, wait } from './matrix-utils';
import {
  TALL, OVERFLOW, stubLayout, fillRows, tbodyOf, columnsFor, makeRows, setLocalData,
  pipelines, deliveries, expectFillRowContract, expectFillNotCountedAsData,
  expectDisplayedCellsMatch, expectWindowedCellsMatch, realDataRows,
} from './height-fill-support';

type Mode = 'local' | 'remote';

let table: any;
afterEach(() => { if (table) { removeComponent(table); table = undefined; } });

async function build(mode: Mode, columns: any[], rows: any[], attrs?: Record<string, any>) {
  table = mode === 'remote'
    ? await makeTable({ columns, remote: true, height: '600px', attrs })
    : await makeTable({ columns, data: rows, height: '600px', attrs });
  stubLayout(table, TALL.frame, TALL.table);
  if (mode === 'remote') await deliver(table, rows);
  else { setLocalData(table, rows); table.renderBody(); await wait(30); }
}

/** A virtualized table over a large row set, with the two measured boxes pinned. */
async function buildMany(mode: Mode, rows: any[], frame: number, box: number) {
  const columns = columnsFor(pipelines[0]);
  table = mode === 'remote'
    ? await makeTable({ columns, remote: true, height: `${frame}px`, attrs: { virtualize: true } })
    : await makeTable({ columns, data: rows, height: `${frame}px`, attrs: { virtualize: true } });
  stubLayout(table, frame, box);
  if (mode === 'remote') await deliver(table, rows);
  else { setLocalData(table, rows); table.renderBody(); await wait(30); }
}

for (const mode of deliveries) {
  for (const pipeline of pipelines) {
    describe(`height fill · ${mode} · ${pipeline.name} · virtualize with slack`, () => {
      // MATRIX-height-fill-2
      it('a virtualized window shorter than its frame still gets a filler', async () => {
        const rows = makeRows();
        await build(mode as Mode, columnsFor(pipeline), rows, { virtualize: true });
        expectFillRowContract(table, TALL.leftover);
      });

      it('renders every windowed row correctly regardless of the filler', async () => {
        const rows = makeRows();
        await build(mode as Mode, columnsFor(pipeline), rows, { virtualize: true });
        expectDisplayedCellsMatch(table, rows);
        expectFillNotCountedAsData(table, rows.length);
      });
    });
  }
}

for (const mode of deliveries) {
  describe(`height fill · ${mode} · virtualize with overflowing content`, () => {
    it('renders no filler, which is the documented outcome when content overflows', async () => {
      const rows = Array.from({ length: 60 }, (_, i) => ({ id: i, a: `A${i}`, src: `A${i}`, n: `n${i}` }));
      await buildMany(mode as Mode, rows, OVERFLOW.frame, OVERFLOW.table);

      expect(fillRows(table)).toEqual([]);
      // The window is whatever the virtualizer chose, but every row in it must
      // still show the documented text for the row its data-index names.
      expectWindowedCellsMatch(table, rows);
      // Virtual spacers hold the scroll height; they are not data rows either.
      for (const tr of dataRows(table)) {
        expect(tr.classList.contains('virtual-spacer')).toBe(false);
      }
    });

    // The virtualizer rebuilds the tbody on scroll without going through
    // renderBody(), so the filler decision has to be re-taken on that path too.
    it('a scroll-driven window rebuild re-derives the filler from the current boxes', async () => {
      const rows = Array.from({ length: 60 }, (_, i) => ({ id: i, a: `A${i}`, src: `A${i}`, n: `n${i}` }));
      await buildMany(mode as Mode, rows, TALL.frame, TALL.table);
      expectFillRowContract(table, TALL.leftover);
      const firstBefore = Number(realDataRows(table)[0].getAttribute('data-index'));

      const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
      frame.scrollTop = 400;
      frame.dispatchEvent(new Event('scroll'));
      await wait(60);

      // The window really did relocate — otherwise the rebuild this test is
      // about never happened and the filler assertion below proves nothing.
      const firstAfter = Number(realDataRows(table)[0].getAttribute('data-index'));
      expect(firstAfter).toBeGreaterThan(firstBefore);
      expectFillRowContract(table, TALL.leftover);
      expectWindowedCellsMatch(table, rows);
    });
  });

  describe(`height fill · ${mode} · toggling virtualize on a filled table`, () => {
    // MATRIX-height-fill-2, regression form: the filler is correct before the
    // toggle and must survive it, because nothing about the frame/table height
    // relationship changed.
    it('keeps the filler when virtualize is switched on', async () => {
      const rows = makeRows();
      await build(mode as Mode, columnsFor(pipelines[0]), rows);
      expectFillRowContract(table, TALL.leftover);

      table.virtualize = true;
      table.renderBody();
      await wait(40);
      expectFillRowContract(table, TALL.leftover);
    });

    it('restores the filler when virtualize is switched back off', async () => {
      const rows = makeRows();
      await build(mode as Mode, columnsFor(pipelines[0]), rows);
      expectFillRowContract(table, TALL.leftover);

      table.virtualize = true;
      table.renderBody();
      await wait(40);
      expectFillRowContract(table, TALL.leftover);

      table.virtualize = false;
      table.renderBody();
      await wait(40);
      expectFillRowContract(table, TALL.leftover);
      expectFillNotCountedAsData(table, rows.length);
      expectDisplayedCellsMatch(table, rows);
    });
  });

  // `updateFillRow()` has two call sites — the end of renderBody() and
  // `@observe('resize', '.table-frame') handleFrameResize()`. The resize path
  // is the one that reacts to the HOST height changing, which is the dimension
  // this slice is named for, and it must work while virtualized too.
  describe(`height fill · ${mode} · virtualized frame resize`, () => {
    it('re-sizes and then removes the filler without a re-render', async () => {
      const rows = makeRows();
      await build(mode as Mode, columnsFor(pipelines[0]), rows, { virtualize: true });
      expectFillRowContract(table, TALL.leftover);

      stubLayout(table, 300, 100);
      table.handleFrameResize();
      await wait(30);
      expectFillRowContract(table, 200);
      expectFillNotCountedAsData(table, rows.length);

      stubLayout(table, 100, 100);
      table.handleFrameResize();
      await wait(30);
      expect(fillRows(table)).toEqual([]);
      expectWindowedCellsMatch(table, rows);
    });
  });

  describe(`height fill · ${mode} · virtualize never leaves a stale filler behind`, () => {
    // The previous form of this block asserted `fillRows().length <= 1` and
    // `tr.table-fill-row[data-index]` === 0 on a body that renders one filler
    // and never stamps data-index on it: both hold for every possible
    // implementation, including the broken one. A stale filler is one that
    // outlives the CONDITION that produced it, so change the condition.
    it('drops the filler when the rows it sat under are delivered away', async () => {
      const rows = makeRows();
      await build(mode as Mode, columnsFor(pipelines[0]), rows, { virtualize: true });
      expectFillRowContract(table, TALL.leftover);

      if (mode === 'remote') await deliver(table, []);
      else { setLocalData(table, []); table.renderBody(); await wait(30); }

      expect(fillRows(table)).toEqual([]);
      expect(realDataRows(table)).toEqual([]);
    });

    it('drops the filler when the content grows past the frame', async () => {
      const rows = makeRows();
      await build(mode as Mode, columnsFor(pipelines[0]), rows, { virtualize: true });
      expectFillRowContract(table, TALL.leftover);

      const many = Array.from({ length: 60 }, (_, i) => ({ id: i, a: `A${i}`, src: `A${i}`, n: `n${i}` }));
      stubLayout(table, OVERFLOW.frame, OVERFLOW.table);
      if (mode === 'remote') await deliver(table, many);
      else { setLocalData(table, many); table.renderBody(); await wait(30); }

      expect(fillRows(table)).toEqual([]);
      expect(tbodyOf(table).querySelector('tr.table-fill-row')).toBeNull();
      expectWindowedCellsMatch(table, many);
    });
  });
}
