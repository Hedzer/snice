---
id: SNICE-106
title: "make file-gallery add, actions, and drop zone keyboard operable"
epic: accessibility
priority: 106
created: 2026-07-14
deps: []
---

## Goal
Provide keyboard-accessible add-file, item actions, selection, and drop-zone alternatives.

## Notes
- Audit identified pointer-only add/custom action/drop-zone surfaces in `packages/components/src/file-gallery/`.
- Safe metadata rendering is tracked separately in SNICE-002.

## Acceptance criteria
- [ ] every action has a semantic control, visible focus, accessible name, disabled/loading state, and keyboard activation
- [ ] drag/drop has an equivalent file-picker path and item/grid navigation is documented
- [ ] browser tests cover keyboard-only upload/action/removal, errors, custom actions, focus retention, and exact events

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
