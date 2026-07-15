---
id: SNICE-041
title: "move menu focus to real menu items"
epic: accessibility
priority: 41
created: 2026-07-14
deps: []
---

## Goal
Make Arrow-key menu navigation focus and announce the actual actionable menu item.

## Notes
- A real-browser probe showed ArrowDown leaving focus on the trigger.
- Affected implementation: `packages/components/src/menu/snice-menu.ts`; item hosts are not currently focusable targets.
- The chosen model must be either roving tabindex or active-descendant, not a visual-only selection.

## Acceptance criteria
- [ ] open, Arrow keys, Home, End, character navigation, Enter, Space, Escape, and Tab follow one documented menu pattern
- [ ] disabled, hidden, separator, nested, and dynamically inserted items are skipped correctly
- [ ] Chromium, Firefox, and WebKit tests assert active element, accessible roles/states, activation, close, and focus restoration

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
