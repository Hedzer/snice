---
id: SNICE-198
title: "Wire Rust into release gates and run an adoption beta"
epic: rust-support
priority: 198
created: 2026-08-12
deps: [SNICE-192, SNICE-193, SNICE-194, SNICE-195, SNICE-196, SNICE-197]
---

## Goal

Make Rust support release-blocking, then validate that real Yew and Leptos users can adopt it without insider knowledge.

## Notes

The expansion is complete only when canonical CI/release paths enforce it and a clean external-style trial validates the installation, syntax, diagnostics, documentation, and upgrade story.

## Acceptance criteria

- [ ] The canonical full test and release paths run contract checks, JavaScript tests, Rust format/lint/test/package checks, WASM tests, examples, packed scaffolds, docs, and all-browser journeys without opt-in or silent skip.
- [ ] Release scripts, semantic-release lifecycle, RELEASE.md, checklists, and actual test behavior agree.
- [ ] A clean environment provisions pinned Rust/WASM/browser tools with documented caching and leaves no generated or template diff.
- [ ] At least one Yew and one Leptos external-style beta project complete create-app, a typed customization, a form/event integration, a production build, and a version upgrade using published-candidate artifacts.
- [ ] Beta findings are classified into generator, runtime, syntax, docs, diagnostics, performance, or compatibility issues and all release-blocking findings are resolved.
- [ ] Size/build-time budgets, supported-version matrix, limitations, migration/upgrade guide, and go/no-go checklist are published.

## Worklog

- 2026-08-12: Final integration and adoption gate for the Rust expansion.
