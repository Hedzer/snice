---
id: SNICE-019
title: "expose native labels for the date-picker family"
epic: forms
priority: 19
created: 2026-07-14
deps: []
---

## Goal
Give date-picker, date-range-picker, and date-time-picker correct external-label and accessible-name behavior.

## Notes
- Audit found the composite date controls do not provide a complete label association story.
- Affected implementations: `packages/components/src/date-picker/`, `date-range-picker/`, and `date-time-picker/`.

## Acceptance criteria
- [x] explicit and wrapping labels activate the intended field without opening unrelated UI
- [x] group versus individual field names are unambiguous for range and date-time controls
- [x] browser accessibility tests cover labels, descriptions, errors, required state, and dynamic updates for all three controls

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: implemented explicit, wrapping, multiple, dynamic, moved, and reconnected label association through the shared form-label bridge, including WebKit label activation behavior and inert disabled dropdown/inline controls.
- 2026-07-16: gave date ranges one field name plus a distinct calendar name; gave date-time panels, calendars, hours, minutes, seconds, period, and day buttons unambiguous accessible names.
- 2026-07-16: connected helper/error descriptions exactly once, made errors alerts, preserved required/invalid semantics, and documented the complete contract in human docs, AI docs, package references, Storybook, and public full showcases.
- 2026-07-16: verified unit/type builds, source/distribution/CDN behavior, Chromium/Firefox/WebKit label matrices, customer form paths, Storybook/static builds, responsive themes, console cleanliness, and mobile/desktop visuals.
