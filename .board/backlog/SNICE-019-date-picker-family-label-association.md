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
- [ ] explicit and wrapping labels activate the intended field without opening unrelated UI
- [ ] group versus individual field names are unambiguous for range and date-time controls
- [ ] browser accessibility tests cover labels, descriptions, errors, required state, and dynamic updates for all three controls

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
