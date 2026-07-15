---
id: SNICE-113
title: "honor reduced-motion across animated components"
epic: accessibility
priority: 113
created: 2026-07-14
deps: []
---

## Goal
Ensure every nonessential component animation and transition has an appropriate prefers-reduced-motion behavior.

## Notes
- Audit found 51 component CSS files with animation but only eight containing reduced-motion handling.
- Essential state changes must remain understandable; reduced motion does not mean hiding final state.

## Acceptance criteria
- [ ] every animation is classified as essential, reducible, removable, or user-controlled
- [ ] CSS and script-driven motion settle immediately or use an accepted reduced alternative without breaking events/focus
- [ ] browser fixtures assert computed motion, final state, timing-sensitive events, and runtime preference changes where supported

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
