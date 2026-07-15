---
id: SNICE-127
title: "restore browser color-contrast testing"
epic: quality
priority: 127
created: 2026-07-14
deps: []
---

## Goal
Run meaningful automated contrast checks instead of globally disabling the axe color-contrast rule.

## Notes
- `tests/components/a11y-helpers.ts` disables color contrast and only one live spec currently references axe.
- Automated tools do not replace manual review, but obvious regressions should fail a browser gate.

## Acceptance criteria
- [ ] the reason for every remaining rule suppression is narrow, documented, and component-specific
- [ ] representative text, controls, focus, disabled/invalid states, overlays, light/dark/no-theme, and forced-colors-compatible cases are checked
- [ ] axe and complementary computed-style tests run in real browsers with actionable failure output and no blanket color-contrast disable

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
