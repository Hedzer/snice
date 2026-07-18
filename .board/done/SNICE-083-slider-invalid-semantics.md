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
- [x] invalid/custom validity, error text, helper text, ElementInternals, styles, and form reporting share one state model
- [x] error content is announced once and does not show as an active error when the control is valid unless explicitly documented
- [x] unit and browser tests cover programmatic invalid, constraint invalid, clearing, disabled, readonly, reset, and form submission

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-18: unified slider constraint and custom-error validity with displayed invalid styling, `aria-invalid`, helper/error selection, one alert, useful validation anchoring, form blocking, clearing, reset, readonly, and disabled behavior.
- 2026-07-18: retained the library-wide authored `invalid` convention as an explicitly documented visual/accessibility override; native form invalidity is produced by constraints or `setCustomValidity()` rather than an inert presentation property.
- 2026-07-18: added unit, source/distribution/CDN browser, Storybook customer-form, deployed-showcase, responsive-theme, and documentation-alignment coverage.
- 2026-07-18: clean release gate passed with 8,097 source tests, 8,097 built tests, 1,231 React tests, 489 framework browser tests, 54 deployed-site tests, and 93.4% core statement coverage in 271.10 seconds.
