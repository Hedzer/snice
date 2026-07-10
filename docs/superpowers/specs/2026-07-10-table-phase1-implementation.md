# snice-table Phase 1 (performance core) — Implementation Spec

Parent design: `2026-07-09-table-incredible-design.md`. Prereq: Phase 0 landed.
Baseline damage (measured in happy-dom, 10k rows): 391 ms per checkbox click,
~4 s full renderBody, ~6.6 s per sort click (render-bound).

**Perf testing rule:** wall-clock assertions flake under load. Tests assert
ALGORITHMIC invariants via spies/counters instead: which functions run, how
many times, over what input sizes. (E.g. "no `Array.prototype.indexOf` on the
full dataset during a selection toggle", "createRow ran ≤ window+overscan
times".) Same TDD discipline as Phase 0: failing test first, prove red, fix,
green. Coordinator runs full `npm test` between tasks; agents run the table
family only.

## Task A — kill the quadratic + cheap deltas (sonnet/opus)

**A1. Select-all/indeterminate is O(n²).**
Evidence: `filteredData.map((row) => this.data.indexOf(row))` at
`snice-table.ts:1451, 2226, 2296, 2700` — runs on EVERY row click/checkbox
toggle via `updateSelectAllState()`.
Fix: maintain `private rowIndexMap: Map<any, number>` rebuilt whenever
`this.data` is replaced (setData, remote load, sort — one place: a
`rebuildRowIndex()` called from those sites). All four `indexOf` sites read
the map. Identity semantics unchanged (reference equality, same as indexOf).
Tests (`tests/components/table-select-perf.test.ts`):
1. Spy on `Array.prototype.indexOf` (install in test, restore after):
   toggling one checkbox in a 1k-row table performs ZERO indexOf calls whose
   receiver is `table.data`. (Red today.)
2. Behavior locks: select-all state/indeterminate still correct after
   filter + select + unfilter round trip (mirror existing select tests).

**A2. Selection change rewrites every rendered row.**
Evidence: `updateRowSelectionState()` (`snice-table.ts:2276-2289`) does
`tbody.querySelectorAll('tr')` + per-row attribute writes on every toggle.
Fix: update only the toggled row's `<tr>` (locate by `data-index`) plus the
header select-all checkbox; full sweep only for select-all/clear-all.
Tests: spy `setAttribute` on tr elements (or count `data-selected` writes):
single toggle in 1k-row table touches exactly 1 row element. Behavior locks:
row highlight + checkbox states still correct (reuse existing assertions).

**A3. Local filter/search re-filters and full-rebuilds per keystroke.**
Evidence: `setQuickFilter`/`setColumnFilter` (`snice-table.ts:2520-2538`) →
`applyClientFilters()` → `renderBody()` synchronously; engine passes at
`table-filter-engine.ts:178-220`. Debounce exists only in remote mode.
Fix: debounce LOCAL quick-filter/header-filter input paths (150 ms, matching
the remote debounce constant; direct API calls like `setQuickFilter` stay
synchronous — only the INPUT event paths debounce, so tests and programmatic
callers keep deterministic behavior).
Tests: fake timers; typing 5 chars into the quick-search input triggers ONE
applyClientFilters (spy) after the window, not 5. Programmatic
`setQuickFilter` remains synchronous (existing tests must stay green
unchanged — that is the regression gate).

**A4. Virtualized scroll re-filters the whole dataset every frame.**
Evidence: `renderRowRange` calls `this.getFilteredData()` per invocation
(`snice-table.ts:2497-2499`), invoked per rAF scroll frame
(`table-virtualizer.ts:112,43-46`).
Fix: cache the filtered array (`private filteredCache`) invalidated on: data
replacement, filter model change, sort. `getFilteredData()` returns the cache
when valid. (This also speeds the non-virtual paths that call it repeatedly —
grep call sites and confirm no stale-cache hazard: every mutation of
data/filters/sort must invalidate. List each invalidation site in the code
comment.)
Tests: spy on the filter engine's `applyFilters`: two consecutive
`renderRowRange` calls with unchanged model → engine runs once. Changing the
filter model invalidates (engine runs again; rendered rows update).

**A5. Remote mode: out-of-order responses.**
Evidence: no requestId/abort anywhere in `getTableData` (`snice-table.ts:
225-256`); 150 ms debounce is the only guard.
Fix: monotonic `private dataRequestSeq`; capture at request start, apply the
response only if it is still the latest (`if (seq !== this.dataRequestSeq)
return;`). Dispatch nothing for stale responses.
Tests: two @respond handlers with controlled resolution order (slow first
request, fast second): table shows the SECOND request's rows after the first
resolves late. (Red today: late slow response overwrites.)

## Task B — render-path recycling (opus; the big one)

**Root cause:** `renderBody()` wipes `tbody.innerHTML` and rebuilds every
`<tr>` + one custom element PER CELL (`snice-table.ts:1674`; virtualizer does
the same per scroll-frame at `table-virtualizer.ts:117`). 10k×5 = 50k custom
elements; sort clicks cost ~6.6 s because of this rebuild, not the sort.

**Required behavior (recycling, not a rewrite):**
- Keep `createRow` as the row factory. Add a row-reconciler in front of the
  tbody: rows are keyed by row-object identity (the `rowIndexMap` from A1
  gives index↔object). On re-render: rows whose object AND rendered state
  (selection/edit/detail-expansion) are unchanged are REUSED as-is (moved if
  order changed — reuse the keyed-move pattern from `src/parts.ts`
  `_reconcileKeyed`, including the detach-into-fragment move to avoid the
  happy-dom stale-query bug); new objects get fresh rows; departed rows are
  dropped. Cell contents update in place only for rows whose data object is
  REPLACED — in-place mutation is out of scope (reference semantics,
  consistent with the framework).
- Sort/filter/pagination then cost: array work + moves + (new rows for
  entering objects) — NOT a full rebuild.
- Virtualizer: `renderRowRange` recycles rows that remain in the window
  across range shifts (scroll down by 3 rows = 3 new rows + 3 dropped, rest
  untouched). Keep spacer math unchanged.
- Edit-state rows and detail-expanded rows always re-render (their DOM shape
  depends on state, not just data).
- The public API and all existing tests must pass UNCHANGED — this is a
  drop-in render-path change. If an existing test asserts full-rebuild side
  effects (element identity churn), examine whether the assertion encodes a
  guarantee or an implementation detail; report, don't silently weaken.

**Tests (`tests/components/table-render-recycling.test.ts`), red-first:**
1. Re-render with identical data (renderBody twice): every `<tr>` element is
   IDENTITY-equal to before (map by data-index). (Red today: all new nodes.)
2. Sort click on 100 rows: the `<tr>` for a given data object is the same
   element after the sort, moved to its new position. (Red.)
3. Removing 1 row of 100: 99 `<tr>`s identity-preserved. (Red.)
4. Virtualized window shift by N rows: ≤ N+overscan new `<tr>` constructions
   (count via a spy on createRow). (Red: full window rebuild.)
5. Selection/edit/detail behavior regression: reuse existing test families —
   they must pass unmodified.
6. Algorithmic gate: renderBody on unchanged 1k rows constructs ZERO new
   cell elements (spy on document.createElement for `snice-cell-` tags).

**Landmines:**
- happy-dom stale querySelectorAll cache after in-place `insertBefore` moves —
  use detach-into-fragment moves (see `src/parts.ts` `_reconcileKeyed` and its
  comment).
- happy-dom crash constructing cells synchronously inside property setters —
  render paths only, never from setters.
- `updateRowSelectionState` (A2) and the reconciler must agree on
  `data-index` attributes after reorder — reconciler re-stamps `data-index`
  on moved rows.

## Coordinator notes

- Order: Task A then Task B (B builds on A1's rowIndexMap; A's spies also
  become B's regression net).
- After B lands: rerun the Phase-1 baseline probe (10k rows: click, sort,
  renderBody) and record before/after numbers in this file under an Outcome
  heading.

## Outcome (2026-07-10) — Phase 1 complete

Real-Chrome measurements, 2k rows non-virtualized (pre-fix baseline in
parentheses):
- identical re-render: 6 ms (~456 ms full rebuild)
- sort click: 41 ms (rebuild-dominated path measured at ~6.6 s @10k in the
  audit)
- selection click: 0.7 ms (quadratic; 391 ms-class @10k)
- initial first render: 714 ms @2k — inherent first-build cost of a custom
  element per cell; addressed by virtualization for large data and revisited
  in Phase 3 (column virtualization / lighter cells).

Both tasks landed TDD (red-proofed spies: 2,000 indexOf calls and 2,000 row
writes per click → 0 and 1; 600 cell constructions on unchanged re-render →
0). Full suite 494 files green, zero stderr, at every commit.
