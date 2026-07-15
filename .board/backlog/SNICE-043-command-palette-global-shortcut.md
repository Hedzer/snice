---
id: SNICE-043
title: "make command-palette global shortcut actually global"
epic: behavior
priority: 43
created: 2026-07-14
deps: []
---

## Goal
Make the documented Ctrl/Cmd+K shortcut open command-palette when focus is anywhere in its intended document scope.

## Notes
- A real-browser probe showed the shortcut does not open when focus is outside the host.
- Affected implementation: `packages/components/src/command-palette/snice-command-palette.ts`, which registers keydown on the host.
- Multiple palettes and editable fields need an explicit ownership/conflict policy.

## Acceptance criteria
- [ ] the shortcut works from the documented scope and avoids text-entry conflicts according to an explicit rule
- [ ] multiple instances, disabled instances, reconnect, modifier differences, and teardown cannot create duplicate openings
- [ ] all-browser tests assert default prevention, selected owner, open event count, and focus placement

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
