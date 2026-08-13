---
id: SNICE-179
title: "Provide versioned assets, registration, and theme loading"
epic: rust-support
priority: 179
created: 2026-08-12
deps: [SNICE-169, SNICE-174]
---

## Goal

Make Snice runtime, component registration, and themes reproducible in Rust development and production builds.

## Notes

Rust crates cannot render working components by themselves; applications also need the matching JavaScript runtime and selected element bundles. The workflow must be explicit and diagnosable.

## Acceptance criteria

- [ ] A pinned asset workflow installs or copies the exact Snice npm artifact matched to the Rust crates and works without a production network fetch.
- [ ] Runtime, theme, and component-family load ordering is deterministic in dev, production, tests, CSR, and supported hydration modes.
- [ ] APIs can register selected families or the complete released set and await definitions before property/method use.
- [ ] npm/crate version mismatches, missing runtime, missing theme, and unregistered tags produce actionable diagnostics.
- [ ] Tree-shaking or family selection has size measurements and does not silently omit dependencies.
- [ ] Generated templates, examples, docs, and packed-tarball tests use the same asset mechanism.

## Worklog

- 2026-08-12: Established as shared infrastructure for both Rust frameworks.
