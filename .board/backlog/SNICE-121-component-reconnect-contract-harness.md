---
id: SNICE-121
title: "add a reconnect lifecycle contract harness"
epic: quality
priority: 121
created: 2026-07-14
deps: []
---

## Goal
Systematically remove and reinsert every component that owns observers, timers, or global listeners and verify fresh-instance behavior.

## Notes
- Real-browser probes already confirmed reconnect defects in grid and tabs; source audit found similar patterns elsewhere.
- The harness must allow component-specific setup while sharing leak and repeat-cycle assertions.

## Acceptance criteria
- [ ] all components with observers, timers, media queries, document/window listeners, or native popover state are inventoried
- [ ] each test covers repeated connect/disconnect, state changes while detached, reconnect, exact callback counts, and final teardown
- [ ] source and built artifacts pass in all supported browsers without relying only on private field inspection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
