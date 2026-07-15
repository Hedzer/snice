---
id: SNICE-112
title: "move component breakpoints to owned containers"
epic: styling
priority: 112
created: 2026-07-14
deps: []
---

## Goal
Make reusable component layout respond to its containing space rather than only the viewport.

## Notes
- Audit found 45 viewport max-width media queries but only one component container query and one unrelated container-type declaration.
- The video container query appears to lack a clear containment owner.
- Global application-level media preferences remain media queries; this ticket concerns reusable layout breakpoints.

## Acceptance criteria
- [ ] each layout breakpoint is classified and component-local breakpoints use an explicit containment owner
- [ ] components behave correctly in narrow sidebars within wide viewports and wide containers within narrow test shells where possible
- [ ] browser fixtures test multiple container widths, nesting, unsupported/fallback assumptions, and no size-containment regressions

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
