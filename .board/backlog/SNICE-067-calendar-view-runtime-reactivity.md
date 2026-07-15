---
id: SNICE-067
title: "react to calendar view changes after mount"
epic: behavior
priority: 67
created: 2026-07-14
deps: []
---

## Goal
Keep calendar classes, layout, navigation, and accessibility synchronized when `view` changes at runtime.

## Notes
- Source audit found initial class setup without a complete watcher/update path for the view property.
- Affected implementation: `packages/components/src/calendar/snice-calendar.ts`.
- This remains necessary whether all three views survive SNICE-066 or the accepted set is reduced.

## Acceptance criteria
- [ ] property and attribute changes after connection produce the exact same state as a fresh instance
- [ ] rapid changes, invalid values, focus, selected date, events, and resize do not retain stale view state
- [ ] tests compare fresh versus mutated markup, computed layout, ARIA, and interactions

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
