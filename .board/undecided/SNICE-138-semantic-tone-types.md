---
id: SNICE-138
title: "standardize semantic tone names"
epic: dx
priority: 138
created: 2026-07-14
deps: []
---

## Goal
Decide whether component variants should share one semantic tone vocabulary, especially `danger` versus `error`.

## Notes
- Audit found inconsistent tone naming across component public types.
- The proposal must distinguish visual tone, validation state, alert severity, destructive action, and domain status rather than flattening them blindly.

## Acceptance criteria
- [ ] current variants are inventoried with semantics and intentional component-specific exceptions
- [ ] a shared base type and extension pattern demonstrates compatibility, CSS tokens, docs, and migration aliases
- [ ] if accepted, types, runtime attributes, styling, metadata, React, docs, and tests stay aligned without changing meaning

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
