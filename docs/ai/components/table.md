# snice-table, snice-row, snice-column, snice-cell, snice-header

Data table with Excel-like formatting, sorting, pagination, and 15 column types.

## snice-table

```typescript
size: 'small'|'medium'|'large' = 'medium';
variant: 'default'|'striped'|'bordered' = 'default';
striped: boolean = false;
hoverable: boolean = true;
bordered: boolean = false;
stickyHeader: boolean = false;
sortable: boolean = false;
selectable: boolean = false;
clickable: boolean = false;
loading: boolean = false;
data: any[] = [];
columns: ColumnDefinition[] = [];
searchable: boolean = false;
showPagination: boolean = false;
pageSize: number = 10;
currentPage: number = 1;
totalItems: number = 0;
```

**Methods:**
- `setData(data)` - Set table data
- `sort(column)` - Sort by column
- `getSelectedRows()` - Get selected rows
- `search(query)` - Filter data
- `goToPage(page)` - Navigate pagination

**Events:**
- `row-clicked` - {rowData, rowIndex}
- `table-row-selection-changed` - {selectedRows, rowIndex, selected}
- `table-select-all-changed` - {selectedRows, allSelected}

## Column Types

15 specialized column types with formatting options:

1. **text** - Plain text
2. **number** - Formatted numbers (decimals, thousands separators, prefix/suffix)
3. **date** - Date formatting (short/medium/long/full/custom)
4. **boolean** - True/false with symbols or text
5. **currency** - Currency formatting with locale and display options
6. **percent** - Percentages with trends and colorization
7. **rating** - Star ratings with custom symbols
8. **progress** - Progress bars with percentage
9. **sparkline** - Inline charts (line/bar/area)
10. **accounting** - Accounting number format
11. **scientific** - Scientific notation
12. **fraction** - Fraction display
13. **duration** - Time durations
14. **filesize** - File size formatting
15. **custom** - Custom formatter function

## Column Definition

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;
  align?: 'left'|'center'|'right';
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value, row) => string;

  // Excel-like formatting
  numberFormat?: NumberFormat;
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  ratingFormat?: RatingFormat;
  progressFormat?: ProgressFormat;
  sparklineFormat?: SparklineFormat;
  percentageFormat?: PercentageFormat;
  currencyFormat?: CurrencyFormat;

  // Additional formats
  phoneFormat?: PhoneFormat;
  statusFormat?: StatusFormat;
  tagFormat?: TagFormat;
  actionsFormat?: ActionsFormat;
  linkFormat?: LinkFormat;
  colorFormat?: ColorFormat;
  emailFormat?: EmailFormat;
  imageFormat?: ImageFormat;
  jsonFormat?: JsonFormat;
  locationFormat?: LocationFormat;

  // Cell styling
  style?: CellStyle;
  conditionalFormats?: ConditionalFormat[];

  // Display options
  wrap?: boolean;
  ellipsis?: boolean;
  tooltip?: boolean | ((value, row) => string);
}
```

## Usage

```html
<!-- Basic table -->
<snice-table id="table"></snice-table>

<script>
const table = document.querySelector('#table');

table.columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age', type: 'number', align: 'right' },
  { key: 'email', label: 'Email' }
];

table.data = [
  { name: 'John', age: 30, email: 'john@example.com' },
  { name: 'Jane', age: 25, email: 'jane@example.com' }
];
</script>

<!-- Striped and hoverable -->
<snice-table striped hoverable></snice-table>

<!-- With sorting and selection -->
<snice-table sortable selectable></snice-table>

<!-- With search -->
<snice-table searchable></snice-table>

<!-- Sticky header -->
<snice-table sticky-header></snice-table>

<!-- Advanced formatting -->
<script>
table.columns = [
  {
    key: 'price',
    label: 'Price',
    type: 'currency',
    currencyFormat: { currency: 'USD', decimals: 2 }
  },
  {
    key: 'progress',
    label: 'Progress',
    type: 'progress',
    progressFormat: { max: 100, showPercentage: true }
  },
  {
    key: 'rating',
    label: 'Rating',
    type: 'rating',
    ratingFormat: { max: 5, symbol: '★' }
  },
  {
    key: 'trend',
    label: 'Trend',
    type: 'sparkline',
    sparklineFormat: { type: 'line', color: '#3b82f6' }
  },
  {
    key: 'status',
    label: 'Status',
    type: 'boolean',
    booleanFormat: { trueValue: 'Active', falseValue: 'Inactive', useSymbols: true }
  }
];
</script>

<!-- Conditional formatting -->
<script>
table.columns = [
  {
    key: 'score',
    label: 'Score',
    type: 'number',
    conditionalFormats: [
      {
        condition: (val) => val >= 90,
        style: { backgroundColor: '#dcfce7', color: '#166534' }
      },
      {
        condition: (val) => val < 60,
        style: { backgroundColor: '#fee2e2', color: '#991b1b' }
      }
    ]
  }
];
</script>

<!-- Event handling -->
<script>
table.addEventListener('row-clicked', (e) => {
  console.log('Clicked row:', e.detail.rowData);
});

table.addEventListener('table-row-selection-changed', (e) => {
  console.log('Selected rows:', e.detail.selectedRows);
});
</script>
```

## Features

- 15 specialized column types
- Excel-like formatting for numbers, dates, currencies
- Visual formatters (progress bars, ratings, sparklines)
- Conditional formatting with styles
- Sorting and filtering
- Row selection
- Pagination and search
- Sticky header
- Custom cell formatters
- Tooltips and ellipsis
- Action buttons in cells
- 3 sizes and variants
- Loading state
- Responsive and accessible
