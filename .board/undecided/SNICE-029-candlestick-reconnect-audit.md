---
id: SNICE-029
title: "verify candlestick reconnection safety"
epic: lifecycle
priority: 29
created: 2026-07-14
deps: []
---

## Goal
Determine whether candlestick restores responsive rendering after reconnection.

## Notes
- Source audit found ResizeObserver setup in `@ready` and teardown in `@dispose`.
- Affected implementation: `packages/components/src/candlestick/snice-candlestick.ts`.

## Acceptance criteria
- [ ] browser characterization covers detach, resize while detached, reinsert, data update, and repeated cycles
- [ ] any accepted fix prevents duplicate observers and restores identical rendering/event behavior
- [ ] observer lifetime is regression-tested in source and built customer paths

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
