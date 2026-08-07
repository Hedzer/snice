---
id: SNICE-165
title: "recommend-exemption-channel"
epic: quality
priority: 165
created: 2026-08-07
deps: []
---

## Goal
Not a rule but an escape hatch: give the `recommend-*` rules a way to record "evaluated, rejected, here's why" — honor a suppression comment, or let the rule see a prebuilt of that family already present in the same template.

## Notes
- `recommend-table`/`recommend-tabs` fire on every hand-rolled table/tab region with no way to record a considered rejection, so legitimate hand-rolled regions produce permanent noise.
- From the external 7.4.0 field report; the checker lives in `bin/project-analyzer.js` (rules) and `bin/snice.js` (CLI).

## Acceptance criteria
- [ ] a suppression comment (or in-template prebuilt detection) silences the recommendation with a recorded rationale
- [ ] fixture has a red case and a clean counterexample
- [ ] focused checker tests pass

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
