---
id: SNICE-030
title: "verify flow reconnection safety"
epic: lifecycle
priority: 30
created: 2026-07-14
deps: []
---

## Goal
Determine whether flow restores resize, SVG, and document drag listeners after reconnection.

## Notes
- Source audit found one-shot observer setup plus several manually installed SVG/document listeners.
- Affected implementation: `packages/components/src/flow/snice-flow.ts`.

## Acceptance criteria
- [ ] browser characterization covers pan, zoom, drag, resize, detach during drag, and repeated reconnection
- [ ] accepted fixes install each local/global listener once and remove every active listener safely
- [ ] listener and observer leak assertions run against source and built artifacts

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
