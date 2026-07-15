---
id: SNICE-010
title: "complete checkbox native form participation"
epic: forms
priority: 10
created: 2026-07-14
deps: []
---

## Goal
Make checked checkbox values, required validity, reset defaults, and fieldset-disabled state behave like a native checkbox.

## Notes
- A real-browser probe found a checked named checkbox absent from `FormData` and a required unchecked checkbox did not invalidate its form.
- Affected implementation: `packages/components/src/checkbox/snice-checkbox.ts`.
- The current reset callback clears state instead of restoring the authored default.

## Acceptance criteria
- [ ] successful-control contribution, configurable value, required validity, form reporting, reset, restore, and disabled fieldset behavior match the documented native model
- [ ] input/change/custom events fire only for user-observable state transitions with stable ordering
- [ ] browser tests cover name removal, defaultChecked changes, indeterminate state, programmatic changes, reset, disabled fieldsets, and repeated connection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
