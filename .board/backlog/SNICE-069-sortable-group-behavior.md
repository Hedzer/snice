---
id: SNICE-069
title: "implement sortable group behavior"
epic: behavior
priority: 69
created: 2026-07-14
deps: []
---

## Goal
Make the public sortable `group` property support documented cross-container movement or remove the inert API.

## Notes
- Source audit found `group` exposed in types and stories but never read by the implementation.
- Affected implementation: `packages/components/src/sortable/snice-sortable.ts`.

## Acceptance criteria
- [ ] same-group and different-group rules, event detail, cancellation, DOM ownership, ordering, and data synchronization are explicit
- [ ] dynamic group changes, disabled containers, empty targets, nested sortables, and reconnect are deterministic
- [ ] source, built, story, and browser tests assert actual cross-container behavior rather than reflection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
