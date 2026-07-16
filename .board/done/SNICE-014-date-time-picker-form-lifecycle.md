---
id: SNICE-014
title: "complete date-time-picker form lifecycle"
epic: forms
priority: 14
created: 2026-07-14
deps: []
---

## Goal
Make date-time-picker a predictable form-associated control with canonical values and native lifecycle behavior.

## Notes
- The component is form-associated but does not expose the complete callback and validity contract.
- Affected implementation: `packages/components/src/date-time-picker/snice-date-time-picker.ts`.

## Acceptance criteria
- [x] date and time parts produce one documented canonical submitted value with strict validity
- [x] reset, authored defaults, state restoration, disabled fieldsets, required, min, and max work end to end
- [x] real-browser tests cover local-time edge cases, partial input, clearing, programmatic updates, and reconnect

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: accepted for implementation as part of the complete form-contract backlog, with every existing picker capability preserved.
- 2026-07-16: implemented the native live/default value split, exact local canonical submission, strict parsing and validity, reset/restore/fieldset lifecycle, native form APIs, customer-facing React support, viewport-safe popup behavior, Storybook and public-site examples, and aligned human/component/AI documentation.
- 2026-07-16: verified 82 focused source tests, 1,225 React adapter tests, 80 CDN tests, metadata and type gates, Storybook build, 21 focused framework-browser cases, 3 focused deployed-site cases, and the complete 210.82-second release matrix: 7,753 source tests, 7,753 built tests, 93.4% core statement coverage, 252 framework-browser cases, and 42 generated-site cases across Chromium, Firefox, and WebKit.
