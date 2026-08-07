---
id: SNICE-151
title: "wrapper-input-attribute-value"
epic: quality
priority: 151
created: 2026-08-07
deps: []
---

## Goal
Add a checker rule that flags a component wrapping snice-input/snice-textarea that binds `value=${...}` as an ATTRIBUTE instead of `.value=${live(...)}`.

## Notes
- The attribute maps to defaultValue and only reaches live state while the field is pristine, so a touched field can never be re-seeded from outside.
- Real defect from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
