---
id: SNICE-071
title: "make tree expandOnClick work"
epic: behavior
priority: 71
created: 2026-07-14
deps: []
---

## Goal
Make the public `expandOnClick` property control row-click expansion or remove the inert API intentionally.

## Notes
- Source audit found the property declared and exposed in stories but not consumed by tree behavior.
- Affected implementation: `packages/components/src/tree/snice-tree.ts`.

## Acceptance criteria
- [ ] row, disclosure, checkbox, link/action, double-click, selection, and keyboard interactions have unambiguous precedence
- [ ] runtime toggles and nested nodes behave consistently without duplicate expansion events
- [ ] unit, story, docs, and browser tests assert observable behavior in property-array and declarative modes

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
