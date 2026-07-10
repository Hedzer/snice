/**
 * Phase 0 — Task 3: virtualization must not silently drop features.
 *
 * The virtual render path (`renderRowRange`) only looped `createRow` over the
 * raw filtered data. Three features handled by the normal render path were
 * silently dropped under `virtualize`:
 *   1. Master-detail: expanded detail rows never rendered.
 *   2. Tree data: rendered raw rows instead of the flattened visible tree, so
 *      expand/collapse did nothing and the virtualizer counted raw length.
 *   3. Pinned rows: pinned-top / pinned-bottom rows never rendered at all.
 *
 * Fix: the virtual path renders from the same feature-aware model as the normal
 * path — flattened tree rows, in-window detail rows, and pinned rows that live
 * outside the windowed range (always present).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/table/snice-table';

// ── Helpers ──

function makeCols(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    key: `c${i}`,
    label: `Col ${i}`,
    type: 'text' as const,
  }));
}

function makeRows(n: number, cols = makeCols(3)) {
  return Array.from({ length: n }, (_, r) =>
    Object.fromEntries(cols.map((c) => [c.key, `${c.key}-${r}`])),
  );
}

async function createVTable(opts: { columns: any[]; data: any[] }) {
  const table = await createComponent<any>('snice-table', {
    virtualize: true,
    'row-height': 40,
  });
  table.columns = opts.columns;
  table.data = opts.data;
  table.unsortedData = [...opts.data];
  (table as any).columnManager.initialize(opts.columns, table);
  await wait(60); // let the @ready rAF run setupVirtualization
  table.renderHeader();
  table.renderBody();
  await wait(60);
  return table;
}

function dataRowCount(table: any): number {
  return queryShadowAll(table as HTMLElement, 'tbody tr[data-index]').length;
}

function scrollTo(table: any, top: number) {
  const sc = queryShadow(table as HTMLElement, '.snice-table') as HTMLElement;
  sc.scrollTop = top;
  sc.dispatchEvent(new Event('scroll'));
}

const TREE_COLS = [{ key: 'name', label: 'Name', type: 'text' as const }];
const TREE_DATA = [
  { name: 'USA', path: ['USA'] },
  { name: 'California', path: ['USA', 'CA'] },
  { name: 'New York', path: ['USA', 'NY'] },
  { name: 'Europe', path: ['Europe'] },
];

describe('snice-table virtualization must not drop features (Task 3)', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  it('renders an expanded master-detail row inside the virtual window', async () => {
    table = await createVTable({ columns: makeCols(3), data: makeRows(1000) });
    table.setDetailPanel({
      getDetailContent: (row: any) => `<div class="detail-body">detail ${row.c0}</div>`,
    });
    await wait(30);

    table.expandRow(2);
    await wait(30);

    const detailRow = queryShadow(table as HTMLElement, 'tbody tr.detail-row');
    expect(detailRow).toBeTruthy();
    expect(detailRow!.getAttribute('data-detail-for')).toBe('2');
  });

  it('renders the flattened tree and expanding a parent inserts children in-window', async () => {
    table = await createVTable({ columns: TREE_COLS, data: TREE_DATA });
    table.setTreeData({
      getPath: (r: any) => r.path,
      groupColumn: 'name',
      defaultExpansionDepth: 0,
    });
    await wait(30);

    // Collapsed: only the two root nodes are visible (USA, Europe), not all 4 raw rows.
    expect(dataRowCount(table)).toBe(2);
    // Tree toggle is wired on the group column (the raw path renders none).
    expect(queryShadow(table as HTMLElement, 'tbody .tree-toggle')).toBeTruthy();

    // Expand USA → its two children appear in the window; total reflects flattened count.
    table.expandTreeNode('USA');
    await wait(30);

    expect(dataRowCount(table)).toBe(4);
    const names = Array.from(
      queryShadowAll(table as HTMLElement, 'tbody tr[data-index] td[data-key="name"]'),
    ).map((td) => (td as HTMLElement).textContent);
    expect(names.some((n) => n?.includes('California'))).toBe(true);
    expect(names.some((n) => n?.includes('New York'))).toBe(true);
  });

  it('keeps a pinned-top row present regardless of scroll position', async () => {
    table = await createVTable({ columns: makeCols(3), data: makeRows(1000) });
    table.pinRowTop({ c0: 'PINNED', c1: 'x', c2: 'y' });
    await wait(30);

    expect(queryShadow(table as HTMLElement, 'tbody tr.pinned-row--top')).toBeTruthy();

    // Scroll far down: the window moves off row 0, but the pinned row survives.
    scrollTo(table, 20000);
    await wait(50);

    expect(queryShadow(table as HTMLElement, 'tbody tr.pinned-row--top')).toBeTruthy();
    expect(queryShadow(table as HTMLElement, 'tbody tr[data-index="0"]')).toBeFalsy();
  });

  it('still windows correctly without extra features (bounded DOM rows while scrolling)', async () => {
    table = await createVTable({ columns: makeCols(3), data: makeRows(1000) });
    await wait(30);

    const initial = dataRowCount(table);
    expect(initial).toBeGreaterThan(0);
    expect(initial).toBeLessThan(50); // windowed, not all 1000

    scrollTo(table, 20000);
    await wait(50);

    const after = dataRowCount(table);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(50);
    expect(queryShadow(table as HTMLElement, 'tbody tr[data-index="0"]')).toBeFalsy();
  });
});
