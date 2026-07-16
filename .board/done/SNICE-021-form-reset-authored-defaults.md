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
- [x] each control defines property, attribute, and default-state semantics that match its nearest native analogue
- [x] reset after user and programmatic changes restores the current authored default without spurious user events
- [x] a real-browser matrix covers default mutations before/after connection, repeated resets, form moves, and state restoration

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: separated live values from authored defaults for input, textarea, select, tag input, color picker, step input, switch, range slider, and slider; retained native empty defaults for file upload and the existing checkbox/radio contracts.
- 2026-07-16: implemented silent reset/state restoration, pre-upgrade property preservation, independent range endpoints, file/FormData restoration, form moves, and effective fieldset disabledness without rewriting authored state.
- 2026-07-16: updated human and AI references, public metadata, editor data, React adapters, CDN artifacts, and the permanent browser release matrix.
- 2026-07-16: release gate passed with 8,005 source tests, 8,005 built tests, 465 framework browser tests, 54 deployed-site tests, and 93.4% core statement coverage in 284.83 seconds.
