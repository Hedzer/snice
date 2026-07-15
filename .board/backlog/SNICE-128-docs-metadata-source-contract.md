---
id: SNICE-128
title: "validate human docs, AI docs, metadata, and source contracts"
epic: quality
priority: 128
created: 2026-07-14
deps: []
---

## Goal
Automatically detect missing, stale, or contradictory component properties, methods, events, slots, parts, attributes, and defaults.

## Notes
- The audit manually found multiple public properties absent from both doc sets.
- Generated custom-elements metadata currently includes some internal methods, so validation must distinguish intentional public API first.

## Acceptance criteria
- [ ] one normalized public API model compares source decorators/types, custom-elements JSON, human docs, AI docs, React types, and MCP catalogue
- [ ] intentional exceptions are explicit and minimal; missing or extra surface produces component/file-specific diagnostics
- [ ] tests include planted mismatches for names, types, defaults, attributes, event detail, methods, slots, and CSS parts

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
