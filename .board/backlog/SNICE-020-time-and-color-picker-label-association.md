---
id: SNICE-020
title: "expose native labels for time and color pickers"
epic: forms
priority: 20
created: 2026-07-14
deps: []
---

## Goal
Make time-picker and color-picker honor external labels and expose one coherent accessible name.

## Notes
- Audit found label-association gaps in both composite picker controls.
- Affected implementations: `packages/components/src/time-picker/snice-time-picker.ts` and `color-picker/snice-color-picker.ts`.

## Acceptance criteria
- [ ] associated labels focus the correct interactive target and ElementInternals reports the expected labels
- [ ] popover/swatch affordances do not create duplicate or unnamed form fields
- [ ] real-browser accessibility tests cover explicit, wrapping, dynamic, helper/error, and disabled cases

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
