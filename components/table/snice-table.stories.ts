import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-table';

type Args = {
  sortable?: boolean;
  selectable?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  density?: string;
  list?: boolean;
  loading?: boolean;
};

const COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'salary', label: 'Salary', type: 'number', prefix: '$', thousandsSeparator: true },
];

const DATA = [
  { name: 'Alice Johnson', age: 30, department: 'Engineering', email: 'alice@example.com', salary: 95000 },
  { name: 'Bob Smith', age: 25, department: 'Marketing', email: 'bob@example.com', salary: 72000 },
  { name: 'Charlie Brown', age: 35, department: 'Sales', email: 'charlie@example.com', salary: 68000 },
  { name: 'Diana Prince', age: 28, department: 'Design', email: 'diana@example.com', salary: 82000 },
  { name: 'Eve Wilson', age: 32, department: 'Engineering', email: 'eve@example.com', salary: 105000 },
  { name: 'Frank Miller', age: 27, department: 'Marketing', email: 'frank@example.com', salary: 65000 },
  { name: 'Grace Lee', age: 40, department: 'Sales', email: 'grace@example.com', salary: 78000 },
  { name: 'Henry Chen', age: 29, department: 'Engineering', email: 'henry@example.com', salary: 98000 },
];

function makeTable(attrs: Record<string, boolean | string | number> = {}, cols = COLUMNS, rows = DATA): HTMLElement {
  const table = document.createElement('snice-table') as any;
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) table.toggleAttribute(k, true); }
    else table.setAttribute(k, String(v));
  }
  table.setColumns(cols);
  table.setData(rows);
  requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
  return table;
}

const meta: Meta<Args> = {
  title: 'Table',
  component: 'snice-table',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    sortable:   { control: 'boolean' },
    selectable: { control: 'boolean' },
    hoverable:  { control: 'boolean' },
    striped:    { control: 'boolean' },
    searchable: { control: 'boolean' },
    pagination: { control: 'boolean' },
    pageSize:   { control: 'number' },
    density:    { control: 'select', options: ['compact', 'comfortable'] },
    list:       { control: 'boolean' },
    loading:    { control: 'boolean' },
  },
  render: (args) => {
    const table = document.createElement('snice-table') as any;
    if (args.sortable)   table.toggleAttribute('sortable', true);
    if (args.selectable) table.toggleAttribute('selectable', true);
    if (args.hoverable)  table.toggleAttribute('hoverable', true);
    if (args.striped)    table.toggleAttribute('striped', true);
    if (args.searchable) table.toggleAttribute('searchable', true);
    if (args.pagination) table.toggleAttribute('pagination', true);
    if (args.list)       table.toggleAttribute('list', true);
    if (args.loading)    table.toggleAttribute('loading', true);
    if (args.pageSize !== undefined) table.setAttribute('page-size', String(args.pageSize));
    if (args.density !== undefined)  table.setAttribute('density', String(args.density));
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
    return table;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { sortable: true, hoverable: true },
};

// h2: Cell Types
export const CellTypes: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:0.75rem;';
    const cells = [
      { tag: 'snice-cell-text', label: 'Text', attrs: { value: 'Alice Johnson' } },
      { tag: 'snice-cell-number', label: 'Number', attrs: { value: '95000', decimals: '0', 'thousands-separator': 'true' } },
      { tag: 'snice-cell-number', label: 'Currency', attrs: { value: '95000', decimals: '2', prefix: '$', 'thousands-separator': 'true' } },
      { tag: 'snice-cell-percentage', label: 'Percent', attrs: { value: '12.5' } },
      { tag: 'snice-cell-date', label: 'Date', attrs: { value: '2024-03-15' } },
      { tag: 'snice-cell-boolean', label: 'Boolean', attrs: { value: 'true' } },
      { tag: 'snice-cell-rating', label: 'Rating', attrs: { value: '4' } },
      { tag: 'snice-cell-progress', label: 'Progress', attrs: { value: '75' } },
      { tag: 'snice-cell-duration', label: 'Duration', attrs: { value: '3661' } },
      { tag: 'snice-cell-filesize', label: 'File Size', attrs: { value: '1048576' } },
      { tag: 'snice-cell-tag', label: 'Tag', attrs: { value: 'Engineering' } },
      { tag: 'snice-cell-status', label: 'Status', attrs: { value: 'Active', 'show-dot': 'true' } },
      { tag: 'snice-cell-email', label: 'Email', attrs: { value: 'alice@example.com' } },
      { tag: 'snice-cell-phone', label: 'Phone', attrs: { value: '+1-555-0101' } },
      { tag: 'snice-cell-link', label: 'Link', attrs: { value: 'https://example.com' } },
      { tag: 'snice-cell-color', label: 'Color', attrs: { value: '#3b82f6' } },
    ];
    cells.forEach(c => {
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:4px;padding:0.5rem 0.75rem;';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;color:#888;margin-bottom:0.375rem;';
      lbl.textContent = c.label;
      card.appendChild(lbl);
      const el = document.createElement(c.tag);
      for (const [k, v] of Object.entries(c.attrs)) el.setAttribute(k, String(v));
      card.appendChild(el);
      wrap.appendChild(card);
    });
    return wrap;
  },
};

// h2: Pro: Sortable + Header Filters + Column Menu (right-click headers)
export const ProSortableHeaderFiltersColumnMenu: Story = {
  render: () => makeTable({ sortable: true, searchable: true, selectable: true, 'column-resize': true, 'column-menu': true, 'header-filters': true, hoverable: true, striped: true }),
};

// h2: Toolbar + Export + Quick Filter
export const ToolbarExportQuickFilter: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('selectable', true);
    table.toggleAttribute('hoverable', true);
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => {
      table.renderHeader();
      table.renderBody();
      table.setToolbar({ showSearch: true, showDensity: true, showExport: true, searchPlaceholder: 'Search employees...' });
    });
    return table;
  },
};

// h2: Master-Detail (Expandable Rows)
export const MasterDetailExpandableRows: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('hoverable', true);
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => {
      table.renderHeader();
      table.renderBody();
      table.setDetailPanel({
        getDetailContent: (row: any) =>
          '<div style="padding:0.75rem 1rem;display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;font-size:0.875rem">'
          + '<div><strong>Name</strong><br>' + row.name + '</div>'
          + '<div><strong>Department</strong><br>' + row.department + '</div>'
          + '<div><strong>Salary</strong><br>$' + (row.salary || 0).toLocaleString() + '</div>'
          + '</div>',
      });
    });
    return table;
  },
};

// h2: Tree Data (Hierarchical)
export const TreeDataHierarchical: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('hoverable', true);
    const treeCols = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'salary', label: 'Salary', type: 'number', prefix: '$', thousandsSeparator: true },
    ];
    const treeData = [
      { name: 'Alice Johnson', role: 'VP Engineering', salary: 180000, path: ['Engineering', 'Alice Johnson'] },
      { name: 'Bob Smith', role: 'Senior Dev', salary: 140000, path: ['Engineering', 'Bob Smith'] },
      { name: 'Frank Miller', role: 'Marketing Manager', salary: 120000, path: ['Marketing', 'Frank Miller'] },
      { name: 'Jack Davis', role: 'Content Writer', salary: 65000, path: ['Marketing', 'Jack Davis'] },
      { name: 'Charlie Brown', role: 'Sales Lead', salary: 110000, path: ['Sales', 'Charlie Brown'] },
    ];
    table.setColumns(treeCols);
    table.setData(treeData);
    requestAnimationFrame(() => {
      table.renderHeader();
      table.renderBody();
      table.setTreeData({ getPath: (row: any) => row.path, groupColumn: 'name', defaultExpansionDepth: 1 });
    });
    return table;
  },
};

// h2: Row Grouping + Aggregation
export const RowGroupingAggregation: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('selectable', true);
    table.toggleAttribute('hoverable', true);
    table.toggleAttribute('striped', true);
    table.columns = [
      { key: 'name', label: 'Employee', type: 'text', sortable: true },
      { key: 'department', label: 'Department', type: 'text', sortable: true },
      { key: 'level', label: 'Level', type: 'text', sortable: true },
      {
        key: 'salary', label: 'Salary', type: 'number', sortable: true,
        aggregate: 'sum', numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 },
      },
    ];
    table.groupBy = 'department';
    table.data = [
      { name: 'Alice Johnson', department: 'Engineering', level: 'Senior', salary: 125000 },
      { name: 'Eve Wilson', department: 'Engineering', level: 'Staff', salary: 148000 },
      { name: 'Diana Prince', department: 'Design', level: 'Senior', salary: 118000 },
      { name: 'Ivy Taylor', department: 'Design', level: 'Mid', salary: 96000 },
      { name: 'Bob Smith', department: 'Marketing', level: 'Mid', salary: 88000 },
    ];
    return table;
  },
};

// h2: Column Groups (Multi-Level Headers)
export const ColumnGroupsMultiLevelHeaders: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('hoverable', true);
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => {
      table.renderHeader();
      table.renderBody();
      table.setColumnGroups([
        { label: 'Personal Info', children: ['name', 'age'] },
        { label: 'Work Info', children: ['department', 'email', 'salary'] },
      ]);
    });
    return table;
  },
};

// h2: Column Pinning + Visibility
export const ColumnPinningVisibility: Story = {
  render: () => {
    const pinnedCols = [
      { key: 'name', label: 'Name', type: 'text', pinned: 'left' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'salary', label: 'Salary', type: 'number', prefix: '$', thousandsSeparator: true },
    ];
    return makeTable({ sortable: true, 'column-resize': true, hoverable: true }, pinnedCols);
  },
};

// h2: Row Reorder (Drag & Drop)
export const RowReorderDragDrop: Story = {
  render: () => makeTable(
    { 'row-reorder': true, hoverable: true },
    [{ key: 'name', label: 'Name', type: 'text' }, { key: 'department', label: 'Department', type: 'text' }, { key: 'age', label: 'Age', type: 'number' }],
    DATA.slice(0, 6),
  ),
};

// h2: Row Pinning
export const RowPinning: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('hoverable', true);
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => {
      table.renderHeader();
      table.renderBody();
      table.pinRowTop({ name: '★ Team Lead', age: 45, department: 'Leadership', email: 'lead@example.com', salary: 200000 });
    });
    return table;
  },
};

// h2: Client-Side Pagination (5 per page)
export const ClientSidePagination5PerPage: Story = {
  render: () => makeTable({ pagination: true, 'page-size': '5', sortable: true, hoverable: true }),
};

// h2: Super-Header Slot
export const SuperHeaderSlot: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('hoverable', true);
    const header = document.createElement('div');
    header.slot = 'header';
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
    const strong = document.createElement('strong');
    strong.textContent = 'Employee Directory';
    const span = document.createElement('span');
    span.style.cssText = 'font-size:0.8rem;color:#888;';
    span.textContent = 'Q1 2026';
    header.appendChild(strong);
    header.appendChild(span);
    table.appendChild(header);
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
    return table;
  },
};

// h2: Density: Compact
export const DensityCompact: Story = {
  render: () => makeTable({ density: 'compact', sortable: true, striped: true, hoverable: true }),
};

// h2: Density: Comfortable
export const DensityComfortable: Story = {
  render: () => makeTable({ density: 'comfortable', sortable: true, striped: true, hoverable: true }),
};

// h2: List Mode
export const ListMode: Story = {
  render: () => makeTable({ list: true, hoverable: true }),
};

// h2: Loading State
export const LoadingState: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('loading', true);
    table.setColumns(COLUMNS);
    table.setData([]);
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
    return table;
  },
};

// h2: Empty Table
export const EmptyTable: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.setColumns(COLUMNS);
    table.setData([]);
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
    return table;
  },
};

// h2: CSS Parts Styling
// Parts available on snice-table: superheader
// Parts available on snice-header: container, checkbox-cell, cell, sort-indicator, filter-button
// Parts available on snice-row: container, checkbox-cell, cell
// Parts available on snice-cell: content
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
      .parts-demo .demo-box { display: flex; flex-direction: column; gap: 0.5rem; }
      .parts-demo .demo-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; margin-bottom: 0.25rem;
      }

      /* Styled table: superheader, header cells, row cells */
      .parts-demo .styled-table snice-header::part(container) {
        background: linear-gradient(135deg, #1e3a5f, #2d5986);
        border-radius: 6px 6px 0 0;
      }
      .parts-demo .styled-table snice-header::part(cell) {
        color: #fff;
        font-weight: 700;
        letter-spacing: 0.04em;
        border-bottom: 2px solid #4a90d9;
      }
      .parts-demo .styled-table snice-header::part(sort-indicator) {
        color: #4af;
        font-size: 1rem;
      }
      .parts-demo .styled-table snice-row::part(container) {
        border-bottom: 1px solid rgba(74, 144, 217, 0.2);
        transition: background 0.15s;
      }
      .parts-demo .styled-table snice-row::part(container):hover {
        background: rgba(74, 144, 217, 0.08);
      }
      .parts-demo .styled-table snice-row::part(cell) {
        color: #c8e0ff;
        padding: 0.6rem 0.75rem;
      }
      .parts-demo .styled-table snice-cell::part(content) {
        font-size: 0.85rem;
      }
      .parts-demo .styled-table snice-table::part(superheader) {
        background: #162b44;
        padding: 0.5rem 0.75rem;
        border-radius: 8px 8px 0 0;
      }
    `;
    wrap.appendChild(style);

    const makeDemo = (label: string, className: string, sortable: boolean): HTMLElement => {
      const box = document.createElement('div');
      box.className = 'demo-box';
      const lbl = document.createElement('div');
      lbl.className = 'demo-label';
      lbl.textContent = label;
      box.appendChild(lbl);
      const table = document.createElement('snice-table') as any;
      if (className) table.classList.add(className);
      if (sortable) table.toggleAttribute('sortable', true);
      table.toggleAttribute('hoverable', true);
      table.setColumns(COLUMNS.slice(0, 3));
      table.setData(DATA.slice(0, 4));
      requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
      box.appendChild(table);
      return box;
    };

    wrap.appendChild(makeDemo('Default (no ::part() styles)', '', true));
    wrap.appendChild(makeDemo('Styled via ::part() — header, cells, rows, content', 'styled-table', true));

    return wrap;
  },
};

// h2: CSS Parts Advanced
// Demonstrates checkbox-cell, filter-button, and row checkbox-cell parts
export const CSSPartsAdvanced: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'parts-demo-adv';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-adv { display: flex; flex-direction: column; gap: 1.5rem; }
      .parts-demo-adv .adv-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; margin-bottom: 0.25rem;
      }

      /* Style checkbox-cell in header and rows */
      .parts-demo-adv snice-header::part(checkbox-cell) {
        background: #2a1a4a;
        border-right: 2px solid #7c3aed;
        min-width: 3rem;
      }
      .parts-demo-adv snice-row::part(checkbox-cell) {
        background: rgba(124, 58, 237, 0.08);
        border-right: 2px solid #7c3aed44;
      }
      /* Style the header cell column labels */
      .parts-demo-adv snice-header::part(cell) {
        background: #1a0a2e;
        color: #c4b5fd;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      /* Style data cells */
      .parts-demo-adv snice-row::part(cell) {
        color: #e2d9f3;
      }
      /* Style cell inner content */
      .parts-demo-adv snice-cell::part(content) {
        border-radius: 4px;
      }
    `;
    wrap.appendChild(style);

    const lbl = document.createElement('div');
    lbl.className = 'adv-label';
    lbl.textContent = 'Styled: checkbox-cell, header cell, row cell, cell content via ::part()';
    wrap.appendChild(lbl);

    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('selectable', true);
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('hoverable', true);
    table.setColumns(COLUMNS.slice(0, 4));
    table.setData(DATA.slice(0, 4));
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
    wrap.appendChild(table);

    return wrap;
  },
};
