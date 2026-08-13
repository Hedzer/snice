---
id: SNICE-212
title: "Add a Windows Fluent enterprise profile"
epic: platform-themes
priority: 212
created: 2026-08-12
deps: [SNICE-200, SNICE-201, SNICE-202, SNICE-216]
---

## Goal

Implement `theme="fluent" platform="windows"` as the highest-value third platform profile for Windows, Microsoft 365, Dynamics, and enterprise application adoption.

## Notes

The target must pin the current official Fluent 2 and Windows guidance, including Windows-specific material and input behavior where Fluent's cross-platform guidance varies.

This is a conditional portfolio profile. Full implementation starts only after SNICE-216 records a theme-specific `GO`; a high-cost result returns this story to product ROI review without weakening its fidelity requirements.

Official references: https://fluent2.microsoft.design/ and https://learn.microsoft.com/windows/apps/design/

## Acceptance criteria

- [ ] SNICE-216 records a `GO` for Fluent within the approved product, runtime, testing, and maintenance cost envelopes.
- [ ] The profile has its own complete element-equivalence/fallback map and pinned Fluent/Windows version.
- [ ] Typography, spacing, geometry, color, elevation, Mica/Acrylic-like materials where appropriate, icons, density, and every control state match the approved Windows references.
- [ ] Mouse, keyboard, touch, focus, selection, menus, dialogs, navigation, window-adjacent layouts, and motion follow Windows behavior rather than iOS or Android conventions.
- [ ] Desktop density, high contrast, forced colors, text scaling, reduced motion/transparency, and enterprise accessibility requirements are first-class modes.
- [ ] All released Snice elements receive direct, composite, or guideline-derived treatment and pass the common real-device/browser conformance harness.
- [ ] Licensing and trademark review permits the shipped implementation and claims without copying Microsoft source or restricted assets.

## Worklog

- 2026-08-12: Prioritized Fluent as the strongest additional OS and enterprise-revenue profile.
- 2026-08-12: Made full implementation conditional on its measured marginal theme cost.
