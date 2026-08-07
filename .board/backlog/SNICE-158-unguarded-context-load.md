---
id: SNICE-158
title: "unguarded-context-load"
epic: quality
priority: 158
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a `@context()` handler that starts work (fetch/load/subscribe) with no guard distinguishing first delivery from later updates. Pairs with SNICE-138.

## Notes
- `@context()` handlers are a subscription firing on every update, so an unguarded handler re-triggers its load on each context change.
- The analyzer's own diagnostic at `bin/project-analyzer.js:814` already says "@context() decorates a method that receives Context updates" (plural).
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
