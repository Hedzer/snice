---
id: SNICE-025
title: "use strict parsing in date-time-picker"
epic: forms
priority: 25
created: 2026-07-14
deps: []
---

## Goal
Reject impossible date and time parts in date-time-picker without JavaScript normalization.

## Notes
- The date-time picker duplicates parsing patterns related to the confirmed date-picker rollover bug.
- Affected implementation: `packages/components/src/date-time-picker/snice-date-time-picker.ts`.

## Acceptance criteria
- [ ] date and time portions validate independently before forming a canonical value
- [ ] invalid dates, 24-hour boundaries, seconds, partial input, DST-sensitive display, min, and max are explicit
- [ ] unit and browser tests prove strict behavior for typed, picked, programmatic, reset, and restored values

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
