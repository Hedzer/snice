---
id: SNICE-088
title: "document login alertMessage and alertVariant"
epic: docs
priority: 88
created: 2026-07-14
deps: []
---

## Goal
Document the public login alert state and explain its relationship to validation, submission, and imperative result handling.

## Notes
- `alertMessage` and `alertVariant` exist in `packages/components/src/login/snice-login.ts` and types but are missing from both doc sets.

## Acceptance criteria
- [ ] names, attributes, types, defaults, allowed variants, clearing, rendering, and accessibility match runtime
- [ ] examples distinguish application/server alerts from individual field validation
- [ ] human docs, AI docs, stories, metadata, and source pass automated contract checks

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
