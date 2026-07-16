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
- Affected implementation: `packages/components/src/button/snice-button.ts`; no form-disabled callback was present.
- Navigation, submit, reset, and ordinary button modes use the same effective-disabled calculation.

## Acceptance criteria
- [x] disabled fieldsets suppress pointer, keyboard, form, and navigation activation while preserving authored disabled state
- [x] moving the button between fieldsets/forms updates immediately without overwriting the public property
- [x] real-browser tests cover nested fieldsets, first-legend exceptions where applicable, reconnect, and all button types

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: accepted for implementation as part of the remaining form-lifecycle batch; navigation, submit/reset, ordinary activation, loading, styling, slots, events, and programmatic methods must remain intact.
- 2026-07-16: separated browser-imposed fieldset disabledness from authored `disabled`, applied it consistently to rendering and every activation channel, and preserved the first-legend exception through the platform form callback.
- 2026-07-16: added unit, source/distribution/CDN, Chromium/Firefox/WebKit, Storybook, full-showcase, deployed-website, docs-alignment, nested-fieldset, move/reconnect, pointer, keyboard, synthetic, and programmatic regression coverage.
