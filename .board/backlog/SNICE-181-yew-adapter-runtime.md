---
id: SNICE-181
title: "Build the Yew adapter runtime"
epic: rust-support
priority: 181
created: 2026-08-12
deps: [SNICE-175, SNICE-176, SNICE-177, SNICE-178, SNICE-179]
---

## Goal

Create a thin Yew layer that turns snice-elements handles and events into idiomatic component lifecycle behavior.

## Notes

Yew wrappers should feel native through Properties, Callback, NodeRef, children, and lifecycle-managed effects while delegating all browser interop to snice-elements.

## Acceptance criteria

- [ ] The runtime maps typed properties, optional values, callbacks, children/slots, node references, imperative handles, and request responders to Yew idioms.
- [ ] Structured values use property assignment after mount and update when Properties change.
- [ ] Callback replacement and component destruction dispose old browser listeners exactly once.
- [ ] Controlled and uncontrolled form patterns work without event loops or stale DOM state.
- [ ] A raw-element escape hatch remains available without weakening the normal typed API.
- [ ] Focused wasm browser tests cover mount, update, keyed lists, conditional rendering, rerender, unmount, late upgrade, and error propagation.

## Worklog

- 2026-08-12: Separated runtime lifecycle mechanics from generated component coverage.
