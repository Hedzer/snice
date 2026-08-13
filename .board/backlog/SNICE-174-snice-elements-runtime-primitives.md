---
id: SNICE-174
title: "Create the framework-neutral snice-elements runtime"
epic: rust-support
priority: 174
created: 2026-08-12
deps: [SNICE-173]
---

## Goal

Provide one small wasm-bindgen/web-sys foundation shared by Yew and Leptos.

## Notes

This crate owns browser interop so the framework crates cannot develop conflicting reflection, readiness, casting, or listener behavior.

## Acceptance criteria

- [ ] The crate provides typed element casting, exact tag constants, property reflection, attribute mutation, registration/readiness checks, and useful JsValue error context.
- [ ] Structured properties preserve JavaScript identity and DOM objects use appropriate feature-gated web-sys handles.
- [ ] Listener guards remove and replace callbacks safely on drop, rerender, unmount, and failed attachment.
- [ ] Late custom-element upgrade and runtime-before-component ordering have deterministic APIs and tests.
- [ ] Feature flags allow family-level or component-level code selection without changing public semantics.
- [ ] Non-wasm and SSR compilation behavior is intentional and produces actionable diagnostics rather than accidental linker failures.
- [ ] Cargo format, Clippy with warnings denied, documentation tests, native compile tests, and wasm browser tests pass.

## Worklog

- 2026-08-12: Chosen as the single framework-neutral interop layer.
