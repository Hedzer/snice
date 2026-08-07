---
id: SNICE-149
title: "element-field-shadows-htmlelement"
epic: quality
priority: 149
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags an `@element` class field whose name collides with an HTMLElement member (`inert`, `title`, `hidden`, `slot`, `lang`, `dir`, `translate`, `role`, `autofocus`).

## Notes
- TS catches only the `private` case; a public field silently shadows the inherited member and corrupts built-in element behavior.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
