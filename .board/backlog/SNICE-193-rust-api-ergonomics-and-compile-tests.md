---
id: SNICE-193
title: "Gate Rust API ergonomics with compile and compile-fail tests"
epic: rust-support
priority: 193
created: 2026-08-12
deps: [SNICE-175, SNICE-176, SNICE-177, SNICE-178, SNICE-182, SNICE-184]
---

## Goal

Make pleasant syntax and useful compiler guidance a release requirement, not a subjective afterthought.

## Notes

Tests should protect the common API shape in snice-elements, Yew, and Leptos while permitting documented raw interop for edge cases.

## Acceptance criteria

- [ ] Compile-pass fixtures cover minimal use, typed enums, optional values, structured properties, forms, slots, typed events, methods, request/response, NodeRef or handles, and reactive/framework-specific values.
- [ ] Trybuild or equivalent compile-fail fixtures cover unknown props, wrong enum values, wrong event callbacks/detail, invalid method arguments, missing required props, feature-gated components, and non-Send browser handles.
- [ ] Expected diagnostics are concise enough to guide a Rust user to the correct construct.
- [ ] API-review fixtures cap boilerplate for representative basic, form-heavy, data-rich, and event-heavy components.
- [ ] Rustdoc examples and generated scaffold syntax reuse the verified idioms.
- [ ] A documented escape hatch supports genuinely dynamic JavaScript values without turning ordinary APIs into JsValue or stringly typed calls.

## Worklog

- 2026-08-12: Created specifically to enforce the requested nice syntax and real type hints.
