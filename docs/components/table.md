<!-- AI: For a low-token version of this doc, use docs/ai/components/table.md instead -->

# Table
`<snice-table>`

Displays tabular data with sorting, filtering, search, selection, pagination, column resize, column menu, tree data, master-detail, toolbar, and 20+ specialized column types.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/table/snice-table';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-table.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `striped` | `boolean` | `false` | Alternating row background colors |
| `searchable` | `boolean` | `false` | Show search input |
| `filterable` | `boolean` | `false` | Show filter dropdown |
| `sortable` | `boolean` | `false` | Enable column sorting |
| `selectable` | `boolean` | `false` | Enable row selection with checkboxes |
| `hoverable` | `boolean` | `true` | Highlight rows on hover |
| `clickable` | `boolean` | `false` | Emit events on row click |
| `list` | `boolean` | `false` | Hide vertical cell borders |
| `editable` | `boolean` | `false` | Enable inline cell editing |
| `column-resize` | `boolean` | `false` | Enable column resizing by dragging |
| `column-menu` | `boolean` | `false` | Enable right-click column menu |
| `header-filters` | `boolean` | `false` | Show inline filter inputs below headers |
| `density` | `'compact'\|'standard'\|'comfortable'` | `'standard'` | Row height density |
| `loading` | `boolean` | `false` | Show loading state |
| `searchDebounce` (attr: `search-debounce`) | `number` | `500` | Search input debounce in milliseconds |
| `currentSort` | `Array<{ column, direction }>` | `[]` | Current sort state (JS only) |
| `selectedRows` | `number[]` | `[]` | Indices of selected rows (JS only) |
| `pagination` | `boolean` | `false` | Enable pagination |
| `paginationMode` (attr: `pagination-mode`) | `'client'\|'server'` | `'client'` | Client-side or server-side pagination |
| `pageSize` (attr: `page-size`) | `number` | `10` | Rows per page |
| `currentPage` (attr: `current-page`) | `number` | `1` | Current page number |
| `totalItems` (attr: `total-items`) | `number` | `0` | Total item count (server mode) |
| `pageSizes` | `number[]` | `[10, 25, 50, 100]` | Available page size options (JS only) |

## Column Definition

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percent' |
         'rating' | 'progress' | 'sparkline' | 'tag' | 'status' | 'email' |
         'phone' | 'link' | 'color' | 'image' | 'duration' | 'filesize' |
         'location' | 'json' | 'actions' | 'custom';
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  resizable?: boolean;       // default: true (when column-resize enabled)
  reorderable?: boolean;     // default: true
  hideable?: boolean;        // default: true
  pinnable?: boolean;        // default: true
  formatter?: (value: any, row?: any) => string;
  numberFormat?: { decimals?, thousandsSeparator?, prefix?, suffix?, negativeStyle? };
  ratingFormat?: { max?, color? };
  progressFormat?: { max?, color?, colorize?, showPercentage?, height? };
  sparklineFormat?: { type?, color?, width?, height? };
  percentageFormat?: { decimals?, colorize? };
  currencyFormat?: CurrencyFormat;
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  tagFormat?: TagFormat;
  statusFormat?: StatusFormat;
  linkFormat?: { target?, external? };
  colorFormat?: { showSwatch?, displayFormat? };
  emailFormat?: { showIcon? };
  phoneFormat?: { showIcon?, format? };
  conditionalFormats?: ConditionalFormat[];
  colSpan?: number | ((value, row) => number);
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setData()` | `data: any[]` | Set table row data |
| `setColumns()` | `columns: ColumnDefinition[]` | Set column definitions |
| `setToolbar()` | `options: ToolbarOptions` | Add toolbar with search, sort, filter, export |
| `setTreeData()` | `options: TreeDataOptions` | Enable tree/hierarchical data |
| `setDetailPanel()` | `options: DetailPanelOptions` | Enable master-detail expand rows |
| `renderHeader()` | -- | Re-render the table header |
| `renderBody()` | -- | Re-render the table body |
| `toggleSort()` | `columnKey: string, multiSort?: boolean` | Toggle sort on a column |
| `goToPage()` | `page: number` | Navigate to a specific page |
| `setPageSize()` | `size: number` | Change rows per page |
| `setColumnFilter()` | `column, operator, value` | Set filter on a column |
| `removeColumnFilter()` | `column: string` | Remove filter from column |
| `clearAllFilters()` | -- | Clear all filters |
| `setFilterModel()` | `model: FilterModel` | Set full filter model |
| `getFilterModel()` | -- | Get current filter model |
| `setQuickFilter()` | `text: string` | Set quick search filter |
| `pinColumn()` | `key, side: 'left'\|'right'` | Pin column to left or right |
| `unpinColumn()` | `key: string` | Unpin column |
| `setColumnVisible()` | `key, visible: boolean` | Show/hide column |
| `autoSizeColumn()` | `key: string` | Auto-size column to fit content |
| `autoSizeAllColumns()` | -- | Auto-size all columns |
| `moveColumn()` | `key, toIndex: number` | Reorder column position |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `table-row-selection-changed` | `{ selectedRows, rowIndex, selected }` | A row's selection state changed |
| `table-select-all-changed` | `{ selectedRows, allSelected }` | Select-all checkbox toggled |
| `row-clicked` | `{ rowData, rowIndex }` | A row was clicked (requires `clickable`) |
| `page-change` | `{ page, pageSize, totalPages, totalItems }` | Page or page size changed |
| `column-resize` | `{ key, width }` | Column is being resized |
| `column-resize-end` | `{ key, width }` | Column resize finished |
| `filter-change` | filter model | Filter state changed |
| `sort-change` | sort model | Sort state changed |

## Slots

| Name | Description |
|------|-------------|
| `columns` | `<snice-column>` elements for declarative column definitions |
| `rows` | `<snice-row>` elements for declarative row data |
| `header` | Superheader content above column headers |

## Basic Usage

```javascript
table.setColumns([
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'age', label: 'Age', type: 'number', align: 'right' }
]);
table.setData([
  { name: 'Alice Johnson', email: 'alice@example.com', age: 32 },
  { name: 'Bob Smith', email: 'bob@example.com', age: 28 }
]);
```

## Examples

### Pro Table (All Features)

```javascript
// <snice-table sortable selectable column-resize column-menu striped hoverable>
table.setColumns([
  { key: 'product', label: 'Product', sortable: true },
  { key: 'revenue', label: 'Revenue', type: 'currency',
    numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 } },
  { key: 'rating', label: 'Rating', type: 'rating' },
  { key: 'progress', label: 'Completion', type: 'progress',
    progressFormat: { colorize: true } },
  { key: 'trend', label: 'Trend', type: 'sparkline',
    sparklineFormat: { type: 'line', height: 24, width: 80 } },
  { key: 'status', label: 'Status', type: 'tag' }
]);
table.setData([
  { product: 'Alpha', revenue: 284500, rating: 4.5, progress: 92,
    trend: { values: [32,35,38,42,45,48], color: '#22c55e' }, status: 'Active' },
  { product: 'Beta', revenue: 891200, rating: 4, progress: 34,
    trend: { values: [50,48,45,43,42,40], color: '#ef4444' }, status: 'Paused' }
]);
table.setToolbar({ showSearch: true, showSort: true, showFilter: true, showExport: true });
```

### Per-Row Cell Styling

Sparklines and progress bars support per-row color via object values:

```javascript
// Sparkline with per-row color
{ trend: { values: [10, 20, 30, 40], color: '#22c55e' } }

// Progress with per-row color
{ completion: { value: 85, color: '#22c55e' } }
```

Set `colorize: true` on `progressFormat` to auto-color based on value:
- Green (≥70%), Yellow (≥40%), Red (<40%)

### Toolbar

```javascript
table.setToolbar({
  showSearch: true,     // Search input (left-aligned)
  showSort: true,       // Opens sort modal (multi-sort)
  showFilter: true,     // Opens filter modal (MUI X Pro format)
  showExport: true      // CSV export button
});
```

The sort and filter buttons open modal dialogs using `snice-modal` with `snice-select` and `snice-input` components.

### Column Menu (Right-Click)

Enable with `column-menu` attribute. Right-click any column header for:
- Sort Ascending / Descending
- Filter (opens filter modal pre-populated with that column)
- Hide Column
- Pin Left / Pin Right / Unpin
- Auto-size

### Column Resize

Enable with `column-resize` attribute. Drag the right edge of any column header to resize. Double-click the resize handle to auto-size to content. Uses `table-layout: fixed` for precise width control.

### Filter Model (MUI X Pro Compatible)

```javascript
// Set filters programmatically
table.setFilterModel({
  filters: [
    { column: 'name', operator: 'contains', value: 'john' },
    { column: 'age', operator: 'gt', value: 25 }
  ],
  logic: 'and'  // 'and' | 'or'
});

// Text operators: contains, equals, startsWith, endsWith, isEmpty, isNotEmpty
// Number operators: eq, neq, gt, gte, lt, lte
// Date operators: is, not, after, before, onOrAfter, onOrBefore
// Boolean operators: is
```

### Tree Data

```javascript
table.setTreeData({
  getPath: (row) => row.path,      // Returns path array e.g. ['US', 'CA']
  groupColumn: 'name',             // Column with expand/collapse toggle
  defaultExpansionDepth: 1          // Auto-expand to depth 1
});

table.setData([
  { id: 1, name: 'USA', path: ['USA'] },
  { id: 2, name: 'California', path: ['USA', 'CA'] },
  { id: 3, name: 'New York', path: ['USA', 'NY'] }
]);
```

Clicking either the caret icon or the parent node text will expand/collapse.

### Select-All with Filters

When filters are active, the select-all checkbox only selects the visible/filtered rows — not all data. This matches MUI X Pro behavior.

### Declarative Columns and Rows

```html
<snice-table striped hoverable>
  <snice-column slot="columns" key="name" label="Name"></snice-column>
  <snice-column slot="columns" key="email" label="Email"></snice-column>
  <snice-row slot="rows" data='{"name":"Alice","email":"alice@example.com"}'></snice-row>
  <snice-row slot="rows" data='{"name":"Bob","email":"bob@example.com"}'></snice-row>
</snice-table>
```

### With Controller (Request/Respond)

```html
<my-table-controller></my-table-controller>
<snice-table searchable sortable></snice-table>
```

```typescript
import { element, respond } from 'snice';

@element('my-table-controller')
class MyTableController extends HTMLElement {
  @respond('table/config')
  getConfig() {
    return {
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', type: 'boolean' }
      ]
    };
  }

  @respond('table/data')
  async getData(params) {
    // params includes: search, sort, filter, page, pageSize
    const response = await fetch(`/api/users?search=${params.search}`);
    const data = await response.json();
    return { data };
  }
}
```
