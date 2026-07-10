# snice-table Phase 3 (paid-tier features) — Implementation Spec

Parent design: `2026-07-09-table-incredible-design.md`. Prereqs: Phases 0-2.
Same discipline: TDD red-first, agents never commit, full suite + real-browser
verification by the coordinator between tasks. Never mention "lit".

## Task F — row grouping + aggregation (opus; the headline feature)

**Gap:** zero grouping/aggregation code exists. This is the single biggest
"paid grid" perception gap vs MUI X Pro/Premium.

**API (additive):**
```ts
groupBy?: string | string[];            // column key(s) to group rows by
groupDefaults?: { expanded?: boolean }; // initial expansion (default true)
// per-column aggregation in ColumnDefinition:
aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count'
          | ((values: any[], rows: any[]) => any);
```
- Reactive: `table.groupBy = 'department'` takes effect post-mount (route
  through the Task C watch/queue pattern).
- Group header rows: full-width row with expand chevron, group value, count
  badge; clicking toggles the group (reuse tree-data expand/collapse UX and
  the master-detail chevron affordance — match their DOM/classes/density).
- Aggregation rows: per-group footer when grouped; ALSO a table-level footer
  row when any column has `aggregate` even without grouping. Formatted through
  the column's normal formatter/type pipeline.
- Interplay (test each): grouping + sorting (sort within groups; groups
  ordered by group key), + filtering (groups with zero visible rows
  disappear; aggregates computed on FILTERED rows), + selection (selecting a
  group header selects its rows; indeterminate state), + pagination (page
  over the flattened group+row list), + virtualization (flattened list model
  — same pattern as tree data), + editing (cell commit recomputes affected
  aggregates).
- Implementation shape: a `table-grouping.ts` module (mirror
  table-tree-data.ts structure) producing a flattened display list
  `{ type: 'group' | 'row' | 'aggregate', ... }` consumed by
  getVirtualRows/renderBody; group rows get synthetic recycler keys.
- Events: `group-toggle { key, value, expanded }`.

**Tests** (`tests/components/table-grouping.test.ts`): red-first — group rows
render with counts; toggle collapses; aggregates (each built-in + custom fn)
correct per group and table-level; the six interplay cases above; reactive
groupBy assignment.

## Task G — Excel export + clipboard paste (opus)

**G1. Real .xlsx export.** table-export.ts:17 ships CSV+BOM labeled "Excel
compatibility". Implement a minimal zero-dependency xlsx writer: an .xlsx is a
ZIP of XML parts ([Content_Types].xml, _rels, workbook.xml, worksheet,
sharedStrings optional — inline strings acceptable). Write a tiny STORED
(no-compression) ZIP builder (local file headers + central directory + CRC32,
~120 lines) in `table-export.ts` or a sibling `xlsx-writer.ts`. Number cells
export as numbers (respect column type), strings as inlineStr. Method:
`exportXlsx(filename?)` + toolbar export menu entry alongside CSV/print.
Honor exportable:false columns and current filter/sort like the CSV path.
Tests: unzip the produced bytes in-test (write a minimal ZIP reader in the
test or assert structure: PK signatures, entry names, worksheet XML contains
expected cell values/types). Verify Excel-openability once manually via
coordinator (a real download in the browser session).

**G2. Clipboard paste.** Copy exists (table-export.ts:152-189). Add paste:
when the grid has keyboard focus and `editable` is on, Ctrl/Cmd+V parses
clipboard TSV (Excel's format) and writes cells starting at the focused
cell, through the SAME editor pipeline (valueParser/valueSetter/validation
per column; skip non-editable columns; clamp to grid bounds). Batch event:
`cells-pasted { startRow, startCol, rows, cols, changes }`. One
renderBody after the batch (recycler handles per-row invalidation — call
invalidateRenderedRow per changed row).
Tests: paste matrix into editable grid updates cells + fires event; respects
validation failures (invalid cells unchanged, error surfaced); non-editable
column skipped; clamps at edges.

## Task H — column virtualization + variable row heights (opus)

**H1. Variable row heights.** Browser evidence (Phase 0 ledger): configured
rowHeight 36 vs ~49px actual → spacer drift → blank band after deep scroll.
Fix: virtualizer measures the first rendered row's offsetHeight after each
window render and uses the measured value for all spacer/index math
(fallback to configured rowHeight when unmeasurable, e.g. happy-dom).
`rowHeightCallback` rows: sum-based offsets via a prefix-sum array rebuilt on
data change (only when the callback is present — fixed-height fast path
untouched).
Tests: happy-dom can't measure — structural: prefix-sum math unit-tested
directly (module-level function); measured-height path verified by
coordinator in the browser (deep scroll shows rows, not blank).

**H2. Column virtualization.** For wide tables (30+ columns): window visible
columns + overscan using measured column widths (columnManager knows widths).
Render only visible column cells per row; header included. Pinned columns
always render. Gate behind `columnVirtualize` (opt-in, default off) to avoid
destabilizing normal tables. Integrates with the row recycler: structural
signature includes the visible-column window so a horizontal scroll rebuilds
rows (acceptable v1; cell-level recycling later if needed).
Tests: with 60 columns and columnVirtualize, rendered `td` count per row is
bounded; horizontal scroll shifts the window; pinned columns always present;
default-off leaves behavior identical.

## Explicitly deferred
Pivoting (Premium-tier scope) and row spanning — revisit after Phase 4.
"Manage columns" panel moves to Phase 4 (it's a UI affordance).

## Coordinator notes
Order: F → G → H (F is the perception headline; H touches the virtualizer
last so F/G land on a stable base). Real-browser checks per task: grouped
showcase interaction (expand/collapse/aggregates), an actual .xlsx download
opened, deep-scroll blank-band gone, 60-column horizontal scroll.
