---
id: SNICE-046
title: "handle rejected command actions"
epic: async
priority: 46
created: 2026-07-14
deps: []
---

## Goal
Prevent rejected asynchronous command actions from becoming unhandled promises or leaving command-palette in a corrupt state.

## Notes
- Source audit found action promises invoked without a rejection path.
- Affected implementation: `packages/components/src/command-palette/snice-command-palette.ts`.

## Acceptance criteria
- [ ] sync throws, rejected promises, resolved promises, reentrancy, and close-during-action have documented outcomes
- [ ] loading, open state, selection, focus, and emitted success/error events settle exactly once
- [ ] tests listen for unhandled rejection and resolve adversarial action orders

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
