---
id: SNICE-147
title: "prop-binding-wiped-by-undecorated-field"
epic: quality
priority: 147
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a `.prop=${...}` binding whose target host declares that name as a PLAIN undecorated class field, since the bound value is silently wiped.

## Notes
- The pre-upgrade commit only replays through `property()`'s initializer; an undeclared member survives, a decorated one receives the value, but a plain declared field gets `undefined`.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
