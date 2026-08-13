---
id: SNICE-204
title: "Match iOS interaction, navigation, and motion behavior"
epic: platform-themes
priority: 204
created: 2026-08-12
deps: [SNICE-203]
---

## Goal

Make the iOS profile behave like the corresponding iOS controls and official compositions wherever the browser platform can express that behavior.

## Acceptance criteria

- [ ] Touch targets, pressed/highlighted/selected/disabled behavior, focus transitions, gesture thresholds, scrolling, overscroll-sensitive surfaces, and selection feedback match the pinned iOS reference.
- [ ] Control, overlay, sheet, menu, disclosure, navigation, and dismissal motion uses platform-correct timing, easing/spring character, layering, and interruption behavior.
- [ ] Keyboard, pointer, hover-capable iPad, touch, VoiceOver, text scaling, orientation, and safe-area behavior are covered without degrading standard web semantics.
- [ ] Form controls preserve native web form behavior while matching iOS editing, validation, clear/reveal affordances, and focus presentation.
- [ ] Browser history and URL behavior remain correct for navigation patterns; visual fidelity does not create fake native navigation.
- [ ] Reduced-motion and reduced-transparency settings receive platform-appropriate alternate behavior.
- [ ] OS-only behavior such as unavailable haptics is neither falsely claimed nor simulated in a way that conflicts with user/device expectations.

## Worklog

- 2026-08-12: Separated behavioral conformance from the visual material implementation.
