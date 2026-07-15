---
id: SNICE-153
title: "add declarative split-button actions"
epic: dx
priority: 153
created: 2026-07-14
deps: []
---

## Goal
Decide how split-button accepts authored action/menu-item children alongside data objects.

## Notes
- Audit identified split-button as a natural collection/composition API candidate.
- Primary action and secondary actions must remain semantically distinct.

## Acceptance criteria
- [ ] primary content, action children, IDs/values, disabled state, icons, separators/groups, precedence, and events are concrete
- [ ] keyboard/menu behavior is accessible and ordinary slotted buttons/items do not create nested controls
- [ ] if accepted, property and declarative examples/tests cover every shipped surface

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
