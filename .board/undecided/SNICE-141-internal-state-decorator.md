---
id: SNICE-141
title: "use internal reactive state instead of reflected private properties"
epic: dx
priority: 141
created: 2026-07-14
deps: []
---

## Goal
Decide where the framework's internal `@state` mechanism should replace private reflected `@property` fields.

## Notes
- Audit found no component `@state` usage and 36 private reflecting property fields, including high-frequency timer, countdown, terminal, and audio state.
- Private attributes intentionally consumed by CSS or external selectors must be identified rather than changed mechanically.

## Acceptance criteria
- [ ] every private reactive property is classified as internal-only, CSS-state, accessibility state, debugging surface, or accidentally public
- [ ] reflection cost, render behavior, styling alternatives, metadata exposure, and testability are measured on representative high-frequency components
- [ ] if accepted, migrations preserve observable DOM/API behavior and add regression/performance tests before broad rollout

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
