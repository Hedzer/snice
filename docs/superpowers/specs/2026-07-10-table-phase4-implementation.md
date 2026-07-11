# snice-table Phase 4 (feel & a11y) — Implementation Spec

Parent design: `2026-07-09-table-incredible-design.md` (Phase 4 section + the
visual defect ledger). Prereqs: Phases 0-3. Same discipline: TDD red-first
where assertable, agents never commit, coordinator runs full suite + a
real-browser dark-AND-light visual pass after each task. Never mention "lit".

## Task I — loading, announcements, visual ledger closeout (sonnet)

**I1. Skeleton loading rows.** Shimmer CSS already exists unwired
(snice-cell.css:221-239 `.loading::after`, snice-row.css:212-230
`.row--loading::after`). When `loading` is true AND the table has columns:
render N placeholder rows (N = pageSize clamped 5..10, or last row count)
of shimmer cells instead of the centered spinner + 50% fade
(snice-table.ts spinner block + `:host([loading]) tbody`). Spinner remains
for the no-columns first-load case. Recycler: skeleton rows use synthetic
keys, always rebuild.
Tests: loading+columns → skeleton rows present, no spinner; loading without
columns → spinner; loading=false clears skeletons.

**I2. aria-live announcements.** Add one visually-hidden live region
(`role="status" aria-live="polite"`) to the table shadow DOM. Announce:
sort changes ("sorted by Name descending"), filter/search result counts
("12 of 48 rows"), page changes ("page 2 of 5"). Match the sibling pattern —
read snice-toast/snice-alert for the established visually-hidden CSS.
Tests: region exists; each action updates its textContent (assert strings).

**I3. Ledger closeout.**
- Standalone search fragment (showcase pro section): restyle the fragment in
  public/showcases/table.html + components/table/full-showcase.html to use
  snice-input with prefix-icon='search' like the toolbar (fragment-only
  change; rebuild showcases via `node public/build-showcases.js`).
- Sort indicator contrast: raise rest-state opacity/color of the sort
  diamonds (snice-table.ts styles) from barely-visible to clearly-visible
  (use --snice-color-text-tertiary token, exact theme fallback).

## Task J — keyboard completion (opus)

All in table-keyboard.ts (+ editor wiring), preserving the shadow-root
delegation, getter bounds, hasUserInteracted gate, and virtualized nav:
- Plain Space toggles selection of the focused row (today Shift+Space only);
  Shift+Space keeps working. Space in an editor must NOT toggle (guard via
  options.isEditing()).
- Shift+ArrowUp/Down extends selection as a range from the anchor
  (integrates with Task E's anchor model; multiple mode only).
- Ctrl/Cmd+C copies the current selection (reuse table-export clipboard copy;
  focused row when nothing selected).
- Escape while editing cancels the edit (route to editor.cancel; the editor
  keydown wiring from Phase 0 handles editor-internal Escape — this covers
  grid-level Escape when focus is on the cell, not the input).
- Type-ahead: printable characters accumulate (500ms window) and move focus
  to the next row whose FIRST VISIBLE column starts with the buffer
  (case-insensitive). Disabled while editing.
- Horizontal auto-scroll: ArrowLeft/Right ensure the focused cell is visible
  (scrollIntoView with inline:'nearest', guarded for happy-dom).
- Remove the inert `tabMode` option entirely (never read; delete from
  options type, attach call, and docs) — dead API is worse than no API.
Tests: one describe per behavior; existing keyboard tests stay green.

## Task K — interaction polish (opus)

**K1. Sort arrow rotation.** Replace the two-glyph innerHTML swap
(renderSortableHeader) with ONE chevron element rotated via CSS transform
(asc 0deg / desc 180deg, transition var(--snice-transition-fast, 150ms));
opacity transition for none-state stays. Multi-sort priority badge (the
small number) unchanged.
Tests: structural — one svg per sortable header across sort cycles; class/
transform toggles instead of node replacement (assert element identity
survives a sort toggle).

**K2. Column resize ghost.** During drag: fixed-position vertical indicator
line at the pointer (theme primary color), NO live width mutation; commit
th/td widths once on mouseup. Keep double-click autosize. Make the rest-state
handle visible (2px hairline, --snice-color-border token) instead of fully
transparent.
Tests: mousemove during drag does not change th.style.width; mouseup commits
the final width; indicator element added on dragstart/removed on mouseup.

**K3. Dark-mode token fixes.**
- snice-cell-image.css:24 background + :58-59 placeholder gradient/border →
  --snice-color-surface-container-high / border tokens (exact theme.css
  fallbacks).
- snice-cell-status.css:38-39 offline dot → --snice-color-text-tertiary
  token + tokenized ring.
Tests: CSS-text assertions (no raw `rgb(243 244 246)` etc. outside var()
fallbacks in those files).

## Coordinator notes
Order: I → J → K. After K: full dark+light browser pass of the entire
showcase (the initiative's exit review), update the parent design doc with a
final scorecard, and refresh the project memory (the setColumns/setData
manual-render gotcha is obsolete; note the reactive API).
