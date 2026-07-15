---
id: SNICE-125
title: "add container, RTL, motion, contrast, and theme fixtures"
epic: quality
priority: 125
created: 2026-07-14
deps: []
---

## Goal
Exercise cross-cutting component behavior under the environmental modes the project promises.

## Notes
- Current audit found weak coverage for container widths, RTL, no-theme, reduced motion, forced colors, and focus visibility.
- Component-specific fixes remain in their own tickets; this card owns reusable test infrastructure and representative matrix selection.

## Acceptance criteria
- [ ] fixtures can deterministically vary container width, direction, theme presence/mode, motion preference, forced colors where supported, and keyboard modality
- [ ] the matrix covers every component family and every known cross-cutting risk without combinatorial test explosion
- [ ] source and fresh built artifacts run in supported browsers with stable semantic/computed-style assertions

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
