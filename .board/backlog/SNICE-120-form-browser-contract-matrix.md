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
- [ ] one shared matrix covers every form-associated control and its component-specific value/constraint cases
- [ ] FormData, formdata event, submit blocking, check/reportValidity, labels, reset, disabled fieldsets, form owner, restore, events, and reconnect are asserted
- [ ] the exact matrix runs against source and fresh built artifacts in Chromium, Firefox, and WebKit

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
