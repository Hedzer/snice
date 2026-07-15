---
id: SNICE-124
title: "smoke every story and full showcase in all browsers"
epic: quality
priority: 124
created: 2026-07-14
deps: []
---

## Goal
Load and interact with every Storybook story and public full showcase in Chromium, Firefox, and WebKit without console/page failures.

## Notes
- The public website and Storybook are distinct products and both must remain rendered and interactive.
- This complements focused behavioral tests; it is not a substitute for them.

## Acceptance criteria
- [ ] every shipped story and `website/showcases/*/full.html` is discovered from authoritative manifests rather than a hand-maintained partial list
- [ ] custom elements reach readiness, expected landmark content renders, representative declared interactions run, and console/page/request errors are classified
- [ ] the gate runs against fresh outputs with deterministic servers, bounded parallelism, artifacts only on failure, and no stale site reuse

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
