---
id: SNICE-028
title: "verify binpack reconnection safety"
epic: lifecycle
priority: 28
created: 2026-07-14
deps: []
---

## Goal
Characterize and, if necessary, repair binpack observer and pointer-listener behavior across remove/reinsert cycles.

## Notes
- Source audit found one-shot `@ready` setup paired with destructive `@dispose` cleanup for resize observers and pointer listeners.
- Affected implementation: `packages/components/src/binpack/snice-binpack.ts`.
- Unlike grid and tabs, this candidate has not yet been browser-confirmed.

## Acceptance criteria
- [ ] a failing or exonerating real-browser characterization test covers repeated reconnection
- [ ] if defective, observers/listeners return exactly once and dragging/layout match a fresh instance
- [ ] the worklog records whether the finding was accepted, rejected, or split

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
