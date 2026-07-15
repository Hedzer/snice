---
id: SNICE-073
title: "implement horizontal waterfall orientation"
epic: behavior
priority: 73
created: 2026-07-14
deps: []
---

## Goal
Make horizontal orientation produce a genuinely horizontal waterfall chart or remove the advertised mode.

## Notes
- A browser probe found vertical and horizontal modes producing identical markup.
- Affected implementation: `packages/components/src/waterfall/snice-waterfall.ts`.

## Acceptance criteria
- [ ] horizontal geometry, axes/labels, connectors, totals, positive/negative bars, resize, and tooltips are defined
- [ ] runtime orientation changes produce fresh-instance-equivalent output
- [ ] tests assert geometry and interaction, not only the orientation property or class

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
