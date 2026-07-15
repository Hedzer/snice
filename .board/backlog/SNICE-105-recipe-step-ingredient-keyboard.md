---
id: SNICE-105
title: "make recipe ingredients and steps keyboard operable"
epic: accessibility
priority: 105
created: 2026-07-14
deps: []
---

## Goal
Give checkable/actionable recipe ingredients and steps semantic controls and keyboard parity.

## Notes
- Audit identified pointer-only ingredient/step interaction in `packages/components/src/recipe/`.

## Acceptance criteria
- [ ] static text and checkable/actionable items expose distinct semantics with checked/current/completed state
- [ ] keyboard activation, focus order, reset, dynamic data, nested links, and event detail are deterministic
- [ ] browser tests cover keyboard-only progress, visible focus, names, states, and persistence if supported

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
