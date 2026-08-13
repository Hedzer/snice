---
id: SNICE-205
title: "Match the current Android Material visual language"
epic: platform-themes
priority: 205
created: 2026-08-12
deps: [SNICE-200, SNICE-201, SNICE-202]
---

## Goal

Implement `theme="material" platform="android"` with faithful current Material 3 visual hierarchy and Android-guided treatment for non-native elements.

## Notes

The target must track the current official Material 3 guidance, including Material 3 Expressive where it is the current Android pattern, rather than freezing an older generic Material look.

Official reference: https://m3.material.io/

## Acceptance criteria

- [ ] Color roles, tonal surfaces, typography, shape families, elevation, state layers, icon metrics, spacing, density, and light/dark appearance match the pinned Material release.
- [ ] Native analogues match the Android/Material anatomy and all enabled, pressed, focused, hovered, dragged, selected, loading, error, and disabled states.
- [ ] Buttons, FABs, app bars, navigation, sheets, dialogs, menus, lists, cards, chips, text fields, selection controls, date/time controls, and feedback patterns follow their official variants and usage rules.
- [ ] Dynamic-color behavior has a deterministic web contract, accessible fallbacks, and stable server rendering without pretending inaccessible OS-private palette APIs are available.
- [ ] Non-native Snice elements use the mapping from SNICE-202 and look intentionally designed for Android rather than reskinned from iOS or the default theme.
- [ ] Compact, medium, and expanded layouts use the correct adaptive Material compositions.
- [ ] High contrast, forced colors where applicable, font scaling, and complex content remain usable without destroying the Material hierarchy.

## Worklog

- 2026-08-12: Chose current Material 3, not a legacy generic Material skin, as the Android target.
