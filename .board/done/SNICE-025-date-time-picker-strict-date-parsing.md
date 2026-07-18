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
- [x] date and time portions validate independently before forming a canonical value
- [x] invalid dates, 24-hour boundaries, seconds, partial input, DST-sensitive display, min, and max are explicit
- [x] unit and browser tests prove strict behavior for typed, picked, programmatic, reset, and restored values

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-18: takeover audit confirmed strict date/time-part parsing, added exhaustive month/leap/format/12-hour/24-hour/seconds/DST/constraint/reset/restoration coverage, aligned package/human/AI docs, and verified source, built ESM, and CDN behavior in Chromium, Firefox, and WebKit.
- 2026-07-18: complete repository gate passed with 8,043 source tests, 8,043 built tests, 93.4% core-engine coverage, 1,231 React tests, 474 framework browser cases, and 54 deployed-website cases in 237.38 seconds.
