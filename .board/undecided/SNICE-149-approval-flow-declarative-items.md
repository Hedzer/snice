---
id: SNICE-149
title: "add declarative approval-flow steps"
epic: dx
priority: 149
created: 2026-07-14
deps: []
---

## Goal
Decide how approval-flow supports authored child steps/approvers alongside object data.

## Notes
- Audit identified approval-flow as a candidate for the required dual collection API.
- The design must preserve status flow, branching, events, and accessible order.

## Acceptance criteria
- [ ] child vocabulary, nesting, array/child precedence, keys, status propagation, mutation, and events are defined
- [ ] declarative markup remains readable and does not evaluate strings as JavaScript
- [ ] if accepted, all public surfaces and browser tests demonstrate equivalent property and child composition

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
