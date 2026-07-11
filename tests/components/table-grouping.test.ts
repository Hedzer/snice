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
    g.processData(PEOPLE);
    g.collapse('group:dept=Eng');
    const items = g.processData(PEOPLE);
    expect(groups(items).map((x) => x.value)).toEqual(['Eng', 'Sales']);
    // Eng's 3 rows are gone; Sales' 2 remain
    expect(dataRows(items).length).toBe(2);
    expect(g.isExpanded('group:dept=Eng')).toBe(false);
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

  it('numeric aggregators tolerate empty / non-numeric', () => {
    expect(computeAggregate('sum', [], [])).toBe(0);
    expect(computeAggregate('avg', [], [])).toBe(0);
    expect(computeAggregate('min', [], [])).toBe(null);
    expect(computeAggregate('max', [], [])).toBe(null);
    expect(computeAggregate('count', [], [{}, {}])).toBe(2);
    expect(computeAggregate('sum', ['x', 5, null], [{}, {}, {}])).toBe(5);
  });

  it('createToggle builds a chevron reusing the tree-toggle affordance + dispatches group-toggle', async () => {
    const g = make(['dept']);
    const items = g.processData(PEOPLE);
    const eng = groups(items).find((x) => x.value === 'Eng')!;
    const toggle = g.createToggle(eng);
    const btn = toggle.querySelector('.tree-toggle') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('tree-toggle--expanded')).toBe(true);

    let detail: any = null;
    btn.addEventListener('group-toggle', (e: any) => (detail = e.detail));
    btn.click();
    expect(detail).toEqual({ key: eng.key, value: 'Eng', expanded: false });
    expect(g.isExpanded(eng.key)).toBe(false);
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

  it('clicking a group chevron collapses it and fires group-toggle', async () => {
    table = await makeTable(COLS, PEOPLE);
    table.groupBy = 'dept';
    await wait(30);

    const events: any[] = [];
    table.addEventListener('group-toggle', (e: CustomEvent) => events.push(e.detail));

    const engHeader = Array.from(queryShadowAll(table, 'tbody tr.group-header-row'))
      .find((h) => h.querySelector('.group-header-label')?.textContent === 'Eng')!;
    const chevron = engHeader.querySelector('.tree-toggle') as HTMLElement;
    chevron.click();
    await wait(30);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ key: 'group:dept=Eng', value: 'Eng', expanded: false });
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
    table = await makeTable(COLS, PEOPLE, { editable: true, 'edit-mode': 'cell' });
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
