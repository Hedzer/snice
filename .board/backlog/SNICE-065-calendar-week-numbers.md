---
id: SNICE-065
title: "implement calendar week numbers"
epic: behavior
priority: 65
created: 2026-07-14
deps: []
---

## Goal
Make `showWeekNumbers` visibly and accessibly render correct week numbers or remove the advertised property intentionally.

## Notes
- A browser probe rendered zero week-number cells with the property enabled.
- Affected implementation: `packages/components/src/calendar/snice-calendar.ts`.

## Acceptance criteria
- [ ] the week-number system, locale rules, year boundaries, and accessible labels are documented
- [ ] runtime toggles update layout without breaking selection, events, or responsive sizing
- [ ] tests cover year transitions, first-week rules, all supported views, source/built output, and browser rendering

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
