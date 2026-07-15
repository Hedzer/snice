---
id: SNICE-037
title: "repair list observer and wheel listener lifecycle"
epic: lifecycle
priority: 37
created: 2026-07-14
deps: []
---

## Goal
Make list infinite-scroll observers and wheel handlers removable, reconnectable, and duplicate-free.

## Notes
- Affected implementation: `packages/components/src/list/snice-list.ts`.
- The wheel listener is anonymous and never removed; IntersectionObserver is disconnected but not reliably recreated; slot/controller handlers also need lifetime accounting.

## Acceptance criteria
- [ ] every listener and observer has stable identity, one owner, exact teardown, and exact reconnection
- [ ] infinite loading, keyboard/list roles, and wheel behavior match a fresh list after repeated remove/reinsert cycles
- [ ] browser tests assert behavior and listener/observer counts, including detach while loading

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
