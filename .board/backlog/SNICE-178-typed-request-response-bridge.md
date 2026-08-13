---
id: SNICE-178
title: "Add a typed request and response bridge"
epic: rust-support
priority: 178
created: 2026-08-12
deps: [SNICE-174, SNICE-175, SNICE-176]
---

## Goal

Expose Snice component request/response channels to Rust without importing the TypeScript controller architecture.

## Notes

Rust frameworks keep application ownership, but components that request data or services still need an idiomatic typed bridge with correct event propagation and lifecycle cleanup.

## Acceptance criteria

- [ ] The contract identifies public request names, request payloads, response payloads, error paths, cancellation, and timeout behavior.
- [ ] snice-elements provides typed request handlers and responders with an explicit JsValue escape hatch for deliberately dynamic channels.
- [ ] Duplicate responders, missing responders, rejected async work, cancellation, and component removal have deterministic behavior.
- [ ] Yew and Leptos can bind framework state or async tasks to the shared bridge without adopting Snice controllers.
- [ ] Browser tests cover successful sync and async responses, rejection, timeout/cancellation, reconnect, and cleanup.
- [ ] Documentation draws a clear boundary between component interop and Snice application-framework constructs.

## Worklog

- 2026-08-12: Included because request/response is part of the component-facing feature surface.
