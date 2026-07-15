---
id: SNICE-155
title: "add declarative timeline items"
epic: dx
priority: 155
created: 2026-07-14
deps: []
---

## Goal
Decide how timeline supports authored child items alongside its data-array API.

## Notes
- Audit identified timeline as a natural dual-API collection.
- Order, dates, status, alternating layout, connectors, and accessibility must be preserved.

## Acceptance criteria
- [ ] child vocabulary, IDs, temporal/display ordering, array/child precedence, mutation, layout, and events are explicit
- [ ] declarative markup stays readable and usable without a Snice-specific expression language
- [ ] if accepted, all public docs/artifacts and browser tests cover equivalent array and child behavior

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
