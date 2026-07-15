---
id: SNICE-036
title: "restore drawer breakpoint behavior after reconnection"
epic: lifecycle
priority: 36
created: 2026-07-14
deps: []
---

## Goal
Reattach drawer media-query and global listeners correctly after remove/reinsert cycles.

## Notes
- Source audit found the breakpoint listener removed during disposal without a guaranteed recreated MediaQueryList path.
- Affected implementation: `packages/components/src/drawer/snice-drawer.ts`.
- This ticket is limited to lifecycle; inline-state semantics are separate.

## Acceptance criteria
- [ ] each connection has one active breakpoint listener and each disconnection has none
- [ ] open, inline, modal, Escape, focus, and breakpoint transitions after reconnect match a fresh drawer
- [ ] browser tests cover repeated cycles at both sides of the breakpoint and detect duplicate global handlers

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
