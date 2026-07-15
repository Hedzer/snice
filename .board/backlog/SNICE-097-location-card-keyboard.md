---
id: SNICE-097
title: "make clickable location cards keyboard operable"
epic: accessibility
priority: 97
created: 2026-07-14
deps: []
---

## Goal
Give an actionable location card one semantic activation target with keyboard parity.

## Notes
- Audit identified pointer-only card activation in `packages/components/src/location/snice-location.ts`.
- Navigation safety is tracked separately in SNICE-008.

## Acceptance criteria
- [ ] static and actionable cards expose different semantics with no nested-interactive conflict
- [ ] Enter/Space or native link behavior, visible focus, disabled state, nested controls, and events are deterministic
- [ ] all-browser tests prove keyboard/pointer parity and one navigation per activation

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
