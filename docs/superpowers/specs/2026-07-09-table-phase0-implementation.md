# snice-table Phase 0 — Implementation Spec

Parent design: `2026-07-09-table-incredible-design.md`. This file is the
executable spec for Phase 0 (advertised-but-broken bugs). Every task follows
the same discipline:

- **TDD**: write the failing test FIRST, run it against unmodified source,
  confirm it fails for the expected reason, then fix, then green.
- Test homes: `tests/components/table-*.test.ts` (one themed file per concern,
  matching existing `table-filter.test.ts` style; helpers may mirror the
  `createTable` helper in `tests/components/table.test.ts`).
- Conventions: read `.ai/coding-standards.md` first. No `lit` mentions. CSS
  always `var(--snice-*, fallback)` with exact theme.css defaults.
- Verify after each task: `npx vitest run tests/components/` green, zero new
  stderr. Do NOT run the full npm test (the coordinator does that between
  tasks).
- Never commit; leave changes in the working tree.

## Task 1 — cell editing must render an editor (opus-tier)

**Bugs (two, fix both):**
a. `table-editor.ts:126-143` `startCellEdit` sets
   `editorType: this.getEditorType(columnKey)` — passes the column KEY where
   `getEditorType(columnType)` expects the TYPE. Every cell edits as 'text'
   unless the key happens to equal a type name. Fix: resolve the column's
   `type` (caller passes it in, or startCellEdit receives the column def).
b. The edit state never reaches the DOM. `snice-table.ts` `createCellElement`
   (~1922) / `createRow` (~2997) never consult
   `this.editor.getCellEditState()` / `getRowEditState()` nor call
   `this.editor.createEditor(type, value, options)`
   (`table-editor.ts:313-356` — returns a real `<input>`/`<select>` etc).
   `startEdit()` (`snice-table.ts:~2458`, invoked by Enter via
   `table-keyboard.ts:237-248`) mutates state then `renderBody()` — cell
   re-renders identically.

**Required behavior:**
- When a cell is in edit state, its `<td>` renders the editor element from
  `createEditor` (with the cell's current value, select options where the
  column provides them) instead of the display cell; editor receives focus.
- Commit on Enter / blur → `commitCellEdit` path (already implemented) →
  re-render shows the new value; `cell-edit-commit` event fires (existing).
- Escape cancels → `cancelCellEdit` → original value re-rendered;
  `cell-edit-cancel` fires. Wire a keydown listener on the editor element
  itself (the editor module has NO keydown handling today — verified).
- Row edit mode (`editMode='row'`): every editable cell in the row renders its
  editor simultaneously (state machine exists — `getRowEditState`).

**Tests (write first, in `tests/components/table-editing-ui.test.ts`):**
1. editable table + `startEdit(row, key)` → `td` contains an editor element
   (input) with the current value. (Fails today: no input.)
2. editor type follows column type: a `number` column yields
   `input[type="number"]`, `boolean` a checkbox/select per `createEditor`.
   (Fails today via bug (a).)
3. Enter in the editor commits: new value rendered, `cell-edit-commit` detail
   `{ rowIndex, columnKey, value }` (match actual dispatch shape in
   `table-editor.ts:182`).
4. Escape cancels: original value rendered, `cell-edit-cancel` fired.
5. `editMode='row'` + `startEdit` → all editable cells in that row show
   editors.
6. Non-editable column (`editable: false` in columnDef) never renders an
   editor.

**Landmine:** do not construct cell/editor elements synchronously inside a
property setter (happy-dom crashes — see parent spec Constraints). Render via
the existing renderBody/renderRow paths only.

## Task 2 — keyboard bounds + virtualized navigation (opus-tier)

**Bugs:**
a. `snice-table.ts:2451-2467` attaches keyboard ONCE at `@ready` with
   `{ totalRows: this.data.length, totalColumns: this.columns.length }` —
   both 0 for async-loaded data; never re-attached on
   setData/setColumns/filter/pagination changes.
b. `table-keyboard.ts:143-144` resolves the focused row via
   `querySelectorAll('tbody tr:not(.virtual-spacer)')[this.focusedRow]` — a
   DOM index. Under virtualization only the window (~15-30 rows) exists;
   `focusedRow` is a LOGICAL index → lookup fails beyond the first window;
   ArrowDown/PageDown/Ctrl+End die.

**Required behavior:**
- Keyboard bounds always reflect the CURRENT filtered/paginated dataset:
  either re-attach on every data/columns/filter change, or (better) change
  `attach` options to accept getter callbacks (`totalRows: () =>
  this.getFilteredData().length`) so bounds are always live. Choose the
  callback approach; update `table-keyboard.ts` option types accordingly.
- Under virtualization, moving focus to a logical row outside the rendered
  window must: scroll the virtualizer so the row's range renders (virtualizer
  exposes scroll math — `table-virtualizer.ts:89-109`), THEN focus the row's
  element (`tr[data-index="<logical>"]` — rows carry `data-index`, see
  `snice-table.ts` createRow). Focus indicator + scrollIntoView work at any
  index (test at index > 100 with a 1000-row virtualized table).

**Tests first (`tests/components/table-keyboard-bounds.test.ts`):**
1. Async data: create table with no data, then `setData(50 rows)`; ArrowDown
   moves focus to row 1 (fails today: bounds captured as 0).
2. `setColumns` after ready: ArrowRight bounds match new column count.
3. Filter active: End/Ctrl+End clamps to filtered count, not raw count.
4. Virtualized (1000 rows, `virtualize`, fixed rowHeight): Ctrl+End focuses
   logical last row — the row element exists in DOM after the scroll and has
   `data-index="999"`. PageDown from 0 lands on a row outside the initial
   window and focuses it. (Both fail today.)

## Task 3 — virtualization must not silently drop features (opus-tier)

**Bug:** virtual path `renderRowRange` (`snice-table.ts:2497-2508`) loops
`createRow(rowData, i)` only. The normal path (:1733-1767) additionally
handles: pinned rows (:1733/:1762), tree-data flattening (:1741-1746),
master-detail expanded rows (:1754-1757).

**Required behavior (support, not just warn):**
- Master-detail: an expanded row inside the virtual window renders its detail
  row (`masterDetail.isExpanded(...)` + `createDetailRow` — mirror the normal
  path). Detail rows may use the variable-height escape: acceptable v1 is
  "expanded detail rows disable windowed math correctness only around
  themselves" — simplest correct approach: include detail rows in the window
  render and accept approximate spacer heights (document this in a comment).
  Row-height EXACTNESS is Phase 3 (variable heights); silent dropping is the
  bug here.
- Tree data: virtual path renders from the FLATTENED visible tree list
  (`treeData.processData` output) rather than raw data, so expand/collapse
  works while virtualized; totalRows for the virtualizer = flattened length.
- Pinned rows: pinned-top/bottom rows render outside the windowed range
  (always present), exactly like the normal path.

**Tests first (`tests/components/table-virtualization-features.test.ts`):**
1. Virtualized + master-detail: expand row 2 → detail row present in DOM.
   (Fails today.)
2. Virtualized + tree data: parent rows render; expanding a parent inserts
   children in-window; virtualizer total reflects flattened count. (Fails.)
3. Virtualized + pinned row: pinned row present regardless of scroll
   position. (Fails.)
4. Regression: virtualization without these features still windows correctly
   (row count in DOM stays bounded ~window+overscan while scrolling).

## Task 4 — polish bug batch (sonnet-tier)

Four independent surgical fixes; TDD each with a focused test in
`tests/components/table-phase0-fixes.test.ts` (one describe per fix).

a. **Action-button hover color** — `components/table/snice-cell-actions.css:40`
   `background: var(--snice-color-text, rgb(23 23 23 / 0.05));` paints solid
   text-color. Fix to a real tint that works in both themes, e.g.
   `background: var(--snice-color-surface-container-high, rgb(252 251 249));`
   or `color-mix`-free rgba overlay pattern used by sibling components — check
   how other snice components do hover washes (grep `hover` in
   components/button/snice-button.css) and match the established pattern with
   exact theme.css-default fallbacks. Test: computed style is not the text
   color (assert the CSS text content of the style, not getComputedStyle —
   happy-dom limits).
b. **row-clicked composed** — `snice-table.ts:2191-2193` add
   `bubbles: true, composed: true` (match sibling dispatches :2376). Test:
   listener on `document` receives `row-clicked` from a click on a row.
c. **Error state** — remote-mode load failure (`getTableData` catch,
   `snice-table.ts:252-254`) must set an internal error state that renderBody
   surfaces: a styled error row/section (danger token + retry affordance not
   required v1; visible message + `table-load-error` event with the error).
   Clear error on next successful load. ALSO delete the dead file
   `components/table/snice-table.css` (243 lines, imported nowhere — verify
   with grep before deleting; its `.table--error` design informs the inline
   styles you add to the live `@styles` block). Test: table in remote mode
   whose @respond handler rejects → error message visible in shadow DOM +
   event fired; subsequent successful load clears it.
d. **Sticky header** — primary path: `thead th` get `position: sticky; top: 0`
   (+ z-index above body cells, below pinned-column z-indexes — inspect the
   inline style block `snice-table.ts:338+` for the .table-frame scroller and
   existing z-index scale; add a background so rows don't bleed through:
   `var(--snice-color-surface, rgb(255 255 255))`). Must compose with pinned
   columns (a pinned header cell is sticky in BOTH axes). Test: style block
   contains sticky rules for thead th (happy-dom can't do scroll layout;
   assert the CSS text + that pinned header cells still carry their left/right
   sticky styles).

## Coordinator notes

- Execution order: Task 1 → Task 4 → Task 2 → Task 3 (1 and 4 touch mostly
  disjoint regions but still run sequentially; 2 and 3 both live in the
  keyboard/virtualizer seam and MUST follow 1/4).
- Full `npm test` + commit between tasks is the coordinator's job.
- Each agent reads: `.ai/coding-standards.md`, this spec, parent design spec.

## Task 5 — real-browser e2e findings (added 2026-07-10; dispatch after Task 3)

Found by driving Chrome against localhost:5566 full-showcase + dynamically
created tables. happy-dom cannot reproduce these; fixes must be verified in
the real browser by the coordinator.

**5a. Keyboard listener never binds for dynamic tables.**
`table-keyboard.ts:47-56` attach() binds keydown to `getTable()` (the inner
<table>) ONCE at @ready via initializeModules. If data/columns arrive after
ready (every real app), the inner table doesn't exist yet — attached stays
false silently — or the element is later rebuilt and the listener is lost.
Repro: create snice-table, await ready, setColumns/setData, dispatch
ArrowDown/Ctrl+End at host/frame/table — no focus marker, no scroll.
Fix direction: delegate keydown at the shadow-root or host level (survives
table rebuilds), or re-attach after every renderHeader/renderBody structural
build; roving tabindex/role=grid must also be (re)applied then. Keep the
Task 2 getter-bounds design.
Tests: happy-dom versions of the repro (attach-after-ready, re-render, then
keydown produces focus movement) + coordinator re-runs the browser repro.

**5b. `virtualize` set as a property post-ready renders an EMPTY table.**
Repro: create table, await ready, setColumns, `v.virtualize = true`,
setData(1000) → tbody has 0 rows (not even the non-virtual fallback);
virtualizer.isEnabled() false while this.virtualize true. As an ATTRIBUTE
before append it works (11 windowed rows + spacer). The renderBody branch
`this.virtualize && this.virtualizer.isEnabled()` diverging from enablement
state produces the empty render.
Fix direction: make renderBody treat "virtualize requested but virtualizer
not yet enabled" as: enable it (setup scroll listener + measurements) then
render windowed; never fall through to nothing. (Full controlled-prop
reactivity is Phase 2 C2 — this task only kills the empty-table state.)
Tests: happy-dom (property-after-ready renders rows; count bounded when
enabled) + coordinator browser repro.

**5c. (Info) dev server serves stale `dist/` for engine core** — rebuild
`npm run build:core` before browser verification sessions, or error texts
etc. lag the source.
