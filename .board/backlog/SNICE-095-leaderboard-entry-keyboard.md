---
id: SNICE-095
title: "make leaderboard entries keyboard operable"
epic: accessibility
priority: 95
created: 2026-07-14
deps: []
---

## Goal
Expose interactive leaderboard entries as meaningful keyboard-operable controls without changing static rows into fake buttons.

## Notes
- Audit identified pointer-only entry interaction in `packages/components/src/leaderboard/`.

## Acceptance criteria
- [ ] actionability is explicit per entry and static entries retain list/table semantics
- [ ] keyboard activation, focus visibility, selection/current state, nested links/actions, and reranking are correct
- [ ] browser tests cover mixed actionable/static rows, dynamic data, all interaction modes, and event detail

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
