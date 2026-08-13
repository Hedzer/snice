---
id: SNICE-208
title: "Gate platform fidelity with real-device visual and interaction tests"
epic: platform-themes
priority: 208
created: 2026-08-12
deps: [SNICE-207]
---

## Goal

Prove visual, thematic, and behavioral fidelity against pinned platform references on representative real devices and browsers.

## Acceptance criteria

- [ ] A reference corpus records approved native controls/compositions and official-guideline examples for every mapped archetype, state, mode, and required accessibility setting.
- [ ] Deterministic visual tests cover actual iOS Safari and Android Chrome device classes, with additional browser coverage for the web component contract.
- [ ] Visual comparison policy defines zero-tolerance structural/state errors and reviewed rendering tolerances for antialiasing, font rasterization, compositing, and device-pixel differences.
- [ ] Interaction tests cover touch, pointer, keyboard, focus, scroll, drag, selection, open/close, validation, navigation, animation interruption, and reduced-motion behavior.
- [ ] Light/dark, increased/high contrast, reduced transparency, zoom/font scaling, RTL, localization, responsive/adaptive breakpoints, and safe areas are included.
- [ ] Performance captures detect glass-compositing regressions, dropped animation frames, layout instability, and input latency on minimum supported devices.
- [ ] Automated evidence plus named design review is required before a profile can claim native fidelity.

## Worklog

- 2026-08-12: Made actual device evidence and human visual review release gates for the word "perfect."
