---
id: SNICE-052
title: "replace time-based drawer event suppression"
epic: events
priority: 52
created: 2026-07-14
deps: []
---

## Goal
Emit every legitimate drawer state transition exactly once without suppressing rapid valid changes by elapsed time.

## Notes
- Source audit found time-based deduplication that can hide real state changes.
- Affected implementation: `packages/components/src/drawer/snice-drawer.ts`.

## Acceptance criteria
- [ ] event emission is derived from actual transition identity rather than a time window
- [ ] rapid open/close/toggle, breakpoint changes, property reflection, cancellation, animation completion, and reconnect have deterministic events
- [ ] tests assert names, detail, order, bubbles/composed flags, and exact counts under fake and real time

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
