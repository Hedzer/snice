---
id: SNICE-015
title: "complete time-picker form lifecycle"
epic: forms
priority: 15
created: 2026-07-14
deps: []
---

## Goal
Complete time-picker submission, validity, reset, restore, and fieldset-disabled behavior.

## Notes
- The component is form-associated but does not implement the complete native lifecycle.
- Affected implementation: `packages/components/src/time-picker/snice-time-picker.ts`.

## Acceptance criteria
- [x] canonical submitted values and step/min/max/required validity are defined and enforced
- [x] authored defaults return on reset and fieldset disablement blocks every interaction path
- [x] browser tests cover keyboard entry, picker changes, seconds, boundaries, clear, reset, and reconnect

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: accepted for implementation with every existing time-picker capability preserved and permission to commit after complete source, built-artifact, and browser verification.
- 2026-07-16: implemented strict canonical/display parsing, live/default/reset/restore state, complete validity and fieldset behavior, native form APIs, viewport-safe dropdown positioning, and the existing selector, inline, format, seconds, event, and public method contracts without feature removal.
- 2026-07-16: updated public types, React adapters, metadata, Storybook, public card/full showcases, generated CDN/site artifacts, and human/component/AI documentation.
- 2026-07-16: verified focused unit, docs, React, source/distribution/CDN, Storybook, and public-site customer paths in Chromium, Firefox, and WebKit; the final release matrix passed 7,820 source + 7,820 built tests, 273 framework-browser cases, 45 website-browser cases, and 93.4% core statement coverage in 220.52s.
