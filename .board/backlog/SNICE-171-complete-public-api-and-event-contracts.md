---
id: SNICE-171
title: "Complete public API, method, property, and event contracts"
epic: rust-support
priority: 171
created: 2026-08-12
deps: [SNICE-170]
---

## Goal

Make every released component surface precise enough to generate trustworthy strong types.

## Notes

The current audit found 193 released elements, 1,639 fields, 1,458 over-broad methods, and 343 event occurrences, including 275 CustomEvent unknown fallbacks. Existing EventMap and detail declarations recover some precision, but source gaps and runtime/type mismatches must be resolved deliberately.

## Acceptance criteria

- [ ] Every released element has an explicit public contract or an intentionally minimal declaration.
- [ ] Public methods come from interfaces or an explicit public annotation; lifecycle hooks, watchers, handlers, and framework internals are absent.
- [ ] Every public emitted or forwarded event declares native/custom kind, exact name, bubbling/composition behavior, and normalized detail semantics.
- [ ] Existing EventMaps and detail types replace unknown where evidence exists; remaining dynamic types are allowlisted with a reason and safe escape hatch.
- [ ] Runtime payloads and declarations agree, including the known button click-detail mismatch and table or bubbled event inclusion rules.
- [ ] All form-associated elements, properties versus attributes, declarative child attributes, slots, CSS parts, and public imperative operations are represented.
- [ ] Contract tests fail when runtime dispatch, source declarations, IR, or generated metadata disagree.

## Worklog

- 2026-08-12: Planned as the precision gate before any generated Rust API ships.
