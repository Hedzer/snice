# MUI DataGrid Distilled Reference

Comprehensive reference distilled from ~40 MUI DataGrid documentation pages. Covers Community, Pro, and Premium tiers.

---

## 1. Feature Matrix

| Feature | Tier | Description | Key Props/APIs |
|---------|------|-------------|----------------|
| Column definition | Community | Define columns with field, headerName, type, etc. | `columns: GridColDef[]` |
| Column types | Community | Built-in types: string, longText, number, date, dateTime, boolean, singleSelect, actions | `type` on GridColDef |
| Column header customization | Community | Custom header renderers, height, styling | `headerName`, `renderHeader`, `columnHeaderHeight` |
| Column dimensions | Community | Width, minWidth, maxWidth, flex | `width`, `minWidth`, `maxWidth`, `flex` on GridColDef |
| Column resizing | Community | Drag column separator to resize | `resizable` on GridColDef, `disableColumnResize` |
| Column autosizing | Community | Auto-fit column width to content | `autosizeOnMount`, `autosizeOptions`, `apiRef.current.autosizeColumns()` |
| Column visibility | Community | Show/hide columns via UI or model | `columnVisibilityModel`, `onColumnVisibilityModelChange` |
| Column spanning | Community | Cell spans multiple columns | `colSpan` on GridColDef (number or function) |
| Column groups | Community | Multi-level header hierarchy | `columnGroupingModel`, `columnGroupHeaderHeight` |
| Column ordering (drag) | **Pro** | Drag-and-drop column reorder | `disableColumnReorder`, `disableReorder` on GridColDef |
| Column pinning | **Pro** | Pin columns left/right | `pinnedColumns`, `onPinnedColumnsChange`, `disableColumnPinning` |
| Row definition | Community | Define rows as array of objects | `rows: GridRowsProp`, `getRowId` |
| Row height (static) | Community | Fixed row height | `rowHeight` (default 52px) |
| Row height (variable) | Community | Per-row height | `getRowHeight` (returns number, null, or "auto") |
| Row height (dynamic) | Community | Content-based height | `getRowHeight: () => "auto"`, `getEstimatedRowHeight` |
| Row spanning | Community | Cell fills multiple rows | `rowSpanning` prop, `rowSpanValueGetter` on GridColDef |
| Row spacing | Community | Space between rows | `getRowSpacing`, `rowSpacingType` |
| Row ordering (drag) | **Pro** | Drag-and-drop row reorder | `rowReordering`, `onRowOrderChange` |
| Row pinning | **Pro** | Pin rows to top/bottom | `pinnedRows: { top: [], bottom: [] }`, `pinnedRowsSectionSeparator` |
| Master-detail panels | **Pro** | Expandable detail panels per row | `getDetailPanelContent`, `getDetailPanelHeight`, `detailPanelExpandedRowIds` |
| Header filters | **Pro** | Filter inputs in column headers | `headerFilters`, `headerFilterHeight` |
| Tree data | **Pro** | Hierarchical parent-child rows | `treeData`, `getTreeDataPath`, `groupingColDef` |
| Lazy loading | **Pro** | Load rows on demand | `lazyLoading`, `lazyLoadingRequestThrottleMs` |
| List view | **Pro** | Display data in list format | `listView`, `listViewColumn` |
| Single sorting | Community | Sort by one column | `sortModel`, `onSortModelChange`, `sortingOrder` |
| Multi-sorting | **Pro** | Sort by multiple columns | `multipleColumnsSortingMode` ("always" or "withModifierKey") |
| Single filter | Community | One filter at a time | `filterModel`, `onFilterModelChange` |
| Multi-filters | **Pro** | Multiple simultaneous filters | `disableMultipleColumnsFiltering` |
| Quick filter | Community | Text search across columns | `quickFilterValues`, `quickFilterLogicOperator`, `quickFilterExcludeHiddenColumns` |
| Server-side filter | Community | Server-processed filtering | `filterMode: "server"`, `onFilterModelChange` |
| Pagination | Community | Client-side pagination (max 100 rows/page in Community) | `paginationModel`, `pageSizeOptions`, `autoPageSize` |
| Server-side pagination | Community | Server-processed pagination | `paginationMode: "server"`, `rowCount`, `paginationMeta` |
| Row selection (single) | Community | Click to select one row | `rowSelectionModel`, `onRowSelectionModelChange` |
| Row selection (multi) | **Pro** | Ctrl/Shift click for multiple | `disableMultipleRowSelection`, `checkboxSelection` |
| Checkbox selection | Community | Checkbox column for selection | `checkboxSelection`, `checkboxSelectionVisibleOnly` |
| Cell selection | **Premium** | Select individual cells or ranges | `cellSelection`, `cellSelectionModel`, `onCellSelectionModelChange` |
| Cell editing | Community | Edit individual cells | `editable` on GridColDef, `editMode: "cell"` |
| Row editing | Community | Edit all cells in a row at once | `editMode: "row"` |
| CSV export | Community | Export to CSV | `apiRef.current.exportDataAsCsv()` |
| Print export | Community | Print via browser dialog | `apiRef.current.exportDataAsPrint()` |
| Excel export | **Premium** | Export to .xlsx (via exceljs) | `apiRef.current.exportDataAsExcel()` |
| Clipboard copy | Community | Ctrl+C to copy cells/rows | `clipboardCopyCellDelimiter` |
| Clipboard paste | **Premium** | Ctrl+V to paste into grid | `disableClipboardPaste`, `splitClipboardPastedText` |
| Row grouping | **Premium** | Group rows by column values | `rowGroupingModel`, `onRowGroupingModelChange`, `groupingColDef` |
| Aggregation | **Premium** | Sum, avg, min, max, size, custom | `aggregationModel`, `aggregationFunctions`, `aggregationRowsScope` |
| Pivoting | **Premium** | Cross-tabulation data analysis | `pivotModel`, `pivotActive`, `pivotPanelOpen`, `disablePivoting` |
| Row virtualization | Community | Virtual scroll for rows | `rowBufferPx` (default 150), `disableVirtualization` |
| Column virtualization | **Pro** | Virtual scroll for columns | `columnBufferPx` (default 150) |
| Density | Community | Compact/standard/comfortable | `density`, `onDensityChange` |
| Toolbar | Community | Built-in or custom toolbar | `showToolbar`, `slots.toolbar` |
| Data source | Community | Server-side data fetching | `dataSource: { getRows, updateRow? }` |
| Selection propagation | **Pro** | Auto-select parent/children | `rowSelectionPropagation: { parents, descendants }` |
| AI Assistant | **Premium** | AI-powered grid assistant | `aiAssistant` |
| Charts integration | **Premium** | Integrated chart views | Active chart management |

---

## 2. Column Features

### 2.1 Column Definition (GridColDef)

Core properties:
- `field: string` — **Required**. Column identifier, maps to row data key
- `headerName: string` — Display name in header (defaults to field)
- `description: string` — Tooltip on header hover
- `type: string` — Column type: `'string'` (default), `'longText'`, `'number'`, `'date'`, `'dateTime'`, `'boolean'`, `'singleSelect'`, `'actions'`
- `width: number` — Column width in px (default 100)
- `minWidth: number` — Minimum width (default 50)
- `maxWidth: number` — Maximum width
- `flex: number` — Flex factor for fluid width (0 to Infinity). Overrides `width`.
- `editable: boolean` — Whether cells in column are editable
- `sortable: boolean` — Whether column can be sorted (default true)
- `filterable: boolean` — Whether column can be filtered (default true)
- `resizable: boolean` — Whether column can be resized (default true)
- `hideable: boolean` — Whether column can be hidden via UI (default true)
- `pinnable: boolean` — [Pro] Whether column can be pinned (default true)
- `groupable: boolean` — [Premium] Whether column can be used for row grouping (default true)
- `aggregable: boolean` — [Premium] Whether column can be aggregated (default true)
- `disableReorder: boolean` — [Pro] Prevent reordering this column
- `disableExport: boolean` — Exclude from export
- `align: 'left' | 'center' | 'right'` — Cell content alignment
- `headerAlign: 'left' | 'center' | 'right'` — Header content alignment
- `display: 'flex' | 'text'` — Cell display mode

Data pipeline:
- `valueGetter: (value, row, column, apiRef) => any` — Transform/derive cell value (used for sorting, filtering, rendering)
- `valueSetter: (value, row) => row` — Set value back into row model (for editing)
- `valueFormatter: (value, row, column, apiRef) => string` — Format value for display only (not used for sorting/filtering)
- `valueParser: (value, row, column, apiRef) => any` — Parse edited value before saving
- `renderCell: (params: GridRenderCellParams) => ReactNode` — Custom cell renderer
- `renderHeader: (params: GridRenderHeaderParams) => ReactNode` — Custom header renderer
- `renderEditCell: (params) => ReactNode` — Custom edit cell renderer
- `sortComparator: (v1, v2, param1, param2) => number` — Custom sort comparator
- `getSortComparator: (sortDirection) => comparator` — Asymmetric sort comparator
- `sortingOrder: Array<'asc' | 'desc' | null>` — Per-column sort order cycle
- `filterOperators: GridFilterOperator[]` — Custom filter operators
- `getApplyQuickFilterFn: (value) => (cellValue) => boolean` — Quick filter logic
- `colSpan: number | ((value, row, column, apiRef) => number)` — Column spanning
- `rowSpanValueGetter: (value, row) => any` — Control row spanning merge logic
- `groupingValueGetter: (value, row) => string | number | Date | null` — [Premium] Value for grouping
- `groupingValueSetter: (groupKey, row) => row` — [Premium] Reverse grouping value
- `preProcessEditCellProps: (params) => props | Promise<props>` — Edit validation
- `cellClassName: string | ((params) => string)` — Dynamic cell CSS class
- `headerClassName: string | ((params) => string)` — Header CSS class

Special column types:
- **singleSelect**: Requires `valueOptions: Array<string | { value, label }>`, optional `getOptionValue`, `getOptionLabel`
- **actions**: Use `renderCell` with `GridActionsCell` + `GridActionsCellItem` children. `showInMenu` groups actions in menu.
- **longText**: Supports expand/collapse popup. Keyboard: Space=toggle popup, Escape=close, Shift+Enter=newline in edit, Enter=commit, Escape=cancel

### 2.2 Column Header

- `headerName: string` — Column title
- `description: string` — Tooltip
- `renderHeader: (params) => ReactNode` — Custom header component
- `columnHeaderHeight: number` — Grid-level prop, default 56px
- `columnGroupHeaderHeight: number` — Grid-level, group header height

### 2.3 Column Dimensions & Resizing

Props on GridColDef:
- `width: number` — Default 100px
- `minWidth: number` — Default 50px
- `maxWidth: number`
- `flex: number` — Proportional width
- `resizable: boolean`

Grid-level props:
- `disableColumnResize: boolean`
- `disableAutosize: boolean` — Disable double-click autosize
- `autosizeOnMount: boolean`
- `autosizeOptions: { columns?, includeHeaders?, includeOutliers?, outliersFactor?, expand?, disableColumnVirtualization?, includeHeaderFilters? }`

Events:
- `onColumnResize: (params) => void` — During resize
- `onColumnWidthChange: (params) => void` — After resize completes

API methods:
- `apiRef.current.autosizeColumns(options)` — Programmatic autosize

### 2.4 Column Visibility

- `columnVisibilityModel: { [field]: boolean }` — Controlled visibility
- `onColumnVisibilityModelChange: (model) => void`
- `initialState.columns.columnVisibilityModel` — Uncontrolled
- `disableColumnSelector: boolean` — Disable visibility panel
- `hideable: boolean` on GridColDef — Prevent hiding specific column
- `slotProps.columnsManagement.getTogglableColumns` — Filter columns in panel
- `slotProps.columnsManagement.disableShowHideToggle` — Remove Show/Hide All
- `slotProps.columnsManagement.disableResetButton` — Remove Reset button
- `slotProps.columnsManagement.toggleAllMode: 'filteredOnly'` — Only toggle filtered columns

### 2.5 Column Ordering [Pro]

- Drag-and-drop column reorder enabled by default in Pro
- `disableColumnReorder: boolean` — Disable for all columns
- `disableReorder: boolean` on GridColDef — Disable for specific column
- `keepNonExistentColumnsInOrder: boolean` — [Pro] Keep dropped column position

Events:
- `columnHeaderDragStart`
- `columnHeaderDragEnter`
- `columnHeaderDragOver`
- `columnHeaderDragEnd`

### 2.6 Column Pinning [Pro]

- `pinnedColumns: { left?: string[], right?: string[] }`
- `onPinnedColumnsChange: (pinnedColumns) => void`
- `initialState.pinnedColumns`
- `disableColumnPinning: boolean` — Disable for all
- `pinnable: boolean` on GridColDef — Disable for specific column
- `pinnedColumnsSectionSeparator: 'border' | 'shadow' | 'border-and-shadow'` (default 'border-and-shadow')

API methods:
- `apiRef.current.getPinnedColumns()`
- `apiRef.current.setPinnedColumns(model)`
- `apiRef.current.pinColumn(field, side)`
- `apiRef.current.unpinColumn(field)`
- `apiRef.current.isColumnPinned(field)` — Returns which side

### 2.7 Column Groups

- `columnGroupingModel: GridColumnGroupingModel` — Array of group definitions
- Each group: `{ groupId: string, children: Array<{ field } | GroupDef>, headerName?, description?, headerClassName?, renderHeaderGroup?, freeReordering? }`
- `columnGroupHeaderHeight: number` — Independent of `columnHeaderHeight`
- `freeReordering: boolean` on group — Allow columns to be dragged outside group
- A column can only belong to one group
- Supports nested groups

### 2.8 Column Spanning

- `colSpan: number | ((value, row, column, apiRef) => number)` on GridColDef
- Number: all cells in column span that many columns
- Function: per-cell spanning via `GridCellParams`
- Incompatible features to disable for spanned columns: sorting, filtering, reorder, hide, pinning

---

## 3. Row Features

### 3.1 Row Definition

- `rows: GridRowsProp` — Array of row objects
- `getRowId: (row) => GridRowId` — Extract unique identifier (defaults to `row.id`)
- Must keep stable references between renders to avoid re-sorting/filtering
- Each row must have a unique identifier

Selectors:
- `gridDataRowIdsSelector`
- `gridRowNodeSelector`
- `gridRowSelector`

### 3.2 Row Height

- `rowHeight: number` — Default 52px, applies to all rows
- `getRowHeight: (params: GridRowHeightParams) => number | null | "auto"` — Per-row height
  - Return number for fixed height per row
  - Return `null`/`undefined` to use default `rowHeight`
  - Return `"auto"` for dynamic content-based height
- `getEstimatedRowHeight: (params) => number` — Estimation for dynamic height (default 52px)
- `virtualizeColumnsWithAutoRowHeight: boolean` — Enable column virtualization with auto row height (default false, may cause row height changes on horizontal scroll)

### 3.3 Row Spanning

- `rowSpanning: boolean` — Enable auto-merge of consecutive cells with same value
- `colDef.rowSpanValueGetter: (value, row) => any` — Control which values determine spanning
- Works by increasing height by factor of `rowHeight` — not compatible with variable/dynamic height
- Can combine with column spanning

### 3.4 Row Ordering [Pro]

- `rowReordering: boolean` — Enable drag-and-drop reorder
- `onRowOrderChange: (params: GridRowOrderChangeParams) => void` — Capture order changes
- `isRowReorderable: (params) => boolean` — Disable reorder for specific rows
- `isValidRowReorder: (context: ReorderValidationContext) => boolean` — Validate specific reorder operations
- Disabled when sorting is applied
- Custom drag indicator via `__reorder__` field or icon slot

Events:
- `rowDragStart`
- `rowDragOver`
- `rowDragEnd`

### 3.5 Row Pinning [Pro]

- `pinnedRows: { top?: GridRowsProp, bottom?: GridRowsProp }`
- `pinnedRowsSectionSeparator: 'border' | 'border-and-shadow'` (default 'border-and-shadow')
- Pinned rows are NOT affected by sorting, filtering, or pagination
- Pinned rows do NOT support: selection, row grouping, tree data, row reordering, master-detail

### 3.6 Master-Detail Panels [Pro]

- `getDetailPanelContent: (params: GridRowParams) => ReactNode` — Content of detail panel
- `getDetailPanelHeight: (params: GridRowParams) => number | "auto"` — Panel height (default 500px)
- `detailPanelExpandedRowIds: Set<GridRowId>` — Controlled expanded panels
- `onDetailPanelExpandedRowIdsChange: (ids) => void`
- `initialState.detailPanel.expandedRowIds`

API methods:
- `apiRef.current.getExpandedDetailPanels()`
- `apiRef.current.setExpandedDetailPanels(ids)`
- `apiRef.current.toggleDetailPanel(id)`

### 3.7 Row Grouping [Premium]

- `rowGroupingModel: string[]` — Array of fields to group by
- `onRowGroupingModelChange: (model) => void`
- `initialState.rowGrouping.model`
- `rowGroupingColumnMode: 'single' | 'multiple'` — One grouping column vs. one per criterion
- `groupingColDef: GridColDef | ((params) => GridColDef)` — Customize grouping column(s)
  - `leafField: string` — Show leaf values from specified column
  - `hideDescendantCount: boolean` — Hide child count
  - `mainGroupingCriteria: string` — Force sorting/filtering on specific criterion
- `disableRowGrouping: boolean` — Disable for all
- `groupable: boolean` on GridColDef — Disable for specific column
- `defaultGroupingExpansionDepth: number` — Auto-expand depth (-1 = all)
- `isGroupExpandedByDefault: (node) => boolean` — Custom expansion logic

Row grouping value:
- `groupingValueGetter: (value, row) => string | number | Date | null` — Custom grouping value
- `groupingValueSetter: (groupKey, row) => row` — Reverse mapping for drag-and-drop

Selection propagation:
- `rowSelectionPropagation: { parents?: boolean, descendants?: boolean }` — Default `{ parents: true, descendants: true }`

API methods:
- `apiRef.current.addRowGroupingCriteria(field)`
- `apiRef.current.removeRowGroupingCriteria(field)`
- `apiRef.current.setRowGroupingCriteriaIndex(field, index)`
- `apiRef.current.setRowGroupingModel(model)`
- `apiRef.current.getRowGroupChildren(params)`
- `apiRef.current.setRowChildrenExpansion(id, isExpanded)`

### 3.8 Tree Data [Pro]

- `treeData: boolean` — Enable tree data mode
- `getTreeDataPath: (row) => string[]` — Returns path array (e.g., `["A", "B", "C"]`)
- `groupingColDef` — Same as row grouping
- `defaultGroupingExpansionDepth: number` — Same as row grouping
- `isGroupExpandedByDefault: (node) => boolean`
- `disableChildrenFiltering: boolean` — Only filter top-level rows
- `disableChildrenSorting: boolean` — Only sort top-level rows
- `setTreeDataPath: (path, row) => row` — Reverse mapping for drag-and-drop reorder
- `GRID_TREE_DATA_GROUPING_FIELD` — Constant for accessing grouping column field
- Automatically fills hierarchy gaps with autogenerated rows
- Selection propagation works same as row grouping

### 3.9 Row Density

- `density: 'compact' | 'standard' | 'comfortable'` — Grid-level (default 'standard')
- `onDensityChange: (density) => void`
- `initialState.density`
- Density scales based on `rowHeight` and `columnHeaderHeight`

---

## 4. Data Operations

### 4.1 Sorting

**Props:**
- `sortModel: GridSortModel` — Array of `{ field: string, sort: 'asc' | 'desc' | null }`
- `onSortModelChange: (model, details) => void`
- `initialState.sorting.sortModel`
- `sortingMode: 'client' | 'server'` — Default 'client'
- `sortingOrder: Array<'asc' | 'desc' | null>` — Default `['asc', 'desc', null]`
- `disableColumnSorting: boolean` — Disable all sorting
- `disableMultipleColumnsSorting: boolean` — [Pro] Disable multi-sort
- `multipleColumnsSortingMode: 'always' | 'withModifierKey'` — [Pro] Default 'withModifierKey'

**Per-column (GridColDef):**
- `sortable: boolean` — Default true
- `sortComparator: (v1, v2, cellParams1, cellParams2) => number`
- `getSortComparator: (sortDirection) => comparator` — Asymmetric comparator
- `sortingOrder: Array<'asc' | 'desc' | null>` — Per-column override

**Built-in comparators:**
- `gridStringOrNumberComparator` (string, singleSelect)
- `gridNumberComparator` (number, boolean)
- `gridDateComparator` (date, dateTime)

**API methods:**
- `apiRef.current.setSortModel(model)`
- `apiRef.current.sortColumn(field, direction)`
- `apiRef.current.applySorting()`
- `apiRef.current.getSortModel()`
- `apiRef.current.getSortedRows()`
- `apiRef.current.getSortedRowIds()`
- `apiRef.current.getRowIdFromRowIndex(index)`

**Selectors:**
- `gridSortModelSelector`
- `gridSortedRowEntriesSelector`
- `gridSortedRowIdsSelector`

### 4.2 Filtering

**Props:**
- `filterModel: GridFilterModel` — `{ items: GridFilterItem[], logicOperator: 'and' | 'or', quickFilterValues?, quickFilterLogicOperator?, quickFilterExcludeHiddenColumns? }`
- `onFilterModelChange: (model, details) => void`
- `initialState.filter.filterModel`
- `filterMode: 'client' | 'server'` — Default 'client'
- `filterDebounceMs: number` — Default 150ms
- `disableColumnFilter: boolean` — Disable all filtering
- `disableMultipleColumnsFiltering: boolean` — [Pro]
- `ignoreDiacritics: boolean` — Ignore accents in filtering

**GridFilterItem structure:**
- `field: string` — Column field
- `operator: string` — Operator name (e.g., 'contains', 'equals', 'is', '>', '<', 'isEmpty')
- `value?: any` — Filter value
- `id?: number | string` — Required for multi-filter

**logicOperator:** `GridLogicOperator.And` or `GridLogicOperator.Or` (default Or)

**Filter operators by column type:**

| Column Type | Available Operators |
|-------------|-------------------|
| string | contains, does not contain, equals, does not equal, starts with, ends with, is empty, is not empty, is any of |
| number | =, !=, >, >=, <, <=, is empty, is not empty, is any of |
| date/dateTime | is, is not, is after, is on or after, is before, is on or before, is empty, is not empty |
| boolean | is |
| singleSelect | is, is not, is any of |

**Quick filter:**
- Displayed in toolbar when `showToolbar` is set
- Splits input by space, keeps rows matching ALL values (default)
- `quickFilterLogicOperator: GridLogicOperator.Or` — Match any instead of all
- `quickFilterExcludeHiddenColumns: boolean` — Default true
- `getApplyQuickFilterFn` on GridColDef — Custom quick filter logic
- Custom parser/formatter via `slotProps.toolbar`

**Multi-filters [Pro]:**
- Available by default in Pro
- `disableMultipleColumnsFiltering: boolean` — Disable
- `slotProps.filterPanel.filterColumns` — Limit available filter columns
- `slotProps.filterPanel.getColumnForNewFilter` — Control new filter column
- `slotProps.filterPanel.disableAddFilterButton`
- `slotProps.filterPanel.disableRemoveAllButton`

**Header filters [Pro]:**
- `headerFilters: boolean` — Show filter inputs in column headers
- `headerFilterHeight: number` — Override height

**API methods:**
- `apiRef.current.setFilterModel(model)`
- `apiRef.current.upsertFilterItem(item)`
- `apiRef.current.upsertFilterItems(items)`
- `apiRef.current.deleteFilterItem(item)`
- `apiRef.current.showFilterPanel(targetColumnField?)`
- `apiRef.current.hideFilterPanel()`
- `apiRef.current.setFilterLogicOperator(operator)`
- `apiRef.current.setQuickFilterValues(values)`
- `apiRef.current.getFilterState(filterModel)`

**Selectors:**
- `gridFilterModelSelector`
- `gridFilteredRowCountSelector`
- `gridFilteredSortedRowIdsSelector`
- `gridFilteredSortedRowEntriesSelector`
- `gridExpandedSortedRowIdsSelector`
- `gridExpandedRowCountSelector`
- `gridQuickFilterValuesSelector`
- `gridFilteredTopLevelRowCountSelector`

### 4.3 Pagination

**Props:**
- `paginationModel: { page: number, pageSize: number }` — Default `{ page: 0, pageSize: 100 }`
- `onPaginationModelChange: (model, details) => void`
- `initialState.pagination.paginationModel`
- `pageSizeOptions: Array<number | { value: number, label: string }>` — Default `[25, 50, 100]`
  - Use `{ value: -1, label: 'All' }` to show all rows option
- `autoPageSize: boolean` — Auto-scale to container height
- `pagination: boolean` — [Pro/Premium] Enable pagination (Community always paginated)
- `paginationMode: 'client' | 'server'` — Default 'client'
- `rowCount: number` — Total rows for server-side pagination. Set -1 for unknown.
- `estimatedRowCount: number` — Estimated total when exact unknown
- `paginationMeta: { hasNextPage?: boolean }` — For unknown row count
- `onRowCountChange: (count) => void`

**Community limits:** Max 100 rows per page

**Server-side pagination types:**
1. **Index-based**: Uses `page` and `pageSize`
2. **Cursor-based**: Track next cursor per page

**API methods:**
- `apiRef.current.setPage(page)`
- `apiRef.current.setPageSize(pageSize)`
- `apiRef.current.setPaginationModel(model)`
- `apiRef.current.setPaginationMeta(meta)`
- `apiRef.current.setRowCount(count)`

**Selectors:**
- `gridPageSelector`
- `gridPageSizeSelector`
- `gridPageCountSelector`
- `gridPaginationModelSelector`
- `gridPaginationRowCountSelector`
- `gridPaginationMetaSelector`
- `gridPaginatedVisibleSortedGridRowIdsSelector`
- `gridPaginatedVisibleSortedGridRowEntriesSelector`
- `gridPaginationRowRangeSelector`

### 4.4 Selection

#### Row Selection

**Props:**
- `rowSelectionModel: { type: 'include' | 'exclude', ids: Set<GridRowId> }`
- `onRowSelectionModelChange: (model, details) => void`
- `rowSelection: boolean` — Default true. Set false to disable.
- `checkboxSelection: boolean` — Show checkbox column
- `checkboxSelectionVisibleOnly: boolean` — [Pro] Select All only affects current page
- `disableMultipleRowSelection: boolean` — Force single selection (Community: defaults to true unless `checkboxSelection`)
- `disableRowSelectionOnClick: boolean`
- `disableRowSelectionExcludeModel: boolean` — Always use include model
- `isRowSelectable: (params: GridRowParams) => boolean` — Conditional selectability
- `keepNonExistentRowsSelected: boolean` — Keep selection across page changes (server-side)
- `rowSelectionPropagation: { parents?: boolean, descendants?: boolean }` — [Pro/Premium] Auto-select parent/children

**API methods:**
- `apiRef.current.getSelectedRows()`
- `apiRef.current.isRowSelectable(id)`
- `apiRef.current.isRowSelected(id)`
- `apiRef.current.selectRow(id, isSelected?, resetSelection?)`
- `apiRef.current.selectRows(ids, isSelected?, resetSelection?)`
- `apiRef.current.selectRowRange(startId, endId, isSelected?)`
- `apiRef.current.setRowSelectionModel(model)`
- `apiRef.current.getPropagatedRowSelectionModel(model)` — Get model with propagation applied

#### Cell Selection [Premium]

**Props:**
- `cellSelection: boolean`
- `cellSelectionModel: { [rowId]: { [field]: boolean } }`
- `onCellSelectionModelChange: (model) => void`

**Interactions:**
- Click to select cell, Shift+Space to toggle
- Cmd/Ctrl+Click for multi-select
- Click+drag for range selection
- Shift+Click for range between two cells
- Arrow keys + Shift for keyboard range

**CSS classes for range edges:**
- `MuiDataGrid-cell--rangeTop`
- `MuiDataGrid-cell--rangeBottom`
- `MuiDataGrid-cell--rangeLeft`
- `MuiDataGrid-cell--rangeRight`

**API methods:**
- `apiRef.current.getCellSelectionModel()`
- `apiRef.current.getSelectedCellsAsArray()`
- `apiRef.current.isCellSelected(id, field)`
- `apiRef.current.selectCellRange(start, end)`
- `apiRef.current.setCellSelectionModel(model)`

### 4.5 Editing

**Grid-level props:**
- `editMode: 'cell' | 'row'` — Default 'cell'
- `processRowUpdate: (newRow, oldRow, params) => row | Promise<row>` — Persist changes
- `onProcessRowUpdateError: (error) => void`
- `isCellEditable: (params: GridCellParams) => boolean` — Conditional editability
- `cellModesModel: { [rowId]: { [field]: { mode, ...options } } }` — Controlled cell modes
- `onCellModesModelChange: (model) => void`
- `rowModesModel: { [rowId]: { mode, ...options } }` — Controlled row modes (editMode="row")
- `onRowModesModelChange: (model) => void`

**Per-column (GridColDef):**
- `editable: boolean` — Enable editing for column
- `valueParser: (value, row, column, apiRef) => any` — Parse input value
- `valueSetter: (value, row) => row` — Custom row update logic
- `preProcessEditCellProps: (params) => props | Promise<props>` — Validation
  - `params: { id, row, props: { value, error?, isProcessingProps? }, hasChanged }`
  - Set `props.error` to truthy value to reject save

**Start editing triggers:**
- Double-click cell
- Press Enter, Backspace, Delete, or any printable key
- `apiRef.current.startCellEditMode({ id, field })`
- `apiRef.current.startRowEditMode({ id })`

**Stop editing triggers:**
- Escape (reverts), Tab (saves), Enter (saves + move down)
- Click outside (saves)
- `apiRef.current.stopCellEditMode({ id, field, ignoreModifications? })`
- `apiRef.current.stopRowEditMode({ id, ignoreModifications? })`

**API methods:**
- `apiRef.current.getCellMode(id, field)`
- `apiRef.current.getRowMode(id)`
- `apiRef.current.getRowWithUpdatedValues(id, field)`
- `apiRef.current.isCellEditable(params)`
- `apiRef.current.setEditCellValue(params)`
- `apiRef.current.startCellEditMode(params)`
- `apiRef.current.stopCellEditMode(params)`
- `apiRef.current.startRowEditMode(params)`
- `apiRef.current.stopRowEditMode(params)`

### 4.6 Aggregation [Premium]

**Props:**
- `aggregationModel: { [field]: string }` — Maps column fields to aggregation function names
- `onAggregationModelChange: (model) => void`
- `initialState.aggregation.model`
- `aggregationFunctions: { [name]: GridAggregationFunction }` — Available functions
- `aggregationRowsScope: 'filtered' | 'all'` — Default 'filtered'
- `disableAggregation: boolean`
- `getAggregationPosition: (groupNode) => 'footer' | 'inline' | null`
- `aggregable: boolean` on GridColDef

**Built-in functions:**
| Name | Column Types | Behavior |
|------|-------------|----------|
| `sum` | number | Sum of values |
| `avg` | number | Average (non-rounded) |
| `min` | number, date, dateTime | Smallest value |
| `max` | number, date, dateTime | Largest value |
| `size` | all | Count of cells |
| `size(true)` | boolean | Count of true values |
| `size(false)` | boolean | Count of false values |

**Custom function shape:**
```
{
  apply: (params: { values: any[], groupId, field, getCellValue? }) => any,
  label: string,
  columnTypes?: string[],
  valueFormatter?: (value) => string,
  getCellValue?: (row, field) => any  // transform data before apply
}
```

- `availableAggregationFunctions: string[]` on GridColDef — Limit options per column

**Selectors:**
- `gridAggregationModelSelector`
- `gridAggregationLookupSelector`

---

## 5. Performance & Virtualization

### 5.1 Row Virtualization

- Built-in, renders only visible rows plus buffer
- `rowBufferPx: number` — Buffer area in pixels (default 150)
- Community limited to 100 rows
- Disabled when `autoHeight` is true
- `disableVirtualization: boolean` — Disable entirely (testing only)

### 5.2 Column Virtualization

- Built-in in Pro/Premium, renders only visible columns plus buffer
- `columnBufferPx: number` — Buffer area in pixels (default 150)
- Disabled when dynamic row height is enabled (unless `virtualizeColumnsWithAutoRowHeight: true`)
- `apiRef.current.unstable_setColumnVirtualization(false)` — Programmatic disable

### 5.3 Performance Best Practices

1. **Stable references**: Keep `columns`, `rows`, `getRowId` references stable between renders. Define outside component or memoize.
2. **Memoize props**: All non-primitive props (objects, functions) should be memoized
3. **Extract static objects**: Move `slots`, `initialState`, `slotProps` outside component
4. **Component uses React.memo**: Grid and subcomponents only re-render when props change
5. **Throttle updates**: `throttleRowsMs` prop to batch row updates
6. **Lazy loading [Pro]**: `lazyLoading` + `lazyLoadingRequestThrottleMs` for on-demand loading

### 5.4 Scrolling

- `initialState.scroll: { top: number, left: number }` — Scroll restoration

**API methods:**
- `apiRef.current.scroll({ top, left })` — Scroll to position in pixels
- `apiRef.current.scrollToIndexes({ rowIndex, colIndex })` — Scroll to cell
- `apiRef.current.getScrollPosition()` — Get current position

---

## 6. Export & Clipboard

### 6.1 CSV Export

- `apiRef.current.exportDataAsCsv(options?)`
- `apiRef.current.getDataAsCsv(options?)`

**CSV Options (GridCsvExportOptions):**
- `delimiter: string` — Field separator (default ',')
- `fileName: string` — Output filename
- `utf8WithBom: boolean` — Add UTF-8 BOM
- `includeHeaders: boolean` — Default true
- `includeColumnGroupsHeaders: boolean`
- `allColumns: boolean` — Include hidden columns
- `fields: string[]` — Exact columns to export
- `getRowsToExport: (params) => GridRowId[]` — Custom row selection
- `escapeFormulas: boolean` — Default true, prefix formulas for Excel safety
- `disableToolbarButton: boolean` — Hide from toolbar

### 6.2 Print Export

- `apiRef.current.exportDataAsPrint(options?)`

**Print Options (GridPrintExportOptions):**
- `hideFooter: boolean`
- `hideToolbar: boolean`
- `includeCheckboxes: boolean`
- `pageStyle: string` — CSS for print page
- `disableToolbarButton: boolean`

### 6.3 Excel Export [Premium]

- `apiRef.current.exportDataAsExcel(options?)`
- `apiRef.current.getDataAsExcel(options?)` — Returns exceljs workbook

**Excel Options (GridExcelExportOptions):**
- `fileName: string`
- `allColumns: boolean`
- `fields: string[]`
- `columnsStyles: { [field]: ExceljsStyle }`
- `exceljsPreProcess: ({ workbook, worksheet }) => void` — Before data
- `exceljsPostProcess: ({ workbook, worksheet }) => void` — After data
- `escapeFormulas: boolean`
- `worker: () => Worker` — Web worker for background export
- `disableToolbarButton: boolean`

Event: `onExcelExportStateChange` — Track export progress

### 6.4 Exported Columns Control

- `disableExport: boolean` on GridColDef — Exclude from all exports
- `allColumns: boolean` in export options — Include hidden columns
- `fields: string[]` in export options — Exact list overrides everything

### 6.5 Exported Rows

Default priority: selected rows > all visible rows (filtered + sorted, excluding footers)

Selectors for custom `getRowsToExport`:
- `gridRowIdsSelector` — Original order
- `gridSortedRowIdsSelector` — After sorting
- `gridFilteredSortedRowIdsSelector` — After sorting + filtering
- `gridExpandedSortedRowIdsSelector` — After sorting + filtering, no collapsed
- `gridPaginatedVisibleSortedGridRowIdsSelector` — Current page only

### 6.6 Clipboard Copy

- Ctrl+C / Cmd+C
- `clipboardCopyCellDelimiter: string` — Default '\t'
- `ignoreValueFormatterDuringExport: boolean | { clipboardExport?: boolean, csvExport?: boolean }` — Copy raw values

Copy priority (highest first):
1. Multiple selected cells (cell selection)
2. Selected rows (row selection)
3. Single focused cell

### 6.7 Clipboard Paste [Premium]

- Ctrl+V / Cmd+V
- Only affects editable columns
- Uses `valueParser` and `valueSetter` same as editing
- `disableClipboardPaste: boolean`
- `splitClipboardPastedText: (text) => string[][]` — Custom paste parser
- `processRowUpdate` — Persist pasted data (same as editing)
- `isCellEditable` — Prevents pasting into non-editable cells

Paste priority (highest first):
1. Multiple selected cells — paste into selection
2. Selected rows — paste into selected rows
3. Single cell — paste starting from that cell

Events:
- `onBeforeClipboardPasteStart: (params) => Promise<void>` — Can cancel/confirm paste
- `onClipboardPasteStart: (params) => void`
- `onClipboardPasteEnd: (params) => void`
- `clipboardPasteStart` event
- `clipboardPasteEnd` event

---

## 7. API Surface — Key Props by Tier

### 7.1 DataGrid (Community) — All Props

**Layout:**
- `columns` (required), `rows`, `autoHeight`, `autoPageSize`, `columnHeaderHeight` (56), `rowHeight` (52), `columnGroupHeaderHeight`, `showColumnVerticalBorder`, `showHeaderVerticalBorder`, `scrollbarSize`, `density`

**Data pipeline:**
- `getRowId`, `getRowHeight`, `getEstimatedRowHeight`, `getRowSpacing`, `getRowClassName`, `getCellClassName`, `getDetailPanelContent`, `rowSpanning`

**Sorting:**
- `sortModel`, `sortingMode`, `sortingOrder`, `disableColumnSorting`

**Filtering:**
- `filterModel`, `filterMode`, `filterDebounceMs`, `columnMenuFilterDebounceMs`, `disableColumnFilter`, `ignoreDiacritics`

**Pagination:**
- `paginationModel`, `pageSizeOptions`, `paginationMode`, `rowCount`, `estimatedRowCount`, `paginationMeta`

**Selection:**
- `rowSelectionModel`, `checkboxSelection`, `disableMultipleRowSelection`, `disableRowSelectionOnClick`, `disableRowSelectionExcludeModel`, `isRowSelectable`, `keepNonExistentRowsSelected`, `rowSelection`

**Editing:**
- `editMode`, `cellModesModel`, `rowModesModel`, `processRowUpdate`, `isCellEditable`

**Visibility:**
- `columnVisibilityModel`, `disableColumnSelector`

**Column management:**
- `disableColumnMenu`, `disableColumnResize`, `disableAutosize`, `autosizeOnMount`, `autosizeOptions`

**Display:**
- `loading`, `showToolbar`, `hideFooter`, `hideFooterPagination`, `hideFooterSelectedRowCount`, `disableVirtualization`, `virtualizeColumnsWithAutoRowHeight`, `rowBufferPx`, `columnBufferPx`

**Data source:**
- `dataSource`, `dataSourceCache`, `dataSourcePollingIntervalMs`

**Other:**
- `apiRef`, `initialState`, `localeText`, `slots`, `slotProps`, `ignoreValueFormatterDuringExport`, `clipboardCopyCellDelimiter`, `label`, `nonce`, `logLevel`, `logger`, `resizeThrottleMs`, `rowSpacingType`, `tabNavigation`, `disableEval`

**Callbacks:**
- `onCellClick`, `onCellDoubleClick`, `onCellEditStart`, `onCellEditStop`, `onCellKeyDown`, `onCellModesModelChange`, `onClipboardCopy`, `onColumnHeaderClick`, `onColumnHeaderContextMenu`, `onColumnHeaderDoubleClick`, `onColumnHeaderEnter`, `onColumnHeaderLeave`, `onColumnHeaderOut`, `onColumnHeaderOver`, `onColumnOrderChange`, `onColumnResize`, `onColumnVisibilityModelChange`, `onColumnWidthChange`, `onDataSourceError`, `onDensityChange`, `onFilterModelChange`, `onMenuClose`, `onMenuOpen`, `onPaginationMetaChange`, `onPaginationModelChange`, `onPreferencePanelClose`, `onPreferencePanelOpen`, `onProcessRowUpdateError`, `onResize`, `onRowClick`, `onRowCountChange`, `onRowDoubleClick`, `onRowEditStart`, `onRowEditStop`, `onRowModesModelChange`, `onRowSelectionModelChange`, `onSortModelChange`

### 7.2 DataGridPro — Additional Props (over Community)

**Column features:**
- `disableColumnPinning`, `disableColumnReorder`, `pinnedColumns`, `pinnedColumnsSectionSeparator`

**Row features:**
- `rowReordering`, `pinnedRows`, `pinnedRowsSectionSeparator`, `treeData`, `getTreeDataPath`, `setTreeDataPath`, `groupingColDef`, `defaultGroupingExpansionDepth`, `isGroupExpandedByDefault`, `isRowReorderable`, `isValidRowReorder`

**Detail panels:**
- `detailPanelExpandedRowIds`, `getDetailPanelHeight` (default 500px)

**Sorting/filtering:**
- `disableMultipleColumnsSorting`, `disableMultipleColumnsFiltering`, `multipleColumnsSortingMode`, `disableChildrenFiltering`, `disableChildrenSorting`

**Pagination:**
- `pagination` (explicit enable, default false for Pro)

**Selection:**
- `checkboxSelectionVisibleOnly`, `rowSelectionPropagation`

**Header filters:**
- `headerFilters`, `headerFilterHeight`

**Lazy loading:**
- `lazyLoading`, `lazyLoadingRequestThrottleMs` (500ms)

**List view:**
- `listView`, `listViewColumn`

**Other:**
- `keepColumnPositionIfDraggedOutside`, `scrollEndThreshold` (80px), `throttleRowsMs`, `rowsLoadingMode`

**Additional callbacks:**
- `onDetailPanelExpandedRowIdsChange`, `onFetchRows`, `onPinnedColumnsChange`, `onRowOrderChange`, `onRowsScrollEnd`

### 7.3 DataGridPremium — Additional Props (over Pro)

**Row grouping:**
- `rowGroupingModel`, `onRowGroupingModelChange`, `rowGroupingColumnMode`, `disableRowGrouping`

**Aggregation:**
- `aggregationModel`, `onAggregationModelChange`, `aggregationFunctions`, `aggregationRowsScope`, `disableAggregation`, `getAggregationPosition`

**Cell selection:**
- `cellSelection`, `cellSelectionModel`, `onCellSelectionModelChange`

**Clipboard:**
- `disableClipboardPaste`, `splitClipboardPastedText`, `onBeforeClipboardPasteStart`, `onClipboardPasteStart`, `onClipboardPasteEnd`

**Pivoting:**
- `pivotModel`, `onPivotModelChange`, `pivotActive`, `onPivotActiveChange`, `pivotPanelOpen`, `onPivotPanelOpenChange`, `disablePivoting`, `pivotable` (on GridColDef), `pivotingColDef`, `getPivotDerivedColumns`

**Excel export:**
- `onExcelExportStateChange`

**AI Assistant:**
- `aiAssistant`, `aiAssistantConversationIndex`, `aiAssistantConversations`

---

## 8. Events

All events can be subscribed via:
1. Prop: `on<EventName>` (e.g., `onRowClick`)
2. Hook: `useGridEvent(apiRef, 'eventName', handler)` (inside grid slots only)
3. API: `apiRef.current.subscribeEvent('eventName', handler)`

Use `event.defaultMuiPrevented = true` to block default behavior.

### 8.1 Cell Events

| Event | Prop | Description |
|-------|------|-------------|
| `cellClick` | `onCellClick` | Cell clicked |
| `cellDoubleClick` | `onCellDoubleClick` | Cell double-clicked |
| `cellEditStart` | `onCellEditStart` | Cell enters edit mode |
| `cellEditStop` | `onCellEditStop` | Cell returns to view mode |
| `cellKeyDown` | `onCellKeyDown` | Keydown in cell |
| `cellKeyUp` | — | Keyup in cell |
| `cellModesModelChange` | `onCellModesModelChange` | Cell modes model changes |
| `cellMouseDown` | — | Mousedown in cell |
| `cellMouseOver` | — | Mouseover in cell |
| `cellMouseUp` | — | Mouseup in cell |
| `cellSelectionChange` | `onCellSelectionModelChange` | [Premium] Cell selection changes |

### 8.2 Column Header Events

| Event | Prop | Description |
|-------|------|-------------|
| `columnHeaderClick` | `onColumnHeaderClick` | Header clicked |
| `columnHeaderContextMenu` | `onColumnHeaderContextMenu` | Right-click on header |
| `columnHeaderDoubleClick` | `onColumnHeaderDoubleClick` | Header double-clicked |
| `columnHeaderKeyDown` | — | Keydown in header |
| `columnHeaderDragEnd` | — | Column drag ended |
| `columnResize` | `onColumnResize` | During column resize |
| `columnResizeStart` | — | Column resize started |
| `columnResizeStop` | — | Column resize stopped |
| `columnsChange` | — | Columns state changed |
| `columnVisibilityModelChange` | `onColumnVisibilityModelChange` | Visibility model changed |
| `columnWidthChange` | `onColumnWidthChange` | Column width finalized |
| `columnGroupHeaderKeyDown` | — | Keydown in column group header |

### 8.3 Row Events

| Event | Prop | Description |
|-------|------|-------------|
| `rowClick` | `onRowClick` | Row clicked (not interactive cells) |
| `rowDoubleClick` | `onRowDoubleClick` | Row double-clicked |
| `rowEditStart` | `onRowEditStart` | Row enters edit mode |
| `rowEditStop` | `onRowEditStop` | Row returns to view mode |
| `rowExpansionChange` | — | Group/detail row expanded/collapsed |
| `rowModesModelChange` | `onRowModesModelChange` | Row modes model changes |
| `rowMouseEnter` | — | Mouse enters row |
| `rowMouseLeave` | — | Mouse leaves row |
| `rowOrderChange` | `onRowOrderChange` | [Pro] Row reorder completed |
| `rowSelectionChange` | `onRowSelectionModelChange` | Row selection changes |
| `rowSelectionCheckboxChange` | — | Selection checkbox toggled |
| `rowCountChange` | `onRowCountChange` | Row count changed |
| `rowGroupingModelChange` | `onRowGroupingModelChange` | [Premium] Grouping model changed |

### 8.4 Sorting & Filtering Events

| Event | Prop | Description |
|-------|------|-------------|
| `sortModelChange` | `onSortModelChange` | Sort model changed |
| `filterModelChange` | `onFilterModelChange` | Filter model changed |

### 8.5 Pagination Events

| Event | Prop | Description |
|-------|------|-------------|
| `paginationModelChange` | `onPaginationModelChange` | Page or pageSize changed |
| `paginationMetaChange` | `onPaginationMetaChange` | Pagination meta changed |

### 8.6 Scroll & Viewport Events

| Event | Prop | Description |
|-------|------|-------------|
| `scrollPositionChange` | — | Viewport scrolled |
| `rowsScrollEnd` | `onRowsScrollEnd` | [Pro] Scrolled to bottom |
| `renderedRowsIntervalChange` | — | Visible rows range changed |
| `viewportInnerSizeChange` | — | Viewport inner size changed |

### 8.7 Clipboard Events

| Event | Prop | Description |
|-------|------|-------------|
| `clipboardCopy` | `onClipboardCopy` | Data copied |
| `clipboardPasteStart` | `onClipboardPasteStart` | [Premium] Paste started |
| `clipboardPasteEnd` | `onClipboardPasteEnd` | [Premium] Paste ended |

### 8.8 Grid Lifecycle Events

| Event | Prop | Description |
|-------|------|-------------|
| `resize` | `onResize` | Grid container resized |
| `stateChange` | — | Grid state updated |
| `unmount` | — | Grid unmounted |
| `densityChange` | `onDensityChange` | Density changed |
| `menuOpen` | `onMenuOpen` | Column menu opened |
| `menuClose` | `onMenuClose` | Column menu closed |
| `preferencePanelOpen` | `onPreferencePanelOpen` | Preferences panel opened |
| `preferencePanelClose` | `onPreferencePanelClose` | Preferences panel closed |
| `headerSelectionCheckboxChange` | — | Header checkbox changed |
| `fetchRows` | `onFetchRows` | [Pro] New rows requested (lazy loading) |
| `detailPanelExpandedRowIdsChange` | `onDetailPanelExpandedRowIdsChange` | [Pro] Detail panel toggled |
| `pinnedColumnsChange` | `onPinnedColumnsChange` | [Pro] Pinned columns changed |
| `aggregationModelChange` | `onAggregationModelChange` | [Premium] Aggregation changed |
| `pivotModelChange` | `onPivotModelChange` | [Premium] Pivot model changed |
| `excelExportStateChange` | `onExcelExportStateChange` | [Premium] Excel export state changed |
| `sidebarOpen` | — | Sidebar opened |
| `sidebarClose` | — | Sidebar closed |
| `redo` | — | Redo operation |
| `undo` | — | Undo operation |

### 8.9 Pivoting [Premium]

| Event | Prop | Description |
|-------|------|-------------|
| `pivotModelChange` | `onPivotModelChange` | Pivot config changed |
| `pivotActiveChange` | `onPivotActiveChange` | Pivot mode toggled |
| `pivotPanelOpenChange` | `onPivotPanelOpenChange` | Pivot panel toggled |

---

## 9. Accessibility

### Keyboard Navigation

| Keys | Action |
|------|--------|
| Arrow keys | Navigate between cells |
| Home / End | First/last cell in row |
| Ctrl+Home / Ctrl+End | First/last cell in grid |
| Page Up / Page Down | Scroll pages |
| Space | Toggle row expansion (grouping cell) |
| Shift+Space | Select/deselect current row |
| Shift+Arrow Up/Down | Extend row selection |
| Ctrl+A | Select all rows |
| Ctrl+C | Copy selected |
| Ctrl+V | [Premium] Paste |
| Enter | Sort column (header) / Confirm edit (cell) |
| Shift+Enter | Multi-sort (header) / Newline (longText edit) |
| Ctrl+Enter | Open column menu (header) / Toggle detail panel |
| Escape | Cancel edit / Close popup |
| Tab | Save edit + move to next cell (when `tabNavigation` is "content" or "all") |
| Double-click | Start cell edit |

### Tab Navigation

- `tabNavigation: 'none' | 'content' | 'header' | 'all'` — Default 'none'
  - `'none'`: Standard composite widget behavior (single tab stop)
  - `'content'`: Tab between cells
  - `'header'`: Tab between headers
  - `'all'`: Both content and header

### Density

- `density: 'compact' | 'standard' | 'comfortable'`
- WCAG 2.1 Level AA conformance target

---

## 10. Pivoting [Premium]

- `pivotModel: { rows: GridPivotField[], columns: GridPivotField[], values: GridPivotField[] }`
- `pivotActive: boolean` — Toggle pivot mode on/off
- `pivotPanelOpen: boolean` — Toggle pivot panel visibility
- `onPivotModelChange`, `onPivotActiveChange`, `onPivotPanelOpenChange`
- `disablePivoting: boolean`
- `pivotable: boolean` on GridColDef — Exclude column from pivoting
- `pivotingColDef: (params) => GridColDef` — Customize derived columns
- `getPivotDerivedColumns: (column) => GridColDef[] | undefined` — Custom derived columns

When pivot mode is active, these props are **ignored**: `rows`, `columns`, `rowGroupingModel`, `aggregationModel`, `getAggregationPosition`, `columnVisibilityModel`, `columnGroupingModel`, `groupingColDef`, `headerFilters`, `disableRowGrouping`, `disableAggregation`.

Date columns auto-generate Year and Quarter derived columns.

---

## 11. Data Source

- `dataSource: { getRows: func, updateRow?: func, getGroupKey?: func, getChildrenCount?: func }`
- `dataSourceCache: { get, set, clear }` — Custom cache
- `dataSourcePollingIntervalMs: number` — Revalidation interval (0 = disabled)
- `onDataSourceError: (error) => void`
