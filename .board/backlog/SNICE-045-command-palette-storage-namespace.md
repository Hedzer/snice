---
id: SNICE-045
title: "isolate command-palette recent-command storage"
epic: behavior
priority: 45
created: 2026-07-14
deps: []
---

## Goal
Prevent unrelated command-palette instances and applications from colliding in one fixed localStorage key.

## Notes
- Source audit found a fixed storage key for recent commands.
- Affected implementation: `packages/components/src/command-palette/snice-command-palette.ts`.
- Storage failure and private-mode behavior must be nonfatal.

## Acceptance criteria
- [ ] a public or derived namespace isolates intentional recent-command histories
- [ ] malformed, unavailable, quota-exceeded, migrated, and removed storage states fail safely
- [ ] tests cover multiple palettes, multiple documents/origins where practical, key changes, clearing, and deterministic ordering

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
