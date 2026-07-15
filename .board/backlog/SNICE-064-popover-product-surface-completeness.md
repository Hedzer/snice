---
id: SNICE-064
title: "complete popover tests, story, and public showcase"
epic: release
priority: 64
created: 2026-07-14
deps: []
---

## Goal
Give the published popover component the same direct unit, Storybook, card, full-showcase, documentation, and browser coverage as other shipped components.

## Notes
- Audit found popover published and documented without a direct component unit test, Storybook story, website card, or full showcase.
- Affected areas: `packages/components/src/popover/`, `tests/components/`, `website/showcases/popover/`, and both docs sets.

## Acceptance criteria
- [ ] the complete component checklist is satisfied without using generic smoke coverage as a substitute
- [ ] examples demonstrate trigger semantics, placement, interactive content, keyboard behavior, light/dark/no-theme, and fallback support
- [ ] source, built, CDN, React, Storybook, public website, and all-browser paths are exercised

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
