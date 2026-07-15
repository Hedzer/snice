---
id: SNICE-070
title: "support non-mouse sortable interaction"
epic: accessibility
priority: 70
created: 2026-07-14
deps: []
---

## Goal
Make sortable reordering usable with keyboard and robust pointer/touch input, with accessible state announcements.

## Notes
- Audit found sorting centered on mouse-style drag behavior without a complete keyboard/touch model.
- Affected implementation: `packages/components/src/sortable/snice-sortable.ts`.

## Acceptance criteria
- [ ] pickup, move, drop, cancel, boundaries, disabled items, handles, and cross-group moves have documented keyboard behavior
- [ ] pointer capture supports touch and pen without scrolling/selection regressions
- [ ] all-browser accessibility tests assert focus, order, live announcements, events, cancellation, and DOM/data agreement

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
