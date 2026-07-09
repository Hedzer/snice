# snice-table → paid-grid tier ("incredible") — Design

**Goal:** close the gap to MUI X DataGrid Pro across four approved axes: feel &
polish, DX/API, feature parity, scale/performance. Grounded in a four-lens
source audit (2026-07-09, all findings cited file:line, perf numbers measured
in vitest/happy-dom).

**Baseline damage (measured):** 391 ms per checkbox click @10k rows (quadratic
select-all), ~4 s full renderBody @10k, ~6.6 s per sort click (render-bound),
50k upgraded custom elements for a 10k×5 grid.

## Constraints

- TDD throughout: every bug gets a failing test against unmodified source first.
- No breaking API changes without a `!` commit; prefer additive.
- `npm test` green + zero stderr after every phase.
- Known landmine: happy-dom crashes constructing cell elements synchronously
  inside a property-setter stack (getAttribute during base constructor via the
  `prefix` accessor collision). Defer DOM construction out of setters
  (microtask-coalesced render queue — design already drafted and parked).

## Phase 0 — advertised but broken (bugs)

1. **Editing renders no editor UI.** table-editor.ts is a complete state
   machine but createCellElement/createRow (snice-table.ts ~1922-2040) never
   call editor.createEditor()/getCellEditState(). Enter →
   startEdit → renderBody → identical cell. Also: startCellEdit passes column
   KEY where getEditorType expects TYPE (table-editor.ts:126-143), so per-type
   editors degrade to text/number.
2. **Keyboard bounds stale.** keyboard.attach({totalRows, totalColumns}) called
   once at @ready (snice-table.ts:2451-2467); never re-attached on
   setData/setColumns/filter/pagination. Async-loaded tables navigate as if 0
   rows.
3. **Keyboard nav dead under virtualization.** table-keyboard.ts:143-144
   indexes querySelectorAll rows by logical index; only the window exists in
   DOM. Navigate-by-data-index + virtualizer scroll cooperation needed.
4. **Virtualization silently drops master-detail, tree data, pinned rows.**
   Virtual path (snice-table.ts:1663-1672 → renderRowRange :2497-2508) skips
   all three handled by the normal path (:1733-1767).
5. **Action-button hover paints solid black/white.**
   snice-cell-actions.css:40 uses var(--snice-color-text, rgb(23 23 23 / .05))
   — theme token as background, tint only as unreachable fallback.
6. **row-clicked not composed.** snice-table.ts:2191-2193 raw dispatchEvent
   without bubbles/composed, violating .ai/coding-standards.md; invisible
   outside shadow boundaries.
7. **Error state unwired.** Failed remote load only console.errors
   (snice-table.ts:252-254) then shows generic "No data". A designed
   .table--error exists in a dead CSS file (components/table/snice-table.css —
   243 lines, imported nowhere; delete or wire).
8. **No sticky header on the primary path.** thead/th never get
   position:sticky (only pinned columns do); .table-frame is the scroller.
   snice-header.css:182-187 implements it for the alternate slotted mode only.

## Phase 1 — performance core (single root cause: render path)

- Quadratic select-all: filteredData.map(row => data.indexOf(row)) at
  snice-table.ts:1451, 2226, 2296, 2700 → maintain a row→index Map.
- renderBody wipes innerHTML (snice-table.ts:1674; virtualizer :117 per scroll
  frame) → incremental row recycling; patch changed rows only.
- Selection change touches every rendered tr (:2276-2289) → touch only deltas.
- Local filtering has no debounce (setQuickFilter → applyClientFilters →
  full renderBody per keystroke; engine at table-filter-engine.ts:178-220).
- Virtualized scroll recomputes getFilteredData() per rAF frame
  (snice-table.ts:2497-2499) → cache filtered snapshot, invalidate on model
  change.
- Remote mode has no out-of-order guard (no requestId/abort in
  getTableData :225-256) → sequence counter; drop stale responses.
- sortLocalData cost is render-bound (:2347-2373) — fixed by recycling above.
- Column virtualization: deferred to Phase 3 (needs the recycling foundation).

## Phase 2 — DX/API

- Reactive columns/data (parked design): @property({attribute:false}) + watch
  → microtask-coalesced render; internal sort reorders skip snapshot refresh
  (settingSortedData flag); unsortedData follows plain assignment.
- Controlled state: currentSort assignment re-sorts (today only re-renders
  arrows, snice-table.ts:1416-1419); add watches for currentPage, pageSize,
  density, editable, virtualize, etc. (inventory at :1382-1424).
- Types: SniceTableElement is fabricated (snice-table.types.ts:230-258 —
  phantom size/variant/bordered/stickyHeader/showSearch, sort()/search();
  ~30 real props/methods missing; class doesn't implement it). Regenerate from
  the class; add a typed event-detail map covering all ~23 real events
  (15 currently undocumented — dispatch sites: snice-table.ts:2403-2418,2924;
  table-editor.ts:182-294; table-master-detail.ts:46-93; table-row-dnd.ts:57,150).
- Unified selection model + event; single-select mode; ctrl/meta additive
  click; shift-click range select.
- Custom hooks: renderCell / renderEditCell equivalents on ColumnDefinition;
  expose TableEditor.setEditabilityCheck (implemented, unreachable —
  table-editor.ts:64-66).
- Docs: document mode/virtualize/rowHeight/editMode/quickFilter/etc (9+ props
  missing from docs/components/table.md), the full column-def surface
  (valueGetter/flex/minWidth...), fix ColumnType doc/type disagreement,
  declarative <snice-column> parity for common fields, cell/dblclick events.
- Naming: getColumns/getData accessors; align expand/collapse verb families
  (aliases, non-breaking).

## Phase 3 — paid-tier features

- Row grouping + aggregation footers (sum/avg/min/max) — biggest parity gap;
  zero grouping/aggregation code exists today.
- Excel (.xlsx) export (real workbook, not CSV+BOM — table-export.ts:17).
- Clipboard paste (copy exists — table-export.ts:152-189).
- Column virtualization; variable row heights (virtualizer assumes fixed
  rowHeight — table-virtualizer.ts:8-9 vs rowHeightCallback desync at
  snice-table.ts:2958-2961).
- Row spanning. Pivoting: DEFERRED (Premium-tier scope, low demand).
- "Manage columns" panel (re-show hidden columns — currently one-way).

## Phase 4 — feel

- Skeleton loading rows (shimmer CSS exists unwired — snice-cell.css:221-239,
  snice-row.css:212-230) instead of spinner+fade (snice-table.ts:1682-1691).
- aria-live region announcing sort/filter/count changes (zero today; sibling
  components have it).
- Keyboard: plain Space toggles selection (today Shift+Space only —
  table-keyboard.ts:228-235); type-ahead; Escape actually cancels edit (editor
  has zero keydown handling); Ctrl+C copy; Shift+Arrow range; horizontal
  arrow auto-scroll; wire or remove inert tabMode.
- Sort arrow rotates (today innerHTML glyph swap — snice-table.ts:1618-1652).
- Column resize: ghost indicator line, commit on mouseup (today live reflow
  per mousemove — table-column-manager.ts:151-166); visible rest-state handle.
- Dark-mode fixes: snice-cell-image.css:24,58-59 hardcoded grays;
  snice-cell-status.css:38-39 offline dot untokenized.

## Testing & verification

- Each phase lands with its own tests (unit + the perf probes as assertions
  where stable, e.g. select-all click must not scan full data).
- Playwright live check on the showcase after Phases 1/4 (dark mode included).
- Full npm test green, zero stderr, after every phase.

## Order rationale

Broken features are trust-killers (0 first); every feature built on the old
render path inherits its jank (1 before 2/3); polish reads best on a fast,
correct grid (4 last).
