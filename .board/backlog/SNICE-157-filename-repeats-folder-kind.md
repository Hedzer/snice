---
id: SNICE-157
title: "filename-repeats-folder-kind"
epic: quality
priority: 157
created: 2026-08-07
deps: []
---

## Goal
Add a validate-only convention rule that flags filenames repeating their folder kind: `controllers/*-controller.*`, `services/*-service.*`, `guards/*-guard.*`.

## Notes
- The folder already states the kind, so the suffix is redundant noise in every import path.
- Convention violation from the external 7.4.0 field report that neither `tsc` nor `snice check` flagged; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] rule fires on the described shape with a message naming the fix
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
