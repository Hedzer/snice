---
id: SNICE-200
title: "Ship the scoped snice-theme web component"
epic: platform-themes
priority: 200
created: 2026-08-12
deps: [SNICE-199]
---

## Goal

Allow a platform theme to cover an entire application or any nested subsection through a real `<snice-theme>` custom element.

## Notes

The provider must remain light-DOM friendly and framework neutral. A nested provider owns its subtree and can override its parent without leaking styles in either direction.

## Acceptance criteria

- [ ] `<snice-theme theme="…" platform="…">` scopes the selected profile to all descendant Snice elements, including dynamically inserted descendants.
- [ ] A nested `<snice-theme>` cleanly overrides the outer provider from its own boundary and restores the outer profile after the nested subtree.
- [ ] The element renders safely before custom-element upgrade, under SSR, during hydration, and when moved, disconnected, or reconnected.
- [ ] Theme propagation uses standard custom-element mechanisms such as inherited custom properties and exported CSS parts, not framework context or `data-*` attributes.
- [ ] Theme changes are reactive without replacing descendant elements or losing their state, focus, form association, selection, scroll position, or event listeners.
- [ ] Default unwrapped Snice usage remains backward compatible.
- [ ] Vanilla HTML, React, Yew, Leptos, and other consumers use the same markup and semantics.

## Worklog

- 2026-08-12: Chose a scoped web component so whole-app and subsection theming share one native API.
