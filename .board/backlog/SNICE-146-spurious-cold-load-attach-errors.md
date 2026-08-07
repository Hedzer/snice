---
id: SNICE-146
title: "investigate spurious cold-load controller attach errors"
epic: lifecycle
priority: 146
created: 2026-08-07
deps: []
---

## Goal
Reproduce or close the reported cold-load `Failed to attach controller "<name>": {}` errors; if real, stop logging when attach subsequently succeeds and serialize the actual cause.

## Notes
- Claim: six `controller=${X}` bindings each logged `Failed to attach controller "<name>": {}` at first paint, then attached fine.
- The abort path is already silenced (`packages/core/src/controller.ts:88-92, 112-116`), so any remaining log is a non-abort error that later resolves — pure noise that trains people to ignore attach errors.
- The logged error serializes to `{}`, destroying the diagnostic value.
- From external 7.4.0 field report; the reporter did NOT re-verify this on 7.4.0, so it needs reproduction first.

## Acceptance criteria
- [ ] reproduce on 7.4.0 or close as not reproducible
- [ ] if real: don't log when attach subsequently succeeds
- [ ] if real: serialize the cause (message + stack) instead of `{}`

## Worklog
- 2026-08-07: created from external 7.4.0 field report; needs reproduction, reporter did not re-verify on 7.4.0 (see Notes).
