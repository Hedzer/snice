---
id: SNICE-068
title: "render Gantt task dependencies"
epic: behavior
priority: 68
created: 2026-07-14
deps: []
---

## Goal
Make task `dependencies` and `showDependencies` produce usable dependency visualization or remove the inert API intentionally.

## Notes
- A browser probe found no dependency markup for tasks that declare dependencies.
- Affected implementation: `packages/components/src/gantt/snice-gantt.ts` and CSS.

## Acceptance criteria
- [ ] valid dependencies render deterministically across groups, zoom levels, scrolling, resizing, and date changes
- [ ] missing, duplicate, cyclic, hidden, and out-of-range dependencies have documented behavior and accessible alternatives
- [ ] tests assert geometry/semantics and toggle behavior in source, built, story, and all-browser paths

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
