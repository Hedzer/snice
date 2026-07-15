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
- [ ] unsafe and obfuscated schemes cannot execute from attributes or properties
- [ ] allowed URLs retain native anchor behavior and accessible names
- [ ] source, built, CDN, and all-browser tests share the same adversarial URL matrix as button

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
