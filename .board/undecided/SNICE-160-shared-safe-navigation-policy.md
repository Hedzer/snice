---
id: SNICE-160
title: "centralize safe navigation policy"
epic: dx
priority: 160
created: 2026-07-14
deps: []
---

## Goal
Decide whether navigational components should share one small URL validation and new-context hardening utility.

## Notes
- Separate security cards cover button, link, breadcrumbs, data-card, and location.
- A shared helper must preserve native anchors where possible and avoid pretending URL parsing alone is an application authorization policy.
- The public contract should state allowed defaults and offer deliberate application control where necessary.

## Acceptance criteria
- [ ] a concrete policy covers relative/base URLs, fragments, HTTP(S), mail/tel, data/blob where applicable, downloads, targets, rel/noopener, and blocked schemes
- [ ] native anchor attributes versus imperative navigation paths and error/event behavior are explicit
- [ ] if accepted, one adversarial matrix drives every component without coupling unrelated UI implementation

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
