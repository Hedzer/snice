---
id: SNICE-053
title: "give popover a single trigger tab stop"
epic: accessibility
priority: 53
created: 2026-07-14
deps: []
---

## Goal
Remove the duplicate tab stops created by a focusable popover wrapper around a focusable slotted trigger.

## Notes
- A real-browser probe found both wrapper and button in the tab order.
- Affected implementation: `packages/components/src/popover/snice-popover.ts` and trigger slot.

## Acceptance criteria
- [ ] only the actual trigger participates in normal tab order and owns expanded/popup relationships
- [ ] native buttons, Snice buttons, replacement triggers, disabled triggers, and programmatic open remain supported
- [ ] all-browser tests assert tab order, focus owner, accessible name, activation, and close restoration

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
