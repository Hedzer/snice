---
id: SNICE-058
title: "make select maxHeight affect the popup"
epic: behavior
priority: 58
created: 2026-07-14
deps: []
---

## Goal
Make the documented `maxHeight` property control option-list sizing or intentionally remove the inert API.

## Notes
- The source property defaults to `200px`, while CSS fixes the popup height at `12.5rem` and does not consume it.
- Affected implementation: `packages/components/src/select/snice-select.ts` and CSS.

## Acceptance criteria
- [ ] valid values visibly constrain the list in native/fallback placement and invalid values have defined handling
- [ ] runtime updates, viewport collision, virtual/remote options, and CSS overrides interact predictably
- [ ] unit and browser tests assert computed layout rather than property reflection alone

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
