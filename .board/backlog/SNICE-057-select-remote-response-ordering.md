---
id: SNICE-057
title: "ignore stale remote select responses"
epic: async
priority: 57
created: 2026-07-14
deps: []
---

## Goal
Ensure obsolete remote search responses cannot overwrite newer select results or state.

## Notes
- Source audit found no request sequence or cancellation guard in async select loading.
- Affected implementation: `packages/components/src/select/snice-select.ts`.

## Acceptance criteria
- [ ] only the newest compatible query may commit options, selection reconciliation, loading, and errors
- [ ] typing, clearing, closing, reopening, disconnect, rejection, abort, and identical-query reuse have explicit outcomes
- [ ] deterministic tests resolve requests in every adversarial order across source, built, CDN, and browser paths

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
