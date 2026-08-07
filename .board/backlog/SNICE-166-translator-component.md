---
id: SNICE-166
title: "translator-component"
epic: quality
priority: 166
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a project element whose template is a SINGLE prebuilt snice component and whose only other code re-dispatches its event under a new name and/or maps inputs into its options/columns.

## Notes
- The wrapper adds no behavior of its own; options/columns are data and belong to the data owner, not to a pass-through element.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
