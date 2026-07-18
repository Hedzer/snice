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
- The range picker contained parser logic similar to the browser-confirmed date-picker rollover path.
- Affected implementation: `packages/components/src/date-range-picker/snice-date-range-picker.ts`.
- The takeover browser probe reproduced `02/31/2026` as submitted/displayed `2026-03-03` in Chromium, Firefox, and WebKit before the fix.

## Acceptance criteria
- [x] each endpoint is strictly validated before range ordering and min/max checks
- [x] invalid, partial, reversed, same-day, leap-day, and boundary ranges have stable values and messages
- [x] tests prove no endpoint can roll over or mutate the other endpoint silently

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-18: replaced timestamp-existence parsing with local calendar-field round trips while preserving all seven formats, alternate numeric separators, raw live/default/restored strings, canonical two-field submission, reversed assignment semantics, and selection convenience.
- 2026-07-18: added adversarial unit and real-customer browser tables for every month end, Gregorian century leap rules, both endpoints, same-day/reversed ranges, min/max, reset, restoration, and impossible presets; 274 source and 274 built date-family tests plus the 54-case source/built/CDN cross-browser matrix passed.
- 2026-07-18: updated package, human, and AI documentation to state the strict parsing and invalid-endpoint contracts.
- 2026-07-18: complete repository gate passed with 8,043 source tests, 8,043 built tests, 93.4% core-engine coverage, 1,231 React tests, 474 framework browser cases, and 54 deployed-website cases in 237.38 seconds.
