---
id: SNICE-131
title: "enforce the complete artifact contract for every published component"
epic: release
priority: 131
created: 2026-07-14
deps: []
---

## Goal
Prove every non-WIP component has the required source, types, styles, tests, adapters, builds, docs, stories, showcases, metadata, and catalogue entries.

## Notes
- The component checklist defines the policy, but popover and spreadsheet findings show it is not fully machine-enforced.
- This ticket automates existence and inclusion; behavioral quality remains in focused tests.

## Acceptance criteria
- [ ] the authoritative shipped-component list is derived once and checked against every required surface
- [ ] missing, stale, extra, WIP, duplicate, misnamed, and unexported artifacts produce exact diagnostics
- [ ] planted omissions across each artifact class fail the required gate without changing the reusable `.ai` checklist

## Worklog
- 2026-07-14: created from the existing-component audit for one-by-one product review.
