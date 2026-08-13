---
id: SNICE-190
title: "Build a robust Yew example application"
epic: rust-support
priority: 190
created: 2026-08-12
deps: [SNICE-177, SNICE-178, SNICE-182, SNICE-185, SNICE-187]
---

## Goal

Ship a customer-readable Yew application that demonstrates the breadth and quality of the generated integration.

## Notes

The example is more substantial than the starter and must be continuously built and browser-tested against the checkout artifact.

## Acceptance criteria

- [ ] `examples/yew` is a coherent routed or multi-view application using Yew for application state and navigation and Snice for UI elements.
- [ ] It demonstrates primitive and structured props, controlled forms and validation, native and typed custom events, slots, CSS parts/themes, focus/keyboard behavior, public methods, readiness, request/response, conditional views, and keyed lists.
- [ ] Its README explains architecture, support boundaries, exact run/build/test commands, and where raw escape hatches are appropriate.
- [ ] It uses the checkout or packed Snice artifact and matching crates, never a stale major or live production CDN.
- [ ] Build, compile, accessibility, and browser journeys are unconditional release gates.
- [ ] Shared generated/template integration code has an explicit drift rule while example-only application code remains readable.

## Worklog

- 2026-08-12: Defined as the robust Yew adoption example requested in the expansion.
