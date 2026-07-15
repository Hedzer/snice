---
id: SNICE-042
title: "remove nested interactive menu triggers"
epic: accessibility
priority: 42
created: 2026-07-14
deps: []
---

## Goal
Give menu one valid trigger in the tab order instead of wrapping an already interactive slotted trigger in another interactive host.

## Notes
- Audit found nested interactive semantics and potentially two competing focus/activation targets.
- Affected implementation: `packages/components/src/menu/snice-menu.ts` and trigger slot contract.

## Acceptance criteria
- [ ] the slotted trigger retains its native semantics, name, disabled state, and keyboard activation
- [ ] aria-expanded, aria-haspopup, and controls ownership land on the actual trigger without a duplicate tab stop
- [ ] browser accessibility tests cover native buttons, Snice buttons, links where supported, disabled triggers, and trigger replacement

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
