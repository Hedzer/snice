---
id: SNICE-060
title: "honor boolean-style button download"
epic: behavior
priority: 60
created: 2026-07-14
deps: []
---

## Goal
Make an empty `download` attribute request native download behavior rather than ordinary navigation.

## Notes
- A browser probe observed zero download clicks and hash navigation for an empty download attribute.
- Affected implementation: `packages/components/src/button/snice-button.ts`.
- The eventual real-anchor mode in SNICE-059 should retain native filename semantics.

## Acceptance criteria
- [ ] absent, empty, and named download states are distinct and match native anchor behavior for allowed URLs
- [ ] disabled/loading states suppress activation without losing the configured value
- [ ] real-browser tests observe download events/targets rather than only rendered attributes

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
