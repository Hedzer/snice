---
id: SNICE-192
title: "Document Rust, Yew, and Leptos integration end to end"
epic: rust-support
priority: 192
created: 2026-08-12
deps: [SNICE-180, SNICE-187, SNICE-188, SNICE-189, SNICE-190, SNICE-191]
---

## Goal

Publish a complete Rust learning path from installation to advanced component interop.

## Notes

Human and AI documentation, website navigation, CLI docs, template READMEs, crate rustdoc, and LLM indexes must agree and compile their examples.

## Acceptance criteria

- [ ] Human and AI Rust integration guides cover prerequisites, crates, asset/version loading, registration/readiness, attributes versus properties, booleans, structured values, typed events, forms, slots, parts/themes, focus, methods, request/response, cleanup, Yew, Leptos, CSR, SSR, and hydration.
- [ ] CLI docs, README, documentation indexes, installed skill, llms.txt, llms-full.txt, website manifest, guide manifest, and homepage entry points expose both frameworks consistently.
- [ ] Rust syntax highlighting is mapped correctly rather than falling back to TypeScript.
- [ ] Every customer-facing Rust code block compiles through the verification harness and links to an equivalent runnable example where appropriate.
- [ ] Generated API rustdoc has complete public-item coverage, source component links, feature flags, examples, and dynamic-value explanations.
- [ ] Structural and all-browser documentation-site tests pass with no dead links, missing AI mirror, page error, or console error.

## Worklog

- 2026-08-12: Planned across every existing Snice documentation publication surface.
