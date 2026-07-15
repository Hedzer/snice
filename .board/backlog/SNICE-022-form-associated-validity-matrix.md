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
- [ ] every documented constraint maps to the correct ValidityState flags and a useful validation anchor/message
- [ ] checkValidity, reportValidity, form submission, aria-invalid, helper/error text, disabled, readonly, and custom validity agree
- [ ] source and real-browser contract tests cover every control, every constraint, clearing, dynamic rules, and form ownership

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
