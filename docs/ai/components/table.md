# snice-table

Data table with sorting, search, selection, pagination, and 15 column types.

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
searchDebounce: number = 500;     // attr: search-debounce
selector: string = '';
selectorOptions: Array<{value: string, label: string}> = []; // JS only
currentSort: Array<{column: string, direction: 'asc'|'desc'}> = []; // JS only
selectedRows: number[] = [];      // JS only
pagination: boolean = false;
paginationMode: 'client'|'server' = 'client'; // attr: pagination-mode
pageSize: number = 10;            // attr: page-size
currentPage: number = 1;          // attr: current-page
totalItems: number = 0;           // attr: total-items
pageSizes: number[] = [10, 25, 50, 100]; // JS only
columns: any[] = [];              // JS only (plain property)
data: any[] = [];                 // JS only (plain property)
```

## Slots

- `columns` - `<snice-column>` elements for declarative column definitions
- `rows` - `<snice-row>` elements for declarative row data

## Events

- `row-clicked` → `{ rowData, rowIndex }`
- `table-row-selection-changed` → `{ selectedRows, rowIndex, selected }`
- `table-select-all-changed` → `{ selectedRows, allSelected }`
- `page-change` → `{ page, pageSize, totalPages, totalItems }`

## Methods

- `setData(data)` - Set table data array
- `setColumns(columns)` - Set column definitions
- `renderHeader()` - Re-render header
- `renderBody()` - Re-render body
- `renderControls()` - Re-render search/filter controls
- `renderPagination()` - Re-render pagination
- `toggleSort(columnKey, multiSort?)` - Toggle sort on a column
- `goToPage(page)` - Navigate to a specific page
- `setPageSize(size)` - Change rows per page

## Column Types

text, number, date, boolean, currency, percent, rating, progress, sparkline, accounting, scientific, fraction, duration, filesize, custom

## ColumnDefinition

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;
  align?: 'left'|'center'|'right';
  width?: string;
  sortable?: boolean;
  formatter?: (value, row) => string;
  numberFormat?: NumberFormat;
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  ratingFormat?: RatingFormat;
  progressFormat?: ProgressFormat;
  sparklineFormat?: SparklineFormat;
  currencyFormat?: CurrencyFormat;
  conditionalFormats?: ConditionalFormat[];
}
```

## Usage

```html
<snice-table id="table" striped hoverable sortable></snice-table>
<script>
  const table = document.querySelector('#table');
  table.setColumns([
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', type: 'number', align: 'right' },
    { key: 'price', label: 'Price', type: 'currency', currencyFormat: { currency: 'USD' } },
    { key: 'rating', label: 'Rating', type: 'rating', ratingFormat: { max: 5 } }
  ]);
  table.setData([
    { name: 'John', age: 30, price: 99.99, rating: 4 },
    { name: 'Jane', age: 25, price: 149.99, rating: 5 }
  ]);
</script>

<!-- Declarative columns -->
<snice-table>
  <snice-column key="name" label="Name"></snice-column>
  <snice-column key="age" label="Age" type="number"></snice-column>
  <snice-row name="Alice" age="30"></snice-row>
  <snice-row name="Bob" age="25"></snice-row>
</snice-table>

<snice-table selectable clickable searchable></snice-table>
<snice-table list></snice-table>
```
