<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/table.md -->

# Table
`<snice-table>`

Displays tabular data with sorting, filtering, search, selection, pagination, column resize, column menu, tree data, master-detail, toolbar, and 20+ specialized column types.

## Table of Contents
- [Properties](#properties)
- [Column Definition](#column-definition)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `striped` | `boolean` | `false` | Alternating row background colors |
| `searchable` | `boolean` | `false` | Show search input |
| `filterable` | `boolean` | `false` | Show filter dropdown |
| `sortable` | `boolean` | `false` | Enable column sorting |
| `selectable` | `boolean` | `false` | Enable row selection with checkboxes |
| `hoverable` | `boolean` | `true` | Highlight rows on hover |
| `clickable` | `boolean` | `false` | Emit `row-clicked` on row click |
| `list` | `boolean` | `false` | Hide vertical cell borders |
| `loading` | `boolean` | `false` | Show loading state |
| `mode` | `'local'\|'remote'` | `'local'` | `'local'`: table owns the dataset. `'remote'`: every filter/sort/search/page change requests data via `@request('table/data')` |
| `columns` | `ColumnDefinition[]` | `[]` | Column definitions — reactive; assigning re-renders the header + body |
| `data` | `any[]` | `[]` | Row data — reactive; assigning re-renders the body |
| `searchText` | `string` | `''` | Current search text. Not an attribute; reassigning does not re-render (avoids stealing input focus while typing) |
| `searchDebounce` (attr: `search-debounce`) | `number` | `500` | Search input debounce in milliseconds |
| `currentSort` | `Array<{ column, direction }>` | `[]` | Current sort state — reactive; assigning re-sorts (local mode) or re-requests (remote mode) |
| `selectedRows` | `number[]` | `[]` | Indices of selected rows (JS only) |
| `selector` | `string` | `''` | Selected filter-dropdown value(s), comma-joined |
| `selectorOptions` | `Array<{value, label}>` | `[]` | Options for the `filterable` dropdown (JS only) |
| `pagination` | `boolean` | `false` | Enable pagination |
| `paginationMode` (attr: `pagination-mode`) | `'client'\|'server'` | `'client'` | Client-side or server-side pagination |
| `pageSize` (attr: `page-size`) | `number` | `10` | Rows per page |
| `currentPage` (attr: `current-page`) | `number` | `1` | Current page number |
| `totalItems` (attr: `total-items`) | `number` | `0` | Total item count (server mode) |
| `pageSizes` | `number[]` | `[10, 25, 50, 100]` | Available page size options (JS only) |
| `virtualize` | `boolean` | `false` | Render only the visible row window (large datasets) |
| `rowHeight` (attr: `row-height`) | `number` | `48` | Row height in pixels (virtualization and fixed-height rows) |
| `virtualBuffer` (attr: `virtual-buffer`) | `number` | `200` | Extra pixels rendered above/below the viewport when `virtualize` is on |
| `editable` | `boolean` | `false` | Enable inline cell/row editing |
| `editMode` (attr: `edit-mode`) | `'cell'\|'row'` | `'cell'` | Edit one cell at a time, or the whole row |
| `density` | `'compact'\|'standard'\|'comfortable'` | `'standard'` | Row height density |
| `columnResize` (attr: `column-resize`) | `boolean` | `false` | Enable column resizing by dragging |
| `headerFilters` (attr: `header-filters`) | `boolean` | `false` | Show inline filter inputs below headers |
| `quickFilter` (attr: `quick-filter`) | `boolean` | `false` | Quick-filter row toggle — use `setQuickFilter()` to actually filter |
| `rowReorder` (attr: `row-reorder`) | `boolean` | `false` | Enable drag-to-reorder rows |
| `columnReorder` (attr: `column-reorder`) | `boolean` | `false` | Enable drag-to-reorder columns |
| `columnMenu` (attr: `column-menu`) | `boolean` | `false` | Enable right-click column menu |
| `lazyLoad` (attr: `lazy-load`) | `boolean` | `false` | Fire `lazy-load` when scrolled near the bottom |
| `lazyLoadThreshold` (attr: `lazy-load-threshold`) | `number` | `200` | Distance from the bottom, in pixels, that triggers `lazy-load` |

## Column Definition

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;                     // see Column Types below
  align?: 'left' | 'center' | 'right';
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
  pinned?: 'left' | 'right' | false;
  editable?: boolean;
  editorType?: 'text' | 'number' | 'date' | 'boolean' | 'select'; // overrides the type-derived editor
  selectOptions?: { value: string; label: string }[];             // options for a `select` editor
  exportable?: boolean;
  formatter?: (value: any, row?: any) => string;
  valueGetter?: (value: any, row: any) => any;
  valueFormatter?: (value: any, row: any) => string;
  valueParser?: (value: string, row: any) => any;
  valueSetter?: (value: any, row: any) => any;
  sortComparator?: (a: any, b: any, direction: 'asc' | 'desc') => number;
  colSpan?: number | ((value, row) => number);
  wrap?: boolean;
  ellipsis?: boolean;
  tooltip?: boolean | ((value: any, row?: any) => string);

  // Excel-like per-type formatting
  numberFormat?: { decimals?, thousandsSeparator?, prefix?, suffix?, negativeStyle? };
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  ratingFormat?: { max?, color? };
  progressFormat?: { max?, color?, colorize?, showPercentage?, height? };
  sparklineFormat?: { type?, color?, width?, height? };
  percentageFormat?: { decimals?, colorize? };
  phoneFormat?: PhoneFormat;
  statusFormat?: StatusFormat;
  tagFormat?: TagFormat;
  actionsFormat?: { actions: ActionButton[] };
  linkFormat?: { target?, external? };
  colorFormat?: { showSwatch?, displayFormat? };
  currencyFormat?: CurrencyFormat;
  emailFormat?: { showIcon? };
  imageFormat?: ImageFormat;
  jsonFormat?: JsonFormat;
  locationFormat?: LocationFormat;
  style?: CellStyle;
  conditionalFormats?: ConditionalFormat[];
}
```

### Column Types

`type` (source of truth: `ColumnType` in `snice-table.types.ts`):

```typescript
type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percent' |
  'rating' | 'progress' | 'sparkline' | 'accounting' | 'scientific' | 'fraction' |
  'duration' | 'filesize' | 'custom';
```

The cell renderer (`getCellTagName()`) additionally recognizes `tag`, `status`,
`actions`, `link`, `email`, `phone`, `color`, `image`, `location`, `json`, and
`percentage` (alias of `percent`) — these render correctly at runtime but
aren't yet part of the `ColumnType` union, so a strict `ColumnDefinition[]`
needs `type: 'status' as ColumnType` (or a looser array type) until it's added.

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
| `row-clicked` | `{ rowData, rowIndex }` | Row clicked (requires `clickable`) |
| `table-row-selection-changed` | `{ selectedRows, rowIndex, selected }` | A row's selection state changed |
| `table-select-all-changed` | `{ selectedRows, allSelected }` | Select-all checkbox toggled |
| `sort-change` | `{ sort }` | Sort state changed |
| `filter-change` | `{ filters }` | Filter state changed |
| `page-change` | `{ page, pageSize, totalPages, totalItems }` | Page or page size changed |
| `column-visibility-change` | `{ key, visible, visibility }` | Column shown/hidden |
| `column-pin-change` | `{ key, pinned }` | Column pinned left/right, or unpinned |
| `column-order-change` | `{ key, toIndex }` | Column moved via `moveColumn()` |
| `density-change` | `{ density }` | `density` controlled-state assignment took effect |
| `table-load-error` | `{ error }` | Remote-mode data request failed |
| `lazy-load` | `{ currentCount }` | Scrolled near the bottom (requires `lazyLoad`) |
| `cell-edit-commit` | `{ rowIndex, columnKey, oldValue, newValue }` | Cell edit committed |
| `cell-edit-cancel` | `{ rowIndex, columnKey }` | Cell edit canceled (Escape) |
| `row-edit-commit` | `{ rowIndex, oldRow, newRow }` | Row edit committed (`edit-mode="row"`) |
| `row-edit-cancel` | `{ rowIndex }` | Row edit canceled |
| `row-expand` | `{ rowIndex }` | Master-detail row expanded |
| `row-collapse` | `{ rowIndex }` | Master-detail row collapsed |
| `detail-toggle` | `{ rowIndex, expanded }` | Master-detail toggle button clicked |
| `row-reorder` | `{ fromIndex, toIndex }` | Row dragged to a new position (`row-reorder`) |
| `column-reorder` | `{ fromKey, toKey }` | Column dragged to a new position (`column-reorder`) |
| `column-resize` | `{ key, width }` | Column is being resized (live, per mouse move) |
| `column-resize-end` | `{ key, width }` | Column resize finished |
| `tree-toggle` | `{ key, expanded }` | Tree node expanded/collapsed (`setTreeData()`) |
| `cell-action` | `{ action, rowData, column }` | An `actions`-type cell's button was clicked |

## Slots

| Name | Description |
|------|-------------|
| `columns` | `<snice-column>` elements for declarative column definitions |
| `rows` | `<snice-row>` elements for declarative row data |
| `header` | Superheader content above column headers |
| `empty-state` | Custom content shown instead of the default `<snice-empty-state>` when `data` is empty |

## Basic Usage

```typescript
import 'snice/components/table/snice-table';
```

```javascript
const table = document.querySelector('snice-table');

// Reactive — assigning `columns`/`data` re-renders automatically.
table.columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'age', label: 'Age', type: 'number', align: 'right' }
];
table.data = [
  { name: 'Alice Johnson', email: 'alice@example.com', age: 32 },
  { name: 'Bob Smith', email: 'bob@example.com', age: 28 }
];
```

`setColumns()`/`setData()` are the equivalent imperative calls, useful when
you also need to force a synchronous `renderHeader()`/`renderBody()` right
after assigning (e.g. a CDN build missing `snice-column`/`snice-row`).

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
- Green (>=70%), Yellow (>=40%), Red (<40%)

### Toolbar

```javascript
table.setToolbar({
  showSearch: true,     // Search input (left-aligned)
  showSort: true,       // Opens sort modal (multi-sort)
  showFilter: true,     // Opens filter modal
  showExport: true      // CSV export button
});
```

### Column Menu (Right-Click)

Enable with `column-menu` attribute. Right-click any column header for:
- Sort Ascending / Descending
- Filter (opens filter modal pre-populated with that column)
- Hide Column
- Pin Left / Pin Right / Unpin
- Auto-size

### Column Resize

Enable with `column-resize` attribute. Drag the right edge of any column header to resize. Double-click the resize handle to auto-size to content.

### Filter Model

```javascript
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
  getPath: (row) => row.path,
  groupColumn: 'name',
  defaultExpansionDepth: 1
});

table.setData([
  { id: 1, name: 'USA', path: ['USA'] },
  { id: 2, name: 'California', path: ['USA', 'CA'] },
  { id: 3, name: 'New York', path: ['USA', 'NY'] }
]);
```

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
<snice-table searchable sortable controller="user-table"></snice-table>
```

```typescript
import { controller, respond, IController } from 'snice';

@controller('user-table')
class UserTableController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach() {}

  @respond('table/config')
  async getTableConfig() {
    return {
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'active', label: 'Status', type: 'boolean' }
      ]
    };
  }

  @respond('table/data')
  async getTableData(params) {
    const response = await fetch(`/api/users?search=${params.search}`);
    const json = await response.json();
    return { data: json.users, total: json.total };
  }
}
```
