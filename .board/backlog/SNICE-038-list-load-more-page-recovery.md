---
id: SNICE-038
title: "preserve list pagination state when loading fails"
epic: async
priority: 38
created: 2026-07-14
deps: []
---

## Goal
Prevent a failed `loadMore` request from permanently skipping a page or corrupting loading state.

## Notes
- Source audit found the page counter incremented before the request succeeds without rollback.
- Affected implementation: `packages/components/src/list/snice-list.ts`.

## Acceptance criteria
- [ ] failed, rejected, aborted, and malformed responses leave the next retry on the correct page
- [ ] concurrent sentinel triggers cannot duplicate or skip pages and loading/end state is deterministic
- [ ] tests cover retry, rapid intersection, disconnect, search reset, empty page, and eventual success

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
