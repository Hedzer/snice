---
id: SNICE-209
title: "Document and demonstrate scoped platform themes"
epic: platform-themes
priority: 209
created: 2026-08-12
deps: [SNICE-207]
---

## Goal

Provide a complete theme lab, examples, and documentation for applying, nesting, validating, and extending platform profiles.

## Acceptance criteria

- [ ] Storybook includes full iOS Glass and Android Material application stories using real Snice elements, not static mockups.
- [ ] Stories expose every component archetype and state, light/dark and accessibility modes, responsive/adaptive layouts, and non-native fallback decisions.
- [ ] A nested-scope story proves that a whole app can use one profile while a subsection uses another through ordinary `<snice-theme theme="…" platform="…">` markup.
- [ ] Documentation explains supported pairs, exact fidelity target, pinned guideline versions, bundle loading, SSR, runtime changes, invalid pairs, fallbacks, and browser/OS limitations.
- [ ] Vanilla, React, Yew, and Leptos examples use the same provider element and show no framework-specific theming API.
- [ ] Guidance distinguishes platform imitation from official endorsement and documents asset/font/icon provenance.
- [ ] Public examples are covered by browser smoke and accessibility tests.

## Worklog

- 2026-08-12: Reserved Storybook for the eventual executable theme lab rather than using stories as the design source of truth.
