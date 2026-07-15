---
id: SNICE-156
title: "add declarative notification-center items"
epic: dx
priority: 156
created: 2026-07-14
deps: []
---

## Goal
Decide how notification-center accepts authored notification children alongside its array API.

## Notes
- Audit identified notification-center as a dual-API collection candidate.
- The design must cover read state, actions, dismissal, timestamps, placement, empty state, and keyboard semantics.

## Acceptance criteria
- [ ] child vocabulary, identity, state ownership, array/child precedence, mutations, actions, and events are concrete
- [ ] large/remote notification feeds can retain an efficient data/request path
- [ ] if accepted, source, docs, stories, website, adapters, builds, and browser accessibility tests cover both APIs

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
