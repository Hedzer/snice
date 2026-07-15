---
id: SNICE-159
title: "reassess table setData rendering semantics"
epic: dx
priority: 159
created: 2026-07-14
deps: []
---

## Goal
Decide whether table's non-eager `setData()` plus required `renderBody()` call is still the clearest imperative contract.

## Notes
- `.ai/coding-standards.md` records the current intentional behavior: reactive `table.data = ...` is eager, while unpaired `setData()` requires `renderBody()`.
- This is not a claim that current behavior is broken; it is a DX review of two update channels with surprising asymmetry.
- Source-plus-built tests and performance characteristics must be preserved under any decision.

## Acceptance criteria
- [ ] current call sites, batching rationale, performance, event timing, selection/edit state, and stale-render failure modes are characterized
- [ ] options include keeping/documenting, renaming to make batching explicit, an optional eager flag, or a transaction/batch API with compatibility
- [ ] if changed, source, built, CDN, React, docs, website showcases, performance, and the full table matrix prove identical intended output

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
