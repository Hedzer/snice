---
id: SNICE-099
title: "make paint swatches keyboard operable"
epic: accessibility
priority: 99
created: 2026-07-14
deps: []
---

## Goal
Expose paint color/tool swatches as a keyboard-operable selection group with non-color names.

## Notes
- Audit identified pointer-only swatches in `packages/components/src/paint/`.

## Acceptance criteria
- [ ] swatches expose semantic selection, color/tool names, current state, visible focus, and a documented key model
- [ ] custom palettes, transparent/duplicate colors, disabled tools, and runtime updates remain usable
- [ ] browser tests cover keyboard selection, announcements, contrast/forced-colors, and emitted changes

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
