---
id: SNICE-001
title: "render select option content without HTML injection"
epic: security
priority: 1
created: 2026-07-14
deps: []
---

## Goal
Render every caller-controlled select string—labels, values, icon URLs, placeholders, and selected-value text—as data rather than executable HTML.

## Notes
- A real-browser probe confirmed that markup supplied through select option data becomes live DOM.
- Affected implementation: `packages/components/src/select/snice-select.ts`, especially the `innerHTML` selected-value and option-list paths.
- Select's documented icon support and `part="option"` styling contract must remain intact; plain strings must never be interpreted as markup.

## Acceptance criteria
- [x] adversarial labels, values, placeholder text, and remote results render literally in single and multiple selection modes
- [x] icons and the `part="option"` metadata contract still work without a generic string-to-HTML sink
- [x] source, built-distribution, CDN, and real-browser tests prove scripts, handlers, SVG payloads, and malformed markup cannot execute

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-14: accepted for implementation; beginning failing-first source and built-browser security coverage.
- 2026-07-14: replaced dynamic `innerHTML` with explicit DOM nodes, text nodes, safe attribute assignment, and `replaceChildren()`.
- 2026-07-14: verified 87 focused source tests and both ESM/CDN customer workflows in Chromium, Firefox, and WebKit.
- 2026-07-14: complete `npm test` passed: 7,297 tests and every artifact/browser gate in 147.96s; core statement coverage 93.34%.
