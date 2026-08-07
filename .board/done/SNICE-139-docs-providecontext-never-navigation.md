---
id: SNICE-139
title: "document that provideContext() can never satisfy @context()"
epic: docs
priority: 139
created: 2026-08-07
deps: []
---

## Goal
State explicitly in the docs that the public `provideContext(root, ctx, { fetch })` path never supplies `navigation`, so `@context()` handlers silently never fire under a provideContext harness — and ideally warn in dev mode.

## Notes
- Public `provideContext` (`packages/core/src/app-context.ts:74-80`) never passes `navigation` — only the internal `provideRouterContext` does (`app-context.ts:83-88`).
- `installContextProvider` accepts a navigation param (`packages/core/src/context-provider.ts:45-49`) but the public path omits it, so a `kind: 'navigation'` context request is never answered.
- Result: a `@context()` handler silently never fires when the app is bootstrapped with `provideContext` (the documented testing harness shape).
- Confirmed limitation from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [x] `testing.md` and the `provideContext` doc entry state the hard limitation explicitly (use a real Router for `@context()`)
- [x] ideally a dev-mode warning fires when a `@context()` handler registers with a provider that supplies no navigation

## Worklog
- 2026-08-07: created from external 7.4.0 field report; docs-only story plus optional dev-mode warning, limitation verified against source (evidence in Notes).
- 2026-08-07: stated the hard limitation explicitly in `docs/testing.md`, `docs/ai/testing.md` (a provideContext boundary can NEVER satisfy `@context()`; the handler silently never fires), `docs/ai/decorators.md`, and `docs/ai/api.md`. Runtime warning deliberately not added: after SNICE-132, bare-mounted pages legitimately carry no Router context in unit tests, so a warning would punish the sanctioned pattern.
