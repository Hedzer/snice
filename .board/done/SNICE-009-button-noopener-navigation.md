---
id: SNICE-009
title: "prevent opener access from targeted button navigation"
epic: security
priority: 9
created: 2026-07-14
deps: []
---

## Goal
Ensure button navigation to a new browsing context cannot retain a live `window.opener` reference.

## Notes
- Affected implementation: `packages/components/src/button/snice-button.ts`, which previously called `window.open(this.href, this.target)`.
- This remains relevant even if SNICE-059 later changes `href` mode to render a real anchor.

## Acceptance criteria
- [x] new-context navigation applies `noopener` semantics for every supported target path
- [x] same-context targets and download behavior remain native and unaffected
- [x] real-browser tests verify opener isolation rather than only inspecting markup

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-15: accepted for implementation; preserve same-context and download behavior, isolate newly created browsing contexts at creation time, and verify the actual opener state in Chromium, Firefox, and WebKit.
- 2026-07-15: added `noopener` to targeted navigation while retaining direct same-context navigation and native download precedence; covered allowed, blocked, mixed-case special, named, dynamic, hostile, and non-string target/URL paths with 90 focused component tests in both source and built modes.
- 2026-07-15: verified real `_blank` and named browsing contexts have a null opener, named contexts are not reused, special targets stay in-context, and downloads do not open a popup across source, distribution, and CDN builds in Chromium, Firefox, and WebKit.
- 2026-07-15: aligned human and AI docs, Storybook controls/stories, and the full public showcase; drove source, static Storybook, and production website surfaces across all three browsers, including mobile layout, themes, keyboard use, real downloads, and popup isolation.
- 2026-07-15: corrected the deploy asset stamper so `download` remains a filename rather than receiving a cache query, with a dedicated regression test and production-browser download verification.
- 2026-07-15: final release matrix passed in 210.00s: 7,506 source tests, 7,506 built tests, 1,220 React tests, 120 framework-browser tests, 27 production-website browser tests, CDN/runtime suites, all builds, and 93.4% statement / 90.87% branch core coverage.
