---
id: SNICE-137
title: "resolve duplicate table event synonyms"
epic: events
priority: 137
created: 2026-07-14
deps: []
---

## Goal
Decide whether table event pairs such as `row-click`/`row-clicked` should be consolidated while preserving compatibility.

## Notes
- Audit found multiple synonymous table event names that increase discovery and typing cost.
- The table has a large installed public surface, so cleanup must be evidence-led and migration-safe.

## Acceptance criteria
- [ ] every table event is inventoried by trigger, detail, flags, cancelation, ordering, and current docs/consumer use
- [ ] true aliases, semantically distinct events, and accidental duplicates are classified
- [ ] if accepted, one canonical vocabulary plus typed aliases/deprecations is proven across source, built, CDN, React, docs, website, and browser tests

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
