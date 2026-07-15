---
id: SNICE-075
title: "use virtual-scroller estimatedItemHeight"
epic: behavior
priority: 75
created: 2026-07-14
deps: []
---

## Goal
Make `estimatedItemHeight` drive initial range, offsets, and scroll extent or remove the inert property.

## Notes
- Source audit found the public property declared but unused.
- Affected implementation: `packages/components/src/virtual-scroller/snice-virtual-scroller.ts`.

## Acceptance criteria
- [ ] different valid estimates produce correct initial virtualization without changing final item order
- [ ] runtime changes, zero/invalid values, resize, scroll anchoring, and large lists have defined behavior
- [ ] tests assert rendered ranges, spacer sizes, scroll positions, and performance boundaries

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
