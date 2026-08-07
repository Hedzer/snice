---
id: SNICE-155
title: "imperative-attach-in-app-code"
epic: quality
priority: 155
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags any `attachController(` call outside tests.

## Notes
- The `controller=${X}` binding covers every legitimate app-code case; imperative attach in application code bypasses the binding lifecycle.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
