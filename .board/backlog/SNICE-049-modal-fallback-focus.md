---
id: SNICE-049
title: "provide reliable modal fallback focus"
epic: accessibility
priority: 49
created: 2026-07-14
deps: []
---

## Goal
Guarantee an empty or temporarily noninteractive modal still receives focus and traps/restores it correctly.

## Notes
- Audit found the panel used as fallback without being focusable and a selector-based focus order that does not fully model composed DOM.
- Affected implementation: `packages/components/src/modal/snice-modal.ts`.

## Acceptance criteria
- [ ] the modal surface is programmatically focusable only when needed and never adds an unwanted ordinary tab stop
- [ ] slotted, shadow, disabled, hidden, radio-group, and dynamically changing focusables follow composed tab order
- [ ] browser tests cover empty panels, delayed content, nested shadow roots, removed opener, nested overlays, and close restoration

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
