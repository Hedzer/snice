# snice-table Phase 2 (DX/API) — Implementation Spec

Parent design: `2026-07-09-table-incredible-design.md`. Prereqs: Phase 0 + 1
landed. Same TDD discipline; agents never commit; coordinator runs full
`npm test` between tasks.

## Task C — reactive data/columns + controlled state (opus)

**C1. Reactive `columns`/`data` assignment.** (Parked design, resume it.)
- `@property({ attribute: false })` on both fields; `@watch('columns',
  { immediate: false })` → header+body; `@watch('data', { immediate: false })`
  → body. `@watch('loading')` keeps its current behavior (stack decorators).
- Renders go through a microtask-coalesced queue (single render per tick, out
  of the setter stack — MANDATORY: happy-dom crashes constructing cells inside
  a property-setter stack; prior attempt confirmed queueMicrotask alone isn't
  sufficient if any construction stays synchronous — ALL DOM work moves into
  the queued callback).
- `table.data = rows` refreshes the `unsortedData` snapshot; the internal
  sort path (`sortLocalData` reassigning `this.data`) must NOT refresh it —
  guard with an internal flag around the sort assignment, and skip the queued
  re-render there (sortLocalData already renders).
- `rowIndexMap` (Phase 1) rebuilds on reactive assignment too.
- setData/setColumns remain as aliases (now: assign + the queue coalesces).
Tests (`tests/components/table-reactive-assignment.test.ts` — recreate; the
parked version was deleted): columns assignment renders header without manual
calls; data assignment renders body + refreshes unsortedData; reassignment
updates rows; sorting after plain assignment works and does not clobber the
snapshot; setColumns/setData still work; a burst of N assignments renders once
(spy renderBody).

**C2. Controlled state props.** Assigning these must take effect post-mount:
`currentSort` (today only re-renders arrows — must re-sort via sortLocalData
or remote request), `currentPage`, `pageSize`, `density`, `editable`,
`editMode`, `virtualize`, `rowHeight`, `columnResize`, `headerFilters`,
`quickFilter`, `columnMenu`. Add `@watch(..., { immediate: false })` handlers
routing to the existing methods (goToPage/setPageSize/etc). All renders via
the coalescing queue.
Tests: one `it` per prop — assign, assert observable effect (sorted rows,
page slice, density class, editor availability, etc). Use existing method
tests as behavior oracles.

## Task D — honest types + typed events (sonnet)

**D1. Replace the fabricated `SniceTableElement`.**
`snice-table.types.ts:230-258` has phantom members (size, variant, bordered,
stickyHeader, showSearch, sort(), search(), getSelectedRows()) and lacks ~30
real props/methods. Rewrite the interface FROM the class (every public
@property/plain field/public method on SniceTable), and make the class
`implements SniceTableElement`. Do not rename anything on the class.
**D2. Typed event map.** Add `SniceTableEventMap` covering every dispatch in
the table family — inventory (grep @dispatch + dispatchEvent):
row-clicked, table-row-selection-changed, table-select-all-changed,
table-sort-changed, table-filter-changed, table-page-changed,
column-visibility-change, column-pin-change, column-order-change,
density-change, lazy-load, table-load-error, cell-edit-commit,
cell-edit-cancel, row-edit-commit, row-edit-cancel, row-expand, row-collapse,
detail-toggle, cell-action, row-reorder, column-reorder — with exact detail
shapes read from the dispatch sites (do not guess; cite each site in a
comment).
**D3. Docs.** `docs/components/table.md` + `docs/ai/components/table.md`
(mirror, low-token): add the ~9 undocumented props (mode, virtualize,
rowHeight, virtualBuffer, editMode, quickFilter, rowReorder, columnReorder,
selector/selectorOptions), full Events table from D2, column-def fields
(valueGetter/valueFormatter/valueParser/valueSetter/sortComparator/flex/
minWidth/maxWidth/pinned/editable/ellipsis/tooltip/wrap), fix the
ColumnType doc/type disagreement (source of truth: snice-table.types.ts:4-6).
Tests: a type-level test file (`tests/components/table-types.test.ts`) that
assigns a `SniceTable` instance to `SniceTableElement` (compile-time check via
vitest typecheck or a plain assignment that fails tsc if drift returns) and
asserts a sample of event names exist in the map. Keep runtime assertions
minimal — the value is compile-time.

## Task E — selection model + custom renderers (opus)

**E1. Selection modes.** `selectionMode: 'none'|'single'|'multiple'` (default
'multiple' = today's behavior). single: clicking selects exactly one; ctrl/
meta-click toggles (multiple mode); shift-click selects the contiguous range
from the last anchor (multiple mode). Emit ONE unified event
`selection-changed` `{ selectedRows: number[], rows: any[] }` alongside the
two legacy events (deprecate in docs, don't remove).
Tests: mode matrix (none/single/multiple × click/ctrl/shift), anchor behavior
across sort (anchor follows row object, not index), unified event payload.
**E2. Custom renderers/editors.** ColumnDefinition additions:
`renderCell?: (value, row, column) => HTMLElement | string` (string =
textContent, never innerHTML) and `renderEditor?: (value, row, column,
commit: (v)=>void, cancel: ()=>void) => HTMLElement`. createCellElement uses
renderCell when present (bypassing type-based cell elements);
maybeCreateCellEditor uses renderEditor. Expose
`setCellEditableCheck(fn)` publicly (wraps TableEditor.setEditabilityCheck —
implemented but unreachable today).
Tests: renderCell HTMLElement + string variants (string is NOT parsed as
HTML — inject `<img onerror>` and assert textContent); renderEditor
commit/cancel plumbing; editability check gates editing per cell.

## Coordinator notes

- Order: C → D → E (C changes render plumbing that E builds on; D is
  independent but touches types file that E extends — run D before E).
- Naming-consistency pass (getColumns/getData aliases, expand/collapse verb
  alignment) folded into D3 docs work only if trivial; otherwise defer.
