# snice-spreadsheet — ALPHA

This component is **alpha**. It is intentionally **not** included in the showcase
(`public/showcases/manifest.json`, `public/showcases/_head.html`,
`public/index.html` prefetch, `public/showcases/_footer.html` search synonyms),
and the constructor logs a one-time `console.warn` to make accidental adoption
loud.

Do not promote to beta until every bug below has a passing live e2e test in
`tests/live/components/spreadsheet/` AND has been verified by hand in storybook.

## Known bugs / unfinished work

### Selection
- [ ] Selection is "still not right" (per user report 2026-04-29). Repro and
      describe the exact failing path before fixing — likely candidates:
      drag-select boundary cells, shift+click after a sort, click-after-resize
      on a different column, click on a frozen cell.
- [ ] When a sort changes row order, the selected cell tracks by row INDEX,
      not by row IDENTITY — selection appears to "jump" to a different row.
- [ ] Multi-cell range selection across a frozen-pane boundary may report the
      wrong `selectionStart`/`selectionEnd` because the frozen overlay row is
      a separate DOM row.

### Column resize
- [x] Column can no longer shrink past ~80px (was floored by `min-width: 5rem`
      on `.spreadsheet-th`/`.spreadsheet-td` and `min-width: 100%` on
      `.spreadsheet-table`). Now floors at ~25px due to padding/border.
- [x] Resize drag was triggering column sort on mouseup. Suppressed via
      `suppressNextHeaderClick` + skip when target is inside the handle.
- [ ] **Regression introduced by the suppression fix:** the suppression flag
      is set sticky in `handleResizeEnd`. A `setTimeout(..., 0)` was added to
      clear it, but that is the wrong primitive — it interacts badly with
      task ordering and was rejected. The correct fix is to track whether
      the mouse actually MOVED during the resize and only suppress when a
      drag occurred, then consume the flag inside the next `click` handler
      (no timer needed). This is currently NOT fixed.
- [ ] Resize handle is 4px wide; at very narrow column widths it overflows
      the cell visually. Acceptable for alpha.

### Keyboard / shortcuts
- [x] Ctrl+Z while editing a cell would undo a *previously committed*
      spreadsheet edit instead of undoing typing in the active editor.
      Fixed by bailing the host keydown handler when `editingCell` is set.
- [x] Ctrl+F while editing would steal focus from the editor and open the
      find bar mid-edit. Same fix.
- [ ] Page Up / Page Down / Ctrl+Home / Ctrl+End not implemented.
- [ ] Ctrl+Arrow (jump-to-edge-of-data) not implemented.

### Edit lifecycle
- [x] Enter/Tab/Escape on the edit input bubbled to the host and re-entered
      edit on the next cell. Fixed via `e.stopPropagation()` in
      `handleEditKeydown`.
- [ ] No formula recalc on dependent cells after edit — e.g. editing B1
      doesn't refresh `=SUM(B1:B3)` in another cell.
- [ ] No data-validation pipeline; type=number cells accept any string.

### Frozen panes
- [x] Frozen-pane stories had hardcoded `wrapper.scrollLeft = 400` in tests
      that assumed a specific table width. Switched to `scrollWidth`-based
      assertions.
- [ ] Visual fidelity at the frozen-row × frozen-col intersection is rough
      around the borders.

### Side-effects coverage
- [x] New `tests/live/components/spreadsheet/spreadsheet-side-effects.spec.ts`
      asserts each user action does NOT trigger an unrelated effect (sort,
      find, context menu, scroll, edit). 19 tests, all passing as of the
      latest run.
- [ ] Coverage gaps: paste / clipboard, right-click on row-num, drag-select
      over a frozen-pane boundary, type-to-overwrite while a cell is
      currently selected via shift+arrow range, fill handle that crosses a
      sorted column.

## How to bring it out of alpha

1. Resolve every unchecked box above with a passing live e2e test.
2. Add the component back to:
   - `public/showcases/manifest.json` (between `table.html` and `list.html`)
   - `public/showcases/_head.html` (script tag near `snice-spotlight`)
   - `public/index.html` (prefetch link near `snice-spotlight`)
   - `public/showcases/_footer.html` (`'grid'` and `'data'` search synonyms)
3. Remove the `STABILITY = 'alpha'` field, the `alphaWarned` console warning,
   and this file.
4. Bump major (breaking) if any consumer is relying on the alpha shape.
