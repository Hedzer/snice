---
id: SNICE-024
title: "use strict parsing in date-range-picker"
epic: forms
priority: 24
created: 2026-07-14
deps: []
---

## Goal
Apply impossible-date and canonical-range validation to both ends of date-range-picker.

## Notes
- The range picker contains parser logic similar to the browser-confirmed date-picker rollover path.
- Affected implementation: `packages/components/src/date-range-picker/snice-date-range-picker.ts`.
- This ticket requires a direct real-browser reproduction before implementation if the shared path has changed.

## Acceptance criteria
- [ ] each endpoint is strictly validated before range ordering and min/max checks
- [ ] invalid, partial, reversed, same-day, leap-day, and boundary ranges have stable values and messages
- [ ] tests prove no endpoint can roll over or mutate the other endpoint silently

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
