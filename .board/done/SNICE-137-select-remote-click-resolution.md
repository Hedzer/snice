---
id: SNICE-137
title: "resolve clicked option from filteredOptions in snice-select remote mode"
epic: behavior
priority: 137
created: 2026-08-07
deps: []
---

## Goal
In snice-select remote mode, mouse selection must resolve the clicked option from `filteredOptions` (the rendered remote results) and the trigger sync-back must use the same source, so mouse and keyboard behave identically and the label persists after a pick.

## Notes
- `packages/components/src/select/snice-select.ts`: `updateDropdownContent` renders remote results from `filteredOptions` (:382), but the click handler (:1033-1035) resolves the clicked `data-value` against `mergedOptions` (slotted children + programmatic options), which is empty in remote mode — clicking a remote result silently selects nothing.
- The keyboard path (:777) already uses `filteredOptions`, so mouse and keyboard disagree.
- Same root cause: `syncEditableInputToValue` (:856-860) falls back to the raw value because `mergedOptions` is empty, so the trigger snaps from label back to bare id after a pick.
- Confirmed bug from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] click resolves the option from `filteredOptions` when `remote` is set
- [x] trigger sync-back uses the same source, so the label persists after a pick
- [x] tests cover mouse-select and label persistence in remote mode

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: three failing tests first in `tests/components/select.test.ts` — remote click selected nothing, trigger showed placeholder, editable input snapped to raw id.
- 2026-08-07: fix in `packages/components/src/select/snice-select.ts` — new `resolvableOptions` getter (filteredOptions ∪ mergedOptions when `remote`), used by the click handler, `selectOption()`, `syncEditableInputToValue()`, `updateValueDisplay()`, and `updateClearButton()`. Select suites green (99 tests).
