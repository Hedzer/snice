---
id: SNICE-083
title: "make slider invalid state real"
epic: forms
priority: 83
created: 2026-07-14
deps: []
---

## Goal
Make slider `invalid` affect validity, styling, accessibility, and error messaging consistently.

## Notes
- A browser probe found no `aria-invalid` when `invalid` was set, while error text can display independently.
- Affected implementation: `packages/components/src/slider/snice-slider.ts` and CSS.

## Acceptance criteria
- [ ] invalid/custom validity, error text, helper text, ElementInternals, styles, and form reporting share one state model
- [ ] error content is announced once and does not show as an active error when the control is valid unless explicitly documented
- [ ] unit and browser tests cover programmatic invalid, constraint invalid, clearing, disabled, readonly, reset, and form submission

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
