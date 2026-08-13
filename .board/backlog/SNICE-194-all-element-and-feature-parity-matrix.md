---
id: SNICE-194
title: "Enforce all-element and all-feature parity"
epic: rust-support
priority: 194
created: 2026-08-12
deps: [SNICE-172, SNICE-175, SNICE-182, SNICE-184, SNICE-193]
---

## Goal

Prove that every released element and every contract feature is represented consistently across JavaScript and Rust surfaces.

## Notes

Exhaustive generated contract checks should cover the full catalog, while browser cases combine every-element smoke tests with deep archetype tests to avoid a brittle combinatorial suite.

## Acceptance criteria

- [ ] One canonical matrix enumerates each released tag, family, module, field, attribute, method, event, slot, part, CSS property, form association, declarative child attribute, and required asset.
- [ ] Every row resolves to IR, CEM, distribution registration, snice-elements, Yew, Leptos, documentation, and a test disposition; WIP rows are absent.
- [ ] Every released element has a browser smoke fixture proving registration, construction, initial rendering, connection, reconnection, and absence of page/console errors.
- [ ] Feature archetypes deeply test every mapping class, event class, form behavior, lifecycle behavior, method shape, slot, styling hook, request/response path, and accessibility primitive.
- [ ] Per-component exceptions are allowlisted with owner, reason, test, and removal condition; unexplained unknown or missing surfaces fail.
- [ ] The matrix is generated or validated from the canonical contract so additions cannot bypass Rust parity.

## Worklog

- 2026-08-12: Uses exhaustive contract coverage plus focused runtime depth to satisfy all-elements/all-features verification.
