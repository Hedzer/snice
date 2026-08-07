---
id: SNICE-150
title: "prop-binding-type-mismatch"
epic: quality
priority: 150
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a `.prop=${expr}` binding whose target member type is incompatible with `expr`, where the tag resolves to a project class.

## Notes
- `html(...values: any[])` erases binding types, so tsc sees nothing; the checker is the only place this mismatch can surface.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
