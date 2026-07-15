---
id: SNICE-100
title: "make camera-annotate swatches keyboard operable"
epic: accessibility
priority: 100
created: 2026-07-14
deps: []
---

## Goal
Give annotation colors/tools the same semantic keyboard selection behavior as pointer users receive.

## Notes
- Audit identified pointer-only swatches in `packages/components/src/camera-annotate/`.
- Camera permission must still require intentional user action under project policy.

## Acceptance criteria
- [ ] tools/colors expose names, selected state, visible focus, disabled state, and deterministic keyboard selection
- [ ] mode changes, permission failure, custom colors, undo/clear, and canvas focus do not strand focus
- [ ] browser tests cover keyboard-only annotation setup, forced colors, and event parity

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
