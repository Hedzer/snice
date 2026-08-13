---
id: SNICE-197
title: "Coordinate npm and crates.io packaging and releases"
epic: rust-support
priority: 197
created: 2026-08-12
deps: [SNICE-172, SNICE-179, SNICE-182, SNICE-184, SNICE-185]
---

## Goal

Publish reproducible, mutually compatible Snice npm and Rust crate artifacts with clear ownership and rollback rules.

## Notes

Likely crates are snice-elements, snice-yew, and snice-leptos. Exact names and repository topology are confirmed by SNICE-169. Rust crates and JavaScript assets must never imply compatibility they have not tested together.

## Acceptance criteria

- [ ] Cargo workspace, crate ownership, licenses, repositories, readmes, feature flags, MSRV, dependency bounds, and crate publication order are defined.
- [ ] npm-to-crate compatibility, coordinated semver, prerelease channels, deprecations, minimum supported framework versions, and breaking contract changes are documented and machine-checked.
- [ ] `cargo package --list`, packaged-crate build/tests, and `cargo publish --dry-run` pass for each crate with only intended generated sources and metadata.
- [ ] The npm tarball contains the canonical public contract and intended Rust scaffolds/assets, while crates do not embed stale JavaScript distributions.
- [ ] Release generation is deterministic from a clean checkout and every published generated artifact is represented in the release commit/tag.
- [ ] Partial publish failure, retry, yank/deprecate, security fix, and npm/crate version mismatch procedures are documented and tested where automatable.

## Worklog

- 2026-08-12: Planned as coordinated multi-registry release engineering, not an npm-only add-on.
