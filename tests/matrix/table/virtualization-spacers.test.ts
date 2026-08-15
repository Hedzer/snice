// Matrix slice: VIRTUALIZATION × spacer integrity.
//
// The spacers are what make a windowed body look like a full one: top + window +
// bottom must always reserve exactly `rows × rowHeight`, and the window itself
// must stay a contiguous in-range slice. These run across { local, remote } and
// across dataset size, `row-height`, `virtual-buffer`, and re-delivery resizes.
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import { makeTable } from './matrix-utils';
import {
  CONTROL_COLUMN,
  columnsFor,
  deliverRows,
  expectControlCells,
  expectVariableHeightWindow,
  expectVirtualWindow,
  expectWindowCells,
  makeRows,
  pipelineColumn,
  readWindow,
  zeroRowMessageCell,
} from './virtualization-support';

// The field-report column shape: the key is not a row field, so a dropped
// valueGetter shows up as a blank cell rather than as the right text by luck.
const COLUMNS = columnsFor('valueGetter');
const GETTER_COLUMN = pipelineColumn('valueGetter');

async function virtualTable(remote: boolean, rows: any[], attrs: Record<string, any> = {}) {
  const table = await makeTable({
    columns: COLUMNS,
    data: remote ? undefined : [],
    remote,
    attrs: { virtualize: true, ...attrs },
  });
  await deliverRows(table, rows, remote);
  return table;
}

function assertBody(table: any, rows: any[]) {
  expectVirtualWindow(table, rows, COLUMNS.length);
  expectControlCells(table, rows);
  expectWindowCells(table, rows, [CONTROL_COLUMN, GETTER_COLUMN]);
}

describe('virtualization × dataset size', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    for (const size of [0, 1, 5, 6, 7, 30, 100]) {
      it(`${mode} / ${size} rows: window + spacers reserve the full scroll height`, async () => {
        const rows = makeRows(size);
        table = await virtualTable(remote, rows);
        assertBody(table, rows);
      });
    }
  }
});

// Audit addition: the assertions above are all satisfied by a body that renders
// EVERY row (top/bottom both 0, no spacers), so on their own they cannot tell a
// working virtualizer from one that silently stopped windowing. These pin the
// windowing itself for datasets that must not fit.
describe('virtualization × windowing actually happens', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    for (const size of [30, 100]) {
      it(`${mode} / ${size} rows: the body is a strict subset with real spacers`, async () => {
        const rows = makeRows(size);
        table = await virtualTable(remote, rows);
        const w = readWindow(table);
        expect(w.rows.length).toBeGreaterThan(0);
        expect(w.rows.length).toBeLessThan(size);
        expect(table.shadowRoot.querySelectorAll('.virtual-spacer').length).toBeGreaterThan(0);
        expect(w.bottomPx).toBeGreaterThan(0);
        assertBody(table, rows);
      });
    }
  }
});

// Audit addition: the spacer must span the tool columns too, not just the data
// columns — expectVirtualWindow only checks `>= columns.length`, which a spacer
// that forgot the checkbox column would still satisfy.
describe('virtualization × selection column', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    it(`${mode} / selectable: spacers span the checkbox column as well`, async () => {
      const rows = makeRows(30);
      table = await virtualTable(remote, rows, { selectable: true });
      const w = readWindow(table);
      const cellsPerRow = w.rows[0].querySelectorAll('td').length;
      expect(cellsPerRow).toBe(COLUMNS.length + 1);
      for (const spacer of [w.topSpacer, w.bottomSpacer]) {
        if (!spacer) continue;
        const td = spacer.querySelector('td') as HTMLTableCellElement;
        expect(td.colSpan).toBeGreaterThanOrEqual(cellsPerRow);
      }
      assertBody(table, rows);
    });
  }
});

describe('virtualization × row-height', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    for (const rowHeight of [20, 48, 100]) {
      it(`${mode} / row-height ${rowHeight}: spacers scale with the configured height`, async () => {
        const rows = makeRows(30);
        table = await virtualTable(remote, rows, { 'row-height': rowHeight });
        expect(table.rowHeight).toBe(rowHeight);
        assertBody(table, rows);
      });
    }
  }

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    it(`${mode} / setRowHeight after delivery: spacers recompute`, async () => {
      const rows = makeRows(30);
      table = await virtualTable(remote, rows);
      assertBody(table, rows);

      table.setRowHeight(120);
      await wait(60);
      expect(table.rowHeight).toBe(120);
      assertBody(table, rows);
    });
  }
});

describe('virtualization × virtual-buffer', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  const BUFFERS = [0, 200, 1000];

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    for (const buffer of BUFFERS) {
      it(`${mode} / virtual-buffer ${buffer}: window stays contiguous and spacers stay exact`, async () => {
        const rows = makeRows(60);
        table = await virtualTable(remote, rows, { 'virtual-buffer': buffer });
        expect(table.virtualBuffer).toBe(buffer);
        assertBody(table, rows);
      });
    }

    // The buffer values were previously never compared against each other, so
    // an ignored `virtual-buffer` looked identical to an honoured one. A larger
    // buffer must widen the window (never shrink it) and must never break the
    // window/spacer invariants.
    it(`${mode}: a larger virtual-buffer renders at least as many rows`, async () => {
      const rows = makeRows(60);
      const sizes: number[] = [];
      for (const buffer of BUFFERS) {
        table = await virtualTable(remote, rows, { 'virtual-buffer': buffer });
        assertBody(table, rows);
        sizes.push(readWindow(table).rows.length);
        removeComponent(table);
        table = null;
      }
      expect(sizes[0]).toBeGreaterThan(0);
      expect(sizes[1]).toBeGreaterThanOrEqual(sizes[0]);
      expect(sizes[2]).toBeGreaterThanOrEqual(sizes[1]);
      expect(sizes[2]).toBeGreaterThan(sizes[0]);
    });

    // MATRIX-virtualization-5 (NEW): `virtualBuffer` is a documented live
    // property (attribute `virtual-buffer`), but the virtualizer reads
    // `bufferPx` once, at attach() time (snice-table.ts setupVirtualization →
    // virtualizer.attach), and nothing re-attaches it. Raising the buffer after
    // delivery therefore changes nothing — not on the next scroll notification,
    // not on the next delivery — so the window stays as narrow as it was.
    it.fails(`${mode}: raising virtual-buffer after delivery widens the window`, async () => {
      const rows = makeRows(60);
      table = await virtualTable(remote, rows, { 'virtual-buffer': 0 });
      const before = readWindow(table).rows.length;

      table.virtualBuffer = 2000;
      await wait(60);
      await deliverRows(table, rows, remote);

      expect(table.virtualBuffer).toBe(2000);
      expect(readWindow(table).rows.length).toBeGreaterThan(before);
      assertBody(table, rows);
    });
  }
});

// Coverage gap closed: `setRowHeightCallback(fn)` (docs: "set rendered/virtual
// height") was never crossed with `virtualize` anywhere in tests/. The fixed
// `rowHeight` arithmetic in expectVirtualWindow cannot express per-row heights,
// so these assert through the variable-height spacer oracle instead.
describe('virtualization × setRowHeightCallback', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  const alternating = (_row: any, index: number) => (index % 2 === 0 ? 40 : 80);

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    it(`${mode}: per-row heights drive the spacers`, async () => {
      const rows = makeRows(30);
      table = await virtualTable(remote, rows);
      table.setRowHeightCallback(alternating);
      await wait(60);

      const w = expectVariableHeightWindow(table, rows, alternating);
      // The window is still a real window, and the reserved scroll height is
      // the summed row heights (1800px), not 30 × rowHeight (1440px).
      expect(w.rows.length).toBeGreaterThan(0);
      expect(w.rows.length).toBeLessThan(rows.length);
      expect(w.topPx + w.rows.length * table.rowHeight + w.bottomPx)
        .not.toBe(rows.length * table.rowHeight);
      expectControlCells(table, rows);
      expectWindowCells(table, rows, [CONTROL_COLUMN, GETTER_COLUMN]);
    });

    it(`${mode}: a re-delivery keeps the per-row heights`, async () => {
      const rows = makeRows(30);
      table = await virtualTable(remote, rows);
      table.setRowHeightCallback(alternating);
      await wait(60);
      expectVariableHeightWindow(table, rows, alternating);

      const next = makeRows(40, '#2');
      await deliverRows(table, next, remote);
      expectVariableHeightWindow(table, next, alternating);
      expectControlCells(table, next);
      expectWindowCells(table, next, [CONTROL_COLUMN, GETTER_COLUMN]);
    });
  }
});

describe('virtualization × re-delivery resizes', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  const transitions: Array<[number, number]> = [[30, 3], [3, 30], [30, 0], [0, 30]];

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    for (const [from, to] of transitions) {
      it(`${mode} / ${from} rows then ${to} rows: window and spacers follow the new dataset`, async () => {
        const first = makeRows(from);
        table = await virtualTable(remote, first);
        assertBody(table, first);

        const second = makeRows(to, '#2');
        await deliverRows(table, second, remote);
        assertBody(table, second);
      });
    }
  }
});

describe('virtualization × empty state', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  async function withSlottedEmptyState(remote: boolean, virtualize: boolean) {
    const t = await makeTable({
      columns: COLUMNS,
      data: remote ? undefined : [],
      remote,
      attrs: virtualize ? { virtualize: true } : {},
    });
    const template = document.createElement('div');
    template.setAttribute('slot', 'empty-state');
    template.id = 'matrix-empty-state';
    template.textContent = 'Nothing delivered';
    t.appendChild(template);
    await deliverRows(t, [], remote);
    return t;
  }

  function shadowEmptyState(t: any): HTMLElement | null {
    return t.shadowRoot.querySelector('tbody #matrix-empty-state');
  }

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';

    // Control: without virtualization the documented clone is present.
    it(`${mode} / not virtualized: zero-row render clones the empty-state slot`, async () => {
      table = await withSlottedEmptyState(remote, false);
      const clone = shadowEmptyState(table);
      expect(clone).not.toBeNull();
      expect(clone!.textContent).toBe('Nothing delivered');
    });

    // MATRIX-virtualization-2: docs state the empty-state slot is cloned into
    // the shadow body on EACH zero-row render — including the virtualized path,
    // where the virtualizer wipes the tbody and renders a zero-length window.
    it(`${mode} / virtualized: zero-row render clones the empty-state slot`, async () => {
      table = await withSlottedEmptyState(remote, true);
      const clone = shadowEmptyState(table);
      expect(clone).not.toBeNull();
      expect(clone!.textContent).toBe('Nothing delivered');
      // …and it is a clone, not the slotted original moved into the shadow root.
      expect(table.querySelector('[slot="empty-state"]')).not.toBeNull();
    });

    // "on EACH zero-row render": a second zero-row delivery must clone again
    // rather than leave the wiped tbody empty.
    it(`${mode} / virtualized: a second zero-row render clones the slot again`, async () => {
      table = await withSlottedEmptyState(remote, true);
      await deliverRows(table, [], remote);
      const clone = shadowEmptyState(table);
      expect(clone).not.toBeNull();
      expect(clone!.textContent).toBe('Nothing delivered');
    });

    // Rows in, rows out: the empty state must come back after the dataset that
    // replaced it is emptied again.
    it(`${mode} / virtualized: rows then zero rows restores the empty state`, async () => {
      table = await withSlottedEmptyState(remote, true);
      const rows = makeRows(30);
      await deliverRows(table, rows, remote);
      expect(shadowEmptyState(table)).toBeNull();
      assertBody(table, rows);

      await deliverRows(table, [], remote);
      expect(shadowEmptyState(table)?.textContent).toBe('Nothing delivered');
      assertBody(table, []);
    });

    // Docs: `virtualize` "keeps every zero-row state: loading spinner, ⚠️ load
    // error, and the `empty-state` slot clone (or the default 'No data'
    // placeholder)". The other three zero-row states, on the virtual path.
    it(`${mode} / virtualized: no slot falls back to the default "No data" placeholder`, async () => {
      table = await makeTable({
        columns: COLUMNS,
        data: remote ? undefined : [],
        remote,
        attrs: { virtualize: true },
      });
      await deliverRows(table, [], remote);

      const cell = zeroRowMessageCell(table);
      expect(cell).not.toBeNull();
      const placeholder = cell!.querySelector('snice-empty-state');
      expect(placeholder).not.toBeNull();
      expect(placeholder!.getAttribute('title')).toBe('No data');
    });

    it(`${mode} / virtualized: a zero-row body while loading shows the spinner`, async () => {
      table = await makeTable({
        columns: COLUMNS,
        data: remote ? undefined : [],
        remote,
        attrs: { virtualize: true },
      });
      await deliverRows(table, [], remote);

      table.loading = true;
      table.renderBody();
      await wait(60);

      const cell = zeroRowMessageCell(table);
      expect(cell).not.toBeNull();
      expect(cell!.querySelector('snice-progress')).not.toBeNull();
      expect(cell!.querySelector('snice-empty-state')).toBeNull();
    });
  }

  // Load errors only exist on the remote path.
  it('remote / virtualized: a failed load shows the ⚠️ error row', async () => {
    table = await makeTable({ columns: COLUMNS, remote: true, attrs: { virtualize: true } });
    table.addEventListener('@request/table/data', (e: any) => {
      e.detail.discovery.resolve();
      e.detail.data.reject(new Error('delivery failure'));
    }, { once: true });
    table.getTableData();
    await wait(60);

    const cell = zeroRowMessageCell(table);
    expect(cell).not.toBeNull();
    expect(cell!.querySelector('.table-error-message')?.textContent)
      .toBe('⚠️ delivery failure');
    expect(readWindow(table).rows.length).toBe(0);
  });
});
