---
id: SNICE-035
title: "verify chat reconnection listener safety"
epic: lifecycle
priority: 35
created: 2026-07-14
deps: []
---

## Goal
Determine whether chat keyboard and file-input listeners remain correct across rerenders and reconnection.

## Notes
- Source audit found host keydown setup/teardown plus anonymous file-input change handlers.
- Affected implementation: `packages/components/src/chat/snice-chat.ts`.

## Acceptance criteria
- [ ] browser characterization covers reconnect, file-input replacement, rerender, keyboard send, and repeated cycles
- [ ] accepted fixes install one effective handler per target and remove obsolete handlers
- [ ] tests assert no duplicate messages, picker actions, or retained detached inputs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
