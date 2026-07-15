---
id: SNICE-104
title: "make Gantt tasks keyboard operable"
epic: accessibility
priority: 104
created: 2026-07-14
deps: []
---

## Goal
Make interactive Gantt task labels and bars focusable, identifiable, and activatable without a pointer.

## Notes
- Audit identified task names/bars as pointer-interactive surfaces in `packages/components/src/gantt/`.

## Acceptance criteria
- [ ] static and interactive tasks are distinct; interactive tasks expose names, dates, progress, dependencies, focus, and state
- [ ] keyboard navigation across visible tasks/groups and activation have documented behavior under zoom/scroll
- [ ] browser tests cover keyboard-only discovery, focus visibility, dynamic tasks, events, and a nonvisual data representation

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
