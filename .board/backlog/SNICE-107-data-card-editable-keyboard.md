---
id: SNICE-107
title: "make editable data-card values keyboard operable"
epic: accessibility
priority: 107
created: 2026-07-14
deps: []
---

## Goal
Allow keyboard users to enter, commit, cancel, and move through editable data-card values.

## Notes
- Audit identified pointer-only editable values in `packages/components/src/data-card/`.

## Acceptance criteria
- [ ] editable and read-only values expose distinct semantics, names, focus, edit state, and instructions
- [ ] Enter/Space, Escape, Tab, validation failure, async save if supported, rerender, and nested links/actions are deterministic
- [ ] browser tests cover keyboard-only edit cycles, focus restoration, errors, events, and no accidental navigation

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
