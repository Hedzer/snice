# snice-table

Data table with sorting, search, selection, and 15 column types.

## Properties

```typescript
size: 'small'|'medium'|'large' = 'medium';
variant: 'default'|'striped'|'bordered' = 'default';
striped: boolean = false;
hoverable: boolean = true;
bordered: boolean = false;
stickyHeader: boolean = false;    // attr: sticky-header
sortable: boolean = false;
selectable: boolean = false;
clickable: boolean = false;
loading: boolean = false;
searchable: boolean = false;
searchDebounce: number = 300;     // attr: search-debounce
list: boolean = false;
selector: string = '';
selectorOptions: string = '';     // attr: selector-options
```

## Events

- `row-clicked` → `{ rowData, rowIndex }`
- `table-row-selection-changed` → `{ selectedRows, rowIndex, selected }`
- `table-select-all-changed` → `{ selectedRows, allSelected }`

## Methods

- `setData(data)` - Set table data array
- `setColumns(columns)` - Set column definitions
- `renderHeader()` - Re-render header
- `renderBody()` - Re-render body
- `toggleSort(column)` - Sort by column

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
