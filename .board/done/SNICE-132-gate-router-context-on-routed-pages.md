---
id: SNICE-132
title: "gate Router context assignment on Router-created page elements"
epic: lifecycle
priority: 132
created: 2026-08-07
deps: []
---

## Goal
Only assign the Router navigation context to page elements the Router actually created, so a bare `document.createElement('my-page')` (unit tests, standalone use) stays inert and a test's own injected context keeps winning.

## Notes
- `packages/core/src/router.ts:137-143` — the `@page` decorator overrides `connectedCallback` to assign `(this)[CONTEXT_HANDLER] = navigationContext` unconditionally, so any bare element receives the real application context including the middleware-bound `ctx.fetch`.
- Router-created elements already get the same assignment at `router.ts:452` inside route resolution, so gating the decorator-side assignment loses nothing.
- Confirmed bug from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] elements not produced by route resolution receive no Router context (stay inert)
- [x] Router-created pages still receive the navigation context
- [x] regression test mounts a page bare and asserts no app context arrives

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: failing test first in `tests/router-page-context-gating.test.ts` — bare mount received the app context, Router-created mount worked.
- 2026-08-07: fix in `packages/core/src/router.ts` — the connectedCallback override now assigns CONTEXT_HANDLER only when ROUTER_CONTEXT is present (set by route resolution and home/404/403 creation before connect). 9 router/context suites green (78 tests).
