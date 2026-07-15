---
id: SNICE-011
title: "complete radio native form participation"
epic: forms
priority: 11
created: 2026-07-14
deps: []
---

## Goal
Make radio groups submit, validate, reset, disable, and coordinate selection like native radio controls.

## Notes
- A real-browser probe found a checked named radio absent from `FormData` and a required group remained valid.
- Affected implementation: `packages/components/src/radio/snice-radio.ts`.
- The contract must cover groups across light DOM and form owners without unchecking unrelated groups.

## Acceptance criteria
- [ ] one checked successful control contributes its configured value and required group validity matches native behavior
- [ ] selection, authored default restoration, disabled fieldsets, form ownership changes, and dynamic names are correct
- [ ] real-browser tests cover multiple forms, shadow hosts, insertion/removal, reset, no checked option, and keyboard selection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
