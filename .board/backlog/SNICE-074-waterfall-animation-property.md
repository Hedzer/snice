---
id: SNICE-074
title: "make waterfall animated apply animation"
epic: behavior
priority: 74
created: 2026-07-14
deps: []
---

## Goal
Make the public `animated` property activate the shipped animation style with reduced-motion support or remove it.

## Notes
- CSS defines `.waterfall-bar-animated`, but a browser probe found no animation class when `animated` was enabled.
- Affected implementation: `packages/components/src/waterfall/snice-waterfall.ts` and CSS.

## Acceptance criteria
- [ ] initial render and data changes animate according to a documented policy without replaying unnecessarily
- [ ] runtime toggles and prefers-reduced-motion produce deterministic final geometry and no inaccessible delay
- [ ] browser tests assert classes/computed animation and reduced-motion behavior

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
