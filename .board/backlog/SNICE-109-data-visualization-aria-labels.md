---
id: SNICE-109
title: "replace generic visualization ARIA labels"
epic: accessibility
priority: 109
created: 2026-07-14
deps: []
---

## Goal
Replace labels such as generic “chart” descriptions with content-specific accessible names and relationships.

## Notes
- Audit found data-visualization labels that identify widget type but not the actual data or purpose.
- This ticket addresses naming/description quality; SNICE-108 owns broader alternative-data architecture.

## Acceptance criteria
- [ ] every visualization can derive or receive a useful accessible name and description without duplicating visible headings
- [ ] empty, loading, error, comparison, and updated data states announce useful context
- [ ] docs and browser tests demonstrate author-supplied and derived labeling for each visualization family

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
