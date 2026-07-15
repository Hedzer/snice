---
id: SNICE-050
title: "preserve authored drawer inline state across breakpoints"
epic: behavior
priority: 50
created: 2026-07-14
deps: []
---

## Goal
Stop responsive breakpoint handling from overwriting an explicitly configured `inline` value.

## Notes
- A real-browser probe confirmed `inline=true` was destroyed by a breakpoint transition.
- Affected implementation: `packages/components/src/drawer/snice-drawer.ts`.
- Responsive effective state must be distinct from the public authored property.

## Acceptance criteria
- [ ] authored state, attribute reflection, and responsive effective state have separate documented semantics
- [ ] crossing breakpoints repeatedly never destroys the caller's value or emits false user-state changes
- [ ] browser tests cover property/attribute updates before and after connection at both breakpoint sides

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
