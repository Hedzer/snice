---
id: SNICE-158
title: "add declarative permission-matrix rows"
epic: dx
priority: 158
created: 2026-07-14
deps: []
---

## Goal
Decide how permission-matrix supports authored role/resource/permission children alongside object matrices.

## Notes
- Audit identified permission-matrix as a dual-API candidate.
- Large matrices, form behavior, keyboard grid navigation, and accessible labels constrain the design.

## Acceptance criteria
- [ ] a readable child vocabulary, keys, row/column derivation, value ownership, precedence, mutation, and events are concrete
- [ ] property data remains efficient for large/generated matrices while child markup is practical for authored cases
- [ ] if accepted, types, docs, stories, builds, adapters, and all-browser grid/accessibility tests cover both APIs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
