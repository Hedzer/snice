---
id: SNICE-152
title: "foreign-shadow-read"
epic: quality
priority: 152
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags member access on `<expr>.shadowRoot` where expr is not `this`, and `style.left`/`style.top` writes derived from cross-boundary `getBoundingClientRect`.

## Notes
- Reaching into another element's shadow root couples components to internals they do not own, and coordinates from `getBoundingClientRect` do not survive a shadow boundary.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
