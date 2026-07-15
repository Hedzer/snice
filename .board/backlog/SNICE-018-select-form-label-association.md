---
id: SNICE-018
title: "expose native label association for select"
epic: forms
priority: 18
created: 2026-07-14
deps: []
---

## Goal
Make external labels and accessible-name calculation work predictably for form-associated select.

## Notes
- Audit found incomplete label association for the composite select control.
- Affected implementation: `packages/components/src/select/snice-select.ts` and its focus target.

## Acceptance criteria
- [ ] clicking an associated `<label for>` focuses or activates the documented target
- [ ] ElementInternals labels, accessible name, helper text, and errors compose without duplicate announcements
- [ ] browser accessibility tests cover explicit, wrapping, multiple, dynamic, and absent labels

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
