---
id: SNICE-202
title: "Map every element to native equivalents and guideline fallbacks"
epic: platform-themes
priority: 202
created: 2026-08-12
deps: [SNICE-199, SNICE-201]
---

## Goal

Produce a versioned design and behavior map for every released Snice element on every supported platform profile.

## Notes

Each element must be classified as: a direct native analogue, a composition of official platform patterns, or a Snice-specific capability with no native analogue. The last category still receives a target-platform treatment derived from the platform's layout, hierarchy, interaction, and accessibility guidance.

## Acceptance criteria

- [ ] Every released element and public variant is present in the matrix; coverage is checked against the canonical component contract so new elements cannot bypass classification.
- [ ] Direct analogues identify the reference control, anatomy, states, interaction model, sizing, motion, and accessibility behavior.
- [ ] Composite elements identify the official patterns used and how their hierarchy and responsive behavior combine.
- [ ] Elements without a native equivalent document a platform-guideline rationale and never default to the visual or behavioral conventions of another platform.
- [ ] Ambiguous mappings require design review with recorded evidence from current official guidance.
- [ ] The map is structured generator input, not only prose, and changes produce a reviewable coverage diff.
- [ ] Reference links and captured observations record source, date, platform version, color mode, accessibility settings, viewport/device, and interaction method.

## Worklog

- 2026-08-12: Made non-native fallback treatment an explicit per-element design decision.
