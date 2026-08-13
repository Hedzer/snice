---
id: SNICE-211
title: "Expose the same platform theme contract in every language"
epic: platform-themes
priority: 211
created: 2026-08-12
deps: [SNICE-174, SNICE-179, SNICE-200]
---

## Goal

Make `<snice-theme>` and its typed `theme`/`platform` contract first-class in vanilla JavaScript, React, Yew, Leptos, and future adapters without reimplementing themes.

## Acceptance criteria

- [ ] `<snice-theme>` is present in the canonical component contract, generated metadata, package exports, documentation, and all applicable language bindings.
- [ ] React, Yew, and Leptos expose strongly typed supported theme/platform pairs while rendering the same custom element and attributes.
- [ ] Nested provider, runtime switch, SSR/hydration, asset readiness, and invalid-pair behavior are identical across frameworks.
- [ ] Yew and Leptos create-app templates can select and load a profile without manual JavaScript or untyped attribute escape hatches.
- [ ] Cross-framework browser tests render the same fixture and compare computed tokens, parts, screenshots, events, focus, forms, and interaction behavior.
- [ ] No adapter owns a parallel theme implementation or context-only API.

## Worklog

- 2026-08-12: Connected platform theming to the Rust expansion while keeping web components as the runtime boundary.
