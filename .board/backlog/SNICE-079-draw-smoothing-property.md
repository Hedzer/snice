---
id: SNICE-079
title: "make draw smoothing configurable"
epic: behavior
priority: 79
created: 2026-07-14
deps: []
---

## Goal
Use the public `smoothing` value in stroke processing instead of a hard-coded pass count, or remove the inert API.

## Notes
- Source audit found `smoothing` declared while processing uses a hard-coded four iterations.
- Affected implementation: `packages/components/src/draw/snice-draw.ts`.

## Acceptance criteria
- [ ] valid smoothing values map to documented stroke behavior with bounded cost and invalid values are handled explicitly
- [ ] runtime changes affect only the intended strokes and exports/replay remain deterministic
- [ ] tests compare full point/path data for zero, boundary, typical, and adversarial inputs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
