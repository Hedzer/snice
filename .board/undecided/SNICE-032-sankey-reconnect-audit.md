---
id: SNICE-032
title: "verify sankey reconnection safety"
epic: lifecycle
priority: 32
created: 2026-07-14
deps: []
---

## Goal
Determine whether sankey resumes responsive layout after remove/reinsert cycles.

## Notes
- Source audit found ResizeObserver construction in `@ready` and disconnection in `@dispose`.
- Affected implementation: `packages/components/src/sankey/snice-sankey.ts`.

## Acceptance criteria
- [ ] browser characterization covers reconnect, detached resize, data changes, and repeated cycles
- [ ] accepted fixes restore one observer and exact fresh-instance rendering
- [ ] tests assert no stale or duplicate observer callbacks

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
