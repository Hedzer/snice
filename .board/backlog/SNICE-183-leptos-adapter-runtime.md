---
id: SNICE-183
title: "Build the Leptos adapter runtime"
epic: rust-support
priority: 183
created: 2026-08-12
deps: [SNICE-175, SNICE-176, SNICE-177, SNICE-178, SNICE-179, SNICE-180]
---

## Goal

Create a thin Leptos layer that integrates snice-elements with signals, event descriptors, NodeRef, effects, and hydration.

## Notes

The adapter should use Leptos conventions such as property bindings and reactive values while keeping reflection and listener ownership in snice-elements.

## Acceptance criteria

- [ ] The runtime maps typed properties, reactive optional values, callbacks/event descriptors, children/slots, NodeRef, imperative handles, and request responders to Leptos idioms.
- [ ] Signal updates write structured properties without unnecessary serialization or feedback loops.
- [ ] Effects and listener guards clean up across reruns, conditional views, keyed lists, and disposal.
- [ ] Controlled and uncontrolled form patterns work with reactive state.
- [ ] CSR, server rendering, and hydration behavior conforms to SNICE-180 for every declared supported mode.
- [ ] Focused browser tests cover mount, reactive update, disposal, late upgrade, hydration, and error propagation.

## Worklog

- 2026-08-12: Separated Leptos lifecycle and hydration mechanics from generated catalog work.
