---
id: SNICE-027
title: "restore tabs observers after reconnection"
epic: lifecycle
priority: 27
created: 2026-07-14
deps: []
---

## Goal
Make tabs recalculate and observe overflow correctly after document reconnection.

## Notes
- A real-browser probe confirmed the tabs ResizeObserver is absent after reinsertion.
- Affected implementation: `packages/components/src/tabs/snice-tabs.ts`.

## Acceptance criteria
- [ ] observer setup returns exactly once per connection and stale observers never survive disconnection
- [ ] selection, indicator, overflow controls, keyboard navigation, and resize behavior match a fresh element after reconnect
- [ ] browser tests cover repeated cycles, slot changes while detached, size changes, and listener/observer leak counts

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
