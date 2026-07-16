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
- [x] clicking an associated `<label for>` focuses or activates the documented target
- [x] ElementInternals labels, accessible name, helper text, and errors compose without duplicate announcements
- [x] browser accessibility tests cover explicit, wrapping, multiple, dynamic, and absent labels

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: accepted for implementation in the form-lifecycle batch; selection, search, editable/free-text, remote loading, keyboard navigation, clearability, multiple values, forms, styling, events, slots, and public methods must remain intact.
- 2026-07-16: added a shared document/shadow-root label bridge with deterministic live association across Chromium, Firefox, and WebKit, including dynamic `id`, `for`, text, ARIA references, DOM moves, reconnects, and CSS-hostile IDs.
- 2026-07-16: aligned standard and editable names, focus targets, helper/error descriptions, invalid state, public types, human/AI docs, Storybook, and the public full showcase without changing selection behavior.
- 2026-07-16: added source/distribution/CDN browser matrices, Storybook and website browser gates, deployed-site coverage, responsive visual checks, unit tests, documentation alignment tests, and generated artifact verification.
