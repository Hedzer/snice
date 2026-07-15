---
id: SNICE-011
title: "complete radio native form participation"
epic: forms
priority: 11
created: 2026-07-14
deps: []
---

## Goal
Make radio groups submit, validate, reset, disable, and coordinate selection like native radio controls.

## Notes
- A real-browser probe found a checked named radio absent from `FormData` and a required group remained valid.
- Affected implementation: `packages/components/src/radio/snice-radio.ts`.
- The contract must cover groups across light DOM and form owners without unchecking unrelated groups.

## Acceptance criteria
- [x] one checked successful control contributes its configured value and required group validity matches native behavior
- [x] selection, authored default restoration, disabled fieldsets, form ownership changes, and dynamic names are correct
- [x] real-browser tests cover multiple forms, shadow hosts, insertion/removal, reset, no checked option, and keyboard selection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-15: accepted for implementation and moved to doing; preserve existing visual and public API behavior while matching the native radio form/group contract across supported browsers and builds.
- 2026-07-15: implemented native live/default checkedness, successful-control values, group validity, form/root ownership, dynamic reconciliation, reset/restore, disabled-fieldset behavior, event ordering, external labels, arrow navigation, roving tab stops, and pre-upgrade property adoption.
- 2026-07-15: updated public types, generated metadata and React adapters, Storybook, the complete public showcase, human docs, AI docs, and deployed-site coverage.
- 2026-07-15: verified source, built ESM, and CDN behavior in Chromium, Firefox, and WebKit; drove Storybook and the deployed website across all three engines and visually inspected desktop and mobile showcase layouts.
- 2026-07-15: fixed form-owner fallback exposed by the complete source+built matrix and isolated the deployed Location gate from nondeterministic third-party map-frame scripts without bypassing Snice URL assertions.
- 2026-07-15: final gate passed with 7,577 source + 7,577 built tests, 1,222 React tests, 180 framework-browser tests, 33 deployed-website browser tests, 93.4% statement / 90.88% branch core coverage, and all artifact/build gates in 242.08s (242.51s wall).
