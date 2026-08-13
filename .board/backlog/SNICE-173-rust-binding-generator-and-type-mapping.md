---
id: SNICE-173
title: "Build the Rust binding generator and stable type mapping"
epic: rust-support
priority: 173
created: 2026-08-12
deps: [SNICE-170, SNICE-171]
---

## Goal

Generate deterministic, idiomatic Rust source from the canonical contract without duplicating component knowledge.

## Notes

The generator must preserve exact JavaScript names while handling duplicate family types, Rust keywords, closed string unions, nullable values, DOM objects, and intentionally dynamic values.

## Acceptance criteria

- [ ] A single generator emits formatted Rust modules for the shared elements crate and framework adapter inputs, with check-only and stale-file cleanup modes.
- [ ] Stable naming rules cover tag names, acronyms, duplicate exported type names, family namespaces, reserved words such as type/loop/for, and collisions.
- [ ] The mapping covers String, bool, validated numeric forms, enums for closed string unions, Option, arrays, records, callbacks, DOM handles, and JsValue escape hatches.
- [ ] Property and attribute channels remain distinct; structured or identity-bearing browser values are never silently stringified.
- [ ] Generated enums support exact wire values, parsing, display/as-str behavior, and forward-compatible fallbacks where the source contract is open.
- [ ] Output order and formatting are deterministic across operating systems.
- [ ] Golden tests include awkward real components, name collisions, dynamic payloads, and intentional generation failures.

## Worklog

- 2026-08-12: Defined from the source-type and Rust-name collision audit.
