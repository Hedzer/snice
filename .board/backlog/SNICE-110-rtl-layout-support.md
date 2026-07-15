---
id: SNICE-110
title: "establish complete RTL layout support"
epic: styling
priority: 110
created: 2026-07-14
deps: []
---

## Goal
Make components that express direction or placement work correctly in right-to-left documents.

## Notes
- Audit counted 475 physical left/right declarations, no logical-property adoption, and no RTL-specific component rules.
- This is a cross-cutting policy implementation, not a blind mechanical replacement; charts, coordinates, timelines, media, and intentional physical directions need explicit decisions.

## Acceptance criteria
- [ ] every component is classified as logical, intentionally physical, mirrored, or direction-independent
- [ ] layout, icons, keyboard direction, scroll, placement, animation, and start/end APIs match that classification
- [ ] source, built, Storybook, website, and browser fixtures exercise LTR/RTL without clipping, reversed semantics, or regressions

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
