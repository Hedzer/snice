---
id: SNICE-140
title: "make data-heavy component APIs generic"
epic: types
priority: 140
created: 2026-07-14
deps: []
---

## Goal
Replace avoidable public `any` in table, virtual-scroller, metric-table, and related data components with usable row/value generics.

## Notes
- Audit found 75 `any` occurrences in public component types, concentrated in table.
- Candidate surfaces include `ColumnDefinition<TRow, TValue>`, `SniceTableElement<TRow>`, render/accessor callbacks, events, and virtual item data.
- Generated custom-element and React typings must remain practical.

## Acceptance criteria
- [ ] current unsound positions are inventoried and separated from truly unknown external data
- [ ] a concrete generic API supports inference, explicit types, nested accessors, custom cells, events, subclass-free DOM queries, and JavaScript consumers
- [ ] if accepted, type tests include positive inference and adversarial errors while runtime/source/built artifacts remain identical

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
