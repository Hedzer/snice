---
id: SNICE-134
title: "introduce a shared overlay foundation"
epic: dx
priority: 134
created: 2026-07-14
deps: []
---

## Goal
Decide whether modal, drawer, popover, menu, command-palette, select, and related overlays should share one platform-level behavior foundation.

## Notes
- Candidate responsibilities: stack ownership, topmost Escape, reference-counted scroll lock, focus entry/trap/restore, inert background, outside interaction, placement, trigger relationships, and reconnect.
- Individual overlay defects remain separate backlog cards.
- The API must remain web-component-native and must not introduce element refs, actions, directives, portals-as-framework-syntax, SSR, or hydration.

## Acceptance criteria
- [ ] a concrete design shows modal and nonmodal overlays, anchored popups, nested stacks, native popover support, and fallback behavior
- [ ] shared policy versus component-owned UX is explicitly separated and public APIs remain independently understandable
- [ ] if accepted, browser-first conformance tests prove nesting, focus, scroll, dismissal, reconnect, and all supported engines before migration

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
