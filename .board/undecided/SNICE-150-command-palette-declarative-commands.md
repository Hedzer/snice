---
id: SNICE-150
title: "add declarative command-palette commands"
epic: dx
priority: 150
created: 2026-07-14
deps: []
---

## Goal
Decide how command-palette accepts authored command child elements in addition to command objects.

## Notes
- Audit identified command-palette as a natural dual-API collection.
- Actions must remain ordinary event/method callbacks; markup must not encode executable expressions.

## Acceptance criteria
- [ ] child command attributes/properties, groups, shortcuts, disabled/hidden state, async action events, IDs, precedence, and live mutation are defined
- [ ] large remote command sets can continue using the array/request path without DOM inflation
- [ ] if accepted, docs and all shipped/tested surfaces cover both APIs and preserve keyboard accessibility

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
