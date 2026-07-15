---
id: SNICE-048
title: "reference-count modal scroll locking"
epic: overlays
priority: 48
created: 2026-07-14
deps: []
---

## Goal
Keep document scrolling locked until the final modal that owns the lock closes.

## Notes
- A real-browser probe opened two modals and found closing one unlocked the body while the other remained open.
- Affected implementation: `packages/components/src/modal/snice-modal.ts`.
- Pre-existing body styles and scrollbar compensation must be preserved.

## Acceptance criteria
- [ ] multiple modals, out-of-order close, disconnect, open-property changes, and abrupt removal retain correct lock ownership
- [ ] the final release restores the exact pre-modal document styles without clobbering application changes
- [ ] all-browser tests assert computed scrolling, style restoration, nested overlays, and no leaked ownership

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
