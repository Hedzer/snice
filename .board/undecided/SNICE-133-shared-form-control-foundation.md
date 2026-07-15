---
id: SNICE-133
title: "introduce a shared form-associated control foundation"
epic: dx
priority: 133
created: 2026-07-14
deps: []
---

## Goal
Decide whether Snice should centralize the native form contract that every form-associated control currently reimplements incompletely.

## Notes
- Candidate responsibilities: form value, authored default, reset/restore, effective disabled state, ElementInternals validity, external labels, aria descriptions, and native input/change event ordering.
- Individual confirmed failures remain in SNICE-010 through SNICE-025 and must not be hidden by this architecture card.
- The foundation must use platform ElementInternals and existing Snice decorators; it must not add two-way-binding syntax.

## Acceptance criteria
- [ ] a concrete API sketch demonstrates checkbox/radio, scalar input, range, picker, file, and multi-value controls without component-specific behavior leaking into the base
- [ ] inheritance, composition/controller, and small shared helpers are compared for public API, lifecycle, typing, tree-shaking, and migration risk
- [ ] if accepted, failing native-form browser contracts land first and every migrated control preserves its shipped public surface

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
