---
id: SNICE-004
title: "reject unsafe URL schemes in button navigation"
epic: security
priority: 4
created: 2026-07-14
deps: []
---

## Goal
Ensure `snice-button` cannot execute script-bearing or otherwise forbidden URL schemes through its `href` behavior.

## Notes
- A browser probe confirmed that a `javascript:` button URL executes.
- Affected implementation: `packages/components/src/button/snice-button.ts`.
- The accepted scheme and relative-URL policy must be shared with other navigational components rather than improvised per component.

## Acceptance criteria
- [ ] unsafe and obfuscated schemes are rejected before navigation while ordinary relative, hash, HTTP, HTTPS, mail, and telephone cases follow a documented policy
- [ ] blocked navigation emits no script, popup, history mutation, or misleading success event
- [ ] real-browser tests exercise encoded, whitespace-prefixed, mixed-case, control-character, and property-versus-attribute inputs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
