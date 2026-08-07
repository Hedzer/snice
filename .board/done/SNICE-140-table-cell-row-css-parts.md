---
id: SNICE-140
title: "expose snice-table cell/row CSS parts and cell border/padding custom properties"
epic: styling
priority: 140
created: 2026-08-07
deps: []
---

## Goal
Give outside styles a way to reach snice-table cells and rows: expose `cell`/`row` CSS parts (or forward snice-row parts) and/or `--snice-table-cell-border` / `--snice-table-cell-padding` custom properties.

## Notes
- `packages/components/src/table/snice-table.ts` exposes only `superheader`, `header`, and `body` parts (:1479, :642-646) — `::part(body)` cannot reach descendant cells.
- Cells get `border-bottom` + `border-right` from the SAME var `--snice-color-border` (:515-521), so removing vertical grid lines from outside also removes the horizontal ones.
- Confirmed gap from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] `cell` and `row` parts (or forwarded snice-row parts) are exposed, and/or `--snice-table-cell-border` / `--snice-table-cell-padding` custom properties exist
- [x] docs list the new parts/properties
- [x] visual or contract test covers them

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: failing tests first in `tests/components/table-styling-surface.test.ts` — no `row`/`cell` parts on body rows/cells, no cell border/padding custom properties.
- 2026-08-07: fix in `packages/components/src/table/snice-table.ts` — `part="row"`/`part="cell"` on every body row/cell in `createRow`, and `--snice-table-cell-padding`, `--snice-table-cell-border` (vertical), `--snice-table-row-border` (horizontal) custom properties in the base `th, td` rule. Density overrides unaffected (higher specificity). Documented in `docs/components/table.md` and `docs/ai/components/table.md`.
