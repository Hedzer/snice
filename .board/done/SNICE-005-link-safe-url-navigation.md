---
id: SNICE-005
title: "reject unsafe URL schemes in link navigation"
epic: security
priority: 5
created: 2026-07-14
deps: []
---

## Goal
Apply a documented safe-URL policy to `snice-link` without weakening native anchor semantics.

## Notes
- A browser probe confirmed that a `javascript:` link URL executes.
- Affected implementation: `packages/components/src/link/snice-link.ts`.
- Native navigation, keyboard behavior, copy-link behavior, target, rel, and download semantics must remain intact for allowed URLs.

## Acceptance criteria
- [x] unsafe and obfuscated schemes cannot execute from attributes or properties
- [x] allowed URLs retain native anchor behavior and accessible names
- [x] source, built, CDN, and all-browser tests share the same adversarial URL matrix as button

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
- 2026-07-15: accepted for implementation; the component reuses core `isSafeUrl()` directly, removes only rejected anchor hrefs, and preserves native anchor behavior for accepted URLs.
- 2026-07-15: completed with shared button/link URL cases, hostile runtime-value coverage, source/distribution/CDN browser tests, full-showcase and production-website tests, light/dark/no-theme verification, human and AI docs, and Storybook coverage.
- 2026-07-15: final gate passed: 7,441 source tests, 7,441 built tests, 93.4% core coverage, 1,220 React tests, 90 framework browser tests, and 21 production-website browser tests; full suite elapsed 202.43 seconds.
