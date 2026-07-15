---
id: SNICE-087
title: "document breadcrumbs collapsed state"
epic: docs
priority: 87
created: 2026-07-14
deps: []
---

## Goal
Document the public breadcrumbs `collapsed` property and its interaction with max-items and user expansion.

## Notes
- The property is implemented in `packages/components/src/breadcrumbs/snice-breadcrumbs.ts` but absent from human and AI docs.

## Acceptance criteria
- [ ] property, attribute, type, default, mutation, expansion, reset/re-collapse behavior, and events match source
- [ ] examples cover controlled state and max-items interaction without inventing unsupported APIs
- [ ] human docs, AI docs, stories, metadata, and source pass automated contract checks

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
