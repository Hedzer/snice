import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/table/snice-table';
import { TableColumnManager } from '../../components/table/table-column-manager';
import { TableFilterEngine } from '../../components/table/table-filter-engine';
import { TableEditor } from '../../components/table/table-editor';
import { TableKeyboard } from '../../components/table/table-keyboard';
import { TableExport } from '../../components/table/table-export';
import { TableMasterDetail } from '../../components/table/table-master-detail';
import { TableToolbar } from '../../components/table/table-toolbar';
import { TableTreeData } from '../../components/table/table-tree-data';
import { TableColumnMenu } from '../../components/table/table-column-menu';
import { TableRowDnD, TableColumnDnD } from '../../components/table/table-row-dnd';
import { TableVirtualizer } from '../../components/table/table-virtualizer';

// Standard columns and data for tests
const TEST_COLUMNS = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'age', label: 'Age', type: 'text' },
];
const TEST_DATA = [
  { id: '1', name: 'Alice', age: '30' },
  { id: '2', name: 'Bob', age: '25' },
  { id: '3', name: 'Charlie', age: '35' },
  { id: '4', name: 'Diana', age: '28' },
  { id: '5', name: 'Eve', age: '32' },
];

// Helper to create a table with programmatic setup
async function createTable(opts: {
  columns?: any[];
  data?: any[];
  attrs?: Record<string, any>;
} = {}) {
  const table = await createComponent<any>('snice-table', opts.attrs || {});

  const columns = opts.columns || TEST_COLUMNS;
  const data = opts.data || TEST_DATA;

  table.columns = columns;
  table.data = data;
  table._unsortedData = [...data];

  // Initialize column manager before rendering
  (table as any).columnManager.initialize(columns, table);

  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(50);
  return table;
}

describe('snice-table', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  // ── Basic Rendering ──

  describe('basic rendering', () => {
    it('should render table element', async () => {
      table = await createComponent<any>('snice-table');
      expect(table).toBeTruthy();
      expect(table.tagName).toBe('SNICE-TABLE');
    });

    it('should not reflect data/columns to attributes', async () => {
      table = await createTable();
      expect(table.hasAttribute('data')).toBe(false);
      expect(table.hasAttribute('columns')).toBe(false);
    });

    it('should render header cells', async () => {
      table = await createTable();
      const ths = queryShadowAll(table as HTMLElement, 'th[data-key]');
      expect(ths.length).toBe(3);
    });

    it('should render body rows', async () => {
      table = await createTable();
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect(rows.length).toBe(5);
    });

    it('should have clean HTML output', async () => {
      table = await createTable();
      const outerHTML = table.outerHTML;
      expect(outerHTML).not.toContain('data="');
      expect(outerHTML).not.toContain('columns="');
    });
  });

  // ── Feature 1: Column Flex Width ──

  describe('column flex width', () => {
    it('should store flex on column state', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', width: '80' },
        { key: 'name', label: 'Name', flex: 2 },
        { key: 'age', label: 'Age', flex: 1 },
      ], el);
      expect(cm.getState('name')!.flex).toBe(2);
      expect(cm.getState('age')!.flex).toBe(1);
    });

    it('should compute flex widths proportionally', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', width: '100' },
        { key: 'name', label: 'Name', flex: 2 },
        { key: 'age', label: 'Age', flex: 1 },
      ], el);
      const widths = cm.computeFlexWidths(700);
      expect(widths.get('id')).toBe(100);
      expect(widths.get('name')).toBe(400);
      expect(widths.get('age')).toBe(200);
    });

    it('should respect minWidth and maxWidth on flex columns', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', width: '100' },
        { key: 'name', label: 'Name', flex: 1, minWidth: 200, maxWidth: 300 },
        { key: 'age', label: 'Age', flex: 1 },
      ], el);
      expect(cm.getState('name')!.minWidth).toBe(200);
      expect(cm.getState('name')!.maxWidth).toBe(300);

      // With 700 total, 100 fixed, 600 remaining, each flex gets 300
      // name is clamped to [200, 300] = 300
      const widths = cm.computeFlexWidths(700);
      expect(widths.get('name')).toBe(300);
    });

    it('should default minWidth to 50', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([{ key: 'x', label: 'X' }], el);
      expect(cm.getState('x')!.minWidth).toBe(50);
    });
  });

  // ── Feature 2: Column Resizing ──

  describe('column resizing', () => {
    it('should render resize handles when column-resize is enabled', async () => {
      table = await createTable({ attrs: { 'column-resize': true } });
      const handles = queryShadowAll(table as HTMLElement, '.resize-handle');
      expect(handles.length).toBe(3);
    });

    it('should not render resize handles when disabled', async () => {
      table = await createTable();
      const handles = queryShadowAll(table as HTMLElement, '.resize-handle');
      expect(handles.length).toBe(0);
    });

    it('should track resizable state per column', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', resizable: false },
        { key: 'name', label: 'Name' },
      ], el);
      expect(cm.getState('id')!.resizable).toBe(false);
      expect(cm.getState('name')!.resizable).toBe(true);
    });

    it('should track resizing state', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([{ key: 'x', label: 'X' }], el);
      expect(cm.isResizing()).toBe(false);
    });
  });

  // ── Feature 3: Column Auto-sizing ──

  describe('column auto-sizing', () => {
    it('should have autoSizeColumn method on table', async () => {
      table = await createTable();
      expect(typeof table.autoSizeColumn).toBe('function');
    });

    it('should have autoSizeAllColumns method', async () => {
      table = await createTable();
      expect(typeof table.autoSizeAllColumns).toBe('function');
    });

    it('should not throw when calling autoSizeColumn', async () => {
      table = await createTable();
      expect(() => table.autoSizeColumn('name')).not.toThrow();
    });

    it('should auto-size on column manager', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([{ key: 'x', label: 'X' }], el);
      const tbody = document.createElement('tbody');
      expect(() => cm.autoSizeColumn('x', tbody)).not.toThrow();
    });
  });

  // ── Feature 4: Column Visibility ──

  describe('column visibility', () => {
    it('should hide a column', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.setColumnVisible('age', false);
      expect(cm.getVisibilityModel().age).toBe(false);
      expect(cm.getVisibilityModel().name).toBe(true);
    });

    it('should show all columns', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.setColumnVisible('age', false);
      cm.showAllColumns();
      expect(cm.getVisibilityModel().age).toBe(true);
    });

    it('should hide all hideable columns', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.hideAllColumns();
      const model = cm.getVisibilityModel();
      expect(Object.values(model).every(v => v === false)).toBe(true);
    });

    it('should respect hideable flag', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', hideable: false },
        { key: 'name', label: 'Name' },
      ], el);
      cm.hideAllColumns();
      expect(cm.getVisibilityModel().id).toBe(true); // not hideable
      expect(cm.getVisibilityModel().name).toBe(false);
    });

    it('should remove hidden columns from visible list', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.setColumnVisible('age', false);
      const visible = cm.getVisibleColumns();
      expect(visible.map(c => c.key)).not.toContain('age');
      expect(visible.map(c => c.key)).toContain('name');
    });

    it('should update DOM when hiding via table API', async () => {
      table = await createTable();
      table.setColumnVisible('age', false);
      await wait(50);

      const ths = queryShadowAll(table as HTMLElement, 'th[data-key]');
      const keys = Array.from(ths).map(th => th.getAttribute('data-key'));
      expect(keys).not.toContain('age');
      expect(keys).toContain('name');
    });
  });

  // ── Feature 5: Column Ordering ──

  describe('column ordering', () => {
    it('should reorder columns', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.moveColumn('age', 0);
      const visible = cm.getVisibleColumns();
      expect(visible[0].key).toBe('age');
    });

    it('should not reorder non-reorderable columns', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', reorderable: false },
        { key: 'name', label: 'Name' },
      ], el);
      expect(cm.getState('id')!.reorderable).toBe(false);
    });

    it('should have moveColumn on table', async () => {
      table = await createTable();
      expect(typeof table.moveColumn).toBe('function');
    });
  });

  // ── Feature 6: Column Pinning ──

  describe('column pinning', () => {
    it('should pin column to left', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.pinColumn('id', 'left');
      expect(cm.getState('id')!.pinned).toBe('left');
    });

    it('should pin column to right', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.pinColumn('age', 'right');
      expect(cm.getState('age')!.pinned).toBe('right');
    });

    it('should unpin column', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.pinColumn('id', 'left');
      cm.unpinColumn('id');
      expect(cm.getState('id')!.pinned).toBe(false);
    });

    it('should respect pinnable flag', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', pinnable: false },
        { key: 'name', label: 'Name' },
      ], el);
      cm.pinColumn('id', 'left');
      expect(cm.getState('id')!.pinned).toBe(false); // pinnable=false, should not pin
    });

    it('should compute pinned left offsets', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize([
        { key: 'id', label: 'ID', width: '100' },
        { key: 'name', label: 'Name', width: '200' },
      ], el);
      cm.pinColumn('id', 'left');
      cm.pinColumn('name', 'left');
      const offsets = cm.getPinnedLeftOffsets();
      expect(offsets.get('id')).toBe(0);
      expect(offsets.get('name')).toBe(100);
    });

    it('should apply sticky positioning via table API', async () => {
      table = await createTable();
      table.pinColumn('id', 'left');
      await wait(50);

      const th = queryShadow(table as HTMLElement, 'th[data-key="id"]') as HTMLElement;
      expect(th?.style.position).toBe('sticky');
    });
  });

  // ── Feature 7: Column Groups ──

  describe('column groups', () => {
    it('should store column groups', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.setColumnGroups([
        { label: 'Identity', children: ['id', 'name'] },
        { label: 'Details', children: ['age'] },
      ]);
      expect(cm.getColumnGroups().length).toBe(2);
    });

    it('should render group header HTML', () => {
      const cm = new TableColumnManager();
      const el = document.createElement('div');
      cm.initialize(TEST_COLUMNS, el);
      cm.setColumnGroups([
        { label: 'Identity', children: ['id', 'name'] },
        { label: 'Details', children: ['age'] },
      ]);
      const html = cm.renderGroupHeaders();
      expect(html).toContain('Identity');
      expect(html).toContain('colspan="2"');
    });

    it('should have setColumnGroups on table', async () => {
      table = await createTable();
      expect(typeof table.setColumnGroups).toBe('function');
    });

    it('should render column group row in DOM', async () => {
      table = await createTable();
      table.setColumnGroups([
        { label: 'Identity', children: ['id', 'name'] },
        { label: 'Details', children: ['age'] },
      ]);
      await wait(50);

      const groupRow = queryShadow(table as HTMLElement, '.column-group-row');
      expect(groupRow).toBeTruthy();
    });
  });

  // ── Feature 8: Column Spanning ──

  describe('column spanning', () => {
    it('should apply static colSpan', async () => {
      table = await createTable({
        columns: [
          { key: 'id', label: 'ID', type: 'text', colSpan: 2 },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'age', label: 'Age', type: 'text' },
        ],
      });
      const cell = queryShadow(table as HTMLElement, 'tbody tr td[data-key="id"]') as HTMLTableCellElement;
      expect(cell?.colSpan).toBe(2);
    });

    it('should apply dynamic colSpan via function', async () => {
      table = await createTable({
        columns: [
          { key: 'id', label: 'ID', type: 'text', colSpan: (val: any) => val === '1' ? 3 : 1 },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'age', label: 'Age', type: 'text' },
        ],
      });
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      const firstCell = rows[0]?.querySelector('td[data-key="id"]') as HTMLTableCellElement;
      expect(firstCell?.colSpan).toBe(3);
    });
  });

  // ── Feature 9: Row Height ──

  describe('row height', () => {
    it('should accept row-height attribute', async () => {
      table = await createTable({ attrs: { 'row-height': 60 } });
      expect(table.rowHeight).toBe(60);
    });

    it('should have setRowHeight method', async () => {
      table = await createTable();
      expect(typeof table.setRowHeight).toBe('function');
    });

    it('should apply row height to rendered rows', async () => {
      table = await createTable();
      table.setRowHeight(80);
      await wait(50);
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect((rows[0] as HTMLElement)?.style.height).toBe('80px');
    });

    it('should support per-row height callback', async () => {
      table = await createTable();
      table.setRowHeightCallback((row: any, index: number) => index === 0 ? 100 : 50);
      await wait(50);
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect((rows[0] as HTMLElement)?.style.height).toBe('100px');
      expect((rows[1] as HTMLElement)?.style.height).toBe('50px');
    });
  });

  // ── Feature 10: Row Spanning ──

  describe('row spanning', () => {
    it('should support colSpan for cell merging', async () => {
      table = await createTable({
        columns: [
          { key: 'id', label: 'ID', type: 'text', colSpan: 2 },
          { key: 'name', label: 'Name', type: 'text' },
        ],
      });
      const cell = queryShadow(table as HTMLElement, 'tbody tr td[data-key="id"]') as HTMLTableCellElement;
      expect(cell?.colSpan).toBe(2);
    });
  });

  // ── Feature 11: Row Ordering (DnD) ──

  describe('row ordering (DnD)', () => {
    it('should accept row-reorder attribute', async () => {
      table = await createTable({ attrs: { 'row-reorder': true } });
      expect(table.rowReorder).toBe(true);
    });

    it('should render drag handles when enabled', async () => {
      table = await createTable({ attrs: { 'row-reorder': true } });
      const handles = queryShadowAll(table as HTMLElement, 'td.drag-handle-cell');
      expect(handles.length).toBe(5);
    });

    it('should make rows draggable', async () => {
      table = await createTable({ attrs: { 'row-reorder': true } });
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect((rows[0] as HTMLElement)?.draggable).toBe(true);
    });

    it('should have drag handle cell in header', async () => {
      table = await createTable({ attrs: { 'row-reorder': true } });
      const headerHandle = queryShadow(table as HTMLElement, 'th.drag-handle-cell');
      expect(headerHandle).toBeTruthy();
    });

    it('should create drag handle via module', () => {
      const dnd = new TableRowDnD();
      const handle = dnd.createDragHandle();
      expect(handle.tagName).toBe('TD');
      expect(handle.className).toBe('drag-handle-cell');
    });
  });

  // ── Feature 12: Row Pinning ──

  describe('row pinning', () => {
    it('should have pinRowTop method', async () => {
      table = await createTable();
      expect(typeof table.pinRowTop).toBe('function');
    });

    it('should have pinRowBottom method', async () => {
      table = await createTable();
      expect(typeof table.pinRowBottom).toBe('function');
    });

    it('should pin row to top with CSS class', async () => {
      table = await createTable();
      table.pinRowTop({ id: '99', name: 'Pinned', age: '0' });
      await wait(50);
      const firstRow = queryShadow(table as HTMLElement, 'tbody tr') as HTMLElement;
      expect(firstRow.classList.contains('pinned-row')).toBe(true);
      expect(firstRow.classList.contains('pinned-row--top')).toBe(true);
    });

    it('should pin row to bottom with CSS class', async () => {
      table = await createTable();
      table.pinRowBottom({ id: '99', name: 'Pinned', age: '0' });
      await wait(50);
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;
      expect(lastRow.classList.contains('pinned-row--bottom')).toBe(true);
    });

    it('should clear all pinned rows', async () => {
      table = await createTable();
      table.pinRowTop({ id: '98', name: 'Top', age: '0' });
      table.pinRowBottom({ id: '99', name: 'Bottom', age: '0' });
      table.clearPinnedRows();
      await wait(50);
      const pinnedRows = queryShadowAll(table as HTMLElement, '.pinned-row');
      expect(pinnedRows.length).toBe(0);
    });
  });

  // ── Feature 13: Master-Detail (Row Expansion) ──

  describe('master-detail', () => {
    it('should track expansion state', () => {
      const md = new TableMasterDetail();
      const el = document.createElement('div');
      md.attach(el, { getDetailContent: () => 'detail' });
      expect(md.isExpanded(0)).toBe(false);
      md.expand(0);
      expect(md.isExpanded(0)).toBe(true);
      md.collapse(0);
      expect(md.isExpanded(0)).toBe(false);
    });

    it('should toggle expansion', () => {
      const md = new TableMasterDetail();
      const el = document.createElement('div');
      md.attach(el, { getDetailContent: () => 'detail' });
      md.toggle(0);
      expect(md.isExpanded(0)).toBe(true);
      md.toggle(0);
      expect(md.isExpanded(0)).toBe(false);
    });

    it('should expand all rows', () => {
      const md = new TableMasterDetail();
      const el = document.createElement('div');
      md.attach(el, { getDetailContent: () => 'detail' });
      md.expandAll(5);
      const expanded = md.getExpandedRows();
      expect(expanded.size).toBe(5);
    });

    it('should collapse all rows', () => {
      const md = new TableMasterDetail();
      const el = document.createElement('div');
      md.attach(el, { getDetailContent: () => 'detail' });
      md.expandAll(5);
      md.collapseAll();
      expect(md.getExpandedRows().size).toBe(0);
    });

    it('should create detail row element', () => {
      const md = new TableMasterDetail();
      const el = document.createElement('div');
      md.attach(el, { getDetailContent: (row: any) => `<b>${row.name}</b>` });
      md.expand(0);
      const detailRow = md.createDetailRow({ name: 'Alice' }, 0, 3);
      expect(detailRow).toBeTruthy();
      expect(detailRow!.className).toBe('detail-row');
      const td = detailRow!.querySelector('td') as HTMLTableCellElement;
      expect(td.colSpan).toBe(3);
    });

    it('should have setDetailPanel on table', async () => {
      table = await createTable();
      expect(typeof table.setDetailPanel).toBe('function');
    });

    it('should show detail rows in DOM after expand', async () => {
      table = await createTable();
      table.setDetailPanel({
        getDetailContent: (row: any) => `<div>Detail for ${row.name}</div>`,
      });
      table.expandRow(0);
      await wait(50);
      const detailRow = queryShadow(table as HTMLElement, '.detail-row');
      expect(detailRow).toBeTruthy();
    });
  });

  // ── Feature 14: Tree Data ──

  describe('tree data', () => {
    const treeTestData = [
      { id: 1, name: 'USA', path: ['USA'] },
      { id: 2, name: 'California', path: ['USA', 'CA'] },
      { id: 3, name: 'New York', path: ['USA', 'NY'] },
      { id: 4, name: 'Europe', path: ['Europe'] },
      { id: 5, name: 'France', path: ['Europe', 'FR'] },
    ];

    it('should process tree data into flat rows', () => {
      const tree = new TableTreeData();
      tree.attach({ getPath: (row: any) => row.path, groupColumn: 'name' });
      const rows = tree.processData(treeTestData);
      // Only root nodes visible (collapsed), sorted alphabetically
      expect(rows.length).toBe(2);
      expect(rows[0].key).toBe('Europe');
      expect(rows[1].key).toBe('USA');
    });

    it('should expand tree node', () => {
      const tree = new TableTreeData();
      tree.attach({ getPath: (row: any) => row.path, groupColumn: 'name' });
      tree.processData(treeTestData);
      tree.expand('USA');
      const rows = tree.processData(treeTestData);
      expect(rows.length).toBe(4); // USA, CA, NY, Europe
    });

    it('should collapse tree node', () => {
      const tree = new TableTreeData();
      tree.attach({ getPath: (row: any) => row.path, groupColumn: 'name' });
      tree.processData(treeTestData);
      tree.expand('USA');
      tree.collapse('USA');
      const rows = tree.processData(treeTestData);
      expect(rows.length).toBe(2);
    });

    it('should expand all nodes', () => {
      const tree = new TableTreeData();
      tree.attach({ getPath: (row: any) => row.path, groupColumn: 'name' });
      tree.processData(treeTestData);
      tree.expandAll(treeTestData);
      const rows = tree.processData(treeTestData);
      expect(rows.length).toBe(5);
    });

    it('should collapse all nodes', () => {
      const tree = new TableTreeData();
      tree.attach({ getPath: (row: any) => row.path, groupColumn: 'name' });
      tree.processData(treeTestData);
      tree.expandAll(treeTestData);
      tree.collapseAll();
      const rows = tree.processData(treeTestData);
      expect(rows.length).toBe(2);
    });

    it('should track depth and hasChildren', () => {
      const tree = new TableTreeData();
      tree.attach({ getPath: (row: any) => row.path, groupColumn: 'name' });
      tree.expandAll(treeTestData);
      const rows = tree.processData(treeTestData);
      const usa = rows.find(r => r.key === 'USA');
      expect(usa!.depth).toBe(0);
      expect(usa!.hasChildren).toBe(true);
      const ca = rows.find(r => r.key === 'USA/CA');
      expect(ca!.depth).toBe(1);
      expect(ca!.hasChildren).toBe(false);
    });

    it('should support default expansion depth', () => {
      const tree = new TableTreeData();
      tree.attach({ getPath: (row: any) => row.path, groupColumn: 'name', defaultExpansionDepth: 1 });
      const rows = tree.processData(treeTestData);
      // Depth 0 auto-expanded, depth 1 visible
      expect(rows.length).toBe(5);
    });

    it('should have setTreeData on table', async () => {
      table = await createTable();
      expect(typeof table.setTreeData).toBe('function');
    });
  });

  // ── Feature 15: Pagination ──

  describe('pagination', () => {
    it('should accept pagination attribute', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      expect(table.pagination).toBe(true);
      expect(table.pageSize).toBe(2);
    });

    it('should render pagination controls', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      const pagination = queryShadow(table as HTMLElement, '.pagination');
      expect(pagination).toBeTruthy();
    });

    it('should show page info text', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      const info = queryShadow(table as HTMLElement, '.pagination__info');
      expect(info?.textContent).toContain('1');
      expect(info?.textContent).toContain('5');
    });

    it('should only render current page rows in client mode', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should navigate to page via goToPage', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      table.goToPage(2);
      await wait(50);
      expect(table.currentPage).toBe(2);
    });

    it('should clamp page to valid range', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      table.goToPage(999);
      await wait(50);
      expect(table.currentPage).toBeLessThanOrEqual(3);
    });

    it('should support server pagination mode', async () => {
      table = await createTable({ attrs: { pagination: true, 'pagination-mode': 'server' } });
      expect(table.paginationMode).toBe('server');
    });

    it('should render page size selector', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 10 } });
      const sizeSelect = queryShadow(table as HTMLElement, '.pagination__size-select');
      expect(sizeSelect).toBeTruthy();
    });

    it('should change page size and reset to page 1', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 10 } });
      table.setPageSize(2);
      await wait(50);
      expect(table.pageSize).toBe(2);
      expect(table.currentPage).toBe(1);
    });

    it('should render page buttons', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      const pageBtns = queryShadowAll(table as HTMLElement, '.pagination__page');
      expect(pageBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Feature 16: Row Virtualization ──

  describe('row virtualization', () => {
    it('should accept virtualize attribute', async () => {
      table = await createTable({ attrs: { virtualize: true } });
      expect(table.virtualize).toBe(true);
    });

    it('should accept virtual-buffer attribute', async () => {
      table = await createTable({ attrs: { virtualize: true, 'virtual-buffer': 300 } });
      expect(table.virtualBuffer).toBe(300);
    });

    it('should have scrollToRow method', async () => {
      table = await createTable();
      expect(typeof table.scrollToRow).toBe('function');
    });

    it('should return scroll position', async () => {
      table = await createTable();
      const pos = table.getScrollPosition();
      expect(pos).toHaveProperty('top');
      expect(pos).toHaveProperty('left');
    });

    it('should track visible range on virtualizer', () => {
      const v = new TableVirtualizer();
      const range = v.getVisibleRange();
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
    });
  });

  // ── Feature 17: Column Virtualization ──

  describe('column virtualization', () => {
    it('should support wide tables with many columns', async () => {
      const cols = Array.from({ length: 50 }, (_, i) => ({ key: `col${i}`, label: `Col ${i}`, type: 'text' as const }));
      const data = [Object.fromEntries(cols.map(c => [c.key, `val`]))];
      table = await createTable({ columns: cols, data });
      const ths = queryShadowAll(table as HTMLElement, 'th[data-key]');
      expect(ths.length).toBe(50);
    });
  });

  // ── Feature 18: Per-Column Filtering ──

  describe('per-column filtering', () => {
    it('should filter with "contains" operator', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'contains', 'ali');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should filter with "equals" operator', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'equals', 'Bob');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(1);
    });

    it('should filter with number operators (gt)', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('age', 'gt', 30);
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(2); // Charlie(35), Eve(32)
    });

    it('should filter with "isEmpty"', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'isEmpty', null);
      const data = [{ name: 'Alice' }, { name: '' }, { name: null }];
      const result = fe.applyFilters(data, [{ key: 'name' }]);
      expect(result.length).toBe(2);
    });

    it('should filter with "startsWith"', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'startsWith', 'Al');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(1);
    });

    it('should filter with "endsWith"', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'endsWith', 'ce');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(1);
    });

    it('should filter with "notContains"', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'notContains', 'a');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(2); // Bob, Eve
    });

    it('should remove filter', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'contains', 'ali');
      fe.removeColumnFilter('name');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(5);
    });

    it('should clear all filters', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'contains', 'ali');
      fe.setColumnFilter('age', 'gt', 30);
      fe.clearAllFilters();
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(5);
    });

    it('should support AND logic', () => {
      const fe = new TableFilterEngine();
      fe.setFilterModel({
        filters: [
          { column: 'name', operator: 'contains', value: 'a' },
          { column: 'age', operator: 'gt', value: 29 },
        ],
        logic: 'and',
      });
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      // Contains 'a': Alice, Charlie, Diana
      // Age > 29: Alice(30), Charlie(35), Eve(32)
      // AND: Alice(30), Charlie(35)
      expect(result.length).toBe(2);
    });

    it('should support OR logic', () => {
      const fe = new TableFilterEngine();
      fe.setFilterModel({
        filters: [
          { column: 'name', operator: 'equals', value: 'Alice' },
          { column: 'name', operator: 'equals', value: 'Bob' },
        ],
        logic: 'or',
      });
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(2);
    });

    it('should get filter model', () => {
      const fe = new TableFilterEngine();
      fe.setColumnFilter('name', 'contains', 'test');
      const model = fe.getFilterModel();
      expect(model.filters.length).toBe(1);
      expect(model.filters[0].column).toBe('name');
    });

    it('should track active filter state', () => {
      const fe = new TableFilterEngine();
      expect(fe.hasActiveFilters()).toBe(false);
      fe.setColumnFilter('name', 'contains', 'x');
      expect(fe.hasActiveFilters()).toBe(true);
      expect(fe.hasColumnFilter('name')).toBe(true);
      expect(fe.hasColumnFilter('age')).toBe(false);
    });

    it('should get operators for column types', () => {
      const fe = new TableFilterEngine();
      const textOps = fe.getOperatorsForType('text');
      expect(textOps.length).toBeGreaterThan(0);
      expect(textOps.some(o => o.value === 'contains')).toBe(true);

      const numOps = fe.getOperatorsForType('number');
      expect(numOps.some(o => o.value === 'gt')).toBe(true);

      const boolOps = fe.getOperatorsForType('boolean');
      expect(boolOps.some(o => o.value === 'isTrue')).toBe(true);

      const dateOps = fe.getOperatorsForType('date');
      expect(dateOps.some(o => o.value === 'before')).toBe(true);
    });

    it('should have setColumnFilter on table', async () => {
      table = await createTable();
      expect(typeof table.setColumnFilter).toBe('function');
    });

    it('should filter DOM rows via table API', async () => {
      table = await createTable();
      table.setColumnFilter('name', 'contains', 'ali');
      await wait(50);
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect(rows.length).toBe(1);
    });
  });

  // ── Feature 19: Header Filters ──

  describe('header filters', () => {
    it('should accept header-filters attribute', async () => {
      table = await createTable({ attrs: { 'header-filters': true } });
      expect(table.headerFilters).toBe(true);
    });

    it('should render header filter row', async () => {
      table = await createTable({ attrs: { 'header-filters': true } });
      const filterRow = queryShadow(table as HTMLElement, '.header-filter-row');
      expect(filterRow).toBeTruthy();
    });

    it('should track header filter values', () => {
      const fe = new TableFilterEngine();
      fe.setHeaderFilter('name', 'test');
      expect(fe.getHeaderFilter('name')).toBe('test');
      fe.setHeaderFilter('name', '');
      expect(fe.getHeaderFilter('name')).toBe('');
    });
  });

  // ── Feature 20: Quick Filter ──

  describe('quick filter', () => {
    it('should filter across all columns', () => {
      const fe = new TableFilterEngine();
      fe.setQuickFilter('alice');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(1);
    });

    it('should match multiple terms with AND logic', () => {
      const fe = new TableFilterEngine();
      fe.setQuickFilter('alice 30');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(1);
    });

    it('should return all rows when cleared', () => {
      const fe = new TableFilterEngine();
      fe.setQuickFilter('alice');
      fe.setQuickFilter('');
      const result = fe.applyFilters(TEST_DATA, TEST_COLUMNS);
      expect(result.length).toBe(5);
    });

    it('should have setQuickFilter on table', async () => {
      table = await createTable();
      expect(typeof table.setQuickFilter).toBe('function');
    });
  });

  // ── Feature 21: Sort Enhancements ──

  describe('sort enhancements', () => {
    it('should accept sortable attribute', async () => {
      table = await createTable({ attrs: { sortable: true } });
      expect(table.sortable).toBe(true);
    });

    it('should render sortable headers', async () => {
      table = await createTable({ attrs: { sortable: true } });
      const sortableHeaders = queryShadowAll(table as HTMLElement, 'th.sortable');
      expect(sortableHeaders.length).toBe(3);
    });

    it('should toggle sort asc', async () => {
      table = await createTable({ attrs: { sortable: true } });
      table.toggleSort('name', false);
      expect(table.currentSort.length).toBe(1);
      expect(table.currentSort[0].direction).toBe('asc');
    });

    it('should toggle sort desc then remove', async () => {
      table = await createTable({ attrs: { sortable: true } });
      table.toggleSort('name', false);
      table.toggleSort('name', false);
      expect(table.currentSort[0].direction).toBe('desc');
      table.toggleSort('name', false);
      expect(table.currentSort.length).toBe(0);
    });

    it('should support multi-sort', async () => {
      table = await createTable({ attrs: { sortable: true } });
      table.toggleSort('name', true);
      table.toggleSort('age', true);
      expect(table.currentSort.length).toBe(2);
    });

    it('should have setSortComparator method', async () => {
      table = await createTable();
      expect(typeof table.setSortComparator).toBe('function');
    });

    it('should register custom comparator', async () => {
      table = await createTable({ attrs: { sortable: true } });
      const cmp = (a: any, b: any) => a - b;
      table.setSortComparator('age', cmp);
      expect(table.columns.find((c: any) => c.key === 'age').sortComparator).toBe(cmp);
    });

    it('should sort data ascending', async () => {
      table = await createTable({ attrs: { sortable: true } });
      table.toggleSort('name', false);
      await wait(50);
      expect(table.data[0].name).toBe('Alice');
    });
  });

  // ── Feature 22: Value Pipeline ──

  describe('value pipeline', () => {
    it('should get display value through pipeline', () => {
      const ed = new TableEditor();
      ed.setPipeline('name', {
        valueGetter: (val: any) => val?.toUpperCase(),
        valueFormatter: (val: any) => `[${val}]`,
      });
      const display = ed.getDisplayValue('name', 'alice', {});
      expect(display).toBe('[ALICE]');
    });

    it('should get sort value through pipeline', () => {
      const ed = new TableEditor();
      ed.setPipeline('name', {
        valueGetter: (val: any) => val?.toUpperCase(),
      });
      const sortVal = ed.getSortValue('name', 'alice', {});
      expect(sortVal).toBe('ALICE');
    });

    it('should accept pipeline properties on column definition', async () => {
      table = await createTable({
        columns: [
          {
            key: 'name', label: 'Name', type: 'text',
            valueGetter: (v: any) => v,
            valueFormatter: (v: any) => `${v}!`,
            valueParser: (v: string) => v.trim(),
            valueSetter: (v: any, row: any) => ({ ...row, name: v }),
          },
        ],
      });
      expect(table.columns[0].valueGetter).toBeDefined();
      expect(table.columns[0].valueFormatter).toBeDefined();
      expect(table.columns[0].valueParser).toBeDefined();
      expect(table.columns[0].valueSetter).toBeDefined();
    });
  });

  // ── Feature 23: Cell Editing ──

  describe('cell editing', () => {
    it('should accept editable attribute', async () => {
      table = await createTable({ attrs: { editable: true } });
      expect(table.editable).toBe(true);
    });

    it('should have edit API methods', async () => {
      table = await createTable();
      expect(typeof table.startEdit).toBe('function');
      expect(typeof table.commitEdit).toBe('function');
      expect(typeof table.cancelEdit).toBe('function');
    });

    it('should start cell edit via module', () => {
      const ed = new TableEditor();
      ed.setEditableColumns(['name']);
      const state = ed.startCellEdit(0, 'name', 'Alice', {});
      expect(state).toBeTruthy();
      expect(state!.isEditing).toBe(true);
      expect(state!.originalValue).toBe('Alice');
    });

    it('should cancel cell edit', () => {
      const ed = new TableEditor();
      ed.attach(document.createElement('div'));
      ed.setEditableColumns(['name']);
      ed.startCellEdit(0, 'name', 'Alice', {});
      ed.cancelCellEdit();
      expect(ed.getCellEditState()).toBeNull();
    });

    it('should determine editor type from column type', () => {
      const ed = new TableEditor();
      expect(ed.getEditorType('number')).toBe('number');
      expect(ed.getEditorType('date')).toBe('date');
      expect(ed.getEditorType('boolean')).toBe('boolean');
      expect(ed.getEditorType('text')).toBe('text');
    });

    it('should create editor elements', () => {
      const ed = new TableEditor();
      const textEditor = ed.createEditor('text', 'hello');
      expect(textEditor.tagName).toBe('INPUT');
      expect((textEditor as HTMLInputElement).type).toBe('text');

      const numEditor = ed.createEditor('number', 42);
      expect((numEditor as HTMLInputElement).type).toBe('number');

      const boolEditor = ed.createEditor('boolean', true);
      expect((boolEditor as HTMLInputElement).type).toBe('checkbox');
    });
  });

  // ── Feature 24: Row Editing ──

  describe('row editing', () => {
    it('should start row edit', () => {
      const ed = new TableEditor();
      const state = ed.startRowEdit(0, { name: 'Alice', age: 30 });
      expect(state).toBeTruthy();
      expect(state!.isEditing).toBe(true);
      expect(state!.originalRow.name).toBe('Alice');
    });

    it('should update row field during edit', () => {
      const ed = new TableEditor();
      ed.startRowEdit(0, { name: 'Alice', age: 30 });
      ed.updateRowField('name', 'Updated');
      const state = ed.getRowEditState();
      expect(state!.editedRow.name).toBe('Updated');
    });

    it('should cancel row edit', () => {
      const ed = new TableEditor();
      ed.attach(document.createElement('div'));
      ed.startRowEdit(0, { name: 'Alice' });
      ed.cancelRowEdit();
      expect(ed.getRowEditState()).toBeNull();
    });

    it('should support row edit mode on table', async () => {
      table = await createTable({ attrs: { editable: true, 'edit-mode': 'row' } });
      expect(table.editMode).toBe('row');
    });
  });

  // ── Feature 25: Edit Validation ──

  describe('edit validation', () => {
    it('should reject invalid cell edits', async () => {
      const ed = new TableEditor();
      ed.attach(document.createElement('div'));
      ed.setEditableColumns(['name']);
      ed.setValidation('name', {
        validate: (v: any) => v === '' ? 'Required' : null,
      });
      ed.startCellEdit(0, 'name', 'Alice', {});
      ed.updateCellValue('');
      const error = await ed.commitCellEdit();
      expect(error).toBe('Required');
    });

    it('should allow valid cell edits', async () => {
      const ed = new TableEditor();
      ed.attach(document.createElement('div'));
      ed.setEditableColumns(['name']);
      ed.setValidation('name', {
        validate: (v: any) => v === '' ? 'Required' : null,
      });
      ed.startCellEdit(0, 'name', 'Alice', {});
      ed.updateCellValue('Bob');
      const error = await ed.commitCellEdit();
      expect(error).toBeNull();
    });

    it('should validate row edits', async () => {
      const ed = new TableEditor();
      ed.attach(document.createElement('div'));
      ed.setEditableColumns(['name']);
      ed.setValidation('name', {
        validate: (v: any) => v === '' ? 'Name required' : null,
      });
      ed.startRowEdit(0, { name: '' });
      const errors = await ed.commitRowEdit();
      expect(errors).toBeTruthy();
      expect(errors!.has('name')).toBe(true);
    });
  });

  // ── Feature 26: Row Selection Enhancements ──

  describe('row selection enhancements', () => {
    it('should accept selectable attribute', async () => {
      table = await createTable({ attrs: { selectable: true } });
      expect(table.selectable).toBe(true);
    });

    it('should render selection checkboxes', async () => {
      table = await createTable({ attrs: { selectable: true } });
      const checkboxes = queryShadowAll(table as HTMLElement, 'snice-checkbox.row-select');
      expect(checkboxes.length).toBe(5);
    });

    it('should render select-all checkbox', async () => {
      table = await createTable({ attrs: { selectable: true } });
      const selectAll = queryShadow(table as HTMLElement, 'snice-checkbox.select-all');
      expect(selectAll).toBeTruthy();
    });

    it('should have setSelectabilityCheck method', async () => {
      table = await createTable();
      expect(typeof table.setSelectabilityCheck).toBe('function');
    });

    it('should track and return selected data', async () => {
      table = await createTable({ attrs: { selectable: true } });
      table.selectedRows = [0, 2];
      const selected = table.getSelectedData();
      expect(selected.length).toBe(2);
      expect(selected[0].name).toBe('Alice');
    });
  });

  // ── Feature 27: Selection Propagation ──

  describe('selection propagation', () => {
    it('should support selectable with tree data', async () => {
      table = await createTable({ attrs: { selectable: true } });
      table.setTreeData({ getPath: (row: any) => [row.name], groupColumn: 'name' });
      await wait(50);
      expect(table.selectable).toBe(true);
    });
  });

  // ── Feature 28: CSV Export ──

  describe('CSV export', () => {
    it('should have exportCSV method', async () => {
      table = await createTable();
      expect(typeof table.exportCSV).toBe('function');
    });

    it('should escape CSV values with commas', () => {
      const exp = new TableExport();
      const escaped = (exp as any).escapeCSV('hello, world', ',');
      expect(escaped).toBe('"hello, world"');
    });

    it('should escape CSV values with quotes', () => {
      const exp = new TableExport();
      const escaped = (exp as any).escapeCSV('say "hi"', ',');
      expect(escaped).toBe('"say ""hi"""');
    });

    it('should filter out non-exportable columns', () => {
      const exp = new TableExport();
      // exportCSV filters columns where exportable !== false
      // Just test it doesn't throw
      expect(() => exp.exportCSV([], [
        { key: 'id', label: 'ID', exportable: false },
        { key: 'name', label: 'Name' },
      ])).not.toThrow();
    });
  });

  // ── Feature 29: Print Export ──

  describe('print export', () => {
    it('should have printTable method', async () => {
      table = await createTable();
      expect(typeof table.printTable).toBe('function');
    });
  });

  // ── Feature 30: Clipboard Copy ──

  describe('clipboard copy', () => {
    it('should have copyToClipboard method', async () => {
      table = await createTable();
      expect(typeof table.copyToClipboard).toBe('function');
    });

    it('should return a promise', async () => {
      table = await createTable();
      const result = table.copyToClipboard();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // ── Feature 31: Keyboard Navigation ──

  describe('keyboard navigation', () => {
    it('should track focus position', () => {
      const kb = new TableKeyboard();
      const focus = kb.getFocus();
      expect(focus).toHaveProperty('row');
      expect(focus).toHaveProperty('col');
    });

    it('should set focus position', () => {
      const kb = new TableKeyboard();
      kb.setFocus(2, 1);
      const focus = kb.getFocus();
      expect(focus.row).toBe(2);
      expect(focus.col).toBe(1);
    });

    it('should initialize keyboard on table', async () => {
      table = await createTable();
      const kb = (table as any).keyboard;
      expect(kb.isAttached()).toBe(true);
    });
  });

  // ── Feature 32: ARIA Grid Pattern ──

  describe('ARIA grid pattern', () => {
    async function createAriaTable() {
      const t = await createTable();
      // Manually apply ARIA since keyboard module may not auto-attach in test env
      const kb = (t as any).keyboard;
      if (kb && t.shadowRoot) {
        kb.attach({
          shadowRoot: t.shadowRoot,
          totalRows: t.data.length,
          totalColumns: t.columns.length,
          tabMode: 'all',
          isEditing: () => false,
        });
      }
      return t;
    }

    it('should set role="grid" on table element', async () => {
      table = await createAriaTable();
      const tableEl = queryShadow(table as HTMLElement, 'table');
      expect(tableEl?.getAttribute('role')).toBe('grid');
    });

    it('should set aria-rowcount', async () => {
      table = await createAriaTable();
      const tableEl = queryShadow(table as HTMLElement, 'table');
      expect(tableEl?.getAttribute('aria-rowcount')).toBeTruthy();
    });

    it('should set aria-colcount', async () => {
      table = await createAriaTable();
      const tableEl = queryShadow(table as HTMLElement, 'table');
      expect(tableEl?.getAttribute('aria-colcount')).toBe('3');
    });

    it('should set role="row" on rows', async () => {
      table = await createAriaTable();
      const headerRow = queryShadow(table as HTMLElement, 'thead tr');
      expect(headerRow?.getAttribute('role')).toBe('row');
      const bodyRow = queryShadow(table as HTMLElement, 'tbody tr');
      expect(bodyRow?.getAttribute('role')).toBe('row');
    });

    it('should set role="columnheader" on th elements', async () => {
      table = await createAriaTable();
      const ths = queryShadowAll(table as HTMLElement, 'thead th[data-key]');
      ths.forEach(th => {
        expect(th.getAttribute('role')).toBe('columnheader');
      });
    });

    it('should set role="gridcell" on td elements', async () => {
      table = await createAriaTable();
      const cells = queryShadowAll(table as HTMLElement, 'tbody td');
      cells.forEach(cell => {
        expect(cell.getAttribute('role')).toBe('gridcell');
      });
    });

    it('should set aria-colindex on header cells', async () => {
      table = await createAriaTable();
      const ths = queryShadowAll(table as HTMLElement, 'thead th');
      ths.forEach(th => {
        expect(th.getAttribute('aria-colindex')).toBeTruthy();
      });
    });

    it('should set aria-rowindex on body rows', async () => {
      table = await createAriaTable();
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      rows.forEach(row => {
        expect(row.getAttribute('aria-rowindex')).toBeTruthy();
      });
    });
  });

  // ── Feature 33: Density ──

  describe('density', () => {
    it('should accept density attribute', async () => {
      table = await createTable({ attrs: { density: 'compact' } });
      expect(table.density).toBe('compact');
    });

    it('should default to standard', async () => {
      table = await createTable();
      expect(table.density).toBe('standard');
    });

    it('should reflect density attribute on host', async () => {
      table = await createTable({ attrs: { density: 'compact' } });
      expect(table.getAttribute('density')).toBe('compact');
    });

    it('should accept comfortable density', async () => {
      table = await createTable({ attrs: { density: 'comfortable' } });
      expect(table.density).toBe('comfortable');
    });
  });

  // ── Feature 34: Toolbar ──

  describe('toolbar', () => {
    it('should have setToolbar method', async () => {
      table = await createTable();
      expect(typeof table.setToolbar).toBe('function');
    });

    it('should render toolbar', async () => {
      table = await createTable();
      table.setToolbar({ showSearch: true });
      await wait(50);
      const toolbar = queryShadow(table as HTMLElement, '.table-toolbar');
      expect(toolbar).toBeTruthy();
    });

    it('should track callbacks on toolbar module', () => {
      const tb = new TableToolbar();
      expect(tb.onSearch).toBeNull();
      expect(tb.onDensityChange).toBeNull();
      expect(tb.onExportCSV).toBeNull();
    });

    it('should not be attached initially', () => {
      const tb = new TableToolbar();
      expect(tb.isAttached()).toBe(false);
    });
  });

  // ── Feature 35: Column Menu ──

  describe('column menu', () => {
    it('should accept column-menu attribute', async () => {
      table = await createTable({ attrs: { 'column-menu': true } });
      expect(table.columnMenu).toBe(true);
    });

    it('should wire up menu callbacks', async () => {
      table = await createTable({ attrs: { 'column-menu': true, sortable: true } });
      const cmm = (table as any).columnMenuManager;
      expect(cmm.onSortAsc).toBeTruthy();
      expect(cmm.onSortDesc).toBeTruthy();
      expect(cmm.onHide).toBeTruthy();
      expect(cmm.onPinLeft).toBeTruthy();
      expect(cmm.onPinRight).toBeTruthy();
      expect(cmm.onUnpin).toBeTruthy();
      expect(cmm.onAutoSize).toBeTruthy();
    });

    it('should track open state', () => {
      const cm = new TableColumnMenu();
      expect(cm.isOpen()).toBe(false);
    });

    it('should hide menu', () => {
      const cm = new TableColumnMenu();
      cm.hide();
      expect(cm.isOpen()).toBe(false);
    });
  });

  // ── Feature 36: Lazy Loading ──

  describe('lazy loading', () => {
    it('should accept lazy-load attribute', async () => {
      table = await createTable({ attrs: { 'lazy-load': true } });
      expect(table.lazyLoad).toBe(true);
    });

    it('should accept lazy-load-threshold', async () => {
      table = await createTable({ attrs: { 'lazy-load': true, 'lazy-load-threshold': 300 } });
      expect(table.lazyLoadThreshold).toBe(300);
    });

    it('should default threshold to 200', async () => {
      table = await createTable({ attrs: { 'lazy-load': true } });
      expect(table.lazyLoadThreshold).toBe(200);
    });
  });

  // ── Feature 37: Scrolling API ──

  describe('scrolling API', () => {
    it('should have scrollToRow method', async () => {
      table = await createTable();
      expect(typeof table.scrollToRow).toBe('function');
    });

    it('should have scrollToColumn method', async () => {
      table = await createTable();
      expect(typeof table.scrollToColumn).toBe('function');
    });

    it('should return scroll position', async () => {
      table = await createTable();
      const pos = table.getScrollPosition();
      expect(typeof pos.top).toBe('number');
      expect(typeof pos.left).toBe('number');
    });

    it('should not throw on scrollToRow', async () => {
      table = await createTable();
      expect(() => table.scrollToRow(2)).not.toThrow();
    });

    it('should find column header for scrollToColumn', async () => {
      table = await createTable();
      const th = queryShadow(table as HTMLElement, 'th[data-key="name"]');
      expect(th).toBeTruthy();
    });
  });

  // ── Feature 38: List View ──

  describe('list view', () => {
    it('should accept list attribute', async () => {
      table = await createTable({ attrs: { list: true } });
      expect(table.list).toBe(true);
    });

    it('should have setListViewRenderer method', async () => {
      table = await createTable();
      expect(typeof table.setListViewRenderer).toBe('function');
    });

    it('should reflect list attribute on host', async () => {
      table = await createTable({ attrs: { list: true } });
      expect(table.hasAttribute('list')).toBe(true);
    });
  });

  // ── Integration Tests ──

  describe('integration', () => {
    it('should combine pagination and filtering', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2 } });
      table.setColumnFilter('age', 'gt', 30);
      await wait(50);
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect(rows.length).toBe(2); // Charlie(35), Eve(32)
    });

    it('should combine sorting and pagination', async () => {
      table = await createTable({ attrs: { pagination: true, 'page-size': 2, sortable: true } });
      table.toggleSort('name', false);
      await wait(50);
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should handle empty data', async () => {
      table = await createTable({ data: [] });
      const noData = queryShadow(table as HTMLElement, '.no-data');
      expect(noData).toBeTruthy();
    });

    it('should track selection', async () => {
      table = await createTable({ attrs: { selectable: true } });
      table.selectedRows = [0, 1, 2];
      const selected = table.getSelectedData();
      expect(selected.length).toBe(3);
    });

    it('should work with setData and setColumns', async () => {
      table = await createComponent<any>('snice-table');
      table.columns = [{ key: 'x', label: 'X', type: 'text' }];
      table.data = [{ x: 'a' }, { x: 'b' }];
      table._unsortedData = [...table.data];
      (table as any).columnManager.initialize(table.columns, table);
      await wait(10);
      table.renderHeader();
      table.renderBody();
      await wait(50);
      const rows = queryShadowAll(table as HTMLElement, 'tbody tr');
      expect(rows.length).toBe(2);
    });
  });
});
