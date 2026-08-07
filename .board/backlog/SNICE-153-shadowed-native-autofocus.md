---
id: SNICE-153
title: "shadowed-native-autofocus"
epic: quality
priority: 153
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a project-defined `autofocus*` attribute/property on a custom element or a `.autofocus=${...}` property binding, pointing at `?autofocus=${...}` as the working form.

## Notes
- Snice reads `hasAttribute('autofocus')` and jsdom implements no autofocus property, so `.autofocus=` no-ops in tests; `?autofocus=${...}` is the working form.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
