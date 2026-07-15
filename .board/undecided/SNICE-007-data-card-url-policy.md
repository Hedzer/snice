---
id: SNICE-007
title: "define and enforce data-card link safety"
epic: security
priority: 7
created: 2026-07-14
deps: []
---

## Goal
Decide how link-like data-card fields should validate and expose caller-provided destinations.

## Notes
- Source audit identified data-card field `href` values as a navigation surface needing explicit policy.
- Affected implementation: `packages/components/src/data-card/snice-data-card.ts` and field types.
- Editing, copy actions, and display-only fields must not accidentally activate a URL.

## Acceptance criteria
- [ ] link fields use one documented safe-URL policy and non-link fields never navigate
- [ ] editing and rerendering cannot bypass validation or retain a previously accepted destination
- [ ] tests cover property data, declarative data, keyboard activation, and adversarial schemes

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
