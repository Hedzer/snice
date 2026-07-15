---
id: SNICE-026
title: "restore grid observers after reconnection"
epic: lifecycle
priority: 26
created: 2026-07-14
deps: []
---

## Goal
Make grid fully operational after it is removed from and reinserted into the document.

## Notes
- A real-browser probe confirmed the ResizeObserver is absent after reinsertion.
- Affected implementation: `packages/components/src/grid/snice-grid.ts`.

## Acceptance criteria
- [ ] all observer and pointer setup is recreated exactly once on every connection and removed exactly once on disconnection
- [ ] layout, resize, drag, transition, and dynamic-item behavior after reconnect matches a fresh instance
- [ ] browser tests repeat remove/reinsert cycles and assert observer counts, behavior, events, and no leaked global listeners

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
