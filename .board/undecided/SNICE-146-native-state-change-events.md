---
id: SNICE-146
title: "standardize state changes on properties plus native events"
epic: dx
priority: 146
created: 2026-07-14
deps: []
---

## Goal
Define a declarative, browser-native state communication pattern using properties/attributes and `input`/`change`/semantic events without two-way binding syntax.

## Notes
- The user rejected special two-way-binding directives; this card preserves that decision.
- The proposal should explain authored attributes, reflected properties, user changes, programmatic changes, controlled use, form value, and event timing.

## Acceptance criteria
- [ ] examples cover checkbox, text input, select, date range, slider, tabs/selection, and a custom data component using only standard DOM assignment/listeners
- [ ] reflection loops, controlled updates, cancelation, form reset, initial/default state, and event detail are explicit
- [ ] if accepted, the binding-channels docs, component conventions, types, and contract tests use the same model

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
