# snice-table: DataGrid Pro Feature Parity

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Research:** `.research/mui-datagrid-distilled.md` — full MUI DataGrid docs for reference

**Goal:** Every feature in MUI DataGrid Pro, done the snice way.

---

## Features to Build

### Column Features

1. **Column flex width** — Columns can have proportional widths (`flex`) in addition to fixed `width`. Flex columns share remaining space after fixed columns are measured. `minWidth` and `maxWidth` constrain all modes.

2. **Column resizing** — Drag the right edge of any header to resize. Double-click to auto-fit to content. Per-column `resizable` toggle. Cursor changes to `col-resize`. Fires events during and after resize.

3. **Column auto-sizing** — Measure the widest content in a column and resize to fit. Can run on mount or on demand. Works for specific columns or all at once.

4. **Column visibility** — Show/hide columns via a panel UI (checkbox list). Show All / Hide All buttons. Per-column `hideable` flag to lock columns as always-visible. Controlled via a visibility model.

5. **Column ordering (drag & drop)** — Drag headers to reorder columns. Per-column `reorderable` flag. Pinned columns stay in place. Visual drop indicator.

6. **Column pinning** — Pin columns to left or right edge. Pinned columns stay visible during horizontal scroll via `position: sticky`. Visual separator (border + shadow). Per-column `pinnable` flag. Pin/unpin API.

7. **Column groups** — Multi-level header hierarchy. Group headers span child columns. Nested groups supported. Each group has a label and optional styling.

8. **Column spanning** — A cell can span multiple columns. Static (always N columns) or dynamic (function of cell value/row data).

### Row Features

9. **Row height** — Fixed height for all rows (default 52px). Per-row height via callback. Dynamic auto-height based on content.

10. **Row spanning** — Consecutive cells in a column with the same value auto-merge vertically. Custom value getter controls merge logic.

11. **Row ordering (drag & drop)** — Drag handle column to reorder rows. Per-row `reorderable` check. Disabled when sorting is active. Drop indicator line.

12. **Row pinning** — Pin specific rows to top or bottom. Pinned rows are immune to sort, filter, and pagination. Visual separator.

13. **Master-detail (row expansion)** — Expand a row to reveal a detail panel below it. Panel content is user-provided (HTML string or element). Lazy: created on expand, destroyed on collapse. Configurable height or auto.

14. **Tree data** — Hierarchical rows with indent levels. Path-based: each row provides a path array. Expand/collapse nodes. Auto-generates gap nodes for missing parents. Configurable default expansion depth. Optional: disable sorting/filtering on children.

### Data Operations

15. **Pagination** — Client-side: slice data by page. Server-side: send page/pageSize to controller, receive totalItems back. Page size selector with configurable options (e.g. [10, 25, 50, 100]). Auto page size (fit to container height). Page navigation: first, prev, numbered, next, last. Info text: "Showing X-Y of Z".

16. **Row virtualization** — Only render visible rows + buffer. Spacer elements maintain scroll height. Fixed row height mode. Buffer size configurable in pixels. Works with pagination, sorting, filtering. Disableable for testing.

17. **Column virtualization** — Only render visible columns + buffer for wide tables. Same approach as row virtualization but horizontal.

18. **Per-column filtering** — Filter panel per column with operators appropriate to the column type:
    - Text: contains, does not contain, equals, does not equal, starts with, ends with, is empty, is not empty
    - Number: =, !=, >, >=, <, <=, is empty, is not empty
    - Date: is, is not, before, on or before, after, on or after, is empty, is not empty
    - Boolean: is true, is false
    - Multiple filters with AND/OR logic
    - Active filter indicator on header
    - Client-side and server-side modes

19. **Header filters** — Inline filter inputs rendered in a second header row. Quick text/value input per column. Click to open full filter panel.

20. **Quick filter** — Toolbar search that filters across all columns. Splits input by space, matches all terms. Configurable logic (AND/OR). Can exclude hidden columns.

21. **Sorting enhancements** — Custom sort comparator per column. Asymmetric comparator (different logic for asc vs desc). Configurable sort cycle per column (e.g. asc → desc → none). Multi-sort with modifier key mode (shift+click) vs always mode.

22. **Value pipeline** — Per-column data transformation chain:
    - `valueGetter(value, row)` — derive/transform value (used for sort, filter, display)
    - `valueFormatter(value, row)` — format for display only (not used for sort/filter)
    - `valueParser(value, row)` — parse edited input back to data type
    - `valueSetter(value, row)` — write value back to row object (for editing)

### Editing

23. **Inline cell editing** — Double-click or Enter to edit a cell. Editor type based on column type: text input, number input, date input, checkbox, select dropdown. Enter commits, Escape cancels, Tab moves to next editable cell, click outside commits. Per-column `editable` flag. Conditional editability callback.

24. **Row editing** — Edit all cells in a row at once. Same triggers and commit/cancel as cell editing but applies to the entire row.

25. **Edit validation** — Pre-commit validation per column (sync or async). Returns error message to show on cell. Blocks commit if error. Server-side validation via async `processRowUpdate` callback.

### Selection

26. **Row selection enhancements** — Conditional selectability (per-row callback). Keep selection across page changes (server-side). Select-all only affects current page (when paginated).

27. **Selection propagation** — In tree data: selecting a parent auto-selects all children. Selecting all children auto-selects parent. Configurable independently for parents and descendants.

### Export & Clipboard

28. **CSV export** — Export current data (respecting sort/filter) to CSV. Options: delimiter, filename, include headers, selected rows only, specific columns, UTF-8 BOM. Per-column `exportable` flag. Download via Blob.

29. **Print export** — Open browser print dialog with table content. Print-optimized CSS. Options: hide footer, hide toolbar, include checkboxes, custom page styles.

30. **Clipboard copy** — Ctrl+C copies focused cell or selected rows as tab-separated text. Configurable delimiter. Respects value formatters or raw values.

### Navigation & Accessibility

31. **Keyboard navigation** — Full arrow key navigation between cells. Home/End for first/last in row. Ctrl+Home/End for first/last in grid. Page Up/Down for viewport scrolling. Space for row expansion. Shift+Space for selection toggle. Ctrl+A select all. Enter for edit/commit. Tab navigation modes (none, content, header, all).

32. **ARIA grid pattern** — `role="grid"`, `role="row"`, `role="gridcell"`, `role="columnheader"`. `aria-sort` on sortable headers. `aria-selected` on selected rows. `aria-rowcount`/`aria-colcount` for virtualized grids. `aria-rowindex`/`aria-colindex` for cell positions. Roving tabindex.

33. **Density** — Already have small/medium/large. Add density selector UI in toolbar.

### UI Components

34. **Toolbar** — Configurable toolbar with: search, filter button, column visibility button, density selector, export dropdown. User can replace with custom toolbar via slot.

35. **Column menu** — Right-click or menu icon on header. Options: sort asc/desc, filter, hide column, pin left/right, autosize. Extensible.

36. **Lazy loading** — Load more rows as user scrolls to bottom. Fires event when near scroll end. Throttled requests. Works with virtualization.

37. **Scrolling API** — Programmatic scroll to pixel position or to specific row/column index. Get current scroll position.

38. **List view** — Alternative rendering mode: single-column list layout instead of grid. Custom list item renderer.

---

## Implementation Phases

### Phase 1: Pagination + Virtualization
Features: 15, 16

### Phase 2: Filtering
Features: 18, 19, 20

### Phase 3: Column Interactions
Features: 1, 2, 3, 6, 4

### Phase 4: Editing + Value Pipeline
Features: 22, 23, 24, 25

### Phase 5: Keyboard + Accessibility
Features: 31, 32

### Phase 6: Master-Detail + Tree Data
Features: 13, 14, 27

### Phase 7: Drag & Drop
Features: 5, 11

### Phase 8: Export + Clipboard + Toolbar
Features: 28, 29, 30, 34, 35

### Phase 9: Advanced
Features: 7, 8, 9, 10, 12, 17, 21, 26, 33, 36, 37, 38

---

## Architecture

- All features opt-in via attributes/properties. Zero breaking changes.
- Controller pattern extends naturally: new params added to `@request('table/data')`.
- Sub-components (pagination, filter panel, column panel, toolbar) are internal to the table bundle.
- Popover panels use `popover="manual"` + CSS anchor positioning.
- Zero external dependencies. Native Drag & Drop, Clipboard API, Blob API.
- Virtualization is the performance foundation. All data ops run on arrays, not DOM.
- CSS custom properties: `--snice-table-*` namespace.
- Full WAI-ARIA grid pattern for accessibility.
- All designs follow snice conventions: `@property`, `@query`, `@dispatch`, `@watch`, `@render`, `@styles`, `@ready`, `@dispose`.

## Component Checklist

Each phase must satisfy `.ai/component-checklist.md` before moving on. Key items:

- Types in `snice-table.types.ts`
- CSS with `var(--snice-*, fallback)`, rem for spacing, px for borders
- Snice decorators only (`@query`, `@on`, `@dispatch`, `@ready`, `@dispose`, `@observe`, `@watch`)
- Container queries for responsive layout (not media queries)
- Unit tests in `tests/components/`
- React adapter metadata updated + regenerated
- Docs updated: `docs/components/table.md` + `docs/ai/components/table.md`
- `components/table/full-showcase.html` demos ALL new features
- `public/showcases/table.html` showcase fragment updated
- CDN build, copy to public, stamp assets
- Light mode, dark mode, no-theme fallbacks all work
- Focus states visible and accessible
