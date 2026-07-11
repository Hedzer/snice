/**
 * Task F — row grouping + aggregation.
 *
 * Two layers:
 *   1. `TableGrouping` module (mirrors `TableTreeData`): pure flattening of a
 *      dataset into an ordered `{ type: 'group' | 'row' | 'aggregate' }` display
 *      list, plus the aggregate math. Unit-tested directly, no DOM.
 *   2. `<snice-table>` integration: group-header / data / aggregate rows render
 *      into the tbody through the recycler + virtualizer, and the six interplay
 *      cases (sort / filter / select / paginate / virtualize / edit) behave.
 *
 * TDD: written red-first against unmodified source (module + `groupBy`/
 * `aggregate` API do not exist yet).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/table/snice-table';
import {
  TableGrouping,
  computeAggregate,
  type DisplayItem,
  type GroupRow,
  type AggregateRow,
} from '../../components/table/table-grouping';

// ── Fixtures ──────────────────────────────────────────────────────────────
const PEOPLE = [
  { name: 'Alice', dept: 'Eng', level: 'Sr', salary: 100 },
  { name: 'Bob', dept: 'Eng', level: 'Jr', salary: 80 },
  { name: 'Carol', dept: 'Eng', level: 'Sr', salary: 120 },
  { name: 'Dave', dept: 'Sales', level: 'Sr', salary: 90 },
  { name: 'Eve', dept: 'Sales', level: 'Jr', salary: 70 },
];

// `salary` is typed `text` (not `number`) purely to dodge happy-dom's typed-cell
// construction crash — the same workaround the existing suite documents ("Use
// empty data to dodge happy-dom typed-cell rendering issues"). Aggregation reads
// the raw numeric values regardless of column type; the computed result is
// asserted via `data-agg-value`. Number/currency formatting of aggregate cells
// is a real-browser (coordinator) check per the Phase 3 spec.
const COLS = [
  { key: 'name', label: 'Name', type: 'text' as const },
  { key: 'dept', label: 'Dept', type: 'text' as const },
  { key: 'salary', label: 'Salary', type: 'text' as const, aggregate: 'sum' as const },
];

const groups = (items: DisplayItem[]) => items.filter((i): i is GroupRow => i.type === 'group');
const dataRows = (items: DisplayItem[]) => items.filter((i) => i.type === 'row');
const aggs = (items: DisplayItem[]) => items.filter((i): i is AggregateRow => i.type === 'aggregate');

// ════════════════════════════════════════════════════════════════════════
// 1. Module — pure flattening + aggregation math
// ════════════════════════════════════════════════════════════════════════
describe('TableGrouping module', () => {
  function make(groupBy: string[], columns: any[] = COLS, defaultExpanded = true) {
    const g = new TableGrouping();
    g.configure({ groupBy, defaultExpanded });
    g.setColumns(columns);
    return g;
  }

  it('single-level grouping: one group header per distinct value, with leaf count', () => {
    const items = make(['dept']).processData(PEOPLE);
    const gs = groups(items);
    expect(gs.map((g) => g.value)).toEqual(['Eng', 'Sales']); // ordered by group key
    expect(gs.find((g) => g.value === 'Eng')!.count).toBe(3);
    expect(gs.find((g) => g.value === 'Sales')!.count).toBe(2);
    // every leaf row present under an expanded group
    expect(dataRows(items).length).toBe(5);
  });

  it('collapsing a group hides its child rows but keeps the header', () => {
    const g = make(['dept']);
    const initial = g.processData(PEOPLE);
    const engKey = groups(initial).find((group) => group.value === 'Eng')!.key;
    g.collapse(engKey);
    const items = g.processData(PEOPLE);
    expect(groups(items).map((x) => x.value)).toEqual(['Eng', 'Sales']);
    // Eng's 3 rows are gone; Sales' 2 remain
    expect(dataRows(items).length).toBe(2);
    expect(g.isExpanded(engKey)).toBe(false);
  });

  it('multi-level grouping nests groups (dept → level)', () => {
    const items = make(['dept', 'level']).processData(PEOPLE);
    const gs = groups(items);
    // Eng: Jr, Sr ; Sales: Jr, Sr  → 2 top + 4 nested = 6 group headers
    expect(gs.length).toBe(6);
    const depth0 = gs.filter((x) => x.depth === 0).map((x) => x.value);
    expect(depth0).toEqual(['Eng', 'Sales']);
    const engSr = gs.find((x) => x.depth === 1 && x.value === 'Sr' && x.key.includes('Eng'));
    expect(engSr!.count).toBe(2); // Alice + Carol
  });

  it('per-group aggregate footer carries the aggregated value', () => {
    const items = make(['dept']).processData(PEOPLE);
    const groupAggs = aggs(items).filter((a) => a.scope === 'group');
    expect(groupAggs.length).toBe(2);
    const engAgg = aggs(items).find((a) => a.scope === 'group' && a.rows.some((r) => r.name === 'Alice'));
    expect(engAgg!.aggregates.salary).toBe(300); // 100 + 80 + 120
  });

  it('table-level (grand total) aggregate footer over all rows', () => {
    const items = make(['dept']).processData(PEOPLE);
    const table = aggs(items).find((a) => a.scope === 'table');
    expect(table).toBeTruthy();
    expect(table!.aggregates.salary).toBe(460);
  });

  it('aggregation with NO grouping: rows + a single table-level footer', () => {
    const g = new TableGrouping();
    g.configure({ groupBy: [] });
    g.setColumns(COLS);
    expect(g.hasGrouping()).toBe(false);
    expect(g.hasAggregation()).toBe(true);
    expect(g.isEnabled()).toBe(true);
    const items = g.processData(PEOPLE);
    expect(groups(items).length).toBe(0);
    expect(dataRows(items).length).toBe(5);
    const tableAggs = aggs(items);
    expect(tableAggs.length).toBe(1);
    expect(tableAggs[0].scope).toBe('table');
    expect(tableAggs[0].aggregates.salary).toBe(460);
  });

  it('isEnabled() is false with neither grouping nor aggregation', () => {
    const g = new TableGrouping();
    g.configure({ groupBy: [] });
    g.setColumns([{ key: 'name' }, { key: 'dept' }]);
    expect(g.isEnabled()).toBe(false);
    expect(g.processData(PEOPLE)).toEqual([]);
  });

  it('empty input yields no rows (no lone footer over nothing)', () => {
    expect(make(['dept']).processData([]).length).toBe(0);
  });

  // Each built-in aggregator + a custom function.
  it('computeAggregate covers each built-in and a custom fn', () => {
    const rows = PEOPLE.filter((p) => p.dept === 'Eng'); // salaries 100, 80, 120
    const vals = rows.map((r) => r.salary);
    expect(computeAggregate('sum', vals, rows)).toBe(300);
    expect(computeAggregate('avg', vals, rows)).toBe(100);
    expect(computeAggregate('min', vals, rows)).toBe(80);
    expect(computeAggregate('max', vals, rows)).toBe(120);
    expect(computeAggregate('count', vals, rows)).toBe(3);
    const custom = (v: number[]) => v.map((x) => x * 2).reduce((a, b) => a + b, 0);
    expect(computeAggregate(custom, vals, rows)).toBe(600);
  });

  it('numeric aggregators tolerate empty, sparse, throwing, and non-numeric values', () => {
    expect(computeAggregate('sum', [], [])).toBe(0);
    expect(computeAggregate('avg', [], [])).toBe(0);
    expect(computeAggregate('min', [], [])).toBe(null);
    expect(computeAggregate('max', [], [])).toBe(null);
    expect(computeAggregate('count', [], [{}, {}])).toBe(2);
    const sparse = [null, undefined, '', '  ', false, true, 'x', 5, '15', Symbol('nope')];
    expect(computeAggregate('sum', sparse, sparse.map(() => ({})))).toBe(20);
    expect(computeAggregate('avg', sparse, sparse.map(() => ({})))).toBe(10);
    expect(computeAggregate('min', sparse, sparse.map(() => ({})))).toBe(5);
    expect(computeAggregate('max', sparse, sparse.map(() => ({})))).toBe(15);
  });

  it('createToggle builds an accessible passive chevron for the table click delegate', () => {
    const g = make(['dept']);
    const items = g.processData(PEOPLE);
    const eng = groups(items).find((x) => x.value === 'Eng')!;
    const toggle = g.createToggle(eng);
    const btn = toggle.querySelector('.tree-toggle') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('tree-toggle--expanded')).toBe(true);
    expect(btn.getAttribute('data-group-key')).toBe(eng.key);
    expect(btn.getAttribute('aria-label')).toContain('Collapse Eng group, 3 rows');
    btn.click();
    expect(g.isExpanded(eng.key)).toBe(true); // model mutation belongs to SniceTable
  });

  it('uses collision-free stable keys for typed, object, and separator-containing values', () => {
    const objectA = { id: 1 };
    const objectB = { id: 1 };
    const rows = [
      { group: 1 },
      { group: '1' },
      { group: 'a|level=string:x' },
      { group: objectA },
      { group: objectB },
    ];
    const g = make(['group'], [{ key: 'group' }]);
    const initialGroups = groups(g.processData(rows));
    expect(initialGroups).toHaveLength(5);
    expect(new Set(initialGroups.map((group) => group.key)).size).toBe(5);

    const collapsed = initialGroups.find((group) => group.value === objectA)!;
    g.collapse(collapsed.key);
    const next = g.processData(rows);
    expect(dataRows(next)).toHaveLength(4);
    expect(groups(next).find((group) => group.value === objectB)!.expanded).toBe(true);
    expect(groups(next).find((group) => group.value === objectA)!.key).toBe(collapsed.key);
  });

  it('aggregates valueGetter output and invokes each custom scope exactly once', () => {
    let calls = 0;
    const custom = (values: any[]) => {
      calls++;
      return values.reduce((sum, value) => sum + value, 0);
    };
    const columns = [{
      key: 'salary',
      aggregate: custom,
      valueGetter: (value: number) => value * 2,
    }];
    const items = make(['dept'], columns).processData(PEOPLE);
    expect(calls).toBe(3); // Eng subtotal + Sales subtotal + table total
    expect(aggs(items).filter((row) => row.scope === 'group').map((row) => row.aggregates.salary)).toEqual([600, 320]);
    expect(aggs(items).find((row) => row.scope === 'table')!.aggregates.salary).toBe(920);
  });

  it('reduces large groups without spread-argument overflow', () => {
    const values = Array.from({ length: 150_000 }, (_, index) => index);
    const rows = values.map(() => ({}));
    expect(computeAggregate('min', values, rows)).toBe(0);
    expect(computeAggregate('max', values, rows)).toBe(149_999);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 2. <snice-table> integration
// ════════════════════════════════════════════════════════════════════════
async function makeTable(cols: any[], data: any[], attrs: Record<string, any> = {}) {
  const table = await createComponent<any>('snice-table', attrs);
  table.columns = cols;
  table.data = data;
  table.unsortedData = [...data];
  table.columnManager.initialize(cols, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(20);
  return table;
}

describe('snice-table grouping integration', () => {
  let table: any;
  afterEach(() => {
    if (table) { removeComponent(table as HTMLElement); table = null; }
  });

  it('renders a group header per group with a count badge', async () => {
    table = await makeTable(COLS, PEOPLE);
    table.groupBy = 'dept';
    await wait(30);

    const headers = queryShadowAll(table, 'tbody tr.group-header-row');
    expect(headers.length).toBe(2);
    const labels = Array.from(headers).map((h) => h.querySelector('.group-header-label')?.textContent);
    expect(labels).toEqual(['Eng', 'Sales']);
    const counts = Array.from(headers).map((h) => h.querySelector('.group-header-count')?.textContent);
    expect(counts).toEqual(['3', '2']);
    // 5 leaf data rows present while expanded
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(5);
  });

  it('exposes grouped structural rows and the flattened count through grid ARIA', async () => {
    table = await makeTable(COLS, PEOPLE);
    table.groupBy = 'dept';
    await wait(30);

    const grid = queryShadow(table, 'table')!;
    expect(grid.getAttribute('aria-rowcount')).toBe(String(table.getGroupingItems().length + 1));
    expect(queryShadow(table, 'tr.group-header-row')?.getAttribute('role')).toBe('row');
    expect(queryShadow(table, 'tr.group-header-row td')?.getAttribute('role')).toBe('gridcell');
    expect(queryShadow(table, 'tr.group-aggregate-row')?.getAttribute('role')).toBe('row');
    expect(queryShadow(table, '.group-header-row .tree-toggle')?.getAttribute('aria-label')).toMatch(/group, \d+ rows/);
  });

  it('clicking a group chevron collapses it and fires group-toggle', async () => {
    table = await makeTable(COLS, PEOPLE);
    table.groupBy = 'dept';
    await wait(30);

    const events: any[] = [];
    table.addEventListener('group-toggle', (e: CustomEvent) => events.push(e.detail));

    const engHeader = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .find((h) => h.querySelector('.group-header-label')?.textContent === 'Eng')!;
    const chevron = engHeader.querySelector('.tree-toggle') as HTMLElement;
    table.keyboard.setFocus(0, 0); // stale grid focus must not swallow button keys
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true, composed: true,
    });
    chevron.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    chevron.click();
    await wait(30);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ value: 'Eng', expanded: false });
    expect(events[0].key).toMatch(/^group:/);
    // Eng's 3 rows gone, Sales' 2 remain
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(2);
    // header still present
    expect(queryShadowAll(table, 'tbody tr.group-header-row').length).toBe(2);
  });

  it('renders per-group + table-level aggregate footers with computed values', async () => {
    table = await makeTable(COLS, PEOPLE);
    table.groupBy = 'dept';
    await wait(30);

    const groupAggCells = Array.from(queryShadowAll(table, 'tbody tr.group-aggregate-row[data-agg-scope="group"] td[data-key="salary"]'))
      .map((td) => td.getAttribute('data-agg-value'));
    expect(groupAggCells).toEqual(['300', '160']);

    const tableAgg = queryShadow(table, 'tbody tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]');
    expect(tableAgg?.getAttribute('data-agg-value')).toBe('460');
  });

  it('identifies nested subtotals and keeps labels when every visible column aggregates', async () => {
    table = await makeTable([
      { key: 'salary', label: 'Salary', type: 'text' as const, aggregate: 'sum' as const },
    ], PEOPLE);
    table.groupBy = ['dept', 'level'];
    await wait(30);

    const nested = Array.from(queryShadowAll(table, 'tr.group-aggregate-row[data-agg-scope="group"][data-depth="2"]'));
    expect(nested.length).toBeGreaterThan(0);
    expect(nested.every((row) => row.hasAttribute('data-group-key'))).toBe(true);
    expect(nested[0].querySelector('.aggregate-label')?.textContent).toMatch(/level: .* subtotal/i);
    expect(queryShadow(table, 'tr.group-aggregate-row[data-agg-scope="table"] .aggregate-label')?.textContent).toBe('Total');
  });

  it('table-level footer renders with aggregation but no grouping', async () => {
    table = await makeTable(COLS, PEOPLE);
    await wait(20);
    // no groupBy set — but salary column aggregates
    const footers = queryShadowAll(table, 'tbody tr.group-aggregate-row[data-agg-scope="table"]');
    expect(footers.length).toBe(1);
    expect(footers[0].querySelector('td[data-key="salary"]')?.getAttribute('data-agg-value')).toBe('460');
    // all data rows still present
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(5);
  });

  // ── Interplay 1: sorting ─────────────────────────────────────────────
  it('sorting sorts rows within groups; groups stay ordered by group key', async () => {
    table = await makeTable(COLS, PEOPLE, { sortable: true });
    table.groupBy = 'dept';
    await wait(30);

    table.toggleSort('salary'); // ascending by salary
    await wait(30);

    // group order unchanged (by dept key)
    const labels = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .map((h) => h.querySelector('.group-header-label')?.textContent);
    expect(labels).toEqual(['Eng', 'Sales']);

    // Within Eng, salaries ascending: Bob(80), Alice(100), Carol(120).
    // Read row order via data-index → model (custom-element cells keep their
    // text in shadow DOM, so td.textContent is empty in happy-dom).
    const names = Array.from(queryShadowAll(table, 'tbody tr[data-index]'))
      .map((tr) => table.data[Number(tr.getAttribute('data-index'))]?.name);
    // First three belong to Eng (first group)
    expect(names.slice(0, 3)).toEqual(['Bob', 'Alice', 'Carol']);
  });

  // ── Interplay 2: filtering ───────────────────────────────────────────
  it('filtering drops empty groups and aggregates over filtered rows only', async () => {
    table = await makeTable(COLS, PEOPLE);
    table.groupBy = 'dept';
    await wait(30);

    table.setQuickFilter('Eng'); // only Eng rows survive (dept === 'Eng')
    await wait(30);

    const labels = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .map((h) => h.querySelector('.group-header-label')?.textContent);
    expect(labels).toEqual(['Eng']); // Sales group disappeared

    const engAgg = queryShadow(table, 'tbody tr.group-aggregate-row[data-agg-scope="group"] td[data-key="salary"]');
    expect(engAgg?.getAttribute('data-agg-value')).toBe('300');
    const tableAgg = queryShadow(table, 'tbody tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]');
    expect(tableAgg?.getAttribute('data-agg-value')).toBe('300'); // filtered total
  });

  // ── Interplay 3: selection ───────────────────────────────────────────
  it('selecting a group header selects all its rows; partial → indeterminate', async () => {
    table = await makeTable(COLS, PEOPLE, { selectable: true });
    table.groupBy = 'dept';
    await wait(30);

    const engHeader = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .find((h) => h.querySelector('.group-header-label')?.textContent === 'Eng')!;
    const groupCheckbox = engHeader.querySelector('snice-checkbox.group-select') as any;
    expect(groupCheckbox).toBeTruthy();

    groupCheckbox.checked = true;
    groupCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(30);

    // Eng = Alice(0), Bob(1), Carol(2)
    expect([...table.selectedRows].sort((a: number, b: number) => a - b)).toEqual([0, 1, 2]);

    // Deselect one row → group checkbox becomes indeterminate
    const bobRow = queryShadow(table, 'tbody tr[data-index="1"]');
    const bobCb = bobRow!.querySelector('snice-checkbox.row-select') as any;
    bobCb.checked = false;
    bobCb.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(30);

    const engHeader2 = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .find((h) => h.querySelector('.group-header-label')?.textContent === 'Eng')!;
    const cb2 = engHeader2.querySelector('snice-checkbox.group-select') as any;
    expect(cb2.indeterminate).toBe(true);
    expect(cb2.checked).toBe(false);
  });

  // ── Interplay 4: pagination ──────────────────────────────────────────
  it('paginates over the flattened group+row list', async () => {
    table = await makeTable(COLS, PEOPLE, { pagination: true, 'page-size': 4 });
    table.groupBy = 'dept';
    await wait(30);

    // Flattened list (expanded, agg on): 12 items total
    //  [g:Eng][Alice][Bob][Carol][agg:Eng][g:Sales][Dave][Eve][agg:Sales][agg:table]
    //  = 10 items. Page size 4 → 3 pages.
    const pageOneRows = queryShadowAll(table, 'tbody tr').length;
    expect(pageOneRows).toBe(4); // exactly one page of the flattened list
    expect(table.totalItems).toBe(10); // public total is the flattened model

    table.goToPage(2);
    await wait(30);
    expect(queryShadowAll(table, 'tbody tr').length).toBe(4);

    table.goToPage(3);
    await wait(30);
    // last page holds the remainder (10 - 8 = 2)
    expect(queryShadowAll(table, 'tbody tr').length).toBe(2);
  });

  // ── Interplay 5: virtualization ──────────────────────────────────────
  it('flattened group list flows through the virtualized path', async () => {
    table = await createComponent<any>('snice-table', { virtualize: true, 'row-height': 40 });
    table.columns = COLS;
    table.data = PEOPLE;
    table.unsortedData = [...PEOPLE];
    table.columnManager.initialize(COLS, table);
    await wait(60); // @ready rAF sets up virtualization
    table.groupBy = 'dept';
    table.renderHeader();
    table.renderBody();
    await wait(60);

    // group headers + data rows both windowed into the tbody
    expect(queryShadowAll(table, 'tbody tr.group-header-row').length).toBeGreaterThan(0);
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBeGreaterThan(0);
  });

  // ── Interplay 6: editing ─────────────────────────────────────────────
  it('committing a cell edit recomputes affected aggregates', async () => {
    const people = PEOPLE.map((row) => ({ ...row }));
    table = await makeTable(COLS, people, { editable: true, 'edit-mode': 'cell' });
    table.groupBy = 'dept';
    await wait(30);

    const before = queryShadow(table, 'tbody tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]');
    expect(before?.getAttribute('data-agg-value')).toBe('460');

    // Alice's salary 100 → 200 (data index 0). Eng group sum 300 → 400, table 460 → 560.
    table.startEdit(0, 'salary');
    await wait(20);
    const cellState = table.editor.getCellEditState();
    expect(cellState?.isEditing).toBe(true);
    table.editor.updateCellValue(200);
    await table.commitEdit();
    await wait(30);

    const engAgg = queryShadow(table, 'tbody tr.group-aggregate-row[data-agg-scope="group"] td[data-key="salary"]');
    expect(engAgg?.getAttribute('data-agg-value')).toBe('400');
    const tableAgg = queryShadow(table, 'tbody tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]');
    expect(tableAgg?.getAttribute('data-agg-value')).toBe('560');
  });

  it('honors groupBy and collapsed groupDefaults assigned before connection', async () => {
    table = document.createElement('snice-table') as any;
    table.groupBy = 'dept';
    table.groupDefaults = { expanded: false };
    table.columns = COLS;
    table.data = PEOPLE;
    document.body.appendChild(table);
    await table.ready;

    // `ready` includes the initial grouped paint; no timer/rAF is required.
    expect(queryShadowAll(table, 'tbody tr.group-header-row')).toHaveLength(2);
    expect(queryShadowAll(table, 'tbody tr[data-index]')).toHaveLength(0);
    const toggles = queryShadowAll(table, '.group-header-row .tree-toggle');
    expect(Array.from(toggles).every((toggle) => toggle.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('keeps data-derived group identity out of markup parsing', async () => {
    const malicious = `Ops\"><img class="injected" src=x>`;
    table = await makeTable(COLS, [{ name: 'Mallory', dept: malicious, level: 'Sr', salary: 10 }], { selectable: true });
    table.groupBy = 'dept';
    await wait(30);

    expect(queryShadow(table, '.group-header-row img.injected')).toBeNull();
    const checkbox = queryShadow(table, 'snice-checkbox.group-select');
    expect(checkbox).toBeTruthy();
    expect(checkbox!.getAttribute('data-group-key')).toMatch(/^group:/);
    expect(queryShadowAll(table, 'tbody tr.group-header-row')).toHaveLength(1);
  });

  it('routes group and aggregate clicks without phantom row-zero actions', async () => {
    table = await makeTable(COLS, PEOPLE, { selectable: true, clickable: true });
    table.groupBy = 'dept';
    await wait(30);

    const rowClicks: any[] = [];
    const groupEvents: any[] = [];
    table.addEventListener('row-clicked', (event: CustomEvent) => rowClicks.push(event.detail));
    table.addEventListener('group-toggle', (event: CustomEvent) => groupEvents.push(event.detail));

    const label = Array.from(queryShadowAll(table, '.group-header-label'))
      .find((element) => element.textContent === 'Eng') as HTMLElement;
    label.click();
    await wait(20);
    expect(groupEvents).toHaveLength(1);
    expect(groupEvents[0]).toMatchObject({ value: 'Eng', expanded: false });
    expect(rowClicks).toHaveLength(0);
    expect(table.selectedRows).toEqual([]);

    (queryShadow(table, '.group-aggregate-row[data-agg-scope="table"] td') as HTMLElement).click();
    expect(rowClicks).toHaveLength(0);
    expect(table.selectedRows).toEqual([]);
  });

  it('preserves master-detail rows in grouped and aggregation-only modes', async () => {
    table = await makeTable(COLS, PEOPLE);
    table.setDetailPanel({ getDetailContent: (row: any) => `Details for ${row.name}` });
    table.groupBy = 'dept';
    table.expandRow(0);
    await wait(30);
    expect(queryShadow(table, 'tr.detail-row[data-detail-for="0"]')).toBeTruthy();

    table.groupBy = '';
    await wait(30);
    expect(queryShadow(table, 'tr.detail-row[data-detail-for="0"]')).toBeTruthy();
    expect(queryShadow(table, 'tr.group-aggregate-row[data-agg-scope="table"]')).toBeTruthy();
  });

  it('preserves tree hierarchy when only table-level aggregation is enabled', async () => {
    const rows = [
      { name: 'Alice', salary: 100, path: ['Engineering', 'Alice'] },
      { name: 'Bob', salary: 80, path: ['Engineering', 'Bob'] },
      { name: 'Eve', salary: 70, path: ['Sales', 'Eve'] },
    ];
    const cols = [
      { key: 'name', label: 'Name', type: 'text' as const },
      { key: 'salary', label: 'Salary', type: 'text' as const, aggregate: 'sum' as const },
    ];
    table = await makeTable(cols, rows);
    table.setTreeData({ getPath: (row: any) => row.path, groupColumn: 'name', defaultExpansionDepth: 1 });
    await wait(30);

    expect(queryShadowAll(table, 'tbody .tree-indent').length).toBeGreaterThan(0);
    expect(queryShadow(table, 'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]')?.getAttribute('data-agg-value')).toBe('250');
  });

  it('group selection respects the table selectability predicate', async () => {
    table = await makeTable(COLS, PEOPLE, { selectable: true });
    table.setSelectabilityCheck((row: any) => row.name !== 'Bob');
    table.groupBy = 'dept';
    await wait(30);

    const engHeader = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .find((header) => header.querySelector('.group-header-label')?.textContent === 'Eng')!;
    const checkbox = engHeader.querySelector('snice-checkbox.group-select') as any;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(20);
    expect([...table.selectedRows].sort((a: number, b: number) => a - b)).toEqual([0, 2]);
    expect(checkbox.indeterminate).toBe(false);
  });

  it('shares one page-sliced model across grouping and virtualization', async () => {
    table = await createComponent<any>('snice-table', {
      virtualize: true,
      pagination: true,
      'page-size': 4,
      'row-height': 40,
    });
    table.columns = COLS;
    table.data = PEOPLE;
    table.groupBy = 'dept';
    await wait(80);

    expect(table.getVirtualRows()).toHaveLength(4);
    expect(queryShadowAll(table, 'tbody tr:not(.virtual-spacer)').length).toBeLessThanOrEqual(4);
    table.goToPage(2);
    await wait(40);
    expect(table.getVirtualRows()).toHaveLength(4);
    expect(queryShadowAll(table, 'tbody tr:not(.virtual-spacer)').length).toBeLessThanOrEqual(4);
  });

  it('clamps a deep virtual window when collapsing groups shrinks the model', async () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      name: `Person ${index}`,
      dept: 'Eng',
      salary: index,
    }));
    table = await createComponent<any>('snice-table', { virtualize: true, 'row-height': 40 });
    table.columns = COLS;
    table.data = rows;
    table.groupBy = 'dept';
    await wait(80);

    table.virtualizer.scrollToIndex(table.getVirtualRows().length - 1);
    const group = table.getGroupingItems().find((item: DisplayItem) => item.type === 'group') as GroupRow;
    table.grouping.collapse(group.key);
    table.invalidateGroupingCache();
    table.renderBody();
    await wait(20);

    expect(table.getVirtualRows()).toHaveLength(2); // header + table total
    expect(queryShadow(table, 'tbody tr.group-header-row')).toBeTruthy();
    expect(queryShadowAll(table, 'tbody tr:not(.virtual-spacer)').length).toBeGreaterThan(0);
  });

  it('maps virtual keyboard navigation through grouped display order', async () => {
    const rows = [
      { name: 'Last by group', dept: 'Z', salary: 1 },
      ...Array.from({ length: 40 }, (_, index) => ({ name: `A ${index}`, dept: 'A', salary: index + 2 })),
    ];
    table = await createComponent<any>('snice-table', { virtualize: true, 'row-height': 40 });
    table.columns = COLS;
    table.data = rows;
    table.groupBy = 'dept';
    await wait(80);

    const grid = queryShadow(table, 'table')!;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', ctrlKey: true, bubbles: true, composed: true }));
    await wait(30);
    expect(queryShadow(table, 'tr[data-index="0"] [data-grid-focus]')).toBeTruthy();
  });

  it('maps public scrollToRow through grouped virtual display positions', async () => {
    const rows = [
      { name: 'Raw first, grouped last', dept: 'Z', salary: 1 },
      ...Array.from({ length: 80 }, (_, index) => ({ name: `A ${index}`, dept: 'A', salary: index })),
    ];
    table = await createComponent<any>('snice-table', { virtualize: true, 'row-height': 40 });
    table.columns = COLS;
    table.data = rows;
    table.groupBy = 'dept';
    await wait(80);

    table.scrollToRow(0);
    const row = queryShadow(table, 'tbody tr[data-index="0"]');
    expect(row).toBeTruthy();
    const displayIndex = table.getVirtualRows().findIndex((entry: any) => entry.data === rows[0]);
    expect(row!.getAttribute('aria-rowindex')).toBe(String(displayIndex + 2));
  });

  it('clamps a grouped page when collapse shrinks the flattened model', async () => {
    table = await makeTable(COLS, PEOPLE, { pagination: true, 'page-size': 4 });
    table.groupBy = 'dept';
    await wait(30);
    table.currentPage = 3;
    await wait(20);

    const groupsBefore = table.getGroupingItems().filter((item: DisplayItem) => item.type === 'group');
    for (const group of groupsBefore) table.grouping.collapse(group.key);
    table.invalidateGroupingCache();
    table.renderBody();
    await wait(20);
    expect(table.currentPage).toBe(1);
    expect(queryShadowAll(table, 'tbody tr').length).toBeGreaterThan(0);
  });

  it('supports aggregate columns and grouped data through declarative children', async () => {
    table = document.createElement('snice-table') as any;
    table.groupBy = 'dept';
    table.searchable = true;
    table.innerHTML = `
      <snice-column slot="columns" key="name" label="Name"></snice-column>
      <snice-column slot="columns" key="dept" label="Department"></snice-column>
      <snice-column slot="columns" key="salary" label="Salary" aggregate="sum"></snice-column>
      <snice-row slot="rows" data='{"name":"Alice","dept":"Eng","salary":100}'></snice-row>
      <snice-row slot="rows" data='{"name":"Bob","dept":"Eng","salary":80}'></snice-row>
      <snice-row slot="rows" data='{"name":"Eve","dept":"Sales","salary":70}'></snice-row>
    `;
    document.body.appendChild(table);
    await table.ready;
    await wait(40);

    expect(queryShadowAll(table, 'tbody tr.group-header-row')).toHaveLength(2);
    expect(queryShadow(table, '.search-input')).toBeTruthy();
    expect(queryShadow(table, 'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]')?.getAttribute('data-agg-value')).toBe('250');
    const salaryColumn = table.querySelector('snice-column[key="salary"]') as any;
    expect(salaryColumn.getColumnDefinition().aggregate).toBe('sum');
    const custom = (values: number[]) => values.length;
    salaryColumn.aggregate = custom;
    expect(salaryColumn.getColumnDefinition().aggregate).toBe(custom);
    await wait(30);
    expect(queryShadow(table, 'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]')?.getAttribute('data-agg-value')).toBe('3');

    salaryColumn.aggregate = undefined;
    salaryColumn.label = 'Compensation';
    table.groupBy = '';
    await wait(40);
    expect(queryShadow(table, '.snice-table--slotted')).toBeTruthy();
    expect(queryShadow(table, '.search-input')).toBeTruthy();
    expect(Array.from(queryShadowAll(table, '#slotted-header .header-cell')).map((cell) => cell.textContent))
      .toEqual(['Name', 'Department', 'Compensation']);
    const firstRow = table.querySelector('snice-row[slot="rows"]') as any;
    expect(firstRow.columns[2].label).toBe('Compensation');
  });

  it('rebinds virtualization when declarative rows switch structural modes', async () => {
    table = document.createElement('snice-table') as any;
    table.virtualize = true;
    table.innerHTML = `
      <snice-column slot="columns" key="name" label="Name"></snice-column>
      <snice-column slot="columns" key="dept" label="Department"></snice-column>
      <snice-row slot="rows" data-name="Alice" data-dept="Eng"></snice-row>
      <snice-row slot="rows" data-name="Bob" data-dept="Eng"></snice-row>
      <snice-row slot="rows" data-name="Eve" data-dept="Sales"></snice-row>
    `;
    document.body.appendChild(table);
    await table.ready;
    expect(queryShadow(table, '.snice-table--slotted')).toBeTruthy();
    expect(table.virtualizer.isEnabled()).toBe(false);
    table.setToolbar({ showSearch: true });
    expect(queryShadow(table, '.table-toolbar')).toBeTruthy();

    table.groupBy = 'dept';
    await wait(60);
    expect(queryShadowAll(table, 'tr.group-header-row')).toHaveLength(2);
    expect(table.virtualizer.isEnabled()).toBe(true);
    expect(queryShadow(table, '.table-toolbar')).toBeTruthy();

    table.groupBy = '';
    await wait(40);
    expect(queryShadow(table, '.snice-table--slotted')).toBeTruthy();
    expect(table.virtualizer.isEnabled()).toBe(false);
    expect(queryShadow(table, '.table-toolbar')).toBeTruthy();
  });

  it('invalidates cached aggregates after in-place column configuration changes', async () => {
    const columns: any[] = COLS.map(({ aggregate: _aggregate, ...column }) => ({ ...column }));
    table = await makeTable(columns, PEOPLE);
    table.groupBy = 'dept';
    await wait(30);
    expect(queryShadowAll(table, 'tr.group-aggregate-row')).toHaveLength(0);

    columns[2].aggregate = 'sum';
    table.renderBody();
    expect(queryShadow(table, 'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]')
      ?.getAttribute('data-agg-value')).toBe('460');

    columns[2].aggregate = 'avg';
    table.renderBody();
    expect(queryShadow(table, 'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]')
      ?.getAttribute('data-agg-value')).toBe('92');
  });

  it('applies valueFormatter to aggregate results without rerunning valueGetter', async () => {
    let getterCalls = 0;
    table = await makeTable([
      { key: 'name', label: 'Name', type: 'text' },
      {
        key: 'salary',
        label: 'Salary',
        type: 'text',
        aggregate: 'sum',
        valueGetter: (value: number) => { getterCalls++; return value * 2; },
        valueFormatter: (value: number) => `Total ${value}`,
      },
    ], PEOPLE);
    await wait(30);

    const totalCell = queryShadow(table,
      'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"] snice-cell-text') as any;
    expect(totalCell.shadowRoot.querySelector('.cell-content')?.textContent?.trim()).toBe('Total 920');
    expect(getterCalls).toBe(PEOPLE.length);
  });

  it('keeps grouped keyboard bounds aligned with tool and hidden columns', async () => {
    table = await makeTable(COLS, PEOPLE, { selectable: true });
    table.groupBy = 'dept';
    await wait(30);
    table.setColumnVisible('salary', false);
    await wait(20);

    const grid = queryShadow(table, 'table')!;
    grid.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'End', ctrlKey: true, bubbles: true, cancelable: true, composed: true,
    }));
    const focused = queryShadow(table, 'tbody [data-grid-focus]') as HTMLElement;
    expect(grid.getAttribute('aria-colcount')).toBe('3'); // select + name + dept
    expect(focused?.getAttribute('data-key')).toBe('dept');
  });

  it('reparents cross-group row drops and preserves selection/detail identity', async () => {
    const rows = [
      { name: 'A one', dept: 'A', salary: 1 },
      { name: 'B one', dept: 'B', salary: 2 },
      { name: 'A two', dept: 'A', salary: 3 },
    ];
    table = await makeTable(COLS, rows, { 'row-reorder': true, selectable: true });
    table.setDetailPanel({ getDetailContent: (row: any) => row.name });
    table.groupBy = 'dept';
    table.selectedRows = [0];
    table.expandRow(0);
    await wait(30);
    const source = rows[0];

    table.dispatchEvent(new CustomEvent('row-reorder', {
      detail: { fromIndex: 0, toIndex: 1 }, bubbles: true, composed: true,
    }));
    await wait(30);

    expect(source.dept).toBe('B');
    expect(table.data[1]).toBe(source);
    expect(table.selectedRows).toEqual([1]);
    expect(table.masterDetail.isExpanded(1)).toBe(true);
    const counts = Array.from(queryShadowAll(table, '.group-header-count')).map((cell) => cell.textContent);
    expect(counts).toEqual(['1', '2']);
  });

  // ── Reactive groupBy ─────────────────────────────────────────────────
  it('reactive groupBy assignment takes effect post-mount and can be cleared', async () => {
    table = await makeTable(COLS, PEOPLE);
    // ungrouped: no group headers
    expect(queryShadowAll(table, 'tbody tr.group-header-row').length).toBe(0);

    table.groupBy = 'dept';
    await wait(30);
    expect(queryShadowAll(table, 'tbody tr.group-header-row').length).toBe(2);

    table.groupBy = 'level';
    await wait(30);
    const labels = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .map((h) => h.querySelector('.group-header-label')?.textContent);
    expect(labels).toEqual(['Jr', 'Sr']);

    table.groupBy = '';
    await wait(30);
    expect(queryShadowAll(table, 'tbody tr.group-header-row').length).toBe(0);
    expect(queryShadowAll(table, 'tbody tr[data-index]').length).toBe(5);
  });
});
