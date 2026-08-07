---
id: SNICE-143
title: "per-instance debounce for @on and @dispatch"
epic: events
priority: 143
created: 2026-08-07
deps: []
---

## Goal
Allow the `debounce` interval on `@on`/`@dispatch` to be resolved per instance — via a function or a property name — so a component can expose the interval as a property.

## Notes
- `debounce?: number` is captured at decoration time and shared by every instance (`packages/core/src/on.ts:200-204`; options types in `packages/core/src/types/on-options.d.ts`).
- Because the number is fixed per class, one component cannot expose the interval as a property.
- Confirmed limitation from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [ ] `debounce` accepts a function or property name — `{ debounce: host => host.debounceMs }` or `{ debounce: 'debounceMs' }` — resolved per invocation
- [ ] tests show two instances with different intervals

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source (evidence in Notes).
