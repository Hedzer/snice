---
id: SNICE-021
title: "restore authored defaults on form reset"
epic: forms
priority: 21
created: 2026-07-14
deps: []
---

## Goal
Audit every form-associated component and make reset restore its authored default state rather than a hard-coded empty value.

## Notes
- Several existing reset callbacks assign `false`, empty strings, or initial implementation values instead of tracking defaults.
- Affected family includes checkbox, radio, input, textarea, select, tag-input, color-picker, step-input, switch, range-slider, slider, and file-upload.
- This is a shared contract ticket; component-specific failures remain separately reviewable.

## Acceptance criteria
- [ ] each control defines property, attribute, and default-state semantics that match its nearest native analogue
- [ ] reset after user and programmatic changes restores the current authored default without spurious user events
- [ ] a real-browser matrix covers default mutations before/after connection, repeated resets, form moves, and state restoration

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
