---
id: SNICE-189
title: "Make CLI diagnostics and Snice guidance Rust-aware"
epic: rust-support
priority: 189
created: 2026-08-12
deps: [SNICE-185, SNICE-187, SNICE-188]
---

## Goal

Give Rust users framework-appropriate setup instructions and diagnostics instead of TypeScript-only assumptions.

## Notes

The current doctor/check path expects package.json, an npm dependency, JavaScript source extensions, tsconfig, and decorators. Rust projects still require the matching Snice asset package but need distinct validation and guidance.

## Acceptance criteria

- [ ] create-app prints Yew- or Leptos-specific prerequisites and exact Cargo, asset, development, test, and production commands.
- [ ] `snice doctor/check --json` recognizes generated Rust projects, verifies Cargo/framework/toolchain/asset/version state, and omits irrelevant TypeScript/decorator failures.
- [ ] Diagnostics have stable codes, source locations where useful, remediation text, and an honest boundary for any unsupported .rs static analysis.
- [ ] The installed Snice skill locates Rust docs and recommends the same commands and support boundaries as generated projects.
- [ ] Default and React doctor/check behavior remains covered and unchanged.
- [ ] Packed-scaffold tests exercise successful and failing Rust diagnostic journeys.

## Worklog

- 2026-08-12: Expanded CLI scope beyond file generation to a supported Rust developer workflow.
