---
id: SNICE-195
title: "Test every packed scaffold and Rust browser journey"
epic: rust-support
priority: 195
created: 2026-08-12
deps: [SNICE-187, SNICE-188, SNICE-189, SNICE-193, SNICE-194]
---

## Goal

Verify the actual npm tarball creates production-capable default, React, Yew, and Leptos applications.

## Notes

Tests must invoke the CLI inside the package being evaluated, not the working-tree CLI, and must never pass conditionally when expected UI is absent.

## Acceptance criteria

- [ ] One catalog-driven matrix covers all templates for structure, names, occupied targets, unknown templates, placeholders, AI files, ignore files, exact dependencies, and packed contents.
- [ ] Each journey invokes the CLI contained in one real npm tarball and installs or links the exact Snice artifact under test.
- [ ] Yew and Leptos pass format/check/tests and clean production builds; default and React retain equivalent existing gates.
- [ ] Chromium, Firefox, and WebKit assert registration, visible initial state, Rust-to-element updates, typed native/custom events into Rust state, form behavior, slots, methods, readiness, and exactly one event per activation.
- [ ] Supported server-rendering/hydration builds and browser journeys run for both frameworks where declared.
- [ ] Any page error, console error, failed asset request, external runtime dependency, missing UI, process leak, or generated worktree diff fails the suite.

## Worklog

- 2026-08-12: Extends current scaffold testing to release-grade Rust package journeys.
