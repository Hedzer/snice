---
id: SNICE-051
title: "use nonmodal semantics for inline drawers"
epic: accessibility
priority: 51
created: 2026-07-14
deps: []
---

## Goal
Make inline or contained drawers stop advertising themselves as modal dialogs when they do not isolate the page.

## Notes
- Audit found inline/contained drawers retaining `role=dialog` and `aria-modal=true`.
- Affected implementation: `packages/components/src/drawer/snice-drawer.ts`.

## Acceptance criteria
- [ ] modal, nonmodal overlay, contained, and inline modes each expose appropriate roles, names, focus, backdrop, and Escape behavior
- [ ] changing mode while open updates semantics without focus loss or stale inert state
- [ ] browser accessibility tests assert the complete mode matrix

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
