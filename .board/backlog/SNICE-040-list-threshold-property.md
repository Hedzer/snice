---
id: SNICE-040
title: "make list threshold control observation"
epic: behavior
priority: 40
created: 2026-07-14
deps: []
---

## Goal
Make the public list `threshold` property affect infinite-scroll observation or remove the inert API through an intentional compatibility decision.

## Notes
- The public default is `0.5`, but `packages/components/src/list/snice-list.ts` constructs IntersectionObserver with a hard-coded `0.01`.
- Stories, docs, types, source, and built metadata must agree on the final contract.

## Acceptance criteria
- [ ] valid threshold values produce observable boundary behavior and invalid values have documented handling
- [ ] runtime changes rebuild observation without duplicate loads or lost state
- [ ] unit and real-browser tests assert multiple thresholds rather than only property reflection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
