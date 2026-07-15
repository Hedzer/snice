---
id: SNICE-142
title: "define array and object mutation reactivity"
epic: dx
priority: 142
created: 2026-07-14
deps: []
---

## Goal
Give consumers an explicit contract for mutating array/object component properties without guessing whether replacement is required.

## Notes
- Audit found no component using `deep: true` despite many collection/object properties.
- Blanket deep observation is not acceptable for large table/chart datasets without measured cost.
- Options include immutable replacement as documented policy, selective deep observation, or explicit mutation methods.

## Acceptance criteria
- [ ] every collection/object API family is classified by size, update frequency, identity needs, and current mutation behavior
- [ ] concrete examples compare replacement, selective deep tracking, and component methods for DX, proxies/reflection cost, predictability, and browser support
- [ ] if accepted, docs, types, runtime tests, performance boundaries, and dev diagnostics make the chosen contract unmistakable

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
