---
id: SNICE-169
title: "Define the Rust support charter and prove browser interop"
epic: rust-support
priority: 169
created: 2026-08-12
deps: []
---

## Goal

Define what first-class Rust support means for Snice and prove the hard browser boundaries in Yew and Leptos before locking the generated API.

## Notes

Rust support wraps the existing custom elements; it does not reimplement them. Yew and Leptos retain ownership of application routing, state, and lifecycle. The decision must cover CSR, SSR, and hydration honestly, plus a reproducible way to load version-matched Snice runtime, theme, and component assets without an unversioned production CDN.

## Acceptance criteria

- [ ] An ADR defines the supported Rust, wasm-bindgen/web-sys, Yew, Leptos, browser, CSR, SSR, and hydration versions or explicitly marks a mode out of scope.
- [ ] The proposed crates, ownership boundaries, feature flags, minimum supported Rust version, and npm-to-crate compatibility policy are documented.
- [ ] Executable Yew and Leptos probes cover scalar and boolean attributes, structured property writes, native events, typed CustomEvent detail, slots, form participation, focus, imperative methods, readiness, rerendering, and unmount cleanup.
- [ ] Asset loading covers runtime ordering, themes, component-family bundles, offline production builds, cache behavior, and version mismatch diagnostics.
- [ ] Success measures include generated coverage, compile-time ergonomics, browser parity, bundle overhead, and scaffold time-to-first-render.
- [ ] Non-goals explicitly exclude recreating Snice elements or transplanting Snice decorators, controllers, daemons, or routing into Rust.

## Worklog

- 2026-08-12: Created from the Rust expansion planning audit.
