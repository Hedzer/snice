---
id: SNICE-206
title: "Match Android interaction, navigation, and motion behavior"
epic: platform-themes
priority: 206
created: 2026-08-12
deps: [SNICE-205]
status: superseded
absorbed_by: [PS-05]
---

## Goal

Make the Android profile reproduce Material state, input, navigation, and motion behavior wherever the browser can express it.

## Acceptance criteria

- [ ] Touch targets, state layers/ripples, pressed/selected/dragged/disabled behavior, focus, pointer hover, scrolling, and selection feedback match the pinned Android/Material reference.
- [ ] Container transforms, shared-axis changes, fades, elevation changes, sheets, dialogs, menus, navigation, and dismissals use current Material motion roles and interruption behavior.
- [ ] Touch, hardware keyboard, mouse/trackpad, TalkBack, font scaling, orientation, viewport resizing, and browser back behavior are covered.
- [ ] Text entry, validation, pickers, selection controls, menus, and transient feedback retain native web correctness while following Material interaction rules.
- [ ] Compact, foldable, tablet, and desktop-class Android layouts choose the official adaptive pattern rather than only stretching phone UI.
- [ ] Reduced motion, high contrast, and browser/OS capability limitations have explicit Android-consistent alternatives.
- [ ] Platform fidelity does not intercept standard browser behavior or create fake OS integration.

## Worklog

- 2026-08-12: Required Material behavior and adaptive composition in addition to visual tokens.
- 2026-11-26: Co-owned vertical slice with tree-shakeable platform-behaviors/material.ts in PS-05.
