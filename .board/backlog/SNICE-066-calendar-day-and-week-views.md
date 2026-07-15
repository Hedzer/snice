---
id: SNICE-066
title: "make calendar day and week views real"
epic: behavior
priority: 66
created: 2026-07-14
deps: []
---

## Goal
Implement meaningfully distinct `day` and `week` calendar views or remove those advertised values through an intentional API decision.

## Notes
- A browser probe found `view='day'` still rendering seven headers and 42 month cells.
- Affected implementation: `packages/components/src/calendar/snice-calendar.ts`.
- Navigation labels, event layout, selection, keyboard movement, and range visibility must follow each view.

## Acceptance criteria
- [ ] month, week, and day have documented cell ranges, headings, navigation steps, keyboard behavior, and event layout
- [ ] view changes preserve or intentionally normalize the focused/selected date without stale DOM
- [ ] unit, story, docs, and all-browser tests assert actual rendered ranges and interactions for every view

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
