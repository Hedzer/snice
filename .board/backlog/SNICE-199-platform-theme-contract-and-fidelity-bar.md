---
id: SNICE-199
title: "Define the platform theme contract and fidelity release bar"
epic: platform-themes
priority: 199
created: 2026-08-12
deps: []
---

## Goal

Define a public, framework-neutral contract for platform themes and make native visual and behavioral fidelity a measurable release requirement.

## Notes

The API is ordinary web-component markup, with no `data-*` convention and no framework-owned provider:

```html
<snice-theme theme="glass" platform="ios">
  <!-- any application subtree -->
</snice-theme>
```

"Perfect" means visually and thematically faithful in every supported state, with platform-correct behavior where the web can express it. When a Snice element has no native counterpart, its treatment must follow the target platform's current design guidance instead of borrowing another platform's control.

## Acceptance criteria

- [ ] `theme` and `platform` are reflected, typed attributes/properties with a versioned registry of supported pairs.
- [ ] The initial required pairs are `theme="glass" platform="ios"` and `theme="material" platform="android"`.
- [ ] The fidelity rubric covers geometry, typography, color, material, elevation, icon treatment, spacing, density, every interactive state, motion, focus, keyboard, pointer, touch, accessibility, light/dark appearance, contrast preferences, and reduced motion/transparency.
- [ ] Each profile pins the official platform-guideline version or release target it implements, and upstream design changes trigger an explicit compatibility review.
- [ ] Unsupported or invalid theme/platform pairs have deterministic diagnostics and fallback behavior; Snice never silently blends two platforms.
- [ ] Browser-imposed limits such as unavailable haptics or OS-private APIs are identified precisely, without lowering the visual and browser-expressible behavioral bar.
- [ ] Profile names, compatibility claims, screenshots, fonts, icons, and other assets pass trademark, license, and provenance review before release.

## Worklog

- 2026-08-12: Established exact platform fidelity and guideline-based non-native treatment as the governing contract.
