---
id: SNICE-080
title: "make estimate qrData render a QR code"
epic: behavior
priority: 80
created: 2026-07-14
deps: []
---

## Goal
Make estimate `qrData` generate documented QR output or remove the inert property in favor of slot-only composition.

## Notes
- Source audit found `qrData` declared but unused; only manual slot content is effective.
- Affected implementation: `packages/components/src/estimate/snice-estimate.ts`.

## Acceptance criteria
- [ ] property-versus-slot precedence, encoding, empty/invalid/large data, print, and accessibility are documented
- [ ] generated output works in source, built, CDN, print, and no-JavaScript fallback expectations
- [ ] tests decode or otherwise verify actual QR payload rather than checking for a placeholder

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
