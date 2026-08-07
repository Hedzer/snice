---
id: SNICE-134
title: "empty query param value must not fail the whole route"
epic: behavior
priority: 134
created: 2026-08-07
deps: []
---

## Goal
An empty query param value (`?q=`) must bind as `''` and keep matching instead of rejecting the whole route; fix upstream in `pica-route` and bump the dependency here.

## Notes
- The matcher lives in the `pica-route` dependency (author's own package, gitlab.com/Hedzer/pica-route): `src/index.ts:493 matchQuery`, the `case 'param'` branch — `if (endIndex === queryIndex) return false;` rejects the whole route on an empty value, so NO route param binds (not just the empty one).
- Breaks the documented `routes: ['/work-orders?status=:status', '/work-orders']` pattern when `status` is empty.
- Fix belongs in pica-route: treat an empty value as `''` and keep matching; then bump `pica-route` here (package.json currently `^1.1.2`).
- Confirmed upstream bug from external 7.4.0 field report; verified against source.

## Acceptance criteria
- [ ] pica-route treats an empty query param value as `''` and the route still matches
- [ ] snice's `pica-route` dependency is bumped to the fixed release
- [ ] snice-side routing regression test for `/pinned?q=:q&type=:t` with `?q=&t=x`

## Worklog
- 2026-08-07: created from external 7.4.0 field report; verified against source, fix lands upstream in pica-route (evidence in Notes).
