---
id: SNICE-062
title: "document button justifyText"
epic: docs
priority: 62
created: 2026-07-14
deps: []
---

## Goal
Document the shipped `justifyText` button property consistently in human docs, AI docs, examples, and metadata.

## Notes
- Source audit found the public property in code but absent from both documentation audiences.
- Affected docs: `docs/components/button.md` and `docs/ai/components/button.md`; source is `packages/components/src/button/snice-button.ts`.

## Acceptance criteria
- [ ] property name, attribute, type, default, behavior, layout interaction, and example match source
- [ ] human and AI docs follow their required formats and generated metadata stays consistent
- [ ] the docs/source contract test introduced by SNICE-128 catches future omission

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
