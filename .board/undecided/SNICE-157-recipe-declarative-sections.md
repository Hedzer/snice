---
id: SNICE-157
title: "add declarative recipe sections and items"
epic: dx
priority: 157
created: 2026-07-14
deps: []
---

## Goal
Decide how recipe accepts authored ingredient/step child elements alongside object data.

## Notes
- Audit identified recipe as a natural dual-API collection.
- The vocabulary must remain comprehensible HTML and compose with the keyboard-accessibility work in SNICE-105.

## Acceptance criteria
- [ ] section/item vocabulary, quantities, ordering, state, array/child precedence, mutation, and events are explicit
- [ ] the container retains recipe layout/aggregate behavior while children remain meaningful
- [ ] if accepted, every public surface and browser test covers both APIs and accessibility

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
