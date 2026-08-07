---
id: SNICE-164
title: "page-owns-transport"
epic: quality
priority: 164
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a `@page` class importing a service module, holding a fetch closure, or declaring its own `ctx` field.

## Notes
- A page owning transport is the anti-pattern the element/controller/page split exists to prevent; transport belongs to controllers and daemons.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
