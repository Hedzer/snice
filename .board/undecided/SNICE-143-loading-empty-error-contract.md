---
id: SNICE-143
title: "standardize loading, empty, and error composition"
epic: dx
priority: 143
created: 2026-07-14
deps: []
---

## Goal
Decide on a consistent native web-component contract for loading, empty, and error states across data-bearing components.

## Notes
- Audit found inconsistent state properties, hard-coded messages, slots, aria-busy use, and async error handling.
- The contract should prefer ordinary properties, events, and named slots; no framework directives or render-prop syntax.

## Acceptance criteria
- [ ] representative list, select, table, chart, feed, gallery, and command components map current states to a proposed minimal contract
- [ ] aria-busy, stale data, retry, cancellation, typed error detail, empty-versus-filtered-empty, and custom content precedence are explicit
- [ ] if accepted, incremental migration preserves component-specific useful behavior with docs and browser accessibility tests

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
