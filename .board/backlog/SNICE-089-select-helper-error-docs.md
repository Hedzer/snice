---
id: SNICE-089
title: "document select helperText and errorText"
epic: docs
priority: 89
created: 2026-07-14
deps: []
---

## Goal
Document select helper and error text, including descriptions, priority, validity relationship, and accessibility.

## Notes
- Both properties are implemented in `packages/components/src/select/snice-select.ts` but absent from human and AI docs.

## Acceptance criteria
- [ ] property/attribute names, types, defaults, precedence, parts, aria-describedby behavior, and validity relationship match source
- [ ] examples cover helper-only, error, clearing, required, disabled, and multi-select without unsafe string rendering
- [ ] human docs, AI docs, stories, metadata, and source pass automated contract checks

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
