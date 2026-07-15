---
id: SNICE-023
title: "reject impossible dates in date-picker"
epic: forms
priority: 23
created: 2026-07-14
deps: []
---

## Goal
Parse date-picker input strictly so impossible calendar dates are invalid instead of silently rolling into another month.

## Notes
- A real-browser probe showed `02/31/2026` normalize to `2026-03-03`.
- Affected implementation: `packages/components/src/date-picker/snice-date-picker.ts`.

## Acceptance criteria
- [ ] accepted display input round-trips to the same calendar date and impossible dates remain invalid
- [ ] leap years, month lengths, locale separators, partial input, min/max, and timezone boundaries are explicit
- [ ] unit and real-browser tests cover exhaustive boundary tables and prove no JavaScript Date rollover leaks into accepted values

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
