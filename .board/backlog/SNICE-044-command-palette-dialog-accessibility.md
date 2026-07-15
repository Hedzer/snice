---
id: SNICE-044
title: "complete command-palette dialog and combobox accessibility"
epic: accessibility
priority: 44
created: 2026-07-14
deps: []
---

## Goal
Make command-palette behave as an accessible modal command search with reliable focus containment, background isolation, and list semantics.

## Notes
- Audit found incomplete focus trapping/restoration, inert background behavior, and combobox/listbox relationships.
- Affected implementation: `packages/components/src/command-palette/snice-command-palette.ts` and styles.

## Acceptance criteria
- [ ] open places focus predictably, Tab stays within the palette, Escape closes the topmost palette, and close restores the initiating focus when possible
- [ ] dialog, combobox, listbox, option, active-descendant, result count, empty, and disabled command semantics are coherent
- [ ] browser accessibility tests cover keyboard-only use, nested overlays, dynamic results, removal of the opener, and assistive-state attributes

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
