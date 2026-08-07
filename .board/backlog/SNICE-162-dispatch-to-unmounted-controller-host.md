---
id: SNICE-162
title: "dispatch-to-unmounted-controller-host"
epic: quality
priority: 162
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a `@dispatch`/dispatchEvent targeting a selector whose element only exists inside a branch the SAME handler's state change creates.

## Notes
- The target element does not exist at dispatch time, so the event goes nowhere silently and no listener ever fires.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
