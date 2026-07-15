---
id: SNICE-115
title: "audit focus-visible coverage"
epic: accessibility
priority: 115
created: 2026-07-14
deps: []
---

## Goal
Determine which focusable component surfaces lack a visible, high-contrast `:focus-visible` treatment and repair confirmed gaps.

## Notes
- Audit found focus-visible rules in 68 CSS files, which is not enough by itself to classify the remaining components.
- This card requires focusability inventory and browser evidence before bulk edits.

## Acceptance criteria
- [ ] every intentional tab stop is inventoried with its rendered focus indicator and contrast
- [ ] missing, clipped, obscured, low-contrast, mouse-only, and duplicate indicators are captured by component-specific evidence
- [ ] accepted fixes pass keyboard, light/dark/no-theme, forced-colors, and browser checks without showing focus rings on ordinary pointer activation

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
