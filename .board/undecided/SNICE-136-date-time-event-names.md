---
id: SNICE-136
title: "normalize date and time picker events"
epic: events
priority: 136
created: 2026-07-14
deps: []
---

## Goal
Decide one coherent event vocabulary for date-picker, date-range-picker, date-time-picker, time-picker, and calendar selection.

## Notes
- Audit found datepicker/daterange/datetimepicker/timepicker naming inconsistencies.
- The contract must distinguish partial typing, valid value changes, range completion, clear, open/close, and commit.

## Acceptance criteria
- [ ] all current event names/details are inventoried and mapped to one consistent vocabulary
- [ ] native input/change behavior, component-specific semantic events, programmatic changes, validity, and cancellation are explicit
- [ ] if accepted, aliases, docs, types, React, metadata, source/built/browser tests, and eventual removal policy are complete

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
