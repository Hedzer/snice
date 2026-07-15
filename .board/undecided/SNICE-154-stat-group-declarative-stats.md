---
id: SNICE-154
title: "add declarative stat-group children"
epic: dx
priority: 154
created: 2026-07-14
deps: []
---

## Goal
Decide how stat-group accepts authored stat child elements alongside object data.

## Notes
- The project policy explicitly lists stat-group as a collection that should support declarative children.
- The group must add layout, size normalization, responsive behavior, and aggregate semantics where applicable.

## Acceptance criteria
- [ ] child vocabulary, array/child precedence, ordering, responsive layout, shared size/variant, and mutation are defined
- [ ] individual stat elements remain usable outside the group
- [ ] if accepted, docs, stories, website, adapters, builds, and browser tests cover both APIs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
