---
id: SNICE-116
title: "test every component without theme CSS"
epic: quality
priority: 116
created: 2026-07-14
deps: []
---

## Goal
Enforce the policy that all shipped components remain usable and visually coherent when the Snice theme is absent.

## Notes
- The component checklist requires no-theme support, while the fallback audit found widespread missing terminal values.
- This ticket owns the recurring regression matrix; SNICE-111 owns fixing existing CSS.

## Acceptance criteria
- [ ] every published component renders and remains operable in a deterministic no-theme fixture
- [ ] critical computed tokens, focus, disabled/invalid state, overlays, and readable contrast are asserted without brittle whole-page snapshots
- [ ] source, built distribution, Storybook/public showcases where relevant, and all supported browsers run the matrix

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
