---
id: SNICE-022
title: "implement validity for every form-associated control"
epic: forms
priority: 22
created: 2026-07-14
deps: []
---

## Goal
Ensure all shipped form-associated controls use ElementInternals validity rather than exposing inert `required`, `invalid`, min/max, or pattern APIs.

## Notes
- Source audit found no component call to `ElementInternals.setValidity()` across the form-associated control set.
- Affected implementations are every `@element(..., { formAssociated: true })` component.
- Validity messages, anchors, custom errors, and form submission/reporting behavior need one explicit matrix.

## Acceptance criteria
- [x] every documented constraint maps to the correct ValidityState flags and a useful validation anchor/message
- [x] checkValidity, reportValidity, form submission, aria-invalid, helper/error text, disabled, readonly, and custom validity agree
- [x] source and real-browser contract tests cover every control, every constraint, clearing, dynamic rules, and form ownership

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-18: added a shared native-validity implementation and completed the validity, form-owner, labels, custom-error, reset, restore, disabled, readonly, loading, reconnect, focus, and event contracts across all 18 form-associated controls.
- 2026-07-18: added exhaustive source tests plus Chromium, Firefox, and WebKit customer matrices against source, fresh distribution, and CDN artifacts; public full showcases exercise every newly supported constraint.
- 2026-07-18: aligned human docs, AI docs, metadata, editor data, React adapters, public CDN bundles, Storybook, and the deployed website with the implemented contracts.
- 2026-07-18: clean release gate passed with 8,097 source tests, 8,097 built tests, 1,231 React tests, 489 framework browser tests, 54 deployed-site tests, and 93.4% core statement coverage in 271.10 seconds.
