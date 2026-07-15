---
id: SNICE-033
title: "verify segmented-control reconnection safety"
epic: lifecycle
priority: 33
created: 2026-07-14
deps: []
---

## Goal
Determine whether segmented-control restores its indicator observer and interactions after reconnection.

## Notes
- Source audit found ResizeObserver setup in `@ready` and teardown in `@dispose`.
- Affected implementation: `packages/components/src/segmented-control/snice-segmented-control.ts`.

## Acceptance criteria
- [ ] browser characterization covers reconnect, selection while detached, slot changes, resize, keyboard use, and repeats
- [ ] accepted fixes restore exact indicator placement without duplicate callbacks
- [ ] source and built paths share the reconnect regression

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
