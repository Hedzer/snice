---
id: SNICE-156
title: "controller-attach-unasserted"
epic: quality
priority: 156
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a page/component that binds a controller but has no test asserting attachment.

## Notes
- `controller="name"` reflects read-only, so the assertion is cheap; without it a broken attach path ships silently.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
