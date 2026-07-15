---
id: SNICE-039
title: "ignore stale remote list responses"
epic: async
priority: 39
created: 2026-07-14
deps: []
---

## Goal
Ensure slower obsolete list requests cannot overwrite newer search or pagination results.

## Notes
- Source audit found no sequence or cancellation guard around remote list requests.
- Affected implementation: `packages/components/src/list/snice-list.ts`.

## Acceptance criteria
- [ ] only the latest compatible request may commit results, loading state, page state, and errors
- [ ] query changes, clear, reconnect, pagination, rejection, and abort have defined outcomes
- [ ] deterministic tests resolve requests in every adversarial order through source, built, and browser paths

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
