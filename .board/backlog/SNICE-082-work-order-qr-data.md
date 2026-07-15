---
id: SNICE-082
title: "make work-order qrData render a QR code"
epic: behavior
priority: 82
created: 2026-07-14
deps: []
---

## Goal
Make work-order `qrData` generate documented QR output or remove the inert property.

## Notes
- Source audit found `qrData` declared but unused.
- Affected implementation: `packages/components/src/work-order/snice-work-order.ts`.

## Acceptance criteria
- [ ] property/slot precedence, encoding, empty state, print behavior, and accessibility are explicit
- [ ] runtime changes replace the payload without stale nodes or duplicated output
- [ ] tests verify decoded payload across source, built, CDN, and print surfaces

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
