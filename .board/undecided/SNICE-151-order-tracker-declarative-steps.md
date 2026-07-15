---
id: SNICE-151
title: "add declarative order-tracker steps"
epic: dx
priority: 151
created: 2026-07-14
deps: []
---

## Goal
Decide how order-tracker supports authored milestone child elements alongside its array API.

## Notes
- Audit identified order-tracker as a natural dual-API collection.
- The container should retain sequencing, current/completed state, dates, and connectors.

## Acceptance criteria
- [ ] child vocabulary, order, IDs, state precedence, mutation, current-step derivation, and events are explicit
- [ ] property and child modes produce equivalent accessible timeline semantics
- [ ] if accepted, source, docs, stories, website, adapters, builds, and browser tests cover both APIs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
