---
id: SNICE-096
title: "make org-chart nodes and toggles keyboard operable"
epic: accessibility
priority: 96
created: 2026-07-14
deps: []
---

## Goal
Provide semantic, keyboard-accessible org-chart selection and expand/collapse controls.

## Notes
- Audit identified pointer-only node/toggle behavior in `packages/components/src/org-chart/`.

## Acceptance criteria
- [ ] node selection and disclosure are distinct controls/states with a documented tree/navigation pattern
- [ ] Arrow keys, Home/End where applicable, Enter/Space, focus retention, collapse, and dynamic hierarchy work
- [ ] browser tests assert roles, levels, expanded state, names, focus order, events, and non-pointer use

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
