---
id: SNICE-055
title: "define popover focus behavior"
epic: accessibility
priority: 55
created: 2026-07-14
deps: []
---

## Goal
Give popover explicit focus-entry, keyboard navigation, dismissal, and restoration behavior appropriate to its content mode.

## Notes
- Audit found outside-click/Escape handling but no complete focus-management contract.
- Affected implementation: `packages/components/src/popover/snice-popover.ts`.
- Noninteractive hints and interactive popovers may need distinct modes rather than one accidental behavior.

## Acceptance criteria
- [ ] trigger, noninteractive content, interactive content, close, Escape, Tab, click-away, and removed-trigger outcomes are documented
- [ ] roles and aria relationships match the accepted interaction model
- [ ] browser accessibility tests cover slotted controls, nested overlays, shadow DOM, dynamic content, and focus restoration

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
