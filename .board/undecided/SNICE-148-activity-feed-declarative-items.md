---
id: SNICE-148
title: "add declarative activity-feed items"
epic: dx
priority: 148
created: 2026-07-14
deps: []
---

## Goal
Decide how activity-feed supports ordinary light-DOM child items alongside its property-array API.

## Notes
- The project collection policy requires both APIs; audit identified activity-feed as property-data-only or incomplete.
- Use normal custom elements/slots and MutationObserver decorators, not directives, refs, actions, or string templates.

## Acceptance criteria
- [ ] child element vocabulary, array/child precedence, identity, ordering, mutation, event, and styling contracts are concrete
- [ ] the feed adds chronology/layout/context beyond merely wrapping children
- [ ] if accepted, source, types, docs, AI docs, Storybook, public showcase, React, CDN, and browser tests cover both APIs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
