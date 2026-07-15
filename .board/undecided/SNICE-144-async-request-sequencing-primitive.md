---
id: SNICE-144
title: "add a shared async request sequencing primitive"
epic: dx
priority: 144
created: 2026-07-14
deps: []
---

## Goal
Decide whether components should share a small cancellation/latest-result helper for remote data rather than reimplementing race handling.

## Notes
- Confirmed candidates include select and list response races; other request/respond and fetch-like components need inventory.
- The primitive should compose with Promise, AbortSignal where available, disconnect, retry, and existing `@request`/`@respond` channels.
- It must not impose a global data layer.

## Acceptance criteria
- [ ] a concrete API demonstrates latest-only search, ordered pagination, explicit parallel requests, abort, disconnect, and error handling
- [ ] ownership, stale completion, loading/error state, sequence overflow, and non-abortable providers are defined
- [ ] if accepted, adversarial deterministic tests prove it before migrating list/select and measuring overhead

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
