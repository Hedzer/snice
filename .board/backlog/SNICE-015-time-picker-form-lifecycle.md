---
id: SNICE-015
title: "complete time-picker form lifecycle"
epic: forms
priority: 15
created: 2026-07-14
deps: []
---

## Goal
Complete time-picker submission, validity, reset, restore, and fieldset-disabled behavior.

## Notes
- The component is form-associated but does not implement the complete native lifecycle.
- Affected implementation: `packages/components/src/time-picker/snice-time-picker.ts`.

## Acceptance criteria
- [ ] canonical submitted values and step/min/max/required validity are defined and enforced
- [ ] authored defaults return on reset and fieldset disablement blocks every interaction path
- [ ] browser tests cover keyboard entry, picker changes, seconds, boundaries, clear, reset, and reconnect

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
