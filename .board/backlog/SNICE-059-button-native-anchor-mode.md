---
id: SNICE-059
title: "render a real anchor when button has href"
epic: semantics
priority: 59
created: 2026-07-14
deps: []
---

## Goal
Preserve native link semantics when `snice-button` represents navigation instead of imperatively navigating from a `<button>`.

## Notes
- Current implementation always renders a button and emulates navigation with `window.location` or `window.open`.
- Affected implementation: `packages/components/src/button/snice-button.ts`.
- This must compose with URL safety, target/rel, download, focus, disabled, loading, and event contracts.

## Acceptance criteria
- [ ] href mode exposes a real anchor with native keyboard, status-bar, context-menu, copy, target, rel, and download behavior
- [ ] action/submit/reset modes remain real buttons and mode changes preserve focus and accessibility
- [ ] source, built, CDN, React, and all-browser tests cover the complete mode and attribute matrix

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
