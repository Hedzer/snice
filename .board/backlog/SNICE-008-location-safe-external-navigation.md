---
id: SNICE-008
title: "harden location external navigation"
epic: security
priority: 8
created: 2026-07-14
deps: []
---

## Goal
Make location-card navigation scheme-safe and prevent opened pages from receiving an opener reference.

## Notes
- Affected implementation: `packages/components/src/location/snice-location.ts`, which calls `window.open(url, '_blank')`.
- The same component also exposes a clickable-card UX, so mouse and keyboard paths must share the exact navigation policy.
- This ticket is separate from general location accessibility.

## Acceptance criteria
- [ ] unsafe schemes are rejected and allowed external destinations use `noopener` behavior
- [ ] mouse, keyboard, and programmatic activation have identical outcomes and event ordering
- [ ] browser tests inspect the opened target parameters and exercise the shared adversarial URL matrix

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
