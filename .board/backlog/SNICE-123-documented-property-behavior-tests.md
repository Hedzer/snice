---
id: SNICE-123
title: "test observable behavior for every documented property"
epic: quality
priority: 123
created: 2026-07-14
deps: []
---

## Goal
Prevent public properties from passing tests through reflection alone while doing nothing in the component.

## Notes
- The audit found inert advertised properties including calendar week numbers, sortable group, waterfall orientation/animation, QR data, smoothing, and others.
- This ticket owns a generated inventory and enforcement; individual behavior repairs remain separate cards.

## Acceptance criteria
- [ ] every documented public property maps to at least one observable DOM, form, event, method, visual geometry, network, or accessibility assertion
- [ ] intentional metadata-only properties are explicitly classified and documented
- [ ] source, built, docs metadata, stories, and browser tests fail when a property becomes a no-op

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
