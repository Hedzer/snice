---
id: SNICE-161
title: "reassess the default host containment contract"
epic: styling
priority: 161
created: 2026-07-14
deps: []
---

## Goal
Decide whether `contain: layout style paint` should remain a universal component-host default when it can prevent expected flex stretching.

## Notes
- `.ai/coding-standards.md` records the current workaround: add `width: 100%` when host containment blocks `align-items: stretch`.
- This is not automatically a reason to remove containment; layout isolation, paint clipping, overlay behavior, intrinsic sizing, performance, and container queries need evidence.
- The warning remains durable policy until a safer default or explicit component classification is accepted and shipped.

## Acceptance criteria
- [ ] representative inline, block, flex, grid, intrinsically sized, overflow, overlay, and container-query components are characterized with and without each containment axis
- [ ] universal containment, component-specific containment, `contain: content`, `contain: style`, and explicit sizing workarounds are compared for DX, correctness, accessibility, and measured performance
- [ ] if changed, source, built distribution, Storybook, public showcases, light/dark/no-theme, container-width, and all-browser tests prove layout parity or intentional improvements

## Worklog
- 2026-07-14: created from the active Known Gotcha in `.ai/coding-standards.md` for one-by-one product review.
