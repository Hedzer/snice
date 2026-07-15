---
id: SNICE-056
title: "restore open popover state after reconnection"
epic: lifecycle
priority: 56
created: 2026-07-14
deps: []
---

## Goal
Make an open popover restore positioning, scroll/resize listeners, and native popover state after remove/reinsert.

## Notes
- Source audit found disposal removes positioning listeners and reconnect does not fully replay open-state setup.
- Affected implementation: `packages/components/src/popover/snice-popover.ts`.

## Acceptance criteria
- [ ] reconnected closed and open popovers behave exactly like fresh instances with the same public state
- [ ] native and fallback modes restore visibility, placement, listeners, focus policy, and dismissal once
- [ ] all-browser tests cover reconnect while open/closed, detached scroll/resize, trigger replacement, and repeated cycles

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
