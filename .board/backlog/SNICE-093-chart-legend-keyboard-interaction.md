---
id: SNICE-093
title: "make chart legends keyboard operable"
epic: accessibility
priority: 93
created: 2026-07-14
deps: []
---

## Goal
Give every interactive chart legend item semantic controls, keyboard activation, visible focus, and announced state.

## Notes
- Audit found chart legend behavior available to pointer users without an equivalent keyboard path.
- Affected family starts with `packages/components/src/chart/` and any shared legend implementation.

## Acceptance criteria
- [ ] interactive legend entries are named controls with pressed/selected/hidden state and noninteractive legends are not fake controls
- [ ] Enter/Space, focus order, disabled series, dynamic series, and chart updates behave predictably
- [ ] all-browser tests cover keyboard-only toggling, focus visibility, ARIA state, events, and non-color indication

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
