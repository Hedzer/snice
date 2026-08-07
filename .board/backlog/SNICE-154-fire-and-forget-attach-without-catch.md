---
id: SNICE-154
title: "fire-and-forget-attach-without-catch"
epic: quality
priority: 154
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags `void attachController(...)` or a bare unattached call whose promise is neither awaited nor `.catch()`ed.

## Notes
- `ControllerAttachAborted` is the designed teardown path but `void` doesn't handle rejections, so attach failures surface as unhandled rejections with a green test suite.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
