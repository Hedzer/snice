---
id: SNICE-017
title: "honor disabled fieldsets in button"
epic: forms
priority: 17
created: 2026-07-14
deps: []
---

## Goal
Make a form-associated Snice button inherit disabled state and activation suppression from its form and ancestor fieldset.

## Notes
- Affected implementation: `packages/components/src/button/snice-button.ts`; no form-disabled callback is present.
- Navigation, submit, reset, and ordinary button modes all need the same effective-disabled calculation.

## Acceptance criteria
- [ ] disabled fieldsets suppress pointer, keyboard, form, and navigation activation while preserving authored disabled state
- [ ] moving the button between fieldsets/forms updates immediately without overwriting the public property
- [ ] real-browser tests cover nested fieldsets, first-legend exceptions where applicable, reconnect, and all button types

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
