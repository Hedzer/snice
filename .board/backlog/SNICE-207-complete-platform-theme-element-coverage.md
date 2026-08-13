---
id: SNICE-207
title: "Complete Apple and Android treatment for every element"
epic: platform-themes
priority: 207
created: 2026-08-12
deps: [SNICE-202, SNICE-204, SNICE-206]
---

## Goal

Apply the approved iOS and Android recipes to the complete released element catalog, including every variant, state, slot, CSS part, and responsive composition.

## Acceptance criteria

- [ ] The canonical manifest reports 100% element and public-variant coverage for both required theme/platform pairs.
- [ ] Primitive controls, form controls, navigation, overlays, data display, data visualization, media, commerce, productivity, and application-level composites are all represented.
- [ ] Empty, loading, partial, success, warning, error, disabled, read-only, selected, expanded, dragged, focused, overflow, dense, responsive, RTL, and long/localized-content states are covered where applicable.
- [ ] Existing hard-coded styles or inaccessible shadow internals that prevent fidelity are converted to semantic theme hooks without breaking the default theme.
- [ ] Generated output contains no accidental cross-platform selector, token, font, icon, motion, or geometry leakage.
- [ ] New elements cannot be released until both required platform classifications and recipes exist or an explicit release exception is approved.
- [ ] Direct unthemed usage and all existing component contracts remain backward compatible.

## Worklog

- 2026-08-12: Set complete catalog coverage as the finish line rather than a showcase subset.
