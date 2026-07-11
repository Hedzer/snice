# snice-table

Data table with row grouping, aggregation, sorting, filtering, selection, pagination, virtualization, editing, tree data, master-detail, and 20+ column types.

## Properties

```typescript
striped: boolean = false;
searchable: boolean = false;
filterable: boolean = false;
sortable: boolean = false;
selectable: boolean = false;
hoverable: boolean = true;
clickable: boolean = false;
list: boolean = false;
loading: boolean = false;
mode: 'local'|'remote' = 'local';    // 'remote' requests via @request('table/data')
columns: ColumnDefinition[] = [];    // reactive — assigning re-renders header+body
data: any[] = [];                    // reactive — assigning re-renders body
searchText: string = '';             // not an attribute — no re-render on assign
searchDebounce: number = 500;        // attr: search-debounce
currentSort: Array<{column: string, direction: 'asc'|'desc'}> = []; // reactive
selectedRows: number[] = [];         // JS only
selectionMode: 'none'|'single'|'multiple' = 'multiple'; // attr: selection-mode
selector: string = '';
selectorOptions: Array<{value: string, label: string}> = []; // JS only
groupBy: string|string[] = '';       // JS only; reactive pre/post-connect
groupDefaults: { expanded?: boolean } = {}; // JS only
pagination: boolean = false;
paginationMode: 'client'|'server' = 'client'; // attr: pagination-mode
pageSize: number = 10;               // attr: page-size
currentPage: number = 1;             // attr: current-page
totalItems: number = 0;              // attr: total-items
pageSizes: number[] = [10, 25, 50, 100]; // JS only
virtualize: boolean = false;
rowHeight: number = 48;              // attr: row-height
virtualBuffer: number = 200;         // attr: virtual-buffer
editable: boolean = false;
editMode: 'cell'|'row' = 'cell';     // attr: edit-mode
density: 'compact'|'standard'|'comfortable' = 'standard';
columnResize: boolean = false;       // attr: column-resize
headerFilters: boolean = false;      // attr: header-filters
quickFilter: boolean = false;        // attr: quick-filter — use setQuickFilter() to actually filter
rowReorder: boolean = false;         // attr: row-reorder
columnReorder: boolean = false;      // attr: column-reorder
columnMenu: boolean = false;         // attr: column-menu
lazyLoad: boolean = false;           // attr: lazy-load
lazyLoadThreshold: number = 200;     // attr: lazy-load-threshold, px from bottom
```

## Column Definition

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;              // see Column Types below
  align?: 'left'|'center'|'right';
  width?: string;
  flex?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
  hideable?: boolean;
  pinnable?: boolean;
  pinned?: 'left'|'right'|false;
  editable?: boolean;
  editorType?: 'text'|'number'|'date'|'boolean'|'select'; // overrides type-derived editor
  selectOptions?: { value: string; label: string }[];     // for a `select` editor
  formatter?: (value, row) => string;
  valueGetter?: (value, row) => any;
  valueFormatter?: (value, row) => string;
  valueParser?: (value: string, row) => any;
  valueSetter?: (value, row) => any;
  sortComparator?: (a, b, direction: 'asc'|'desc') => number;
  colSpan?: number | ((value, row) => number);
  aggregate?: 'sum'|'avg'|'min'|'max'|'count' | ((values, rows) => any);
  renderCell?: (value, row, column) => HTMLElement|string;
  renderEditor?: (value, row, column, commit, cancel) => HTMLElement;
  wrap?: boolean;
  ellipsis?: boolean;
  tooltip?: boolean | ((value, row?) => string);
  numberFormat?: { decimals?, thousandsSeparator?, prefix?, suffix?, negativeStyle? };
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  ratingFormat?: { max?, color? };
  progressFormat?: { max?, color?, colorize?, showPercentage?, height? };
  sparklineFormat?: { type?, color?, width?, height? };
  currencyFormat?: CurrencyFormat;
  percentageFormat?: { decimals?, colorize? };
  conditionalFormats?: ConditionalFormat[];
}
```

### Column Types

Source of truth (`ColumnType`): `text, number, date, boolean, currency, percent, rating, progress, sparkline, accounting, scientific, fraction, duration, filesize, custom`

`getCellTagName()` additionally renders `tag, status, actions, link, email, phone, color, image, location, json, percentage` (alias of `percent`) at runtime — not yet in the `ColumnType` union, cast (`as ColumnType`) if using a strict `ColumnDefinition[]`.

## Methods

- `setData(data)` - Set table data array
- `setColumns(columns)` - Set column definitions
- `renderHeader()` - Re-render header
- `renderBody()` - Re-render body
- `toggleSort(columnKey, multiSort?)` - Toggle sort on a column
- `goToPage(page)` - Navigate to a specific page
- `setPageSize(size)` - Change rows per page
- `setToolbar(options)` - Add toolbar (search, sort, filter, export buttons)
- `setTreeData(options)` - Enable tree/hierarchical data
- `setDetailPanel(options)` - Enable master-detail expand rows
- `setColumnFilter(column, operator, value)` - Set filter on column
- `removeColumnFilter(column)` - Remove filter from column
- `clearAllFilters()` - Clear all filters
- `setFilterModel(model)` - Set full filter model
- `getFilterModel()` - Get current filter model
- `setQuickFilter(text)` - Set quick search filter
- `pinColumn(key, side)` - Pin column left/right
- `unpinColumn(key)` - Unpin column
- `setColumnVisible(key, visible)` - Show/hide column
- `autoSizeColumn(key)` - Auto-size column to content
- `autoSizeAllColumns()` - Auto-size all columns
- `moveColumn(key, toIndex)` - Reorder column

## Events

- `row-clicked` -> `{ rowData, rowIndex }` (requires `clickable`)
- `table-row-selection-changed` -> `{ selectedRows, rowIndex, selected }`
- `table-select-all-changed` -> `{ selectedRows, allSelected }`
- `selection-changed` -> `{ selectedRows, rows }`
- `sort-change` -> `{ sort }`
- `filter-change` -> `{ filters }`
- `page-change` -> `{ page, pageSize, totalPages, totalItems }`
- `column-visibility-change` -> `{ key, visible, visibility }`
- `column-pin-change` -> `{ key, pinned }`
- `column-order-change` -> `{ key, toIndex }`
- `density-change` -> `{ density }`
- `table-load-error` -> `{ error }` (remote-mode fetch failed)
- `lazy-load` -> `{ currentCount }` (requires `lazyLoad`)
- `cell-edit-commit` -> `{ rowIndex, columnKey, oldValue, newValue }`
- `cell-edit-cancel` -> `{ rowIndex, columnKey }`
- `row-edit-commit` -> `{ rowIndex, oldRow, newRow }` (edit-mode="row")
- `row-edit-cancel` -> `{ rowIndex }`
- `row-expand` -> `{ rowIndex }`
- `row-collapse` -> `{ rowIndex }`
- `detail-toggle` -> `{ rowIndex, expanded }`
- `row-reorder` -> `{ fromIndex, toIndex }` (requires `rowReorder`)
- `column-reorder` -> `{ fromKey, toKey }` (requires `columnReorder`)
- `column-resize` -> `{ key, width }` (live, per mousemove)
- `column-resize-end` -> `{ key, width }`
- `tree-toggle` -> `{ key, expanded }`
- `cell-action` -> `{ action, rowData, column }` (actions-type cell button click)
- `group-toggle` -> `{ key, value, expanded }` (`key` opaque/stable)

## Slots

- `columns` - `<snice-column>` elements for declarative column definitions
- `rows` - `<snice-row>` elements for declarative row data
- `header` - Superheader content above column headers
- `empty-state` - Custom content instead of the default `<snice-empty-state>` when `data` is empty

## Basic Usage

```typescript
const table = document.querySelector('snice-table');

// Reactive — assigning columns/data re-renders automatically.
table.columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'department', label: 'Department' },
  { key: 'revenue', label: 'Revenue', type: 'currency',
    aggregate: 'sum', numberFormat: { prefix: '$', thousandsSeparator: true } },
  { key: 'progress', label: 'Progress', type: 'progress',
    progressFormat: { colorize: true } }
];
table.data = [
  { name: 'A', department: 'Engineering', revenue: 50000, progress: 85 }
];
table.groupBy = 'department';
table.setToolbar({ showSearch: true, showSort: true, showFilter: true, showExport: true });
```

`setColumns()` is a reactive alias for `columns = ...`. `setData()` is the
non-eager bulk-load path; call `renderBody()` unless another assignment already
schedules the paint.

## Examples

```typescript
table.groupBy = ['department', 'level'];
table.groupDefaults = { expanded: false };

// Built-ins ignore null/blank/boolean/non-numeric values; count counts rows.
// valueGetter runs before aggregate.
columns[3].aggregate = (values, rows) => values.reduce((a, b) => a + b, 0);

// Declarative built-in; custom reducers use column.aggregate property.
// <snice-column slot="columns" key="salary" aggregate="sum"></snice-column>
```

- Sort: within groups; group order: group key.
- Filter: empty groups removed; aggregates use filtered rows.
- Pagination/virtualization: flattened group/header/row/footer model.
- Aggregate display: column type + `formatter`/`valueFormatter` pipeline.
- Row reorder: cross-group drops update active `groupBy` fields to reparent the row.
- Group/aggregate colors: `--snice-table-group-*` and `--snice-table-aggregate-*` variables.
- Remote mode: aggregates cover currently loaded `data`.
- `groupBy` hierarchy takes precedence over tree hierarchy; aggregation-only preserves tree/master-detail.

## Keyboard Navigation

- Group chevron: Tab, Enter/Space.
- Group checkbox: select allowed rows; partial selection -> mixed state.
- Grid arrows/Home/End/Page keys follow visible grouped data order.

## Accessibility

- Group buttons: dynamic action label + row count + `aria-expanded`.
- Grid `aria-rowcount`: visible group/data/aggregate rows.
- Group/subtotal/total rows: distinct accessible labels.
