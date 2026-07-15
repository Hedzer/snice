---
id: SNICE-031
title: "verify network-graph reconnection safety"
epic: lifecycle
priority: 31
created: 2026-07-14
deps: []
---

## Goal
Determine whether network-graph restores responsive and pointer behavior after reconnection.

## Notes
- Source audit found one-shot ResizeObserver setup and manually attached SVG/document handlers.
- Affected implementation: `packages/components/src/network-graph/snice-network-graph.ts`.

## Acceptance criteria
- [ ] browser characterization covers hover, selection, pan, zoom, drag, resize, detach during drag, and repeat cycles
- [ ] accepted fixes produce fresh-instance behavior with no duplicate callbacks
- [ ] source and built browser tests track observer and global-listener lifetime

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
