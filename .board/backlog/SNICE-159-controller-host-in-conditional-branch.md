---
id: SNICE-159
title: "controller-host-in-conditional-branch"
epic: quality
priority: 159
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a `controller=${...}` binding on an element with an `<if>`/`<when>`/`<case>` ancestor in the same template.

## Notes
- Branch DOM parks/restores, so the controller detaches and re-attaches and re-fires its initial load on every toggle; the element also doesn't exist in the idle state, so deep links can't load.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
