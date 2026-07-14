import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-table';

type Args = {
  sortable?: boolean;
  selectable?: boolean;
  selectionMode?: 'none' | 'single' | 'multiple';
  hoverable?: boolean;
  clickable?: boolean;
  striped?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  paginationMode?: 'client' | 'server';
  pageSize?: number;
  density?: 'compact' | 'standard' | 'comfortable';
  list?: boolean;
  loading?: boolean;
  editable?: boolean;
  editMode?: 'cell' | 'row';
  virtualize?: boolean;
  rowHeight?: number;
  lazyLoad?: boolean;
  lazyLoadThreshold?: number;
  columnResize?: boolean;
  columnReorder?: boolean;
  columnMenu?: boolean;
  headerFilters?: boolean;
  rowReorder?: boolean;
};

const COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  {
    key: 'salary', label: 'Salary', type: 'currency',
    currencyFormat: { currency: 'USD', decimals: 0 },
  },
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
    sortable:       { control: 'boolean', table: { category: 'Behavior' } },
    selectable:     { control: 'boolean', table: { category: 'Selection' } },
    selectionMode:  { control: 'select', options: ['multiple', 'single', 'none'], table: { category: 'Selection' } },
    hoverable:      { control: 'boolean', table: { category: 'Behavior' } },
    clickable:      { control: 'boolean', table: { category: 'Behavior' } },
    striped:        { control: 'boolean', table: { category: 'Appearance' } },
    searchable:     { control: 'boolean', table: { category: 'Filtering' } },
    pagination:     { control: 'boolean', table: { category: 'Pagination' } },
    paginationMode: { control: 'select', options: ['client', 'server'], table: { category: 'Pagination' } },
    pageSize:       { control: { type: 'number', min: 1 }, table: { category: 'Pagination' } },
    density:        { control: 'select', options: ['compact', 'standard', 'comfortable'], table: { category: 'Appearance' } },
    list:           { control: 'boolean', table: { category: 'Appearance' } },
    loading:        { control: 'boolean', table: { category: 'Data state' } },
    editable:       { control: 'boolean', table: { category: 'Editing' } },
    editMode:       { control: 'select', options: ['cell', 'row'], table: { category: 'Editing' } },
    virtualize:     { control: 'boolean', table: { category: 'Large data' } },
    rowHeight:      { control: { type: 'number', min: 24 }, table: { category: 'Large data' } },
    lazyLoad:       { control: 'boolean', table: { category: 'Large data' } },
    lazyLoadThreshold: { control: { type: 'number', min: 0 }, table: { category: 'Large data' } },
    columnResize:   { control: 'boolean', table: { category: 'Columns' } },
    columnReorder:  { control: 'boolean', table: { category: 'Columns' } },
    columnMenu:     { control: 'boolean', table: { category: 'Columns' } },
    headerFilters:  { control: 'boolean', table: { category: 'Filtering' } },
    rowReorder:     { control: 'boolean', table: { category: 'Rows' } },
  },
  render: (args) => {
    const table = document.createElement('snice-table') as any;
    if (args.sortable)   table.toggleAttribute('sortable', true);
    if (args.selectable) table.toggleAttribute('selectable', true);
    if (args.hoverable !== undefined) table.hoverable = args.hoverable;
    if (args.clickable)  table.toggleAttribute('clickable', true);
    if (args.striped)    table.toggleAttribute('striped', true);
    if (args.searchable) table.toggleAttribute('searchable', true);
    if (args.pagination) table.toggleAttribute('pagination', true);
    if (args.list)       table.toggleAttribute('list', true);
    if (args.loading)    table.toggleAttribute('loading', true);
    if (args.editable)   table.toggleAttribute('editable', true);
    if (args.virtualize) table.toggleAttribute('virtualize', true);
    if (args.lazyLoad)   table.toggleAttribute('lazy-load', true);
    if (args.columnResize)  table.toggleAttribute('column-resize', true);
    if (args.columnReorder) table.toggleAttribute('column-reorder', true);
    if (args.columnMenu)    table.toggleAttribute('column-menu', true);
    if (args.headerFilters) table.toggleAttribute('header-filters', true);
    if (args.rowReorder)    table.toggleAttribute('row-reorder', true);
    if (args.selectionMode !== undefined) table.setAttribute('selection-mode', args.selectionMode);
    if (args.paginationMode !== undefined) table.setAttribute('pagination-mode', args.paginationMode);
    if (args.editMode !== undefined) table.setAttribute('edit-mode', args.editMode);
    if (args.pageSize !== undefined) table.setAttribute('page-size', String(args.pageSize));
    if (args.density !== undefined)  table.setAttribute('density', String(args.density));
    if (args.rowHeight !== undefined) table.setAttribute('row-height', String(args.rowHeight));
    if (args.lazyLoadThreshold !== undefined) table.setAttribute('lazy-load-threshold', String(args.lazyLoadThreshold));
    if (args.virtualize) table.style.height = '24rem';
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });
    return table;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {
    sortable: true,
    selectable: false,
    selectionMode: 'multiple',
    hoverable: true,
    density: 'standard',
    pageSize: 10,
    editMode: 'cell',
  },
};

// h2: Cell Types
export const CellTypes: Story = {
  render: () => {
    type CellCard = {
      tag: string;
      label: string;
      attrs?: Record<string, string>;
      props?: Record<string, unknown>;
    };

    const section = document.createElement('div');
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:0.75rem;';
    const actionColumn = {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      actionsFormat: { actions: [
        { action: 'inspect', label: 'Inspect', icon: '⌕', variant: 'primary' },
        { action: 'archive', icon: '⌁', title: 'Archive row' },
      ] },
    };
    const cells: CellCard[] = [
      { tag: 'snice-cell-text', label: 'Text', attrs: { value: 'Alice Johnson' } },
      { tag: 'snice-cell-number', label: 'Number', attrs: { value: '95000', decimals: '0', 'thousands-separator': 'true' } },
      { tag: 'snice-cell-currency', label: 'Currency', attrs: { value: '95000', currency: 'USD', decimals: '0' } },
      { tag: 'snice-cell', label: 'Accounting', attrs: { value: '-12840.5', type: 'accounting' } },
      { tag: 'snice-cell', label: 'Scientific', attrs: { value: '1250000', type: 'scientific' } },
      { tag: 'snice-cell', label: 'Fraction', attrs: { value: '0.75', type: 'fraction' } },
      { tag: 'snice-cell-percentage', label: 'Percentage', attrs: { value: '12.5', colorize: 'true' } },
      { tag: 'snice-cell-date', label: 'Date', attrs: { value: '2026-03-15' } },
      { tag: 'snice-cell-boolean', label: 'Boolean', attrs: { value: 'true', 'use-symbols': 'true' } },
      {
        tag: 'snice-cell-rating', label: 'Rating', attrs: { value: '4.5' },
        props: { column: { key: 'rating', label: 'Rating', type: 'rating', ratingFormat: { max: 5 } } },
      },
      {
        tag: 'snice-cell-progress', label: 'Progress', attrs: { value: '75' },
        props: { column: { key: 'progress', label: 'Progress', type: 'progress', progressFormat: { showPercentage: true } } },
      },
      { tag: 'snice-cell-sparkline', label: 'Sparkline', attrs: { value: '32,35,38,36,42,45,48', color: '#3b82f6' } },
      { tag: 'snice-cell-duration', label: 'Duration', attrs: { value: '3661' } },
      { tag: 'snice-cell-filesize', label: 'File Size', attrs: { value: '1048576' } },
      { tag: 'snice-cell-tag', label: 'Tags', attrs: { value: 'Engineering,Remote' } },
      { tag: 'snice-cell-status', label: 'Status', attrs: { value: 'Active' } },
      { tag: 'snice-cell-email', label: 'Email', attrs: { value: 'alice@example.com' } },
      { tag: 'snice-cell-phone', label: 'Phone', attrs: { value: '+1-555-0101' } },
      { tag: 'snice-cell-link', label: 'Link', attrs: { value: 'https://example.com', external: 'true' } },
      { tag: 'snice-cell-color', label: 'Color', attrs: { value: '#3b82f6' } },
      { tag: 'snice-cell-image', label: 'Image', attrs: { value: '/images/snice-logo.png', variant: 'circle', size: 'small', alt: 'Snice logo' } },
      { tag: 'snice-cell-json', label: 'JSON', attrs: { value: '{"plan":"pro","seats":12}' } },
      { tag: 'snice-cell-location', label: 'Location', attrs: { value: 'New York, NY' }, props: { showMapLink: false } },
      {
        tag: 'snice-cell-actions', label: 'Actions',
        props: { column: actionColumn, actions: actionColumn.actionsFormat.actions, rowData: { id: 7, name: 'Alice Johnson' } },
      },
    ];
    cells.forEach(c => {
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:4px;padding:0.5rem 0.75rem;';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;color:#888;margin-bottom:0.375rem;';
      lbl.textContent = c.label;
      card.appendChild(lbl);
      const el = document.createElement(c.tag);
      for (const [k, v] of Object.entries(c.attrs || {})) el.setAttribute(k, String(v));
      if (c.props) Object.assign(el, c.props);
      card.appendChild(el);
      wrap.appendChild(card);
    });

    const status = document.createElement('p');
    status.style.cssText = 'margin:0.75rem 0 0;color:#888;font-size:0.8rem;';
    status.textContent = 'Action cells emit the source row and column.';
    wrap.addEventListener('cell-action', (event) => {
      const detail = (event as CustomEvent).detail;
      status.textContent = `${detail.action} · ${detail.rowData.name} · ${detail.column.label}`;
    });
    section.append(wrap, status);
    return section;
  },
};

// h2: Pro: Sortable + Header Filters + Column Menu (right-click headers)
export const ProSortableHeaderFiltersColumnMenu: Story = {
  render: () => {
    const table = makeTable({ sortable: true, selectable: true, 'column-resize': true, 'column-menu': true, 'header-filters': true, hoverable: true, striped: true }) as any;
    requestAnimationFrame(() => {
      table.setToolbar({ showSearch: true, showSort: true, showFilter: true, showExport: true, searchPlaceholder: 'Search employees...' });
    });
    return table;
  },
};

// h2: Toolbar Search + Export
export const ToolbarSearchExport: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('selectable', true);
    table.toggleAttribute('hoverable', true);
    table.toggleAttribute('column-menu', true);
    table.setColumns(COLUMNS);
    table.setData(DATA);
    requestAnimationFrame(() => {
      table.renderHeader();
      table.renderBody();
      table.setToolbar({ showSearch: true, showExport: true, searchPlaceholder: 'Search employees...' });
    });
    return table;
  },
};

// h2: Selection Modes + Conditional Selectability
export const SelectionModesConditionalSelectability: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(16rem,1fr));gap:1rem;padding:1rem;';

    for (const mode of ['multiple', 'single', 'none'] as const) {
      const card = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = `${mode[0].toUpperCase()}${mode.slice(1)} selection`;
      heading.style.cssText = 'margin:0 0 0.25rem;font-size:1rem;';
      const note = document.createElement('p');
      note.textContent = mode === 'multiple'
        ? 'Toggle rows or Shift-select a range. Charlie is locked.'
        : mode === 'single'
          ? 'Selecting a row replaces the previous selection. Charlie is locked.'
          : 'Selection controls and row selection are disabled.';
      note.style.cssText = 'margin:0 0 0.75rem;color:#888;font-size:0.8rem;';
      const table = makeTable({
        selectable: true,
        'selection-mode': mode,
        hoverable: true,
      }, COLUMNS.slice(0, 3), DATA.slice(0, 4)) as any;
      table.setSelectabilityCheck((row: any) => row.name !== 'Charlie Brown');
      card.append(heading, note, table);
      wrap.appendChild(card);
    }

    return wrap;
  },
};

// h2: Inline Editing: Cell + Row + Custom Editor
export const InlineEditingCellRowCustomEditor: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.padding = '1rem';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;';
    const editName = document.createElement('button');
    editName.type = 'button';
    editName.textContent = 'Edit first name';
    const editRow = document.createElement('button');
    editRow.type = 'button';
    editRow.textContent = 'Edit second row';
    const status = document.createElement('span');
    status.style.cssText = 'color:#888;font-size:0.8rem;';
    status.textContent = 'Double-click an editable cell, or use an edit button.';
    actions.append(editName, editRow, status);

    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('editable', true);
    table.toggleAttribute('hoverable', true);
    table.toggleAttribute('striped', true);
    table.setColumns([
      { key: 'name', label: 'Name', type: 'text' },
      {
        key: 'role', label: 'Role', type: 'text', editorType: 'select',
        selectOptions: [
          { value: 'Engineer', label: 'Engineer' },
          { value: 'Designer', label: 'Designer' },
          { value: 'Manager', label: 'Manager' },
        ],
      },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      {
        key: 'salary', label: 'Salary', type: 'number',
        numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 },
        valueParser: (value: string) => Number(value),
      },
      { key: 'active', label: 'Active', type: 'boolean' },
      {
        key: 'status', label: 'Custom Status', type: 'text',
        renderCell: (value: string) => {
          const pill = document.createElement('span');
          pill.textContent = value;
          pill.style.cssText = 'display:inline-flex;padding:0.15rem 0.5rem;border-radius:999px;background:#dcfce7;color:#166534;font-size:0.75rem;';
          return pill;
        },
        renderEditor: (value: string, _row: any, _column: any, commit: (next: string) => void) => {
          const select = document.createElement('select');
          select.className = 'table-editor-select';
          for (const optionValue of ['Active', 'On leave']) {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            option.selected = optionValue === value;
            select.appendChild(option);
          }
          select.addEventListener('change', () => commit(select.value));
          return select;
        },
      },
    ]);
    table.setData([
      { name: 'Alice Johnson', role: 'Engineer', startDate: '2022-03-14', salary: 125000, active: true, status: 'Active' },
      { name: 'Diana Prince', role: 'Designer', startDate: '2023-08-21', salary: 118000, active: true, status: 'Active' },
      { name: 'Bob Smith', role: 'Manager', startDate: '2021-11-02', salary: 109000, active: false, status: 'On leave' },
    ]);
    table.setCellEditableCheck(() => true);
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); });

    editName.addEventListener('click', () => {
      table.editMode = 'cell';
      table.startEdit(0, 'name');
      status.textContent = 'Editing Alice’s name; Enter or blur commits, Escape cancels.';
    });
    editRow.addEventListener('click', () => {
      table.editMode = 'row';
      table.startEdit(1, 'name');
      status.textContent = 'Editing Diana’s full row.';
    });
    table.addEventListener('cell-edit-commit', (event: Event) => {
      const detail = (event as CustomEvent).detail;
      status.textContent = `Saved ${detail.columnKey}: ${detail.newValue}`;
    });
    table.addEventListener('row-edit-commit', () => { status.textContent = 'Saved the row.'; });

    wrap.append(actions, table);
    return wrap;
  },
};

// h2: Virtualization + Lazy Append
export const VirtualizationLazyAppend: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.padding = '1rem';
    const status = document.createElement('p');
    status.style.cssText = 'margin:0 0 0.75rem;color:#888;font-size:0.8rem;';
    const table = document.createElement('snice-table') as any;
    table.toggleAttribute('virtualize', true);
    table.toggleAttribute('lazy-load', true);
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('hoverable', true);
    table.setAttribute('row-height', '40');
    table.style.height = '24rem';
    table.setColumns([
      { key: 'id', label: 'ID', type: 'number', sortable: true, width: '80' },
      { key: 'account', label: 'Account', type: 'text', sortable: true },
      { key: 'region', label: 'Region', type: 'text', sortable: true },
      { key: 'usage', label: 'Usage', type: 'progress' },
    ]);
    const makeRows = (start: number, count: number) => Array.from({ length: count }, (_, offset) => {
      const index = start + offset;
      return {
        id: index + 1,
        account: `Account ${String(index + 1).padStart(4, '0')}`,
        region: ['Americas', 'EMEA', 'APAC'][index % 3],
        usage: (index * 17) % 101,
      };
    });
    let rows = makeRows(0, 1200);
    table.setData(rows);
    const updateStatus = () => requestAnimationFrame(() => {
      const mounted = table.shadowRoot?.querySelectorAll('tbody tr[data-index]').length || 0;
      status.textContent = `${rows.length.toLocaleString()} records; ${mounted} data rows mounted.`;
    });
    table.addEventListener('lazy-load', () => {
      if (rows.length >= 2000) return;
      rows = [...rows, ...makeRows(rows.length, 200)];
      table.data = rows;
      updateStatus();
    });
    requestAnimationFrame(() => { table.renderHeader(); table.renderBody(); updateStatus(); });
    wrap.append(status, table);
    return wrap;
  },
};

// h2: Remote Data + Server Pagination
export const RemoteDataServerPagination: Story = {
  render: () => {
    const table = document.createElement('snice-table') as any;
    table.setAttribute('mode', 'remote');
    table.toggleAttribute('pagination', true);
    table.setAttribute('pagination-mode', 'server');
    table.setAttribute('page-size', '5');
    table.toggleAttribute('sortable', true);
    table.toggleAttribute('hoverable', true);
    table.toggleAttribute('striped', true);
    table.setColumns([
      { key: 'id', label: 'ID', type: 'number', sortable: true, width: '70' },
      { key: 'company', label: 'Company', type: 'text', sortable: true },
      { key: 'region', label: 'Region', type: 'text', sortable: true },
      { key: 'plan', label: 'Plan', type: 'tag', sortable: true },
      {
        key: 'arr', label: 'ARR', type: 'number', sortable: true,
        numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 },
      },
    ]);
    table.setData([]);
    const rows = Array.from({ length: 42 }, (_, index) => ({
      id: index + 1,
      company: ['Acme', 'Globex', 'Initech', 'Umbrella'][index % 4] + ` ${Math.floor(index / 4) + 1}`,
      region: ['Americas', 'EMEA', 'APAC'][index % 3],
      plan: ['Starter', 'Growth', 'Enterprise'][index % 3],
      arr: 12000 + ((index * 13731) % 180000),
    }));
    table.addEventListener('@request/table/data', (event: Event) => {
      const detail = (event as CustomEvent).detail;
      event.stopImmediatePropagation();
      detail.discovery.resolve();
      setTimeout(() => {
        let result = [...rows];
        const query = String(
          detail.payload.filter?.quickFilter || detail.payload.search || ''
        ).trim().toLowerCase();
        if (query) {
          result = result.filter((row) => Object.values(row).some((value) =>
            String(value).toLowerCase().includes(query)
          ));
        }
        result.sort((left, right) => {
          for (const sort of detail.payload.sort || []) {
            const comparison = String(left[sort.column as keyof typeof left]).localeCompare(
              String(right[sort.column as keyof typeof right]), undefined, { numeric: true }
            );
            if (comparison !== 0) return sort.direction === 'desc' ? -comparison : comparison;
          }
          return 0;
        });
        const page = detail.payload.page || 1;
        const pageSize = detail.payload.pageSize || 5;
        const start = (page - 1) * pageSize;
        detail.data.resolve({ data: result.slice(start, start + pageSize), totalItems: result.length });
      }, 180);
    });
    requestAnimationFrame(() => {
      table.renderHeader();
      table.renderBody();
      table.setToolbar({ showSearch: true, showExport: false, searchPlaceholder: 'Search remote records...' });
      table.getTableData();
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
      {
        key: 'salary', label: 'Salary', type: 'number',
        numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 },
      },
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

// h2: Column Pinning + Visibility + Resize + Reorder
export const ColumnPinningVisibility: Story = {
  render: () => {
    const pinnedCols = [
      { key: 'name', label: 'Name', type: 'text', pinned: 'left' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      {
        key: 'salary', label: 'Salary', type: 'number',
        numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 },
      },
    ];
    const wrapper = document.createElement('div');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Hide email';
    toggle.style.margin = '0.75rem';
    const status = document.createElement('span');
    status.textContent = 'Drag an unpinned header to reorder it.';
    status.style.cssText = 'color:#888;font-size:0.8rem;';
    const table = makeTable({
      sortable: true,
      'column-resize': true,
      'column-reorder': true,
      'column-menu': true,
      hoverable: true,
    }, pinnedCols) as any;
    let emailVisible = true;
    toggle.addEventListener('click', () => {
      emailVisible = !emailVisible;
      table.setColumnVisible('email', emailVisible);
      toggle.textContent = emailVisible ? 'Hide email' : 'Show email';
      status.textContent = `Email ${emailVisible ? 'shown' : 'hidden'}.`;
    });
    table.addEventListener('column-reorder', (event: Event) => {
      const detail = (event as CustomEvent).detail;
      status.textContent = `Moved ${detail.fromKey} before ${detail.toKey}.`;
    });
    requestAnimationFrame(() => table.setToolbar({ showSearch: false, showExport: false }));
    wrapper.append(toggle, status, table);
    return wrapper;
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
  render: () => {
    const table = makeTable({ list: true, hoverable: true }) as any;
    requestAnimationFrame(() => table.setListViewRenderer((row: any) => {
      const card = document.createElement('div');
      card.style.cssText = 'display:flex;justify-content:space-between;gap:1rem;padding:0.25rem 0;';
      card.innerHTML = `<span><strong>${row.name}</strong><br><small>${row.department} · ${row.email}</small></span><strong>$${Number(row.salary).toLocaleString()}</strong>`;
      return card;
    }));
    return table;
  },
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
// Imperative snice-table exposes superheader, controls, toolbar, and pagination.
// Its native header/body/cells are not forwarded as parts.
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

      .parts-demo .styled-table::part(superheader) {
        background: linear-gradient(135deg, #162b44, #2d5986);
        color: #fff;
        padding: 0.65rem 0.85rem;
        border-radius: 8px 8px 0 0;
      }
      .parts-demo .styled-table::part(toolbar) {
        background: #eef6ff;
        border: 1px solid #93c5fd;
        border-radius: 6px;
        padding: 0.5rem;
      }
      .parts-demo .styled-table::part(pagination) {
        background: #f8fbff;
        border-top: 2px solid #4a90d9;
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
      table.toggleAttribute('pagination', true);
      table.setAttribute('page-size', '2');
      const superheader = document.createElement('div');
      superheader.slot = 'header';
      superheader.textContent = 'Employee directory';
      table.appendChild(superheader);
      table.setColumns(COLUMNS.slice(0, 3));
      table.setData(DATA.slice(0, 4));
      requestAnimationFrame(() => {
        table.renderHeader();
        table.renderBody();
        table.setToolbar({ showSearch: true, showExport: true });
      });
      box.appendChild(table);
      return box;
    };

    wrap.appendChild(makeDemo('Default (no ::part() styles)', '', true));
    wrap.appendChild(makeDemo('Styled table parts — superheader, toolbar, pagination', 'styled-table', true));

    return wrap;
  },
};

// h2: Standalone Row + Cell Parts
// snice-row and cell parts are available when those elements are direct
// light-DOM children; snice-table does not forward them through its shadow root.
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

      .parts-demo-adv snice-row::part(checkbox-cell) {
        background: rgba(124, 58, 237, 0.08);
        border-right: 2px solid #7c3aed44;
      }
      .parts-demo-adv snice-row::part(container) {
        border: 1px solid #7c3aed;
        border-radius: 6px;
        overflow: hidden;
      }
      .parts-demo-adv snice-row::part(cell) {
        background: #1a0a2e;
        color: #e2d9f3;
        padding: 0.65rem 0.75rem;
      }
      .parts-demo-adv snice-cell-text::part(content) {
        background: #ede9fe;
        color: #5b21b6;
        border-radius: 4px;
        padding: 0.35rem 0.55rem;
      }
    `;
    wrap.appendChild(style);

    const lbl = document.createElement('div');
    lbl.className = 'adv-label';
    lbl.textContent = 'Direct snice-row and snice-cell-text elements styled through their own parts';
    wrap.appendChild(lbl);

    const row = document.createElement('snice-row') as any;
    row.selectable = true;
    row.hoverable = true;
    row.columns = COLUMNS.slice(0, 4);
    row.data = DATA[0];

    const cellLabel = document.createElement('div');
    cellLabel.className = 'adv-label';
    cellLabel.textContent = 'Standalone cell content part';
    const cell = document.createElement('snice-cell-text');
    cell.setAttribute('value', 'Part styling stays at the component boundary');
    wrap.append(row, cellLabel, cell);

    return wrap;
  },
};
