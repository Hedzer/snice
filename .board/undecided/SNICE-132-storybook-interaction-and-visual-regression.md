---
id: SNICE-132
title: "decide Storybook interaction and visual regression coverage"
epic: quality
priority: 132
created: 2026-07-14
deps: []
---

## Goal
Decide whether curated Storybook interaction tests and screenshot-based visual regression add enough signal beyond semantic browser tests.

## Notes
- Project debugging policy forbids ad hoc screenshots, but a deliberate versioned visual-regression system is a distinct product decision.
- This must account for animation, fonts, browser differences, theme modes, review burden, storage, and false positives.

## Acceptance criteria
- [ ] the decision compares semantic assertions, Storybook play functions, image snapshots, DOM snapshots, and targeted computed-style checks
- [ ] if accepted, a small representative pilot defines deterministic capture, baselines, review/update workflow, browsers, modes, and failure artifacts
- [ ] the worklog records the accepted scope or explicit rejection without weakening existing behavioral gates

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
