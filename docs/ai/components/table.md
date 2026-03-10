# snice-table

Data table with sorting, filtering, search, selection, pagination, column resize, column menu, tree data, master-detail, toolbar, and 20+ column types.

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
editable: boolean = false;
columnResize: boolean = false;       // attr: column-resize
columnMenu: boolean = false;         // attr: column-menu
headerFilters: boolean = false;      // attr: header-filters
density: 'compact'|'standard'|'comfortable' = 'standard';
searchDebounce: number = 500;        // attr: search-debounce
selector: string = '';
selectorOptions: Array<{value: string, label: string}> = []; // JS only
currentSort: Array<{column: string, direction: 'asc'|'desc'}> = []; // JS only
selectedRows: number[] = [];         // JS only
pagination: boolean = false;
paginationMode: 'client'|'server' = 'client'; // attr: pagination-mode
pageSize: number = 10;               // attr: page-size
currentPage: number = 1;             // attr: current-page
totalItems: number = 0;              // attr: total-items
pageSizes: number[] = [10, 25, 50, 100]; // JS only
columns: any[] = [];                 // JS only
data: any[] = [];                    // JS only
```

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

- `row-clicked` -> `{ rowData, rowIndex }`
- `table-row-selection-changed` -> `{ selectedRows, rowIndex, selected }`
- `table-select-all-changed` -> `{ selectedRows, allSelected }`
- `page-change` -> `{ page, pageSize, totalPages, totalItems }`
- `column-resize` -> `{ key, width }`
- `column-resize-end` -> `{ key, width }`
- `filter-change` -> filter model
- `sort-change` -> sort model

## Slots

- `columns` - `<snice-column>` elements for declarative column definitions
- `rows` - `<snice-row>` elements for declarative row data
- `header` - Superheader content above column headers

## Column Definition

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;
  align?: 'left'|'center'|'right';
  width?: string;
  sortable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
  hideable?: boolean;
  pinnable?: boolean;
  formatter?: (value, row) => string;
  numberFormat?: { decimals?, thousandsSeparator?, prefix?, suffix?, negativeStyle? };
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  ratingFormat?: { max?, color? };
  progressFormat?: { max?, color?, colorize?, showPercentage?, height? };
  sparklineFormat?: { type?, color?, width?, height? };
  currencyFormat?: CurrencyFormat;
  percentageFormat?: { decimals?, colorize? };
  conditionalFormats?: ConditionalFormat[];
  colSpan?: number | ((value, row) => number);
}
```

Column types: text, number, date, boolean, currency, percent, rating, progress, sparkline, tag, status, email, phone, link, color, image, duration, filesize, location, json, actions, custom

## Basic Usage

```typescript
table.setColumns([
  { key: 'name', label: 'Name', sortable: true },
  { key: 'revenue', label: 'Revenue', type: 'currency',
    numberFormat: { prefix: '$', thousandsSeparator: true } },
  { key: 'progress', label: 'Progress', type: 'progress',
    progressFormat: { colorize: true } }
]);
table.setData([
  { name: 'A', revenue: 50000, progress: 85 }
]);
table.setToolbar({ showSearch: true, showSort: true, showFilter: true, showExport: true });
```
