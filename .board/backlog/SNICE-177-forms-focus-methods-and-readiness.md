---
id: SNICE-177
title: "Expose forms, focus, methods, and readiness idiomatically"
epic: rust-support
priority: 177
created: 2026-08-12
deps: [SNICE-175, SNICE-176]
---

## Goal

Cover the browser behaviors that distinguish a native-quality component integration from markup-only wrappers.

## Notes

The generated API must support controlled and uncontrolled form use, validity, reset/state restore, focus management, public methods, and asynchronous definition/upgrade.

## Acceptance criteria

- [ ] Form-associated elements expose typed value, checked/selected state, name/disabled/required state, validity, validation messages, reset, and FormData participation where the element supports them.
- [ ] Focus, blur, active-element inspection, keyboard interaction, and forwarded labels are usable without raw JavaScript.
- [ ] Public imperative methods have typed arguments, return values, errors, and async behavior; internal lifecycle methods never appear.
- [ ] A readiness primitive gates operations that require an upgraded custom element and reports missing or mismatched assets clearly.
- [ ] Browser tests cover controlled updates, user edits, validation, reset, submission, reconnection, focus movement, and late upgrade.
- [ ] Ergonomic examples show the common path while keeping raw element access available for advanced use.

## Worklog

- 2026-08-12: Added as a first-class feature track rather than hiding forms and methods inside wrapper work.
