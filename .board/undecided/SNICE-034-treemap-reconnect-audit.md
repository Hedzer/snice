---
id: SNICE-034
title: "verify treemap reconnection safety"
epic: lifecycle
priority: 34
created: 2026-07-14
deps: []
---

## Goal
Determine whether treemap restores resize and dynamically attached drill controls after reconnection.

## Notes
- Source audit found a one-shot ResizeObserver plus imperative per-render listeners.
- Affected implementation: `packages/components/src/treemap/snice-treemap.ts`.

## Acceptance criteria
- [ ] browser characterization covers resize, drilldown, breadcrumb controls, data replacement, reconnect, and repeats
- [ ] accepted fixes prevent stale controls, duplicate actions, and observer loss
- [ ] listener/observer counts and rendered output are asserted for source and built artifacts

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
