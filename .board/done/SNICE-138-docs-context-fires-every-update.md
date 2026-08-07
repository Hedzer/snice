---
id: SNICE-138
title: "state that @context() fires on every context update and fix DataController example"
epic: docs
priority: 138
created: 2026-08-07
deps: []
---

## Goal
Document that `@context()` handlers are a subscription firing on EVERY context update, and fix the canonical `DataController` example so it guards first delivery instead of re-triggering a load on every update.

## Notes
- Docs-only: runtime behavior is by design — handlers are a subscription, and `cleanupContextHandler` at `packages/core/src/context.ts:188` already unregisters on detach.
- The canonical example `docs/ai/controllers.md:217-220` (`DataController.receiveContext` → `void this.reload()`) is the unguarded shape: every context update re-triggers a load.
- The "Required pieces" checklist below the example never mentions a first-delivery guard or `{ once: true }`, and no doc states the every-update semantics.
- From external 7.4.0 field report; behavior verified as designed, docs gap confirmed.

## Acceptance criteria
- [x] example gains a first-delivery/attachment guard (or uses the appropriate option) with one sentence stating `@context()` fires on EVERY context update
- [x] the "Required pieces" checklist mentions the guard
- [x] the fix is mirrored in human docs if the same example exists there

## Worklog
- 2026-08-07: created from external 7.4.0 field report; docs-only story, runtime behavior confirmed by design (evidence in Notes).
- 2026-08-07: fixed the canonical DataController example in `docs/ai/controllers.md` and `docs/controllers.md` — both now carry a first-delivery guard (reset in `detach()`), a comment stating `@context()` fires on EVERY update, and prose explaining the subscription semantics + `{ once: true }` alternative. The "Required pieces" checklist now includes the guard.
