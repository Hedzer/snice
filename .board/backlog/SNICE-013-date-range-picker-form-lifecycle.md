---
id: SNICE-013
title: "complete date-range-picker form lifecycle"
epic: forms
priority: 13
created: 2026-07-14
deps: []
---

## Goal
Define and implement a complete native form contract for date-range-picker.

## Notes
- The component is form-associated but lacks the complete reset, disabled, restore, and validity lifecycle.
- Affected implementation: `packages/components/src/date-range-picker/snice-date-range-picker.ts`.
- The submitted representation for start/end must be explicit and stable.

## Acceptance criteria
- [ ] the component documents and submits one unambiguous canonical range representation
- [ ] partial, reversed, out-of-bounds, and required ranges set correct validity without silently normalizing bad input
- [ ] browser tests cover default restoration, form reset, fieldset disablement, clear, dynamic constraints, and reconnect

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
