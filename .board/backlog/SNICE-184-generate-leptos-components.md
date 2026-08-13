---
id: SNICE-184
title: "Generate idiomatic Leptos components for all released elements"
epic: rust-support
priority: 184
created: 2026-08-12
deps: [SNICE-172, SNICE-173, SNICE-183]
---

## Goal

Generate discoverable Leptos components with strong props, reactive inputs, and typed events for the complete released Snice catalog.

## Notes

The API should read like Leptos rather than a JavaScript translation while still rendering and upgrading the existing snice-* elements.

## Acceptance criteria

- [ ] Every released tag has a generated Leptos wrapper and no WIP element is exported.
- [ ] Props cover attributes, live properties, static and reactive values, closed enums, typed events, children, named slots, NodeRef, and imperative handles.
- [ ] Required versus optional inputs yield useful compiler diagnostics and reactive values do not erase type safety.
- [ ] Generated code consumes the canonical contract and shared runtime without a second component-specific override database.
- [ ] Rustdoc and runnable examples demonstrate pleasant basic, form, data-rich, event-heavy, CSR, and supported hydration syntax.
- [ ] Compile and manifest parity tests prove complete coverage and reject wrong property/event types.
- [ ] Generated overhead and feature selection are measured and documented.

## Worklog

- 2026-08-12: Targets generated Leptos-native syntax over raw custom tags.
