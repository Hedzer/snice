---
id: SNICE-012
title: "complete date-picker form lifecycle"
epic: forms
priority: 12
created: 2026-07-14
deps: []
---

## Goal
Implement native form value, reset/default, restore, disabled-fieldset, and validity behavior for date-picker.

## Notes
- The component is declared form-associated but does not implement the complete callback and validity contract.
- Affected implementation: `packages/components/src/date-picker/snice-date-picker.ts`.
- Display formatting must stay separate from the stable submitted value.

## Acceptance criteria
- [ ] valid dates submit in the documented canonical format and invalid/incomplete input does not masquerade as a valid value
- [ ] form reset restores the authored default and fieldset disablement updates interaction and accessibility state
- [ ] real-browser tests cover manual input, picker selection, clear, min/max/required, reset, restoration, and reconnect

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
