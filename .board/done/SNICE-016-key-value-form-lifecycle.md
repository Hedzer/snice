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
- [x] the public contract defines exact successful-control serialization and validation rules
- [x] reset/default, restore, required/invalid rows, disabled fieldsets, add/remove, and reorder behavior are correct
- [x] browser tests round-trip empty, duplicate, Unicode, malformed, and large sets through real `FormData`

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: accepted for implementation with every existing declarative, imperative, edit/view, fixed-row, description, copy, and event capability preserved; ordered JSON entry arrays will retain duplicate keys, descriptions, Unicode, and row order.
- 2026-07-16: implemented the native value/default, reset, state restore, validation, disabled-fieldset, labels, form-owner, copy, slot-default, fixed-row, and reconnect contracts; documented the exact ordered entry-array representation across package, human, AI, generated metadata, React, Storybook, and website surfaces.
- 2026-07-16: verified unit and React behavior plus real source/distribution/CDN `FormData`, customer interaction, Storybook, responsive layout, themes, and stamped website deployment in Chromium, Firefox, and WebKit.
