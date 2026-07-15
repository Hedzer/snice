---
id: SNICE-085
title: "decide the diff language property contract"
epic: behavior
priority: 85
created: 2026-07-14
deps: []
---

## Goal
Decide whether diff `language` should drive syntax-aware rendering now, be documented as metadata, or be removed until it has observable behavior.

## Notes
- Source marks the public property as a future placeholder and current rendering does not use it.
- Affected implementation/docs: `packages/components/src/diff/`, `docs/components/diff.md`, and AI docs.

## Acceptance criteria
- [ ] one current, user-observable contract is chosen without advertising speculative functionality
- [ ] source, types, metadata, docs, stories, and showcase all expose exactly that contract
- [ ] if retained as behavior, tests prove multiple languages and safe handling of untrusted source text

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
