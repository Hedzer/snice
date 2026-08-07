---
id: SNICE-148
title: "controller-reads-host-prop-written-this-turn"
epic: quality
priority: 148
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a controller reading `this.element.<prop>` for a value the page wrote synchronously in the same user action, since the controller reads stale data.

## Notes
- Binding commits a microtask later, so a synchronous read in the same turn sees the old value; values must travel in the announcing event's detail instead.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
