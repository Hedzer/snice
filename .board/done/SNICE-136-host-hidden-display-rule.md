---
id: SNICE-136
title: "ship :host([hidden]) display none on every component that sets :host display"
epic: styling
priority: 136
created: 2026-08-07
deps: []
---

## Goal
Every component whose CSS sets a `:host { display: ... }` rule must also ship `:host([hidden]) { display: none }`, so the `hidden` attribute (and `?hidden=${...}` bindings) actually hides the element.

## Notes
- Only 2 of 171 component CSS files (`packages/components/src/*/snice-*.css`) contain a `:host([hidden])` rule (message-strip, tab-panel).
- A `:host { display: ... }` rule beats the UA `[hidden]` rule, so the `hidden` attribute silently does nothing — attribute present, property true, element still visible and clickable.
- This is the only safe way to gate a region hosting a controller, since a conditional branch would detach it.
- Confirmed bug from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] every component that sets a `:host` display gets `:host([hidden]) { display: none }`
- [x] a test (or lint/contract check) proves every such component honors `hidden`

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: contract test first (`tests/host-hidden-contract.test.ts`) — static scan of every component CSS file and inline `@styles()` template: 176 style sources set a `:host` display with no `:host([hidden])` rule.
- 2026-08-07: codemod inserted `:host([hidden]) { display: none }` ahead of the first display-setting `:host` block in 167 sources (9 more are `display: none` data-only hosts, correctly excluded). Full component suite green: 216 files, 5588 tests.
