---
id: SNICE-013
title: "complete date-range-picker form lifecycle"
epic: forms
priority: 13
created: 2026-07-14
deps: []
---

## Goal
Define and implement a complete native form contract for date-range-picker.

## Notes
- The component is form-associated but lacks the complete reset, disabled, restore, and validity lifecycle.
- Affected implementation: `packages/components/src/date-range-picker/snice-date-range-picker.ts`.
- The submitted representation for start/end must be explicit and stable.

## Acceptance criteria
- [x] the component documents and submits one unambiguous canonical range representation
- [x] partial, reversed, out-of-bounds, and required ranges set correct validity without silently normalizing bad input
- [x] browser tests cover default restoration, form reset, fieldset disablement, clear, dynamic constraints, and reconnect

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-16: accepted for implementation with the existing `{name}-start` / `{name}-end` field shape preserved and canonical `YYYY-MM-DD` submitted values.
- 2026-07-16: completed the native form lifecycle, validation, restoration, fieldset behavior, public API, responsive popup positioning, generated artifacts, React adapter, Storybook/public-site examples, and human/AI/component documentation.
- 2026-07-16: verified source, built distribution, CDN, React, CLI, Storybook, deployed website, and Chromium/Firefox/WebKit customer paths; the full 7,701-test source and built suites and all browser gates passed with 93.4% core statement coverage.
