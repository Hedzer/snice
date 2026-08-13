---
id: SNICE-175
title: "Generate strong snice-elements APIs for every released element"
epic: rust-support
priority: 175
created: 2026-08-12
deps: [SNICE-172, SNICE-174]
---

## Goal

Expose every released Snice custom element through discoverable, strongly typed Rust handles.

## Notes

This layer is the complete component-facing contract: properties, attributes, getters, setters, public methods, slots, parts, CSS properties, form metadata, and safe dynamic escape hatches.

## Acceptance criteria

- [ ] Every released tag has a generated handle and module; no WIP tag is exported.
- [ ] Readable and writable state, reflected attributes, nullable values, enums, collections, records, browser handles, and public method results map according to SNICE-173.
- [ ] Slots, CSS parts, and CSS custom properties have typed constants or builders that preserve their exact wire names.
- [ ] Public asynchronous and fallible methods expose useful Rust Result or future semantics.
- [ ] Imperative handles can be acquired safely before and after custom-element upgrade.
- [ ] Rustdoc links each generated API to its Snice component documentation and identifies intentionally dynamic values.
- [ ] A manifest parity test proves exact element and member coverage against the canonical contract.

## Worklog

- 2026-08-12: Scoped to all 193 currently released custom elements, with the generated inventory remaining authoritative.
