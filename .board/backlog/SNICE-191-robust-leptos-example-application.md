---
id: SNICE-191
title: "Build a robust Leptos example application"
epic: rust-support
priority: 191
created: 2026-08-12
deps: [SNICE-177, SNICE-178, SNICE-180, SNICE-184, SNICE-185, SNICE-188]
---

## Goal

Ship a customer-readable Leptos application that demonstrates the breadth and quality of the generated integration.

## Notes

The example should match the Yew example's observable feature coverage and additionally demonstrate the supported server-rendering and hydration contract.

## Acceptance criteria

- [ ] `examples/leptos` is a coherent routed or multi-view application using Leptos for application state and navigation and Snice for UI elements.
- [ ] It demonstrates static and reactive props, controlled forms and validation, native and typed custom events, slots, CSS parts/themes, focus/keyboard behavior, public methods, readiness, request/response, conditional views, and keyed lists.
- [ ] Supported CSR, SSR, and hydration paths are visible, documented, and covered without mismatch warnings or duplicate effects.
- [ ] Its README explains architecture, support boundaries, exact run/build/test commands, and raw escape hatches.
- [ ] It uses the checkout or packed Snice artifact and matching crates, never a stale major or live production CDN.
- [ ] Build, compile, accessibility, and browser journeys are unconditional release gates with selectors compatible with the Yew journey where behavior matches.

## Worklog

- 2026-08-12: Defined as the robust Leptos adoption example requested in the expansion.
