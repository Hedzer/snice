// Matrix slice: VIRTUALIZATION × toggling.
//
// `virtualize` is a live property: turning it on after rows have been delivered
// must hand the body to the virtualizer (contiguous window + exact spacers), and
// turning it off must restore the complete body with no spacers left behind.
// Crossed with { local, remote } × the five pipeline shapes.
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import { makeTable } from './matrix-utils';
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
  zeroRowMessageCell,
  type PipelineName,
} from './virtualization-support';

const TOTAL = 30;

describe('virtualization × toggling', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  async function deliveredTable(pipeline: PipelineName, remote: boolean, virtualize: boolean) {
    const columns = columnsFor(pipeline);
    const rows = makeRows(TOTAL);
    table = await makeTable({
      columns,
      data: remote ? undefined : [],
      remote,
      attrs: virtualize ? { virtualize: true } : {},
    });
    await deliverRows(table, rows, remote);
    return { columns, rows };
  }

  async function setVirtualize(value: boolean) {
    table.virtualize = value;
    await wait(60);
  }

  /** With virtualization off the body holds every row and no spacer at all. */
  function expectFullBody(rows: any[]) {
    const w = readWindow(table);
    expect(w.rows.length).toBe(rows.length);
    expect(w.indices).toEqual(rows.map((_r, i) => i));
    expect(table.shadowRoot.querySelectorAll('.virtual-spacer').length).toBe(0);
  }

  /** With virtualization on the body holds a strict, contiguous subset. */
  function expectWindowedBody(rows: any[], columnCount: number) {
    const w = expectVirtualWindow(table, rows, columnCount);
    expect(w.rows.length).toBeGreaterThan(0);
    expect(w.rows.length).toBeLessThan(rows.length);
    expect(table.shadowRoot.querySelectorAll('.virtual-spacer').length).toBeGreaterThan(0);
  }

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    for (const pipeline of PIPELINES) {

      // ── off → on ─────────────────────────────────────────────────────────
      const on = `${mode} / ${pipeline} / virtualize off→on`;

      it(`${on}: body becomes a windowed slice with exact spacers`, async () => {
        const { columns, rows } = await deliveredTable(pipeline, remote, false);
        expectFullBody(rows);
        await setVirtualize(true);
        expectWindowedBody(rows, columns.length);
        expectControlCells(table, rows);
        expectWindowCells(table, rows, [CONTROL_COLUMN]);
      });

      it(`${on}: pipeline cell text`, async () => {
        const { rows } = await deliveredTable(pipeline, remote, false);
        await setVirtualize(true);
        expectWindowCells(table, rows, [pipelineColumn(pipeline)]);
      });

      // ── on → off ─────────────────────────────────────────────────────────
      const off = `${mode} / ${pipeline} / virtualize on→off`;

      it(`${off}: every row is restored and no spacer survives`, async () => {
        const { columns, rows } = await deliveredTable(pipeline, remote, true);
        expectWindowedBody(rows, columns.length);
        await setVirtualize(false);
        expectFullBody(rows);
        expectControlCells(table, rows);
        expectWindowCells(table, rows, [CONTROL_COLUMN]);
      });

      it(`${off}: pipeline cell text`, async () => {
        const { rows } = await deliveredTable(pipeline, remote, true);
        await setVirtualize(false);
        expectWindowCells(table, rows, [pipelineColumn(pipeline)]);
      });
    }

    // Round trip plus a re-delivery in the virtualized state.
    it(`${mode} / valueGetter / on→off→on with a re-delivery in between`, async () => {
      const { columns, rows } = await deliveredTable('valueGetter', remote, true);
      expectWindowedBody(rows, columns.length);

      await setVirtualize(false);
      expectFullBody(rows);

      await setVirtualize(true);
      expectWindowedBody(rows, columns.length);

      const next = makeRows(TOTAL, '#2');
      await deliverRows(table, next, remote);
      expectWindowedBody(next, columns.length);
      expectControlCells(table, next);
      expectWindowCells(table, next, [CONTROL_COLUMN, pipelineColumn('valueGetter')]);
    });
  }
});

// Coverage gap closed: every case above delivers 30 rows first, so the two
// transitions most likely to strand a blank body were never taken — toggling
// while the dataset is EMPTY, and toggling virtualization ON before the first
// delivery ever arrives.
describe('virtualization × toggling with no rows yet', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  const columns = columnsFor('valueGetter');

  async function undeliveredTable(remote: boolean, virtualize: boolean) {
    table = await makeTable({
      columns,
      data: remote ? undefined : [],
      remote,
      attrs: virtualize ? { virtualize: true } : {},
    });
    const template = document.createElement('div');
    template.setAttribute('slot', 'empty-state');
    template.id = 'matrix-empty-state';
    template.textContent = 'Nothing delivered';
    table.appendChild(template);
    if (remote) await deliverRows(table, [], remote);
    else { table.renderBody(); await wait(30); }
  }

  /** Docs: `virtualize` keeps every zero-row state, empty-state clone included. */
  function expectZeroRowState() {
    const w = readWindow(table);
    expect(w.rows.length).toBe(0);
    expect(w.topSpacer).toBeNull();
    expect(w.bottomSpacer).toBeNull();
    const clone = table.shadowRoot.querySelector('tbody #matrix-empty-state') as HTMLElement | null;
    expect(clone).not.toBeNull();
    expect(clone!.textContent).toBe('Nothing delivered');
    expect(zeroRowMessageCell(table)).not.toBeNull();
  }

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: virtualize off→on with an empty dataset keeps the empty state`, async () => {
      await undeliveredTable(remote, false);
      expectZeroRowState();

      table.virtualize = true;
      await wait(60);
      expectZeroRowState();
    });

    it(`${mode}: virtualize on→off with an empty dataset keeps the empty state`, async () => {
      await undeliveredTable(remote, true);
      expectZeroRowState();

      table.virtualize = false;
      await wait(60);
      expectZeroRowState();
    });

    it(`${mode}: virtualize turned on BEFORE the first delivery still windows it`, async () => {
      await undeliveredTable(remote, false);
      table.virtualize = true;
      await wait(60);
      expectZeroRowState();

      const rows = makeRows(TOTAL);
      await deliverRows(table, rows, remote);

      const w = expectVirtualWindow(table, rows, columns.length);
      expect(w.rows.length).toBeGreaterThan(0);
      expect(w.rows.length).toBeLessThan(rows.length);
      expect(table.shadowRoot.querySelector('tbody #matrix-empty-state')).toBeNull();
      expectControlCells(table, rows);
      expectWindowCells(table, rows, [CONTROL_COLUMN, pipelineColumn('valueGetter')]);
    });

    it(`${mode}: a virtualized table emptied by a re-delivery falls back to the empty state`, async () => {
      await undeliveredTable(remote, true);
      const rows = makeRows(TOTAL);
      await deliverRows(table, rows, remote);
      expectControlCells(table, rows);

      await deliverRows(table, [], remote);
      expectZeroRowState();
    });
  }
});
