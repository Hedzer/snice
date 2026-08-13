---
id: SNICE-203
title: "Match the iOS Liquid Glass visual language"
epic: platform-themes
priority: 203
created: 2026-08-12
deps: [SNICE-200, SNICE-201, SNICE-202]
---

## Goal

Implement `theme="glass" platform="ios"` with faithful iOS visual hierarchy, materials, controls, and platform-guided treatment for non-native elements.

## Notes

Apple describes Liquid Glass as a functional layer for controls and navigation above content, with regular and clear material variants. The profile must reproduce that role and restraint, not place a generic blur behind every surface.

Official reference: https://developer.apple.com/design/human-interface-guidelines/materials

## Acceptance criteria

- [ ] Materials reproduce the targeted iOS translucency, refraction/highlight impression, vibrancy, tinting, edge treatment, shadows, and content-dependent legibility as closely as browser rendering permits.
- [ ] Native analogues match iOS typography, metrics, corner geometry, control sizing, spacing, icon weight/alignment, safe-area treatment, light/dark appearance, and every visual state.
- [ ] Regular versus clear glass is selected according to content and legibility guidance, and content surfaces are not indiscriminately rendered as floating glass.
- [ ] Navigation bars, tab bars, toolbars, sheets, menus, dialogs, search, forms, selection controls, buttons, cards/lists, and feedback states have reference-approved compositions.
- [ ] Non-native Snice elements use the mapping from SNICE-202 and look intentionally designed for iOS rather than reskinned from the default theme.
- [ ] Increased contrast, reduced transparency, forced colors where applicable, and content over complex backgrounds remain legible and coherent.
- [ ] Unsupported material effects have a purpose-built iOS fallback rather than a visibly unrelated default style.

## Worklog

- 2026-08-12: Scoped Apple glass to iOS and made functional material hierarchy part of visual parity.
