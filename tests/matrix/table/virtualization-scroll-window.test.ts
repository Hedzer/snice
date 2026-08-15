// Matrix slice: VIRTUALIZATION × window relocation.
//
// happy-dom performs no layout, so nothing here scrolls for real. What IS
// exercised is the documented API surface: `scrollToRow(index)` ("Reveal data
// row") moves the scroll offset, and the scroll container's `scroll`
// notification — the thing a user interaction produces — is delivered as a bare
// DOM event. That separation is what pins down "rows are blank/wrong until the
// user interacts": the assertions below distinguish the state the API leaves
// behind from the state an interaction (or the next delivery) repairs.
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import { cellText, makeTable } from './matrix-utils';
import {
  CONTROL_COLUMN,
  PIPELINES,
  columnsFor,
  deliverRows,
  expectControlCells,
  expectVirtualWindow,
  expectWindowCells,
  makeRows,
  pipelineColumn,
  readWindow,
  visibleCellText,
  type PipelineName,
} from './virtualization-support';

const TOTAL = 30;
const TARGET = 20; // far outside the window rendered at scroll offset 0

describe('virtualization × window relocation', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  async function deliveredTable(pipeline: PipelineName, remote: boolean) {
    const columns = columnsFor(pipeline);
    const rows = makeRows(TOTAL);
    table = await makeTable({
      columns,
      data: remote ? undefined : [],
      remote,
      attrs: { virtualize: true },
    });
    await deliverRows(table, rows, remote);
    return { columns, rows };
  }

  /** The scroll notification a real user interaction would produce. */
  async function fireScroll() {
    const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
    frame.dispatchEvent(new Event('scroll'));
    await wait(60);
  }

  function renderedIndices(): number[] {
    return readWindow(table).indices;
  }

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    // Control: a row already inside the window stays revealed.
    it(`${mode}: scrollToRow(0) keeps row 0 rendered`, async () => {
      const { columns, rows } = await deliveredTable('valueGetter', remote);
      table.scrollToRow(0);
      await wait(60);
      expect(renderedIndices()).toContain(0);
      expectVirtualWindow(table, rows, columns.length);
      expectControlCells(table, rows);
    });

    it(`${mode}: scrollToRow(${TARGET}) moves the scroll offset`, async () => {
      await deliveredTable('valueGetter', remote);
      table.scrollToRow(TARGET);
      await wait(60);
      // rowHeight defaults to 48, so row 20 begins at 960px.
      expect(table.getScrollPosition()).toEqual({ top: TARGET * table.rowHeight, left: 0 });
      // …and the offset the API reports is the one the scroll container holds.
      const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
      expect(frame.scrollTop).toBe(TARGET * table.rowHeight);
    });

    // MATRIX-virtualization-3: `scrollToRow(index)` is documented as "Reveal
    // data row". A programmatic `scrollTop` assignment fires no scroll event,
    // so the virtualizer recomputes the window itself — otherwise the requested
    // row is never rendered and the body is nothing but spacer.
    it(`${mode}: scrollToRow(${TARGET}) renders row ${TARGET}`, async () => {
      const { columns, rows } = await deliveredTable('valueGetter', remote);
      table.scrollToRow(TARGET);
      await wait(60);
      expect(renderedIndices()).toContain(TARGET);
      const w = readWindow(table);
      const tr = w.rows[w.indices.indexOf(TARGET)];
      // The revealed row carries its own data: the cell's `value` (the shared
      // oracle) and the text painted inside the cell element's shadow root.
      const td = tr.querySelector('td[data-key="label"]') as HTMLElement;
      expect(cellText(td)).toBe(rows[TARGET].label);
      expect(visibleCellText(td)).toBe(rows[TARGET].label);
      // …and the rest of the relocated window is just as real.
      expectVirtualWindow(table, rows, columns.length);
      expectControlCells(table, rows);
      expectWindowCells(table, rows, [CONTROL_COLUMN, pipelineColumn('valueGetter')]);
    });

    // MATRIX-virtualization-3, second half: spacer integrity against the scroll
    // offset. Whatever window is rendered has to straddle the current offset —
    // otherwise the viewport is parked over bare spacer and the user sees an
    // empty body.
    it(`${mode}: the window after scrollToRow(${TARGET}) covers the scroll offset`, async () => {
      const { columns, rows } = await deliveredTable('valueGetter', remote);
      table.scrollToRow(TARGET);
      await wait(60);

      expectVirtualWindow(table, rows, columns.length);
      const w = readWindow(table);
      const scrollTop = table.getScrollPosition().top;
      expect(w.topPx).toBeLessThanOrEqual(scrollTop);
      expect(w.topPx + w.rows.length * table.rowHeight).toBeGreaterThan(scrollTop);
    });

    // The repair paths: an interaction, or the next delivery.
    it(`${mode}: a scroll notification after scrollToRow(${TARGET}) renders row ${TARGET}`, async () => {
      const { columns, rows } = await deliveredTable('valueGetter', remote);
      table.scrollToRow(TARGET);
      await wait(60);
      await fireScroll();

      expect(renderedIndices()).toContain(TARGET);
      expectVirtualWindow(table, rows, columns.length);
      expectControlCells(table, rows);
      expectWindowCells(table, rows, [CONTROL_COLUMN, pipelineColumn('valueGetter')]);
    });

    it(`${mode}: a re-delivery after scrollToRow(${TARGET}) renders row ${TARGET}`, async () => {
      const { columns, rows } = await deliveredTable('valueGetter', remote);
      table.scrollToRow(TARGET);
      await wait(60);
      await deliverRows(table, rows, remote);

      expect(renderedIndices()).toContain(TARGET);
      expectVirtualWindow(table, rows, columns.length);
      expectControlCells(table, rows);
      expectWindowCells(table, rows, [CONTROL_COLUMN, pipelineColumn('valueGetter')]);
    });

    // The relocated window must still run the whole pipeline for every shape.
    if (!remote) {
      // MATRIX-virtualization-4 (fixed): docs state `table.data =` rerenders,
      // and that now includes assigning the SAME array reference back after
      // mutating it in place — `data` opts out of the core identity dirty-check
      // with `hasChanged: () => true`. A row appended to the live array reaches
      // the virtual model and the spacers re-reserve the scroll height.
      it(`${mode}: reassigning the same data array after mutating it rerenders [MATRIX-virtualization-4]`, async () => {
        const { columns } = await deliveredTable('valueGetter', remote);
        const appended = makeRows(TOTAL + 1)[TOTAL];
        const live = table.data;
        live.push(appended);
        table.unsortedData.push(appended);

        table.data = live; // documented to rerender
        await wait(60);

        expectVirtualWindow(table, live, columns.length);
      });
    }

    for (const pipeline of PIPELINES) {
      const combo = `${mode} / ${pipeline} / window relocated by a scroll notification`;

      it(`${combo}: window + spacers + control cells`, async () => {
        const { columns, rows } = await deliveredTable(pipeline, remote);
        table.scrollToRow(TARGET);
        await wait(60);
        await fireScroll();

        expect(renderedIndices()).toContain(TARGET);
        expectVirtualWindow(table, rows, columns.length);
        expectControlCells(table, rows);
        expectWindowCells(table, rows, [CONTROL_COLUMN]);
      });

      it(`${combo}: pipeline cell text`, async () => {
        const { rows } = await deliveredTable(pipeline, remote);
        table.scrollToRow(TARGET);
        await wait(60);
        await fireScroll();
        expectWindowCells(table, rows, [pipelineColumn(pipeline)]);
      });
    }
  }
});
