---
id: SNICE-152
title: "add declarative segmented-control options"
epic: dx
priority: 152
created: 2026-07-14
deps: []
---

## Goal
Decide how segmented-control accepts authored option children alongside object data.

## Notes
- Audit identified segmented-control as a dual-API candidate.
- Children must compose with native form, selection, keyboard navigation, indicator sizing, disabled state, and reconnection.

## Acceptance criteria
- [ ] child option vocabulary, name/value/label, selection precedence, mutation, form value, and event semantics are defined
- [ ] property and child modes share one accessible radiogroup or accepted selection pattern
- [ ] if accepted, all public surfaces and all-browser tests cover both modes and reconnect behavior

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
