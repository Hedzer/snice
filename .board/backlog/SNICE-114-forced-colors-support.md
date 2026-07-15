---
id: SNICE-114
title: "support forced-colors mode"
epic: accessibility
priority: 114
created: 2026-07-14
deps: []
---

## Goal
Keep controls, states, focus, charts, and interactive surfaces perceivable in forced-colors/high-contrast environments.

## Notes
- Audit found no component-level forced-colors rules.
- Native system colors and semantic borders should be preferred over preserving decorative branding.

## Acceptance criteria
- [ ] interactive boundaries, focus, selection, invalid/disabled state, icons, and non-color chart distinctions remain perceivable
- [ ] components do not disable forced color adjustment without a documented necessity and equivalent affordance
- [ ] browser-supported forced-colors fixtures and static assertions cover representative controls, overlays, and visualizations

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
