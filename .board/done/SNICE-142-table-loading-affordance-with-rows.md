---
id: SNICE-142
title: "loading affordance for snice-table while rows are present"
epic: behavior
priority: 142
created: 2026-08-07
deps: []
---

## Goal
Give snice-table an optional spinner/overlay that shows while loading even when rows are already present, so a refetch with existing data has a real loading affordance.

## Notes
- `loading` renders `<snice-progress>` only inside the `data.length === 0` branch (`packages/components/src/table/snice-table.ts:2378-2387`).
- With rows present the only affordance is `:host([loading]) tbody { opacity: .5 }` (:875-877).
- Confirmed gap from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] an optional spinner/overlay is available independent of row count (keep-rows-and-show-spinner)
- [x] test covers refetch-with-data

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: failing test first in `tests/components/table-loading-overlay.test.ts` — `loading` with rows present showed no spinner.
- 2026-08-07: fix in `packages/components/src/table/snice-table.ts` — `updateLoadingOverlay()` adds a `part="loading-overlay"` spinner overlay over `.table-frame` whenever `loading && data.length > 0`; the no-data load keeps its single spinner message row. Documented the part in both table docs. Component suite green.
