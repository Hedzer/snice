---
id: SNICE-147
title: "share strict localized date and time formatting"
epic: dx
priority: 147
created: 2026-07-14
deps: []
---

## Goal
Decide whether calendar and picker components should share one strict canonical-value and Intl-based display foundation.

## Notes
- Audit found duplicated parser/formatter logic and impossible-date normalization risk across date-picker, date-range-picker, and date-time-picker.
- Canonical submitted ISO-like values must remain separate from localized display strings.
- This card does not propose a string-evaluated template language or hidden global locale.

## Acceptance criteria
- [ ] a concrete design covers locale, calendar assumptions, numbering, date order, 12/24-hour time, time zones, strict parsing, canonical form values, and messages
- [ ] calendar, date, range, date-time, and time components map to shared versus intentionally distinct behavior
- [ ] if accepted, exhaustive locale/boundary/browser tests land before deduplicating implementation

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
