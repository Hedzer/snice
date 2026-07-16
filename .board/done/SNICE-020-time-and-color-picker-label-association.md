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
- [x] associated labels focus the correct interactive target and ElementInternals reports the expected labels
- [x] popover/swatch affordances do not create duplicate or unnamed form fields
- [x] real-browser accessibility tests cover explicit, wrapping, dynamic, helper/error, and disabled cases

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: implemented live explicit, wrapping, multiple, moved, and reconnected label association for time and color pickers, including inline and swatch-only modes.
- 2026-07-16: gave fields, toggles, panels, time segments, clear controls, swatches, and presets coherent derived names; connected helper/error descriptions once and made errors alerts.
- 2026-07-16: preserved authored disabled state while honoring disabled fieldsets, loading, focus, form submission, reset, state restoration, and every existing picker interaction.
- 2026-07-16: documented the complete contract in human docs, AI docs, package references, Storybook, and public full showcases.
- 2026-07-16: verified 7,949 source and built tests, 438 source/distribution/CDN browser cases, 54 deployed-site cases, type and production builds, responsive themes, console cleanliness, mobile/desktop visuals, and 93.4% core-engine statement coverage; the full gate passed in 352.60 seconds.
