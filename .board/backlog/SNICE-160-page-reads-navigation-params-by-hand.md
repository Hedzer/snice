---
id: SNICE-160
title: "page-reads-navigation-params-by-hand"
epic: quality
priority: 160
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a `@page` class reading `ctx.navigation.params` by hand, as a symptom-detector for broken route-param binding.

## Notes
- Reading params manually means the declarative route-param binding failed silently; the diagnostic should pair with "check each `:param` has a plain `@property()` of the same name".
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
