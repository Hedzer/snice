---
id: SNICE-010
title: "complete checkbox native form participation"
epic: forms
priority: 10
created: 2026-07-14
deps: []
---

## Goal
Make checked checkbox values, required validity, reset defaults, and fieldset-disabled state behave like a native checkbox.

## Notes
- A real-browser probe found a checked named checkbox absent from `FormData` and a required unchecked checkbox did not invalidate its form.
- Affected implementation: `packages/components/src/checkbox/snice-checkbox.ts`.
- The current reset callback clears state instead of restoring the authored default.

## Acceptance criteria
- [x] successful-control contribution, configurable value, required validity, form reporting, reset, restore, and disabled fieldset behavior match the documented native model
- [x] input/change/custom events fire only for user-observable state transitions with stable ordering
- [x] browser tests cover name removal, defaultChecked changes, indeterminate state, programmatic changes, reset, disabled fieldsets, and repeated connection

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-15: accepted for implementation; preserve the existing public visual/state API while making form value, validity, defaults, restoration, disabled ancestry, and user-event behavior match native checkbox semantics in all supported browsers and builds.
- 2026-07-15: implemented native form value/validity/reset/restore/fieldset behavior, live versus authored checked state, native event ordering, external-label activation, and safe pre-upgrade property adoption; kept tree checkbox interaction stable.
- 2026-07-15: updated public types, React adapters, metadata, Storybook, public showcase, human/AI docs, and generated CDN/site artifacts.
- 2026-07-15: verified source, built ESM, CDN, React, Storybook, public website, production site, and Chromium/Firefox/WebKit behavior. Full gate: 7,545 source + 7,545 built tests, 93.4% core statement coverage, all gates passed in 210.47s (210.99s wall).
- 2026-07-18: takeover audit caught a duplicate host `click` from external-label forwarding; activation now exposes one host click while preserving native input/change ordering in every browser and build channel.
