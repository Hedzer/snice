---
id: SNICE-135
title: "snice-option must not rewrite an empty-string value to the label"
epic: behavior
priority: 135
created: 2026-08-07
deps: []
---

## Goal
An authored `value: ''` on snice-option (the standard "All/Any/None" sentinel in filter dropdowns) must survive as `''` instead of being silently rewritten to the label.

## Notes
- `packages/components/src/select/snice-option.ts:39-41`: `if (!this.value && this.label) { this.value = this.label; }` — a falsy check cannot distinguish "not provided" from "empty".
- Confirmed by the reporter in a real browser: selecting the sentinel option produced `?ownerUserId=All routines` in the URL.
- Fix: distinguish "not provided" from "empty" (`this.value === undefined` or a `hasAttribute` check).
- Confirmed bug from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] `value=""` survives as `''`
- [x] omitted value still falls back to the label
- [x] component test covers both cases

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: failing test first in `tests/components/select.test.ts` — authored `value=""` + label was rewritten to the label.
- 2026-08-07: fix in `packages/components/src/select/snice-option.ts` — fallback to label only when the `value` attribute was never set (`hasAttribute('value')`). Property reflection covers property-set values that differ from the default. Select suites green (96 tests).
