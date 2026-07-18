---
id: SNICE-120
title: "add a real-browser form control contract matrix"
epic: quality
priority: 120
created: 2026-07-14
deps: []
---

## Goal
Exercise every form-associated component as a customer would through actual forms, FormData, constraint validation, reset, restore, and fieldsets.

## Notes
- Current unit coverage did not catch checked checkbox/radio omission or required-validity failure in real browsers.
- Affected test area: `tests/live/` and built-customer browser paths.

## Acceptance criteria
- [x] one shared matrix covers every form-associated control and its component-specific value/constraint cases
- [x] FormData, formdata event, submit blocking, check/reportValidity, labels, reset, disabled fieldsets, form owner, restore, events, and reconnect are asserted
- [x] the exact matrix runs against source and fresh built artifacts in Chromium, Firefox, and WebKit

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-18: added one permanent customer matrix for all 18 form-associated controls, including native host APIs, every component-specific constraint and clearing path, trusted input behavior, standard and component events, explicit form owners, labels, submit blocking, reset, state restoration, fieldsets, readonly/loading eligibility, reconnects, and focus delegation.
- 2026-07-18: ran the same matrix in Chromium, Firefox, and WebKit against source, fresh distribution, and CDN builds; added separate full-showcase and Storybook customer journeys for public rendering contracts.
- 2026-07-18: hardened the key-value Storybook journey to assert each customer edit reaches the component model before advancing; it passed 50 WebKit stress repetitions and 30 cross-browser repetitions.
- 2026-07-18: clean release gate passed with 8,097 source tests, 8,097 built tests, 1,231 React tests, 489 framework browser tests, 54 deployed-site tests, and 93.4% core statement coverage in 271.10 seconds.
