---
id: SNICE-076
title: "support or reject variable virtual row heights"
epic: behavior
priority: 76
created: 2026-07-14
deps: []
---

## Goal
Stop per-item heights from overlapping or leaving gaps when virtual-scroller offsets remain fixed.

## Notes
- Audit found item height can vary while offset calculation assumes fixed rows.
- Affected implementation: `packages/components/src/virtual-scroller/snice-virtual-scroller.ts`.
- A deliberately fixed-height contract is acceptable only if enforced and documented.

## Acceptance criteria
- [ ] one fixed-height or measured-variable-height contract is chosen and enforced end to end
- [ ] scroll anchoring, range calculation, resize, dynamic content, prepend/append, and jumps do not overlap or gap
- [ ] browser tests use adversarial height patterns and compare visible positions, extent, and item identity

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
