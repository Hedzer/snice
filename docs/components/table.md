<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/table.md -->

# Table
`<snice-table>`

Displays tabular data with row grouping, aggregation, sorting, filtering, search, selection, pagination, virtualization, editing, tree data, master-detail, and 20+ specialized column types.

## Table of Contents
- [Properties](#properties)
- [Column Definition](#column-definition)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

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
| `selectionMode` (attr: `selection-mode`) | `'none'\|'single'\|'multiple'` | `'multiple'` | Selection behavior. `multiple` supports Ctrl/Cmd additive and Shift range selection |
| `selector` | `string` | `''` | Selected filter-dropdown value(s), comma-joined |
| `selectorOptions` | `Array<{value, label}>` | `[]` | Options for the `filterable` dropdown (JS only) |
| `groupBy` | `string \| string[]` | `''` | Column key(s) used for one or more grouping levels. JS-only and reactive; assign before or after connection |
| `groupDefaults` | `{ expanded?: boolean }` | `{}` | Initial expansion policy. Set `{ expanded: false }` to start groups collapsed (JS only) |
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
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count' |
    ((values: any[], rows: any[]) => any);
  renderCell?: (value, row, column) => HTMLElement | string;
  renderEditor?: (value, row, column, commit, cancel) => HTMLElement;
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
| `setData()` | `data: any[]` | Bulk-load row data without an eager paint; call `renderBody()` when needed |
| `setColumns()` | `columns: ColumnDefinition[]` | Reactively set column definitions and schedule header/body paint |
| `setToolbar()` | `options: ToolbarOptions` | Add search, optional CSV export, and fullscreen controls; also hosts the column-menu filter panel |
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
| `selection-changed` | `{ selectedRows, rows }` | Unified selection event for row, group, range, and select-all changes |
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
| `group-toggle` | `{ key, value, expanded }` | Group expanded/collapsed. `key` is an opaque stable identity |

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

`setColumns()` is a reactive alias for assigning `columns`. `setData()` is the
bulk-load path: it synchronizes row identity/filter state but intentionally
does not paint eagerly, so call `renderBody()` when it is not paired with a
column assignment that already schedules the paint.

## Examples

### Pro Table (All Features)

```javascript
// <snice-table sortable selectable column-resize column-menu striped hoverable>
table.setColumns([
  { key: 'product', label: 'Product', sortable: true },
  { key: 'revenue', label: 'Revenue', type: 'currency',
    currencyFormat: { currency: 'USD', decimals: 0 } },
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
table.setToolbar({ showSearch: true, showExport: true });
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
  showExport: true,     // CSV export button
  searchPlaceholder: 'Search employees...'
});
```

Fullscreen is always present. Sorting stays on column headers; click additional
headers to build a multi-sort. Advanced filtering opens from **Filter...** in
the right-click column menu. Enable `column-menu` and call `setToolbar()` so
that filter panel has a host.

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

// Text: contains, notContains, equals, notEquals, startsWith, endsWith,
//       isEmpty, isNotEmpty
// Number: eq, neq, gt, gte, lt, lte, isEmpty, isNotEmpty
// Date: is, isNot, after, before, onOrAfter, onOrBefore, isEmpty, isNotEmpty
// Boolean: isTrue, isFalse
```

### Row Grouping and Aggregation

Assign `groupBy` to one key or an ordered key array. Add `aggregate` to any
column to render a subtotal under every expanded group and a grand total over
all filtered rows.

```javascript
table.columns = [
  { key: 'employee', label: 'Employee' },
  { key: 'department', label: 'Department' },
  { key: 'level', label: 'Level' },
  {
    key: 'salary',
    label: 'Salary',
    type: 'number',
    aggregate: 'sum',
    numberFormat: { prefix: '$', thousandsSeparator: true }
  },
  { key: 'headcount', label: 'Headcount', aggregate: 'count' }
];

table.groupBy = ['department', 'level'];
table.groupDefaults = { expanded: true };
table.data = employees;

table.addEventListener('group-toggle', event => {
  console.log(event.detail.value, event.detail.expanded);
});
```

Built-ins are `sum`, `avg`, `min`, `max`, and `count`. Numeric reducers ignore
null, blank, boolean, and non-numeric values; numeric strings are accepted.
`count` counts rows. A custom reducer receives the column values after
`valueGetter` and the matching raw rows:

```javascript
{
  key: 'margin',
  label: 'Weighted Margin',
  valueGetter: (_value, row) => row.revenue * row.marginRate,
  aggregate: (values, rows) => values.reduce((sum, value) => sum + value, 0)
}
```

Sorting applies within each group, filtering removes empty groups, and totals
use only filtered rows. Client pagination and virtualization operate on the
same flattened sequence of group headers, data rows, and subtotal/total rows.
Aggregate results use the column's type/`formatter`/`valueFormatter` display
pipeline. With `rowReorder` enabled, a drop within a group changes order; a
drop onto another group reparents the row by updating every active `groupBy`
field to the target row's group values.
In remote mode, totals cover the rows currently loaded in `data`. A non-empty
`groupBy` is the active hierarchy model; when `groupBy` is empty, a table-level
aggregate footer composes with tree data and master-detail rows.

Grouping visuals inherit the active theme and can be customized with
`--snice-table-group-header-bg`, `--snice-table-group-header-color`,
`--snice-table-group-count-bg`, `--snice-table-group-count-color`,
`--snice-table-aggregate-bg`, `--snice-table-aggregate-color`,
`--snice-table-aggregate-label-color`, and
`--snice-table-aggregate-border-color`.

Declarative columns support built-in aggregators with the `aggregate`
attribute. Custom reducers are property-only:

```html
<snice-table id="department-table">
  <snice-column slot="columns" key="employee" label="Employee"></snice-column>
  <snice-column slot="columns" key="department" label="Department"></snice-column>
  <snice-column slot="columns" key="salary" label="Salary" type="number" aggregate="sum"></snice-column>
  <snice-row slot="rows" data-employee="Alice" data-department="Engineering" data-salary="100000"></snice-row>
  <snice-row slot="rows" data-employee="Bob" data-department="Engineering" data-salary="80000"></snice-row>
</snice-table>

<script>
  const table = document.querySelector('#department-table');
  table.groupBy = 'department';

  const salary = table.querySelector('snice-column[key="salary"]');
  salary.aggregate = (values, rows) => values.reduce((sum, value) => sum + Number(value), 0);
</script>
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
    return { data: json.users, totalItems: json.total };
  }
}
```

## Keyboard Navigation

- Arrow keys, Home/End, and Page Up/Down move the active grid cell.
- Enter activates an editable cell.
- Shift+Space toggles the focused row; Ctrl/Cmd+A selects all selectable rows.
- Group chevrons are native buttons: Tab to them, then use Enter or Space to expand/collapse.
- Group checkboxes select only rows allowed by `setSelectabilityCheck()` and expose mixed state for partial selection.

## Accessibility

- Uses native table semantics enhanced with the WAI-ARIA grid pattern.
- `aria-rowcount` includes visible group headers and aggregate rows; collapsed descendants are excluded.
- Group toggles expose an action label, row count, and `aria-expanded` state.
- Group headers, subtotals, and grand totals have distinct accessible labels.
- Focus indicators use `:focus-visible`, so keyboard focus is visible without a persistent mouse-focus ring.
