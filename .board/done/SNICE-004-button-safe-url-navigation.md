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
- [x] unsafe and obfuscated schemes are rejected before navigation while ordinary relative, hash, HTTP, HTTPS, mail, and telephone cases follow a documented policy
- [x] blocked navigation emits no script, popup, history mutation, or misleading success event
- [x] real-browser tests exercise encoded, whitespace-prefixed, mixed-case, control-character, and property-versus-attribute inputs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-15: accepted for implementation; scoped to shared URL-policy hardening and existing button navigation channels without taking on native-anchor redesign.
- 2026-07-15: hardened shared `isSafeUrl()` parsing and applied it to direct location, target, download, form, property, and reflected-attribute button paths; blocked activations now stop before navigation, form behavior, propagation, or `button-click`.
- 2026-07-15: added 100 focused source and built tests, including all ASCII controls, malformed/obfuscated schemes, custom protocol policies, falsey and throwing runtime values, allowed URL channels, downloads, forms, and event behavior.
- 2026-07-15: verified source, built ESM, and CDN behavior in Chromium, Firefox, and WebKit; the standalone button showcase also passed 15/15 cross-browser tests.
- 2026-07-15: updated human and AI references, the generated public docs, public full showcase, and Storybook; visually drove desktop/mobile Storybook and the real public website drawer with no clipping, overflow, execution, or console errors.
- 2026-07-15: final release matrix passed in 199.36s: 7,378 source tests, 7,378 built tests, 1,220 React tests, 66 framework-browser tests, 18 website-browser tests, CDN/runtime suites, all builds, and 93.4% statement / 90.87% branch core coverage.
- 2026-07-18: takeover audit found that a safe `href` could navigate and then fall through to submit/reset. Navigation is now an exclusive activation mode, with source/built/CDN browser regression coverage.
