---
id: SNICE-014
title: "complete date-time-picker form lifecycle"
epic: forms
priority: 14
created: 2026-07-14
deps: []
---

## Goal
Make date-time-picker a predictable form-associated control with canonical values and native lifecycle behavior.

## Notes
- The component is form-associated but does not expose the complete callback and validity contract.
- Affected implementation: `packages/components/src/date-time-picker/snice-date-time-picker.ts`.

## Acceptance criteria
- [ ] date and time parts produce one documented canonical submitted value with strict validity
- [ ] reset, authored defaults, state restoration, disabled fieldsets, required, min, and max work end to end
- [ ] real-browser tests cover local-time edge cases, partial input, clearing, programmatic updates, and reconnect

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
