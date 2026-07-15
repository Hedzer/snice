---
id: SNICE-072
title: "add declarative light-DOM tree items"
epic: dx
priority: 72
created: 2026-07-14
deps: []
---

## Goal
Decide whether tree should support authored `<snice-tree-item>` children alongside the existing property-data API.

## Notes
- The project policy requires collection components to support both array data and declarative child elements.
- Affected implementation: `packages/components/src/tree/`.
- This proposal uses normal custom elements and slots only; it does not introduce directives, refs, actions, two-way binding, or string-evaluated templates.

## Acceptance criteria
- [ ] property data and light-DOM children have explicit precedence, observation, nesting, key/identity, and event semantics
- [ ] declarative children remain independently accessible and styleable while the container adds navigation/selection behavior
- [ ] if accepted, docs, AI docs, Storybook, public showcase, React, CDN, mutation, and browser tests cover both APIs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
