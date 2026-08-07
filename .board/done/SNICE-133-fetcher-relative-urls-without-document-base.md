---
id: SNICE-133
title: "fetcher tolerates relative URLs without a document base"
epic: behavior
priority: 133
created: 2026-08-07
deps: []
---

## Goal
Make `ContextAwareFetcher` resolve relative request URLs against `location.href` when available, so `ctx.fetch('/api/v1/notes')` works identically in the browser and under Node/undici.

## Notes
- `packages/core/src/fetcher.ts:94` — `ContextAwareFetcher.create()` does `new Request(input, init)`; in a browser a relative URL resolves against the document base, but under Node/undici there is no base and it throws `TypeError: Failed to parse URL`.
- Relative URLs are the normal case for browser apps, so framework code and tests under Node hit this constantly.
- Confirmed bug from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] relative input resolves against `location.href` when available before constructing the Request
- [x] absolute URLs are unchanged
- [x] unit tests cover both relative and absolute input under Node

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
- 2026-08-07: wrote failing test first — a strict Request shim (undici semantics: throws on relative input) reproduced `TypeError: Failed to parse URL` at fetcher.ts:94.
- 2026-08-07: fix in `packages/core/src/fetcher.ts` — relative string input resolves against `location.href` when available; Request/URL objects and absolute strings untouched. `tests/fetcher.test.ts` + `tests/fetcher-router-integration.test.ts` green (80 tests).
