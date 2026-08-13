---
id: SNICE-182
title: "Generate idiomatic Yew components for all released elements"
epic: rust-support
priority: 182
created: 2026-08-12
deps: [SNICE-172, SNICE-173, SNICE-181]
---

## Goal

Generate discoverable Yew components with strong Properties and typed callbacks for the complete released Snice catalog.

## Notes

The common syntax should be concise and IDE-friendly, with typed enums and events instead of strings or JsValue. Generated wrappers render the existing snice-* elements.

## Acceptance criteria

- [ ] Every released tag has a generated Yew wrapper and no WIP element is exported.
- [ ] Generated Properties cover attributes, live properties, defaults, optionals, closed enums, typed callbacks, children, named slots, node references, and imperative handles.
- [ ] Required versus optional values follow the canonical contract and yield clear compiler diagnostics.
- [ ] Wrapper code contains no independent component-specific override table unless the exception is recorded and tested upstream.
- [ ] Rustdoc and runnable examples demonstrate pleasant common syntax for basic, form, data-rich, and event-heavy components.
- [ ] Compile and manifest parity tests prove complete coverage and reject wrong property/event types.
- [ ] Generated overhead is measured and family/component feature selection is documented.

## Worklog

- 2026-08-12: Targets generated strong types rather than manually maintained element recreations.
