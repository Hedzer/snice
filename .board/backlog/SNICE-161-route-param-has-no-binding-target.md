---
id: SNICE-161
title: "route-param-has-no-binding-target"
epic: quality
priority: 161
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that, for every `:param` in a route pattern, requires a plain `@property()` of that name on the page class; flag missing fields and `@property({ attribute: false })` ones.

## Notes
- Without a matching plain property the route param binds nowhere and the page sees nothing; the message should suggest renaming the ROUTE param (not the field), since `id` collides with HTMLElement.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
