---
id: SNICE-016
title: "complete key-value form lifecycle"
epic: forms
priority: 16
created: 2026-07-14
deps: []
---

## Goal
Define a stable submission representation and complete form-associated lifecycle for key-value.

## Notes
- The component is form-associated but lacks the standard reset, disabled, restore, and validity callbacks.
- Affected implementation: `packages/components/src/key-value/snice-key-value.ts`.
- Serialization must not lose duplicate keys or silently accept malformed rows.

## Acceptance criteria
- [ ] the public contract defines exact successful-control serialization and validation rules
- [ ] reset/default, restore, required/invalid rows, disabled fieldsets, add/remove, and reorder behavior are correct
- [ ] browser tests round-trip empty, duplicate, Unicode, malformed, and large sets through real `FormData`

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
