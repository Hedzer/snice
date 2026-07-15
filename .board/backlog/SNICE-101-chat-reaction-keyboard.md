---
id: SNICE-101
title: "make chat reactions keyboard operable"
epic: accessibility
priority: 101
created: 2026-07-14
deps: []
---

## Goal
Make existing reactions and add-reaction controls named, focusable, and activatable by keyboard.

## Notes
- Audit identified pointer-only reaction surfaces in `packages/components/src/chat/`.

## Acceptance criteria
- [ ] reaction buttons expose emoji meaning, count, pressed-by-current-user state, and disabled/loading state
- [ ] keyboard activation, picker opening, message rerender, optimistic failure, and focus retention are deterministic
- [ ] browser tests cover screen-readable names, exact event counts, dynamic reactions, and no nested controls

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
