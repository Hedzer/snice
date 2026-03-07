# snice-table: MUI DataGrid Pro Parity

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring snice-table to feature parity with MUI DataGrid Pro (paid tier).

**Architecture:** Pure web components, shadow DOM, CSS custom properties, no external dependencies. All new features are opt-in via boolean attributes/properties. Server-side support via existing `@request`/`@respond` controller pattern.

**Tech Stack:** TypeScript, snice framework decorators, native browser APIs (Drag & Drop, IntersectionObserver, Clipboard API, Blob API).

---

## Current State

snice-table has 46 files in `components/table/`. It provides:
- 25+ cell types (text, number, date, boolean, currency, rating, progress, sparkline, etc.)
- Multi-column sorting (client + server-side)
- Row selection (checkbox, select-all with indeterminate)
- Global search (debounced, server-delegated)
- Selector-based filtering (via snice-select)
- Conditional formatting per cell
- Custom formatters per column
- Cell action buttons
- Loading state with spinner
- Striped/bordered/hoverable/list variants
- Declarative (`<snice-column>` + `<snice-row>`) and imperative (`setColumns()`/`setData()`) APIs
- Controller pattern for server-side data (`@request('table/config')`, `@request('table/data')`)

**Types already declared but NOT implemented:** `showPagination`, `pageSize`, `currentPage`, `totalItems`, `goToPage()` are in `snice-table.types.ts` but have no implementation in `snice-table.ts`.

## MUI DataGrid Pro Feature Matrix

### Community (Free) Features

| Feature | MUI | snice-table | Gap |
|---------|-----|-------------|-----|
| Column definitions | Yes | Yes | None |
| Column sorting (single) | Yes | Yes (multi by default) | None |
| Column width | Yes | Yes | None |
| Column alignment | Yes | Yes | None |
| Row selection (single/multi/checkbox) | Yes | Yes | None |
| Loading state | Yes | Yes | None |
| Custom cell renderers | Yes | Yes (25+ types) | None |
| Density (compact/standard/comfortable) | Yes | Yes (small/medium/large) | None |
| Conditional formatting | Yes | Yes | None |
| Row hover/click | Yes | Yes | None |
| Pagination | Yes | Types only, no impl | **P0** |
| Column filtering (basic) | Yes | Global only, no per-column | **P0** |
| Column visibility toggle | Yes | No | **P1** |
| Inline cell editing | Yes | No | **P1** |
| CSV export | Yes | No | **P2** |
| Keyboard navigation | Yes | No | **P1** |
| Column auto-sizing | Yes | No | **P2** |
| Custom toolbar | Yes | Partial (search/filter bar) | **P2** |
| Value getter/formatter | Yes | Yes (formatter) | None |

### Pro (Paid) Features - TARGET PARITY

| Feature | MUI Pro | snice-table | Gap |
|---------|---------|-------------|-----|
| Multi-column sorting | Yes | Yes | None |
| Column pinning (left/right) | Yes | No | **P1** |
| Column reordering (drag & drop) | Yes | No | **P2** |
| Column resizing (drag) | Yes | No | **P1** |
| Column groups (header groups) | Yes | No | **P2** |
| Row reordering (drag & drop) | Yes | No | **P2** |
| Row pinning (top/bottom) | Yes | No | **P3** |
| Tree data | Yes | No | **P2** |
| Master-detail (row expansion) | Yes | No | **P2** |
| Lazy loading (infinite scroll) | Yes | No | **P2** |
| Row/column virtualization | Yes | No | **P0** |
| Server-side data source | Yes | Yes (controller pattern) | None |
| Advanced filtering (multi-filter, custom operators) | Yes | No | **P0** |
| Cell selection (range) | Yes | No | **P3** |
| Clipboard copy | Yes | No | **P3** |
| Excel export | Yes | No | **P3** |

### Premium (Paid) - NOT in scope but noted

| Feature | Notes |
|---------|-------|
| Row grouping | Group by column values |
| Aggregation (sum, avg, count, min, max) | Footer/group aggregation |
| Pivoting | Full pivot table |
| Clipboard paste | Paste into editable cells |

---

## Implementation Phases

### Phase 1: Pagination + Virtualization (Foundation)

These unblock everything else. Without virtualization, large datasets are unusable. Without pagination, server-side workflows are incomplete.

#### 1A. Pagination

Types already exist in `snice-table.types.ts:225-228`. CSS placeholder exists in `snice-table.css`.

**New properties on snice-table:**
- `pagination: boolean` (attribute) - enables pagination
- `page-size: number` (attribute, default 25) - rows per page
- `current-page: number` (attribute, default 0) - zero-indexed
- `total-items: number` (attribute) - total row count (for server-side)
- `page-sizes: number[]` (property, default `[10, 25, 50, 100]`) - page size options
- `show-pagination: boolean` (attribute, alias) - backward compat with types

**New sub-component:** `snice-table-pagination.ts` + `.css`
- Page navigation: first, prev, page numbers, next, last
- Page size selector dropdown
- "Showing X-Y of Z" info text
- Fires `page-change` event: `{ page, pageSize }`

**Integration:**
- In `renderBody()`: slice `this.data` by page when no controller
- In `@request('table/data')`: send `{ page, pageSize }` in params
- Controller responds with `{ data, totalItems }`

#### 1B. Row Virtualization

Only render visible rows + buffer. Critical for 1000+ row datasets.

**New utility:** `snice-table-virtualizer.ts`
- Manages a scroll container with spacer elements (top/bottom)
- Calculates visible range from scroll position + row height
- Only creates DOM nodes for visible rows + buffer (e.g., 3 rows above/below viewport)
- Fixed row height mode first (variable height is a later optimization)
- Uses `scroll` event listener on `.snice-table` wrapper

**New properties:**
- `virtual-scroll: boolean` (attribute) - enable virtualization
- `row-height: number` (attribute, default 48) - fixed row height in px
- `overscan: number` (attribute, default 5) - buffer rows above/below viewport

**Integration:**
- When `virtual-scroll` is true, `renderBody()` delegates to virtualizer
- Virtualizer creates/recycles `<tr>` elements as user scrolls
- Total scroll height = rowCount * rowHeight (via spacer divs)
- Compatible with pagination (virtualizes current page)
- Compatible with sorting/filtering (re-renders visible range)

### Phase 2: Per-Column Filtering

The current `ColumnDefinition` already has `filterable: boolean`. Build a proper filter system.

**New types:**
```typescript
type FilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' |
  'isEmpty' | 'isNotEmpty' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' |
  'is' | 'isNot' | 'before' | 'after';

interface FilterItem {
  column: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // for 'between' operator
}

type FilterModel = FilterItem[];
```

**New properties on snice-table:**
- `filter-model: FilterModel` (property) - active filters

**New sub-component:** `snice-table-filter-panel.ts` + `.css`
- Dropdown panel shown per-column (click filter icon in header)
- Operator selector (varies by column type)
- Value input (text input, number input, date picker, select - based on column type)
- Add/remove filter rows
- Apply/Clear buttons
- Uses popover API (same pattern as split-button)

**Integration:**
- Filter icon in header cells (when `filterable` on column)
- Active filter indicator (dot/badge on header)
- Client-side: `processLocalData()` applies filters before sort
- Server-side: pass `filterModel` in `@request('table/data')` params
- Events: `filter-change` with `{ filterModel }`

### Phase 3: Column Resizing + Pinning

#### 3A. Column Resizing

**New properties:**
- `resizable: boolean` on snice-table (attribute) - enables for all columns
- `resizable: boolean` on ColumnDefinition - per-column override
- `minWidth: string` on ColumnDefinition
- `maxWidth: string` on ColumnDefinition

**Implementation:**
- Render drag handle (4px wide div) on right edge of each `<th>`
- `mousedown` on handle starts resize: track initial width + mouse X
- `mousemove` calculates delta, updates column width via CSS custom property
- `mouseup` commits the new width
- Double-click auto-sizes to content width (measure max cell width)
- Cursor: `col-resize` on handle, applied to body during drag
- Events: `column-resize` with `{ column, width }`
- Store widths in `Map<string, number>` internal state

#### 3B. Column Pinning

**New properties:**
- `pinned: 'left' | 'right' | undefined` on ColumnDefinition
- `pinned-columns: { left: string[], right: string[] }` on snice-table (property)

**Implementation:**
- Pinned columns render with `position: sticky` + calculated `left`/`right` offsets
- Left-pinned columns get cumulative `left` values
- Right-pinned columns get cumulative `right` values
- Higher `z-index` than scrollable columns
- Visual separator shadow between pinned and scrollable areas
- Pin/unpin via public API: `pinColumn(key, side)`, `unpinColumn(key)`
- Events: `column-pin-change` with `{ column, pinned }`

### Phase 4: Inline Cell Editing

**New properties:**
- `editable: boolean` on snice-table (attribute) - enables editing globally
- `editable: boolean` on ColumnDefinition - per-column
- `edit-mode: 'cell' | 'row'` on snice-table (attribute, default 'cell')

**New types:**
```typescript
interface CellEditEvent {
  column: string;
  rowIndex: number;
  rowData: any;
  oldValue: any;
  newValue: any;
}
```

**Implementation:**
- Double-click (or Enter key) on editable cell enters edit mode
- Cell renders an appropriate editor based on column type:
  - text -> `<input type="text">`
  - number -> `<input type="number">`
  - date -> `<snice-date-picker inline>`
  - boolean -> `<input type="checkbox">`
  - select (via `editorOptions` on ColumnDefinition) -> `<select>`
- Enter commits edit, Escape cancels
- Tab moves to next editable cell
- Events: `cell-edit-start`, `cell-edit-commit`, `cell-edit-cancel`
- Validation: `validator` callback on ColumnDefinition returns `true` or error message
- `processRowUpdate` callback for async server-side validation

### Phase 5: Keyboard Navigation + Column Visibility

#### 5A. Keyboard Navigation

- Arrow keys move active cell focus
- Tab/Shift+Tab move between cells
- Enter starts editing (if editable), commits edit (if editing)
- Escape cancels editing
- Space toggles row selection
- Home/End: first/last column in row
- Ctrl+Home/End: first/last cell in table
- Focus tracking via `aria-activedescendant` or `tabindex` management
- Visual focus ring on active cell

#### 5B. Column Visibility

**New properties:**
- `hideable: boolean` on ColumnDefinition (default true)
- `hidden: boolean` on ColumnDefinition
- `column-visibility-model: Record<string, boolean>` on snice-table (property)

**New sub-component:** `snice-table-column-panel.ts` + `.css`
- Checkbox list of all columns
- Show All / Hide All buttons
- Popover panel triggered from toolbar button
- Events: `column-visibility-change` with `{ column, visible }`

### Phase 6: Master-Detail + Tree Data

#### 6A. Master-Detail (Row Expansion)

**New properties:**
- `expandable: boolean` on snice-table (attribute)
- `detail-panel: (row: any) => string | HTMLElement` on snice-table (property)
- `expanded-rows: Set<number>` (property)

**Implementation:**
- Expand toggle icon in first column (or dedicated expand column)
- Expanded row: additional `<tr>` with single `<td colspan="all">` containing detail panel
- Single-expand or multi-expand mode
- Lazy rendering: detail panel created on expand, destroyed on collapse
- Events: `row-expand`, `row-collapse`

#### 6B. Tree Data

**New properties:**
- `tree-data: boolean` on snice-table (attribute)
- `get-tree-data-path: (row: any) => string[]` on snice-table (property)
- `default-expand-depth: number` (attribute, default 0)

**Implementation:**
- Indent levels in first column with expand/collapse toggle
- Auto-grouping based on path
- Parent-child relationships derived from path arrays
- Expand/collapse nodes
- Selection propagates to children (optional)

### Phase 7: Drag & Drop (Column Reorder + Row Reorder)

#### 7A. Column Reordering

**New properties:**
- `reorderable: boolean` on snice-table (attribute)

**Implementation:**
- Header cells become `draggable`
- Native Drag & Drop API (`dragstart`, `dragover`, `drop`)
- Visual: ghost header, drop indicator line
- Events: `column-reorder` with `{ column, oldIndex, newIndex }`
- Respects pinned columns (can't reorder across pin boundaries)

#### 7B. Row Reordering

**New properties:**
- `row-reorderable: boolean` on snice-table (attribute)

**Implementation:**
- Drag handle column rendered as first column
- Native Drag & Drop on `<tr>` elements
- Drop indicator line between rows
- Events: `row-reorder` with `{ rowData, oldIndex, newIndex }`
- Updates internal data array on drop

### Phase 8: Export + Clipboard + Polish

#### 8A. CSV Export
- `exportCsv(options?)` public method
- Options: `{ fileName, delimiter, includeHeaders, selectedRowsOnly, columns }`
- Generate CSV from current data (respects active sort/filter)
- Browser download via `Blob` + `URL.createObjectURL`
- No external dependencies

#### 8B. Clipboard Copy
- Ctrl+C copies selected rows as tab-separated text
- `copyToClipboard()` public method
- Uses `navigator.clipboard.writeText()`

#### 8C. Column Auto-Sizing
- `autoSizeColumns()` public method
- Double-click resize handle auto-sizes column
- Measures max rendered cell width + padding

#### 8D. Custom Toolbar
- `<slot name="toolbar">` for user-provided toolbar content
- Default toolbar with search, filter, column visibility, density, export buttons
- Toolbar slot replaces default when provided

---

## Architecture Notes

1. **Backward compatibility:** All new features are opt-in. Existing `setColumns()`/`setData()` API unchanged. New features activated by attributes (`pagination`, `virtual-scroll`, `resizable`, `editable`, etc.)

2. **Controller pattern extension:** `@request('table/data')` params expand to include `{ search, sort, selector, page, pageSize, filterModel }`. Controllers that don't handle new params continue working.

3. **Sub-components stay internal:** `snice-table-pagination`, `snice-table-filter-panel`, `snice-table-column-panel` are internal to the table bundle. Not registered as standalone custom elements users import separately.

4. **Popover for panels:** Filter panel and column panel use `popover="manual"` + CSS anchor positioning (same pattern as split-button/select/date-picker).

5. **No framework dependencies:** Everything uses native APIs. Drag & Drop uses native HTML5 DnD. Clipboard uses `navigator.clipboard`. Export uses `Blob`.

6. **Performance:** Virtualization is the foundation. All row-level operations (filtering, sorting, pagination) operate on data arrays, not DOM. DOM is only created for visible rows.

7. **CSS custom properties for all new visuals:** `--snice-table-*` namespace. Examples: `--snice-table-row-height`, `--snice-table-pin-shadow`, `--snice-table-resize-handle-color`, `--snice-table-edit-cell-outline`.

8. **Accessibility:** WAI-ARIA grid pattern. `role="grid"`, `role="row"`, `role="gridcell"`. `aria-sort` on sortable headers. `aria-selected` on selected rows. Keyboard navigation follows ARIA grid spec.
