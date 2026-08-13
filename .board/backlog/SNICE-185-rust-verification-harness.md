---
id: SNICE-185
title: "Add a pinned Rust and WASM verification harness"
epic: rust-support
priority: 185
created: 2026-08-12
deps: [SNICE-169, SNICE-173, SNICE-174]
---

## Goal

Give the repository one reproducible way to build, lint, test, package, and browser-run Rust fixtures.

## Notes

The current suite has no Cargo, WASM, or Trunk gate. The harness must provision pinned tools rather than silently skipping when they are absent.

## Acceptance criteria

- [ ] One machine-readable policy pins Rust/MSRV, WASM target, wasm-bindgen tooling, browser builder, formatter, and lint settings.
- [ ] A canonical runner performs format checks, Clippy with warnings denied, native tests, wasm compilation/tests, production browser builds, and registered fixture checks.
- [ ] Missing tools fail with one actionable installation diagnostic and no Rust gate silently skips.
- [ ] Cargo and browser outputs use isolated caches or temporary directories and leave the worktree unchanged.
- [ ] Test process trees, ports, traces, and temporary projects are reliably cleaned or retained for diagnosed failure.
- [ ] Rust code fences and extracted documentation snippets compile in real framework harnesses.

## Worklog

- 2026-08-12: Added before scaffolds so generated projects have an enforceable build contract.
