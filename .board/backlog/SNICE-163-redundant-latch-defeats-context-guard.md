---
id: SNICE-163
title: "redundant-latch-defeats-context-guard"
epic: quality
priority: 163
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a controller carrying BOTH a first-delivery guard and a second idempotence flag checked in its load path.

## Notes
- The second latch makes the first guard's regression test vacuous — the test passes even if the first guard is removed, because the latch still blocks the re-load.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
