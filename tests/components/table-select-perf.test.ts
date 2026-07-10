/**
 * Phase 1 — Task A: kill the quadratic + cheap deltas.
 *
 * These tests assert ALGORITHMIC invariants via spies/counters (never
 * wall-clock): which functions run, how many times, over what input sizes.
 *
 *   A1 — select/indeterminate must not scan the full dataset with indexOf
 *   A2 — a single selection toggle must touch exactly one rendered <tr>
 *   A3 — local header-filter INPUT path debounces (one apply per burst);
 *        programmatic setQuickFilter stays synchronous (regression gate)
 *   A4 — virtualized renderRowRange reuses a cached filtered snapshot
 *   A5 — remote mode drops out-of-order (stale) responses
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';

const COLS = [{ key: 'name', label: 'Name', type: 'text' }];

function makeRows(n: number) {
  const rows: any[] = [];
  for (let i = 0; i < n; i++) rows.push({ name: `row-${i}` });
  return rows;
}

async function makeTable(opts: {
  data?: any[];
  columns?: any[];
  attrs?: Record<string, any>;
} = {}) {
  const columns = opts.columns || COLS;
  const data = opts.data || makeRows(10);
  const table = await createComponent<any>('snice-table', opts.attrs || {});
  table.columns = columns;
  table.data = data;
  table.unsortedData = [...data];
  (table as any).columnManager.initialize(columns, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(10);
  return table;
}

// ────────────────────────────────────────────────────────────────────
// A1 — select-all / indeterminate is O(n²) via data.indexOf
// ────────────────────────────────────────────────────────────────────
describe('A1: selection never scans this.data with indexOf', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  it('toggling one checkbox in a 1k-row table performs ZERO indexOf calls whose receiver is table.data', async () => {
    table = await makeTable({ data: makeRows(1000), attrs: { selectable: true } });

    // Install a receiver-aware spy on Array.prototype.indexOf.
    const origIndexOf = Array.prototype.indexOf;
    let dataIndexOfCalls = 0;
    // eslint-disable-next-line no-extend-native
    Array.prototype.indexOf = function (this: any[], ...args: any[]) {
      if (this === table.data) dataIndexOfCalls++;
      return origIndexOf.apply(this, args as [any, number?]);
    };

    try {
      // Toggle the checkbox for a single row through the real event path.
      const cb = table.shadowRoot.querySelector(
        'tbody tr[data-index="5"] snice-checkbox.row-select'
      ) as any;
      expect(cb, 'row-5 checkbox present').toBeTruthy();
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    } finally {
      // eslint-disable-next-line no-extend-native
      Array.prototype.indexOf = origIndexOf;
    }

    expect(dataIndexOfCalls, 'indexOf calls whose receiver is table.data').toBe(0);
  });

  it('behavior lock: select-all state + indeterminate correct across filter → select → unfilter', async () => {
    table = await makeTable({
      data: [{ name: 'apple' }, { name: 'apricot' }, { name: 'banana' }],
      attrs: { selectable: true, 'quick-filter': true },
    });

    // Filter down to the two "ap*" rows, select them all.
    table.setQuickFilter('ap');
    await wait(10);
    (table as any).selectAllRows();
    await wait(10);

    const selectAll = () =>
      table.shadowRoot.querySelector('snice-checkbox.select-all') as any;

    // Both filtered rows selected → checkbox fully checked (no indeterminate).
    (table as any).updateSelectAllState();
    expect(selectAll().checked, 'all filtered selected').toBe(true);
    expect(selectAll().indeterminate).toBe(false);

    // Unfilter: now 2 of 3 selected → indeterminate.
    table.setQuickFilter('');
    await wait(10);
    (table as any).updateSelectAllState();
    expect(selectAll().checked).toBe(false);
    expect(selectAll().indeterminate, '2 of 3 selected → indeterminate').toBe(true);

    // The two selected indices are the apple/apricot rows.
    expect([...table.selectedRows].sort((a: number, b: number) => a - b)).toEqual([0, 1]);
  });
});

// ────────────────────────────────────────────────────────────────────
// A2 — a single toggle rewrites every rendered row
// ────────────────────────────────────────────────────────────────────
describe('A2: single selection toggle touches exactly one row element', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  it('toggling one checkbox writes data-selected on exactly ONE <tr>', async () => {
    table = await makeTable({ data: makeRows(1000), attrs: { selectable: true } });

    // Count data-selected writes on any element during the toggle.
    const origSetAttribute = Element.prototype.setAttribute;
    let dataSelectedWrites = 0;
    // eslint-disable-next-line no-extend-native
    Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
      if (name === 'data-selected') dataSelectedWrites++;
      return origSetAttribute.call(this, name, value);
    };

    try {
      const cb = table.shadowRoot.querySelector(
        'tbody tr[data-index="7"] snice-checkbox.row-select'
      ) as any;
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    } finally {
      // eslint-disable-next-line no-extend-native
      Element.prototype.setAttribute = origSetAttribute;
    }

    expect(dataSelectedWrites, 'data-selected writes during a single toggle').toBe(1);
  });

  it('behavior lock: the toggled row highlights and its checkbox is checked', async () => {
    table = await makeTable({ data: makeRows(50), attrs: { selectable: true } });

    const cb = table.shadowRoot.querySelector(
      'tbody tr[data-index="3"] snice-checkbox.row-select'
    ) as any;
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await wait(10);

    const tr = table.shadowRoot.querySelector('tbody tr[data-index="3"]') as HTMLElement;
    expect(tr.getAttribute('data-selected')).toBe('true');
    expect(cb.checked).toBe(true);
    expect(table.selectedRows).toContain(3);

    // A different row is untouched.
    const other = table.shadowRoot.querySelector('tbody tr[data-index="4"]') as HTMLElement;
    expect(other.getAttribute('data-selected')).toBe('false');
  });
});

// ────────────────────────────────────────────────────────────────────
// A3 — local filter INPUT path re-filters + full-rebuilds per keystroke
// ────────────────────────────────────────────────────────────────────
describe('A3: local filter input debounces; programmatic API stays synchronous', () => {
  let table: any;
  afterEach(() => {
    if (table) { removeComponent(table); table = null; }
    vi.useRealTimers();
  });

  it('typing 5 chars into a header-filter input triggers ONE applyClientFilters after the window', async () => {
    table = await makeTable({
      data: [{ name: 'alpha' }, { name: 'beta' }, { name: 'gamma' }],
      attrs: { 'header-filters': true },
    });
    // header-filter row is rendered by renderHeader when header-filters is on.
    table.renderHeader();
    await wait(10);

    const input = table.shadowRoot.querySelector('.header-filter-row snice-input[data-column="name"]') as any;
    expect(input, 'header-filter input present').toBeTruthy();

    const applySpy = vi.spyOn(table as any, 'applyClientFilters');

    vi.useFakeTimers();
    for (const ch of ['a', 'al', 'alp', 'alph', 'alpha']) {
      input.value = ch;
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }
    // Nothing yet — the burst is still inside the debounce window.
    expect(applySpy).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(200);
    expect(applySpy, 'one apply after the debounce window, not five').toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('regression gate: programmatic setQuickFilter applies synchronously (no debounce)', async () => {
    table = await makeTable({
      data: [{ name: 'alpha' }, { name: 'beta' }, { name: 'gamma' }],
      attrs: { 'quick-filter': true },
    });

    const applySpy = vi.spyOn(table as any, 'applyClientFilters');
    table.setQuickFilter('alp');
    // Synchronous — no timers advanced.
    expect(applySpy).toHaveBeenCalledTimes(1);
    expect(table.shadowRoot.querySelectorAll('tbody tr').length).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────
// A4 — virtualized scroll re-filters the whole dataset every frame
// ────────────────────────────────────────────────────────────────────
describe('A4: renderRowRange reuses a cached filtered snapshot', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  it('two consecutive renderRowRange calls with an unchanged model run the filter engine ONCE', async () => {
    table = await makeTable({ data: makeRows(200) });

    // Apply a filter through the real API (invalidates cache + re-renders),
    // then swap the data with setData so the filtered snapshot starts COLD.
    table.setQuickFilter('row-1');
    table.setData(makeRows(200));
    await wait(10);

    const engineSpy = vi.spyOn((table as any).filterEngine, 'applyFilters');

    (table as any).renderRowRange(0, 50);
    (table as any).renderRowRange(0, 50);
    expect(engineSpy, 'filter engine ran once for two identical renders').toHaveBeenCalledTimes(1);

    // Changing the filter model invalidates the cache — the engine runs again.
    const before = engineSpy.mock.calls.length;
    table.setQuickFilter('row-2');
    await wait(10);
    (table as any).renderRowRange(0, 50);
    expect(engineSpy.mock.calls.length, 'model change re-runs the engine').toBeGreaterThan(before);
  });
});

// ────────────────────────────────────────────────────────────────────
// A5 — remote mode: out-of-order responses
// ────────────────────────────────────────────────────────────────────
describe('A5: remote mode drops stale out-of-order responses', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  it('a slow FIRST response resolving after a fast SECOND response does not overwrite it', async () => {
    table = await createComponent<any>('snice-table', { mode: 'remote' });
    table.columns = COLS;
    table.data = [];
    table.unsortedData = [];
    (table as any).columnManager.initialize(COLS, table);
    await wait(10);
    table.renderHeader();
    table.renderBody();
    await wait(10);

    const requests: any[] = [];
    table.addEventListener('@request/table/data', (e: any) => requests.push(e.detail));

    table.getTableData(); // request #1 (slow)
    table.getTableData(); // request #2 (fast, latest)

    // Wait for both request events to be dispatched.
    for (let i = 0; i < 20 && requests.length < 2; i++) await wait(5);
    expect(requests.length, 'two in-flight requests').toBe(2);

    const FIRST = [{ name: 'stale-1' }, { name: 'stale-2' }];
    const SECOND = [{ name: 'fresh-a' }];

    requests[0].discovery.resolve();
    requests[1].discovery.resolve();

    // Fast second resolves first…
    requests[1].data.resolve({ data: SECOND });
    await wait(20);
    // …then the slow first resolves LATE and must be ignored.
    requests[0].data.resolve({ data: FIRST });
    await wait(30);

    expect(table.data.map((r: any) => r.name)).toEqual(['fresh-a']);
    expect(table.shadowRoot.querySelectorAll('tbody tr').length).toBe(1);
  });
});
